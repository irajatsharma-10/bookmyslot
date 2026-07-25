import { prisma } from "@/lib/db";
import { createVenue } from "../actions";
import { PlusCircle, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function AdminVenuesPage() {
  const venues = await prisma.venue.findMany({
    include: {
      slots: true,
      _count: {
        select: { slots: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">Manage Venues</h1>
        <p className="text-zinc-400">Add or remove venues from the platform.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl shadow-emerald-900/10">
        <h2 className="text-xl font-bold mb-6 text-white">Create New Venue</h2>
        <form action={createVenue} className="flex flex-col sm:flex-row gap-4 items-end" encType="multipart/form-data">
          <div className="w-full">
            <label className="block text-sm font-medium text-zinc-400 mb-2">Venue Name</label>
            <input 
              name="name" 
              type="text" 
              required
              placeholder="e.g. Downtown Turf" 
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-zinc-400 mb-2">Location</label>
            <input 
              name="location" 
              type="text" 
              required
              placeholder="e.g. 123 Main St" 
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-zinc-400 mb-2">Upload Image (Optional)</label>
            <input 
              name="image" 
              type="file" 
              accept="image/*"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20"
            />
          </div>
          <button 
            type="submit"
            className="w-full sm:w-auto shrink-0 bg-emerald-500 text-black font-bold uppercase tracking-widest text-sm px-8 py-3.5 rounded-xl hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            Create
          </button>
        </form>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl shadow-emerald-900/10">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-zinc-800/50 text-xs uppercase font-bold text-zinc-300">
            <tr>
              <th scope="col" className="px-6 py-4">Venue Name</th>
              <th scope="col" className="px-6 py-4">Location</th>
              <th scope="col" className="px-6 py-4">Total Slots</th>
              <th scope="col" className="px-6 py-4">Added On</th>
              <th scope="col" className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {venues.map((venue) => (
              <tr key={venue.id} className="hover:bg-zinc-800/50 transition-colors group">
                <td className="px-6 py-4 font-medium text-white">{venue.name}</td>
                <td className="px-6 py-4">{venue.location}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center justify-center bg-emerald-500/10 text-emerald-400 font-medium px-3 py-1 rounded-full text-xs">
                    {venue._count.slots}
                  </span>
                </td>
                <td className="px-6 py-4">{new Date(venue.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    href={`/admin/venues/${venue.id}`}
                    className="inline-flex items-center gap-1 text-sm font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-widest transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Manage <ChevronRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
            {venues.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                  No venues found. Create one above!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
