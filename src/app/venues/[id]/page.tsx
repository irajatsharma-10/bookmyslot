import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { MapPin, Info, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { VenueBookingClient } from '@/components/VenueBookingClient';

export const dynamic = 'force-dynamic';

export default async function VenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const venue = await prisma.venue.findUnique({
    where: { id },
    include: { slots: { orderBy: { startTime: 'asc' } } }
  });

  if (!venue) {
    notFound();
  }

  // Filter out past slots
  const upcomingSlots = venue.slots.filter(s => new Date(s.startTime) >= new Date());

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans pb-24">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 md:pt-40">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 bg-zinc-900/50 hover:bg-zinc-900 px-4 py-2 rounded-full w-fit border border-zinc-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Venues
        </Link>
        
        <div className="flex flex-col md:flex-row gap-8 lg:gap-16 items-start">
          <div className="flex-1 w-full">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-4 w-fit">
              Premium Venue
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 text-white leading-tight">
              {venue.name}
            </h1>
            <div className="flex items-center gap-2 text-zinc-400 text-lg mb-8">
              <MapPin className="w-5 h-5 text-emerald-500" />
              {venue.location}
            </div>
          </div>

          <div className="w-full md:w-[45%] lg:w-[50%] shrink-0">
            <div className="aspect-video w-full rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl relative">
              <img 
                src={venue.imageUrl || "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=2000&auto=format&fit=crop"} 
                alt={venue.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-12">
        <div className="prose prose-invert max-w-none">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
                <Info className="w-6 h-6 text-emerald-500" />
                About this Venue
              </h3>
              <p className="text-zinc-400 text-lg leading-relaxed">
                Experience top-tier sports facilities at {venue.name}. Carefully maintained for optimal performance, this venue offers an unparalleled athletic experience. Whether you're playing a casual match or a competitive game, our premium courts and turfs are ready for you.
              </p>
              
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
                  <span className="block text-zinc-500 text-sm font-medium mb-1">Amenities</span>
                  <span className="text-white">Changing Rooms, Parking, Floodlights</span>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
                  <span className="block text-zinc-500 text-sm font-medium mb-1">Surface Type</span>
                  <span className="text-white">Professional Grade AstroTurf</span>
                </div>
              </div>
            </div>

          <VenueBookingClient slots={upcomingSlots} />
        </div>
      </div>
  );
}
