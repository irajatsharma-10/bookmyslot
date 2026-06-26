import Redis from 'ioredis';
import { logger } from './logger';
import { prisma } from './db';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Create a singleton connection to Redis
const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required by BullMQ
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: process.env.NODE_ENV === 'test', // Don't auto-connect in tests
  retryStrategy(times) {
    if (process.env.NODE_ENV === 'test') return null; // Don't retry in tests
    const delay = Math.min(times * 200, 5000);
    logger.warn({ attempt: times, delay }, 'Redis retrying connection...');
    return delay;
  },
});

redis.on('error', (err) => {
  logger.error({ err }, 'Redis connection error');
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('reconnecting', () => {
  logger.warn('Redis reconnecting...');
});

// Define custom commands
redis.defineCommand('reserveSlotAtomic', {
  numberOfKeys: 3,
  lua: `
-- KEYS[1] = slot:{slotId}:capacity
-- KEYS[2] = reservation:slot:{slotId}:user:{userId}
-- KEYS[3] = slot:{slotId}:expirations
-- ARGV[1] = reservation_ttl_seconds
-- ARGV[2] = current_timestamp

-- 1. Recover capacity from expired reservations
local expired_keys = redis.call('ZRANGEBYSCORE', KEYS[3], '-inf', ARGV[2])
if #expired_keys > 0 then
  redis.call('INCRBY', KEYS[1], #expired_keys)
  for _, key in ipairs(expired_keys) do
    redis.call('DEL', key)
  end
  redis.call('ZREMRANGEBYSCORE', KEYS[3], '-inf', ARGV[2])
end

-- 2. Idempotency check
if redis.call('EXISTS', KEYS[2]) == 1 then
  return 2 -- Already reserved
end

-- 3. Capacity check
local current = tonumber(redis.call('GET', KEYS[1]))
if not current then
  return -1 -- Cache miss, application needs to hydrate from Postgres and retry
end

if current > 0 then
  -- 4. Reserve and decrement
  redis.call('DECR', KEYS[1])
  redis.call('SET', KEYS[2], '1', 'EX', ARGV[1])
  redis.call('ZADD', KEYS[3], ARGV[2] + ARGV[1], KEYS[2])
  return 1  -- success
else
  return 0  -- sold out
end
  `
});

// Extend type definitions for ioredis
declare module 'ioredis' {
  interface Redis {
    reserveSlotAtomic(
      slotCapacityKey: string,
      reservationKey: string,
      expirationsKey: string,
      ttlSeconds: number | string,
      currentTimestamp: number | string
    ): Promise<number>;
  }
}

/**
 * Hydrates Redis with the current available capacity from Postgres
 */
export async function hydrateSlotCapacity(slotId: string): Promise<number> {
  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: {
      bookings: {
        where: {
          OR: [
            { status: 'CONFIRMED' },
            { 
              status: 'PENDING',
              createdAt: { gt: new Date(Date.now() - 10 * 60 * 1000) }
            }
          ]
        }
      }
    }
  });

  if (!slot) {
    throw new Error('Slot not found');
  }

  const availableCapacity = slot.capacity - slot.bookings.length;
  // Initialize in Redis with a 24-hour TTL just to keep things tidy
  await redis.set(`slot:${slotId}:capacity`, availableCapacity, 'EX', 60 * 60 * 24);
  return availableCapacity;
}

/**
 * Attempts to reserve a slot using Redis atomic operations.
 * Handles cache misses by hydrating from Postgres.
 */
export async function reserveSlot(slotId: string, userId: string, ttlSeconds: number = 600): Promise<'SUCCESS' | 'SOLD_OUT' | 'ALREADY_RESERVED'> {
  const capacityKey = `slot:${slotId}:capacity`;
  const reservationKey = `reservation:slot:${slotId}:user:${userId}`;
  const expirationsKey = `slot:${slotId}:expirations`;
  const currentTimestamp = Math.floor(Date.now() / 1000);

  let result = await redis.reserveSlotAtomic(capacityKey, reservationKey, expirationsKey, ttlSeconds, currentTimestamp);

  // Cache miss (-1)
  if (result === -1) {
    const actualCapacity = await hydrateSlotCapacity(slotId);
    if (actualCapacity <= 0) {
      return 'SOLD_OUT';
    }
    // Retry atomic reservation after hydration
    result = await redis.reserveSlotAtomic(capacityKey, reservationKey, expirationsKey, ttlSeconds, currentTimestamp);
  }

  if (result === 1) return 'SUCCESS';
  if (result === 2) return 'ALREADY_RESERVED';
  
  return 'SOLD_OUT';
}

/**
 * Releases a user's reservation explicitly (e.g., on payment failure or manual cancellation)
 * Increments capacity back.
 */
export async function releaseSlot(slotId: string, userId: string): Promise<void> {
  const capacityKey = `slot:${slotId}:capacity`;
  const reservationKey = `reservation:slot:${slotId}:user:${userId}`;
  const expirationsKey = `slot:${slotId}:expirations`;

  const deleted = await redis.del(reservationKey);
  if (deleted > 0) {
    await redis.incr(capacityKey);
    await redis.zrem(expirationsKey, reservationKey);
  }
}

/**
 * Confirms a user's reservation (e.g., after successful payment).
 * Does NOT increment capacity back, but stops the reservation from expiring.
 */
export async function confirmSlot(slotId: string, userId: string): Promise<void> {
  const reservationKey = `reservation:slot:${slotId}:user:${userId}`;
  const expirationsKey = `slot:${slotId}:expirations`;

  await redis.del(reservationKey);
  await redis.zrem(expirationsKey, reservationKey);
}

export default redis;
