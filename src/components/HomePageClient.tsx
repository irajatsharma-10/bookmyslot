'use client';

import { useState } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { VenueCard } from '@/components/VenueCard';
import { Prisma } from '@prisma/client';

type VenueWithSlots = Prisma.VenueGetPayload<{
  include: { slots: true }
}>;

interface HomePageClientProps {
  venues: VenueWithSlots[];
}

export function HomePageClient({ venues }: HomePageClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const filteredVenues = venues.filter((venue) => {
    const matchesSearch = venue.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = venue.location.toLowerCase().includes(locationFilter.toLowerCase());
    return matchesSearch && matchesLocation;
  });

  return (
    <>
      <div id="venues" className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="mb-12">
          <SearchBar 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery}
            locationFilter={locationFilter}
            setLocationFilter={setLocationFilter}
          />
        </div>
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Premium Venues</h2>
          <p className="text-zinc-400 max-w-2xl">Discover and book the finest sports facilities in your area. Guaranteed availability and instant confirmation.</p>
        </div>

        {filteredVenues.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">No venues found</h3>
            <p className="text-zinc-400">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVenues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
