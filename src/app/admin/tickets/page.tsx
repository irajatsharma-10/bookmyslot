import { prisma } from "@/lib/db";
import { Ticket, CalendarClock } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminTicketsPage() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      slot: {
        include: {
          venue: true
        }
      }
    }
  });

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">All Booked Tickets</h1>
        <p className="text-zinc-400">View and manage all customer bookings across all venues.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl shadow-emerald-900/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-zinc-800/50 text-xs uppercase font-bold text-zinc-300">
              <tr>
                <th scope="col" className="px-6 py-4">Ticket ID</th>
                <th scope="col" className="px-6 py-4">User</th>
                <th scope="col" className="px-6 py-4">Venue</th>
                <th scope="col" className="px-6 py-4">Session Time</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="pr-6 py-4 text-right">Booked On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {bookings.map((booking) => {
                const isPast = new Date(booking.slot.startTime) < new Date();
                
                return (
                  <tr key={booking.id} className="hover:bg-zinc-800/50 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs uppercase text-zinc-500">
                      {booking.id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{booking.user.name || 'Unknown User'}</div>
                      <div className="text-xs text-zinc-500">{booking.user.email}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-emerald-400">
                      {booking.slot.venue.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-white">
                          {booking.slot.startTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-zinc-500">
                          <CalendarClock className="w-3 h-3" />
                          {booking.slot.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {booking.slot.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isPast ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-400">
                          Completed
                        </span>
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          booking.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'
                        }`}>
                          {booking.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {booking.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    <Ticket className="w-8 h-8 mx-auto mb-3 text-zinc-600" />
                    No tickets booked yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
