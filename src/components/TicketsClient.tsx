'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Ticket, MapPin, CalendarClock } from 'lucide-react';
import { Prisma } from '@prisma/client';
import { DownloadTicketButton } from '@/app/tickets/components/DownloadTicketButton';

type BookingWithDetails = Prisma.BookingGetPayload<{
  include: {
    slot: {
      include: { venue: true }
    }
  }
}> & { qrCode: string };

interface TicketsClientProps {
  bookings: BookingWithDetails[];
}

export function TicketsClient({ bookings }: TicketsClientProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const now = new Date();
  
  const upcomingBookings = bookings.filter(b => new Date(b.slot.startTime) >= now);
  const pastBookings = bookings.filter(b => new Date(b.slot.startTime) < now);
  
  const displayBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  return (
    <>
      <div className="flex gap-4 mb-8 border-b border-zinc-800">
        <button 
          onClick={() => setActiveTab('upcoming')}
          className={`pb-4 px-2 font-semibold transition-colors relative ${activeTab === 'upcoming' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Upcoming
          {activeTab === 'upcoming' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t-full" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('past')}
          className={`pb-4 px-2 font-semibold transition-colors relative ${activeTab === 'past' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Past Bookings
          {activeTab === 'past' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t-full" />
          )}
        </button>
      </div>

      {displayBookings.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center shadow-sm">
          <Ticket className="w-16 h-16 text-zinc-600 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold mb-2">No {activeTab} tickets</h3>
          <p className="text-zinc-400 mb-8">
            {activeTab === 'upcoming' 
              ? "You haven't booked any upcoming slots yet. Secure your turf now." 
              : "You have no past bookings."}
          </p>
          {activeTab === 'upcoming' && (
            <Link 
              href="/"
              className="bg-emerald-500 text-white font-semibold px-8 py-3 rounded-lg hover:bg-emerald-600 transition-colors inline-block"
            >
              Browse Venues
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-8">
          {displayBookings.map((booking) => (
            <div 
              key={booking.id} 
              className={`bg-zinc-900 border rounded-2xl flex flex-col md:flex-row overflow-hidden transition-colors ${
                activeTab === 'past' ? 'border-zinc-800 opacity-70 grayscale' : 'border-zinc-800 hover:border-emerald-500/50'
              }`}
            >
              <div className="hidden md:flex absolute left-64 top-0 bottom-0 w-8 flex-col justify-between items-center py-4 z-10">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-[#0a0a0a]" />
                ))}
              </div>

              <div className="bg-zinc-950 p-8 md:w-64 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-zinc-800 relative z-0">
                <div className="bg-white p-3 rounded-xl mb-4">
                  <img src={booking.qrCode} alt="Ticket QR Code" className="w-24 h-24 object-contain rounded-lg" />
                </div>
                <span className="font-mono text-xs text-zinc-500 tracking-widest uppercase text-center break-all">
                  ID: {booking.id.substring(0, 12)}
                </span>
              </div>

              <div className="p-8 flex-1 relative z-0">
                <div className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md mb-4 ${
                  activeTab === 'upcoming' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {activeTab === 'upcoming' ? 'Confirmed' : 'Completed'}
                </div>
                
                <h2 className="text-2xl font-bold mb-2">{booking.slot.venue.name}</h2>
                
                <div className="flex items-center gap-2 text-zinc-400 mb-6">
                  <MapPin className="w-4 h-4" />
                  <span>{booking.slot.venue.location}</span>
                </div>

                <div className="flex flex-wrap gap-6 bg-zinc-950 p-6 rounded-xl border border-zinc-800">
                  <div>
                    <span className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Date</span>
                    <span className="font-medium text-lg">
                      {new Date(booking.slot.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Time</span>
                    <div className={`flex items-center gap-2 font-medium text-lg ${activeTab === 'upcoming' ? 'text-emerald-400' : 'text-zinc-400'}`}>
                      <CalendarClock className="w-5 h-5" />
                      {new Date(booking.slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <DownloadTicketButton bookingId={booking.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
