import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Ticket } from 'lucide-react';
import QRCode from 'qrcode';

import { TicketsClient } from '@/components/TicketsClient';

export const dynamic = 'force-dynamic';

export default async function TicketsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/login');
  }

  const userId = session.user.id;

  const rawBookings = await prisma.booking.findMany({
    where: { 
      userId,
      status: 'CONFIRMED' // Only show confirmed bookings (paid)
    },
    include: {
      slot: {
        include: {
          venue: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Generate QR codes for all bookings on the server
  const bookings = await Promise.all(
    rawBookings.map(async (booking) => {
      const qrCode = await QRCode.toDataURL(`BOOKING:${booking.id}`, {
        width: 256,
        margin: 1,
        color: {
          dark: '#0a0a0a',
          light: '#ffffff'
        }
      });
      return { ...booking, qrCode };
    })
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 px-6 lg:px-8 font-sans pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12 border-b border-zinc-800 pb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">My Tickets</h1>
            <p className="text-zinc-400">Manage your upcoming and past bookings.</p>
          </div>
          <Ticket className="w-12 h-12 text-zinc-600" />
        </div>

        <TicketsClient bookings={bookings} />
      </div>
    </div>
  );
}
