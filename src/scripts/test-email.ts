import { prisma } from '../lib/db';
import { bookingQueue } from '../lib/queue';

async function main() {
  console.log('Fetching an existing booking...');
  const booking = await prisma.booking.findFirst({
    include: {
      user: true,
      slot: {
        include: {
          venue: true
        }
      }
    }
  });

  if (!booking) {
    console.error('No booking found in the database. Please create a booking first.');
    return;
  }

  console.log('Enqueuing job to worker for booking:', booking.id);
  await bookingQueue.add('process-booking', {
    bookingId: booking.id,
    userId: booking.userId,
    requestId: 'test-request-id-resend'
  });
  
  console.log('Job enqueued! Check docker logs for the worker to see the Ethereal email URL.');
  await prisma.$disconnect();
}

main().catch(console.error);
