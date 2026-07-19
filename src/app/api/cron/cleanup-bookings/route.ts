import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { apiHandler } from '@/lib/api-handler';
import { ApiError } from '@/lib/api-error';

export const POST = apiHandler(async (req: Request) => {
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'dev-cron-secret'}`) {
    throw new ApiError('Unauthorized', 401);
  }

  // 30 minutes ago
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  const result = await prisma.booking.updateMany({
    where: {
      status: 'PENDING',
      createdAt: {
        lt: thirtyMinutesAgo
      }
    },
    data: {
      status: 'FAILED'
    }
  });

  logger.info(`Cleaned up ${result.count} stale pending bookings`);

  return NextResponse.json({ success: true, count: result.count });
});
