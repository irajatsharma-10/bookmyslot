import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ProfileClient } from '@/components/ProfileClient';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      role: true,
      _count: {
        select: {
          bookings: {
            where: {
              status: 'CONFIRMED'
            }
          }
        }
      }
    }
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-100 pt-24 px-6 lg:px-8 font-sans pb-24 flex justify-center selection:bg-zinc-800 selection:text-white">
      <div className="max-w-4xl w-full">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-3">
            Account Settings
          </h1>
          <p className="text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed">
            Manage your personal information and preferences. Your profile details are private and secure.
          </p>
        </div>

        {/* Profile Content */}
        <ProfileClient user={user} totalBookings={user._count.bookings} />
      </div>
    </div>
  );
}
