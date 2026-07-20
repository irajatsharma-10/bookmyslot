import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiHandler } from '@/lib/api-handler';
import { ApiError } from '@/lib/api-error';
import { logger } from '@/lib/logger';

export const GET = apiHandler(async (
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new ApiError('Unauthorized', 401);
  }
  const { bookingId } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: true,
      slot: {
        include: {
          venue: true,
        },
      },
    },
  });

  if (!booking || booking.userId !== session.user.id) {
    throw new ApiError('Not Found', 404);
  }

  if (booking.status !== 'CONFIRMED') {
    throw new ApiError('Booking is not confirmed', 400);
  }

  try {
    const { generateTicketPdf } = await import('@/lib/pdf');
    const pdfBuffer = await generateTicketPdf(booking);

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ticket-${booking.id.substring(0, 8)}.pdf"`,
      },
    });
  } catch (error) {
    logger.error({ error, bookingId }, 'PDF generation error');
    throw new ApiError('Failed to generate PDF', 500);
  }
});
