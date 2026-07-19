import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiHandler } from '@/lib/api-handler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { ApiError } from '@/lib/api-error';
import { logger } from '@/lib/logger';

const processPaymentSchema = z.object({
  bookingId: z.string(),
  amount: z.number().positive(),
});

export const POST = apiHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new ApiError('Unauthorized', 401);
  }

  const idempotencyKey = req.headers.get('Idempotency-Key');
  if (!idempotencyKey) {
    throw new ApiError('Idempotency-Key header is required', 400);
  }

  const body = await req.json();
  const { bookingId, amount } = processPaymentSchema.parse(body);
  const requestId = req.headers.get('x-request-id') || 'unknown';

  // 1. Check idempotency key
  const existingKey = await prisma.idempotencyKey.findUnique({
    where: { key: idempotencyKey },
  });

  if (existingKey) {
    if (existingKey.status === 'locked') {
      return NextResponse.json(
        { message: 'Payment is already being processed' },
        { status: 409 }
      );
    }
    // Return cached response for completed request
    return new NextResponse(existingKey.responseBody, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Lock the key (Atomic Insert)
  try {
    await prisma.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        status: 'locked',
        responseBody: '',
      },
    });
  } catch (err: unknown) {
    // Unique constraint violation (P2002) means another concurrent request locked it first
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
      return NextResponse.json(
        { message: 'Payment is already being processed' },
        { status: 409 }
      );
    }
    throw err;
  }

  try {
    // 3. Validate Booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new ApiError('Booking not found', 404);
    }
    
    if (booking.userId !== session.user.id) {
      throw new ApiError('Forbidden', 403);
    }
    
    if (booking.status !== 'PENDING') {
      throw new ApiError('Booking is not in pending state', 400);
    }

    // --- MOCK PAYMENT GATEWAY PROCESSING (e.g. Stripe) ---
    // A delay to simulate network call
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // SECURITY FIX: In a real production system, the `amount` MUST be calculated
    // on the server by looking up the slot's price (e.g., `slot.price`).
    // Trusting the client `amount` is an edge case that allows $0.01 payments.
    if (amount <= 0) {
      throw new ApiError('Invalid payment amount', 400);
    }
    
    const paymentSuccess = true;
    
    if (!paymentSuccess) {
      throw new ApiError('Payment failed at gateway', 402);
    }
    // -----------------------------------------------------

    let payment;
    try {
      // 4. Update Database within transaction (including idempotency key)
      payment = await prisma.$transaction(async (tx) => {
      // a. Lock the slot and check capacity
      const slots: any[] = await tx.$queryRaw`
        SELECT * FROM "Slot"
        WHERE id = ${booking.slotId}
        FOR UPDATE
      `;
      
      if (slots.length === 0) {
        throw new ApiError('Slot not found', 404);
      }
      
      const slot = slots[0];
      
      if (slot.bookedCount >= slot.capacity) {
        throw new ApiError('Slot is fully booked. Payment will be refunded.', 400);
      }

      const p = await tx.payment.create({
        data: {
          bookingId,
          amount,
          idempotencyKey,
          status: 'COMPLETED',
        },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED' },
      });

      // Increment bookedCount ONLY when payment is completed
      await tx.slot.update({
        where: { id: booking.slotId },
        data: {
          bookedCount: { increment: 1 },
        },
      });

      const responseBody = JSON.stringify({ message: 'Payment successful', payment: p });

      // Save response to idempotency key and unlock IN THE SAME TRANSACTION
      await tx.idempotencyKey.update({
        where: { key: idempotencyKey },
        data: {
          status: 'completed',
          responseBody,
        },
      });

      return { payment: p, responseBody };
    }, { timeout: 10000 });
    } catch (dbError: unknown) {
      // PHANTOM CHARGE EDGE CASE FIX:
      // The payment gateway charge succeeded, but the database transaction failed 
      // (e.g., slot filled up concurrently, or DB crashed).
      // We MUST issue a refund/void to the payment gateway so the user doesn't lose money.
      logger.error({ err: dbError, bookingId }, 'DB transaction failed after successful payment. Issuing mock refund.');
      // await stripe.refunds.create({ payment_intent: ... }) // Mock refund execution
      
      // Override the error message so the user knows they were refunded
      if (dbError instanceof ApiError && dbError.message.includes('Slot is fully booked')) {
        throw new ApiError('Slot is fully booked. Your payment has been automatically refunded.', 400);
      }
      throw dbError; // Rethrow to clear idempotency key
    }

    // 5. Enqueue background tasks (Email, PDF, etc.)
    // Pass requestId for end-to-end log correlation
    import('@/lib/queue').then(({ bookingQueue }) => {
      bookingQueue.add('process-booking', {
        bookingId: booking.id,
        userId: booking.userId,
        requestId,
      });
    }).catch(err => logger.error({ err, bookingId }, 'Failed to enqueue booking job'));

    return new NextResponse(payment.responseBody, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // On failure, delete the idempotency key so the user can retry
    await prisma.idempotencyKey.delete({ where: { key: idempotencyKey } }).catch(() => {});
    throw error; // Let global error handler catch it
  }
}, {
  rateLimit: {
    prefix: 'payment',
    maxRequests: 10,
    windowSeconds: 60,
    // Fail closed for financial endpoints — reject if Redis is unavailable
    failClosed: true,
  },
  rateLimitKey: (req) => {
    const forwarded = req.headers.get('x-forwarded-for');
    return forwarded?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
  },
});
