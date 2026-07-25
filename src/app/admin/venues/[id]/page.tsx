import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { createSlot, deleteSlot, deleteVenue } from "../../actions";
import { Trash2, PlusCircle, CalendarPlus, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function VenueManagementPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const venueId = resolvedParams.id;
  
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    include: {
      slots: {
        orderBy: { startTime: 'asc' }
      }
    }
  });

  if (!venue) return notFound();

  // Helper to format datetime-local input default value
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const formatLocal = (d: Date) => {
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <Link href="/admin/venues" className="inline-flex items-center text-sm font-bold text-emerald-400 hover:text-emerald-300 mb-4 transition-colors uppercase tracking-widest">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Venues
          </Link>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">{venue.name}</h1>
          <p className="text-zinc-400 font-medium">{venue.location}</p>
        </div>
        
        <form action={deleteVenue.bind(null, venue.id)}>
          <button 
            type="submit"
            className="flex items-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-6 py-2.5 rounded-xl font-bold uppercase tracking-widest text-sm transition-colors border border-red-500/20 hover:border-transparent"
          >
            <Trash2 className="w-4 h-4" /> Delete Venue
          </button>
        </form>
      </div>

      {/* Add Slot Form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl shadow-emerald-900/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <CalendarPlus className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Create Availability Slot</h2>
        </div>
        
        <form action={createSlot} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <input type="hidden" name="venueId" value={venue.id} />
          
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Start Time</label>
            <input 
              name="startTime" 
              type="datetime-local" 
              required
              defaultValue={formatLocal(nextHour)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">End Time</label>
            <input 
              name="endTime" 
              type="datetime-local" 
              required
              defaultValue={formatLocal(twoHoursLater)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Capacity</label>
            <input 
              name="capacity" 
              type="number" 
              min="1"
              required
              defaultValue="10"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-emerald-500 text-black font-bold uppercase tracking-widest text-sm px-8 py-3.5 rounded-xl hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            Add Slot
          </button>
        </form>
      </div>

      {/* Slots List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl shadow-emerald-900/10">
        <div className="p-6 border-b border-zinc-800 bg-zinc-900">
          <h2 className="text-xl font-bold text-white">Active Sessions</h2>
        </div>
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-zinc-800/50 text-xs uppercase font-bold text-zinc-300">
            <tr>
              <th scope="col" className="px-6 py-4">Date</th>
              <th scope="col" className="px-6 py-4">Start Time</th>
              <th scope="col" className="px-6 py-4">End Time</th>
              <th scope="col" className="px-6 py-4">Bookings</th>
              <th scope="col" className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {venue.slots.map((slot) => {
              const isFull = slot.bookedCount >= slot.capacity;
              
              return (
                <tr key={slot.id} className="hover:bg-zinc-800/50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-white">
                    {slot.startTime.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-zinc-300">
                    {slot.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-zinc-300">
                    {slot.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${isFull ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {slot.bookedCount} / {slot.capacity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <form action={deleteSlot.bind(null, slot.id, venue.id)}>
                      <button 
                        type="submit"
                        className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Delete Session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </td>
                </tr>
              )
            })}
            {venue.slots.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                  No sessions found. Create one above!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
