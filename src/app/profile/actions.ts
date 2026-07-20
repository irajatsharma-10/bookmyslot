'use server';

import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export async function updateProfile(formData: FormData) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }

  const name = formData.get('name') as string;
  const result = updateProfileSchema.safeParse({ name });

  if (!result.success) {
    throw new Error(result.error.issues[0].message);
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: result.data.name },
  });

  return { success: true };
}
