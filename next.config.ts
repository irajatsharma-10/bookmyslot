import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pdfkit', 'qrcode'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      }
    ]
  }
};

export default withSentryConfig(nextConfig, {
  org: "thunder-36",
  project: "bookslot",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  }
});
