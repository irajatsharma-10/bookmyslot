'use client';

import { Search, MapPin } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  locationFilter: string;
  setLocationFilter: (l: string) => void;
}

export function SearchBar({ searchQuery, setSearchQuery, locationFilter, setLocationFilter }: SearchBarProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 md:p-4 flex flex-col md:flex-row gap-4 shadow-xl mb-12">
      <div className="flex-1 flex items-center gap-3 bg-[#0a0a0a] border border-zinc-800 rounded-xl px-4 py-3 focus-within:border-emerald-500/50 transition-colors">
        <Search className="w-5 h-5 text-zinc-500" />
        <input 
          type="text" 
          placeholder="Search for a venue (e.g. Urban Sports Arena)..." 
          className="bg-transparent border-none outline-none w-full text-white placeholder-zinc-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="flex-1 md:max-w-xs flex items-center gap-3 bg-[#0a0a0a] border border-zinc-800 rounded-xl px-4 py-3 focus-within:border-emerald-500/50 transition-colors">
        <MapPin className="w-5 h-5 text-zinc-500" />
        <input 
          type="text" 
          placeholder="Location (e.g. Downtown)..." 
          className="bg-transparent border-none outline-none w-full text-white placeholder-zinc-500"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        />
      </div>
    </div>
  );
}
