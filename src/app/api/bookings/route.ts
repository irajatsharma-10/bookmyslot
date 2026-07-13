import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Slot } from '@prisma/client';
import { apiHandler } from '@/lib/api-handler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { ApiError } from '@/lib/api-error';
import { reserveSlot } from '@/lib/redis';

const createBookingSchema = z.object({
  slotId: z.string(),
});

export const POST = apiHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new ApiError('Unauthorized', 401);
  }

  const body = await req.json();
  const { slotId } = createBookingSchema.parse(body);
  const userId = session.user.id;

  // 1. Redis Gatekeeper: Attempt to reserve slot atomically (10 minute TTL)
  const reservationResult = await reserveSlot(slotId, userId, 600);

  if (reservationResult === 'ALREADY_RESERVED') {
    // Idempotency: Return existing pending booking if it exists
    const existingBooking = await prisma.booking.findFirst({
      where: { userId, slotId, status: 'PENDING' }
    });
    if (existingBooking) {
      return NextResponse.json(existingBooking, { status: 200 });
    }
    // Mismatch edge case: Redis says reserved, but Postgres has no pending booking.
    throw new ApiError('Reservation state mismatch. Please wait 10 minutes for the lock to expire.', 409);
  } else if (reservationResult === 'SOLD_OUT') {
    throw new ApiError('Slot is fully booked', 400);
  }

  // 2. Persist to Postgres as Authoritative Record
  // Interactive transaction with row-level locking (SELECT ... FOR UPDATE)
  // Timeout prevents indefinite lock-hold if the database stalls
  const booking = await prisma.$transaction(async (tx) => {
    // Lock the slot row
    const slots: Slot[] = await tx.$queryRaw`
      SELECT * FROM "Slot"
      WHERE id = ${slotId}
      FOR UPDATE
    `;

    if (slots.length === 0) {
      throw new ApiError('Slot not found', 404);
    }

    const slot = slots[0];

    // Time machine validation edge case
    if (new Date(slot.startTime) < new Date()) {
      throw new ApiError('Cannot book a slot that has already occurred', 400);
    }

    // Check confirmed capacity as a secondary safety net
    if (slot.bookedCount >= slot.capacity) {
      throw new ApiError('Slot is fully booked', 400);
    }

    const newBooking = await tx.booking.create({
      data: {
        userId,
        slotId,
        status: 'PENDING',
      },
    });

    return newBooking;
  }, { timeout: 5000 });

  return NextResponse.json(booking, { status: 201 });
}, {
  rateLimit: {
    prefix: 'booking',
    maxRequests: 10,
    windowSeconds: 60,
    failClosed: false,
  },
  rateLimitKey: (req) => {
    // Rate limit per user would require session parsing here.
    // Use IP as a practical approximation.
    const forwarded = req.headers.get('x-forwarded-for');
    return forwarded?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
  },
});
