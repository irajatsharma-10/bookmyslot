import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { apiHandler } from '@/lib/api-handler';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const POST = apiHandler(async (req: Request) => {
  const body = await req.json();
  const result = registerSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.issues },
      { status: 400 }
    );
  }

  const { name, email, password } = result.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: 'User already exists' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  return NextResponse.json(
    { message: 'User registered successfully', userId: user.id },
    { status: 201 }
  );
}, {
  rateLimit: {
    prefix: 'register',
    maxRequests: 5,
    windowSeconds: 60,
    failClosed: false, // Don't block registration if Redis is down
  },
});

