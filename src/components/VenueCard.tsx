import Link from 'next/link';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import { Prisma } from '@prisma/client';

type VenueWithSlots = Prisma.VenueGetPayload<{
  include: { slots: true }
}>;

interface VenueCardProps {
  venue: VenueWithSlots;
}

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2070&auto=format&fit=crop', // Soccer/Turf
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=2090&auto=format&fit=crop', // Basketball
  'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=2074&auto=format&fit=crop', // Tennis
  'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=2000&auto=format&fit=crop'  // Multi-purpose
];

export function VenueCard({ venue }: VenueCardProps) {
  // Determine if there are upcoming slots today
  const todaySlots = venue.slots.filter(s => new Date(s.startTime) >= new Date() && s.bookedCount < s.capacity);
  
  // Use venue.imageUrl or pick a consistent image based on venue name length
  const fallbackImage = DEFAULT_IMAGES[venue.name.length % DEFAULT_IMAGES.length];
  const imageToUse = venue.imageUrl || fallbackImage;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all duration-300 group flex flex-col h-full shadow-lg">
      <div className="h-48 relative overflow-hidden bg-zinc-950">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent z-10" />
        <img 
          src={imageToUse} 
          alt={venue.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-80"
        />
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
            Premium
          </div>
        </div>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-2xl font-black text-white mb-2 group-hover:text-emerald-400 transition-colors">
          {venue.name}
        </h3>
        
        <div className="flex items-center gap-2 text-zinc-400 mb-6">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{venue.location}</span>
        </div>
        
        <div className="mt-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Calendar className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {todaySlots.length > 0 ? `${todaySlots.length} slots available` : 'Book in advance'}
              </p>
              <p className="text-xs text-zinc-500">Secure your time now</p>
            </div>
          </div>
          
          <Link 
            href={`/venues/${venue.id}`}
            className="w-full bg-zinc-950 border border-zinc-800 text-white font-semibold py-3 px-4 rounded-xl hover:bg-emerald-500 hover:border-emerald-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
          >
            View Details & Book
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
