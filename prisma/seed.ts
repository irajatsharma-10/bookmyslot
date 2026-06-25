import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import bcrypt from 'bcryptjs';

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');
  
  // Clear existing venues
  await prisma.venue.deleteMany();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Add default user for sign in
  const passwordHash = await bcrypt.hash('password', 10);
  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: passwordHash,
      role: 'USER',
    }
  });

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash: passwordHash,
      role: 'ADMIN',
    }
  });

  const venue1 = await prisma.venue.create({
    data: {
      name: 'Downtown Turf',
      location: '123 Main St, City Center',
      slots: {
        create: [
          {
            startTime: new Date(new Date(today).setHours(10, 0, 0, 0)),
            endTime: new Date(new Date(today).setHours(11, 0, 0, 0)),
            capacity: 10,
          },
          {
            startTime: new Date(new Date(today).setHours(11, 0, 0, 0)),
            endTime: new Date(new Date(today).setHours(12, 0, 0, 0)),
            capacity: 10,
          },
          {
            startTime: new Date(new Date(today).setHours(18, 0, 0, 0)),
            endTime: new Date(new Date(today).setHours(19, 0, 0, 0)),
            capacity: 10,
          },
        ]
      }
    }
  });

  const venue2 = await prisma.venue.create({
    data: {
      name: 'Uptown Sports Complex',
      location: '456 Uptown Blvd',
      slots: {
        create: [
          {
            startTime: new Date(new Date(today).setHours(16, 0, 0, 0)),
            endTime: new Date(new Date(today).setHours(18, 0, 0, 0)),
            capacity: 20,
          }
        ]
      }
    }
  });

  const venue3 = await prisma.venue.create({
    data: {
      name: 'City Tennis Courts',
      location: '789 Park Ave',
      slots: {
        create: [
          {
            startTime: new Date(new Date(today).setHours(8, 0, 0, 0)),
            endTime: new Date(new Date(today).setHours(9, 30, 0, 0)),
            capacity: 4,
          },
          {
            startTime: new Date(new Date(today).setHours(9, 30, 0, 0)),
            endTime: new Date(new Date(today).setHours(11, 0, 0, 0)),
            capacity: 4,
          }
        ]
      }
    }
  });

  console.log(`Created venues: ${venue1.name}, ${venue2.name}, ${venue3.name}`);
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
