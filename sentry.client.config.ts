import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  tracesSampleRate: 1,
  debug: false,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true, // Blurs out text for privacy
      blockAllMedia: true, // Blocks images/video for privacy
    }),
  ],
  replaysSessionSampleRate: 0.1, 
  replaysOnErrorSampleRate: 1.0, // Always record when an error happens
});
