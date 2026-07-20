import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/payments/route';
import { prisma } from '@/lib/db';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() => ({ user: { id: 'user-1' } })),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    idempotencyKey: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    booking: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/queue', () => ({
  bookingQueue: {
    add: vi.fn(),
  }
}));

describe('Payment API Idempotency', () => {
  it('should return 409 if payment is already locked', async () => {
    (prisma.idempotencyKey.findUnique as any).mockResolvedValueOnce({
      key: 'key-1',
      status: 'locked'
    });

    const req = new Request('http://localhost/api/payments', {
      method: 'POST',
      headers: { 'Idempotency-Key': 'key-1' },
      body: JSON.stringify({ bookingId: 'b-1', amount: 100 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it('should return cached response if payment is completed', async () => {
    const cachedResponse = JSON.stringify({ message: 'Cached success' });
    (prisma.idempotencyKey.findUnique as any).mockResolvedValueOnce({
      key: 'key-2',
      status: 'completed',
      responseBody: cachedResponse,
    });

    const req = new Request('http://localhost/api/payments', {
      method: 'POST',
      headers: { 'Idempotency-Key': 'key-2' },
      body: JSON.stringify({ bookingId: 'b-2', amount: 100 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe('Cached success');
  });
});
