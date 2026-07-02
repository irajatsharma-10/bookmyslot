import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiHandler } from '@/lib/api-handler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const createSlotSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  capacity: z.number().int().positive().default(1),
});

export const GET = apiHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const slots = await prisma.slot.findMany({
    where: { venueId: id },
    orderBy: { startTime: 'asc' },
  });
  return NextResponse.json(slots);
});

export const POST = apiHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Admins only' }, { status: 403 });
  }

  const body = await req.json();
  const { startTime, endTime, capacity } = createSlotSchema.parse(body);

  const slot = await prisma.slot.create({
    data: {
      venueId: id,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      capacity,
    },
  });

  return NextResponse.json(slot, { status: 201 });
});
