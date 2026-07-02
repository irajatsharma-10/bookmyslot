import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiHandler } from '@/lib/api-handler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const createVenueSchema = z.object({
  name: z.string().min(2),
  location: z.string().min(2),
});

export const GET = apiHandler(async () => {
  const venues = await prisma.venue.findMany({
    include: {
      slots: {
        select: { id: true, startTime: true, endTime: true, capacity: true, bookedCount: true },
      },
    },
  });
  return NextResponse.json(venues);
});

export const POST = apiHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Admins only' }, { status: 403 });
  }

  const body = await req.json();
  const { name, location } = createVenueSchema.parse(body);

  const venue = await prisma.venue.create({
    data: { name, location },
  });

  return NextResponse.json(venue, { status: 201 });
});
