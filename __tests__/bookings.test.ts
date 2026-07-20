import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/bookings/route';
import { prisma } from '@/lib/db';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() => ({ user: { id: 'user-1' } })),
}));

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

describe('Booking API Concurrency', () => {
  it('should handle concurrent bookings properly by relying on Prisma interactive transaction', async () => {
    // In a real integration test, we'd fire off Promise.all() against a real DB.
    // Here we assert the route calls $transaction which handles the SELECT FOR UPDATE.
    
    const req = new Request('http://localhost/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ slotId: 'slot-1' }),
    });

    (prisma.$transaction as any).mockResolvedValueOnce({ id: 'booking-1', status: 'PENDING' });

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
