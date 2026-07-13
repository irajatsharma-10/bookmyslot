import { Worker, Job } from 'bullmq';
import redis from './lib/redis';
import { bookingQueueName } from './lib/queue';
import { logger } from './lib/logger';
import { prisma } from './lib/db';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import PDFDocument from 'pdfkit';
import * as Sentry from '@sentry/node';

// Initialize Sentry for the worker process
if (process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.2'),
    environment: process.env.NODE_ENV || 'development',
  });
}

// ---------------------------------------------------------------------------
// Email Transport — configured ONCE at startup, not per-job
// ---------------------------------------------------------------------------
let transporter: Transporter | null = null;

async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    // Production: use configured SMTP
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    logger.info('Email transporter configured with SMTP');
  } else {
    // Development fallback: Ethereal test account (created ONCE)
    logger.warn('No SMTP_HOST configured — using Ethereal test account (dev only)');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return transporter;
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------
logger.info(`Starting BullMQ worker for queue: ${bookingQueueName}`);

const worker = new Worker(
  bookingQueueName,
  async (job: Job) => {
    const { bookingId, userId, requestId } = job.data;
    const jobLog = logger.child({ jobId: job.id, bookingId, userId, requestId });

    jobLog.info('Started processing booking');

    // Fetch booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        slot: {
          include: {
            venue: true,
          }
        }
      }
    });

    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    // Generate PDF ticket
    jobLog.info('Generating PDF ticket...');
    const { generateTicketPdf } = await import('./lib/pdf');
    const pdfBuffer = await generateTicketPdf(booking);

    jobLog.info('PDF ticket generated successfully');

    // Send email
    jobLog.info('Sending confirmation email...');
    const mailer = await getTransporter();
    const fromAddress = process.env.SMTP_FROM || '"BookMySlot" <noreply@bookmyslot.com>';

    const info = await mailer.sendMail({
      from: fromAddress,
      to: booking.user?.email || 'user@example.com',
      subject: `Your Ticket for ${booking.slot.venue.name} - BookMySlot`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
            .header { background-color: #10b981; padding: 40px 20px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px; }
            .content { padding: 40px 30px; color: #374151; line-height: 1.6; }
            .greeting { font-size: 18px; font-weight: 600; margin-bottom: 20px; }
            .card { background-color: #f3f4f6; border-left: 4px solid #10b981; padding: 25px; border-radius: 8px; margin: 30px 0; }
            .venue-name { font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 15px 0; }
            .detail-row { margin-bottom: 10px; font-size: 15px; }
            .detail-label { font-weight: 600; color: #6b7280; display: inline-block; width: 80px; }
            .detail-value { color: #111827; font-weight: 500; }
            .footer { background-color: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
            .button { display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 8px; font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>BOOKING CONFIRMED</h1>
            </div>
            <div class="content">
              <div class="greeting">Hi ${booking.user?.name || 'Sports Fan'},</div>
              <p>Great news! Your booking has been successfully processed and your slot is secured. Get ready for an amazing time!</p>
              
              <div class="card">
                <h2 class="venue-name">${booking.slot.venue.name}</h2>
                <div class="detail-row">
                  <span class="detail-label">Location:</span>
                  <span class="detail-value">${booking.slot.venue.location}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${new Date(booking.slot.startTime).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time:</span>
                  <span class="detail-value">${new Date(booking.slot.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(booking.slot.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Order ID:</span>
                  <span class="detail-value" style="font-family: monospace;">${booking.id.substring(0, 12).toUpperCase()}</span>
                </div>
              </div>

              <p>Your official PDF ticket is attached to this email. Please have it ready (on your phone or printed) to show at the venue upon arrival.</p>
              
              <p style="margin-top: 30px;">Have a great game!<br><strong>The BookMySlot Team</strong></p>
            </div>
            <div class="footer">
              <p>You're receiving this email because you made a booking on BookMySlot.</p>
              <p>© ${new Date().getFullYear()} BookMySlot Inc. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `ticket-${booking.id.substring(0, 8)}.pdf`,
          content: pdfBuffer,
        }
      ]
    });

    jobLog.info('Confirmation email sent');

    // Only show preview URL for Ethereal (dev) emails
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      jobLog.info({ previewUrl }, 'Ethereal preview URL');
    }

    return { status: 'success', sentAt: new Date().toISOString() };
  },
  {
    connection: redis,
    // Concurrency: 5 is reasonable for PDF generation workloads.
    // PDFKit is CPU-bound but typically completes in ~100-200ms per ticket.
    // With 5 concurrent jobs, peak CPU usage stays manageable on a single
    // container. Profile and adjust if p95 latency increases or CPU saturates.
    concurrency: 5,
  }
);

// ---------------------------------------------------------------------------
// Event Handlers
// ---------------------------------------------------------------------------
worker.on('completed', (job) => {
  logger.info({ jobId: job.id, bookingId: job.data.bookingId }, 'Job completed successfully');
});

worker.on('failed', (job, err) => {
  const isLastAttempt = job && job.attemptsMade >= (job.opts.attempts ?? 1);
  
  logger.error(
    { jobId: job?.id, bookingId: job?.data?.bookingId, err, isLastAttempt },
    `Job failed (attempt ${job?.attemptsMade}/${job?.opts.attempts ?? 1})`
  );

  // Only alert Sentry on the FINAL failure — no noise for transient retries
  if (isLastAttempt) {
    Sentry.captureException(err, {
      tags: {
        jobId: job?.id,
        bookingId: job?.data?.bookingId,
        queue: bookingQueueName,
      },
    });
  }
});

worker.on('error', (err) => {
  logger.error({ err }, 'Worker encountered an error');
  Sentry.captureException(err);
});

// ---------------------------------------------------------------------------
// Graceful Shutdown
// ---------------------------------------------------------------------------
async function shutdown(signal: string) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  
  // worker.close() stops accepting new jobs and waits for active jobs to finish
  await worker.close();
  
  // Disconnect Prisma
  await prisma.$disconnect();
  
  logger.info('Worker closed. Exiting.');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
