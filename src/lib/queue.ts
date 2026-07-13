import { Queue } from 'bullmq';
import redis from './redis';

export const bookingQueueName = 'booking-processing-queue';

export const bookingQueue = new Queue(bookingQueueName, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 1000, // Wait 1s, 2s, 4s between retries
    },
    removeOnComplete: true, // Clean up successful jobs to save memory
    removeOnFail: false, // Keep failed jobs for debugging
  },
});
