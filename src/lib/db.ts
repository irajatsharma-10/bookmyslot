import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  // Initialize the driver adapter for Neon
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  
  return new PrismaClient({
    adapter,
    // Disable verbose query logging in production to reduce log noise and overhead
    log: process.env.NODE_ENV === 'production'
      ? ['error', 'warn']
      : ['query', 'error', 'warn'],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Cache the Prisma client globally to prevent connection exhaustion
// during dev hot-reload AND for safety in edge cases in production
globalForPrisma.prisma = prisma;

