'use client';

import { useState, useEffect, useOptimistic, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Clock, Users } from 'lucide-react';

type Slot = {
  id: string;
  startTime: string | Date;
  endTime: string | Date;
  capacity: number;
  bookedCount: number;
};

export function VenueBookingClient({ slots }: { slots: Slot[] }) {
  const router = useRouter();
  const { status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [bookingState, setBookingState] = useState<{ slotId: string | null; status: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
    slotId: null,
    status: 'idle',
    message: ''
  });

  const [optimisticSlots, addOptimisticBooking] = useOptimistic(
    slots,
    (state: Slot[], slotId: string) => state.map(slot => 
      slot.id === slotId ? { ...slot, bookedCount: slot.bookedCount + 1 } : slot
    )
  );

  const [optimisticBookingState, setOptimisticBookingState] = useOptimistic(
    bookingState,
    (state: typeof bookingState, newState: typeof bookingState) => newState
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBooking = (slotId: string) => {
    if (status === 'unauthenticated') {
      toast.error('Please log in to book a slot');
      return;
    }

    startTransition(async () => {
      addOptimisticBooking(slotId);
      setOptimisticBookingState({ slotId, status: 'success', message: 'Redirecting...' });

      try {
        const bookingRes = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slotId }),
        });

        if (!bookingRes.ok) {
          if (bookingRes.status === 401) throw new Error('Please log in to book a slot');
          const errorData = await bookingRes.json();
          throw new Error(errorData.error || 'Failed to book slot');
        }

        const booking = await bookingRes.json();
        toast.success('Slot reserved! Redirecting to payment...');
        router.push(`/checkout/${booking.id}`);

      } catch (err: any) {
        toast.error(err.message || 'Error occurred while booking');
        setBookingState({ slotId: null, status: 'idle', message: '' });
      }
    });
  };

  return (
    <div className="mt-12">
      <div className="flex items-center gap-3 mb-8">
        <Clock className="w-6 h-6 text-emerald-500" />
        <h2 className="text-3xl font-bold tracking-tight text-white">Available Sessions</h2>
      </div>
      
      {optimisticSlots.length === 0 ? (
        <p className="text-zinc-500">No sessions available for this venue right now.</p>
      ) : (
        <div className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {optimisticSlots.map((slot) => {
            const isAvailable = slot.bookedCount < slot.capacity;
            const isThisSlotLoading = optimisticBookingState.slotId === slot.id && optimisticBookingState.status === 'loading';
            const isThisSlotSuccess = optimisticBookingState.slotId === slot.id && optimisticBookingState.status === 'success';

            return (
              <div 
                key={slot.id} 
                className={`relative flex-none w-[320px] md:w-[360px] snap-start flex flex-col justify-between p-6 rounded-2xl border transition-all duration-300 ${
                  isAvailable 
                    ? 'bg-zinc-950/50 border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900 cursor-pointer group/slot hover:-translate-y-1' 
                    : 'bg-black/40 border-white/5 opacity-50 grayscale cursor-not-allowed'
                }`}
              >
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-2xl font-black text-white group-hover/slot:text-emerald-400 transition-colors">
                      {mounted ? new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </span>
                    <div className="h-px flex-1 mx-4 bg-zinc-800 group-hover/slot:bg-emerald-500/30 transition-colors" />
                    <span className="text-xl font-bold text-zinc-500 group-hover/slot:text-zinc-300 transition-colors">
                      {mounted ? new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-lg">
                        <Users className="w-4 h-4" />
                        {slot.capacity - slot.bookedCount} spots left
                      </span>
                      <span className="text-zinc-500 font-medium">{slot.capacity} total</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${((slot.capacity - slot.bookedCount) / slot.capacity) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  disabled={!isAvailable || isThisSlotLoading || isThisSlotSuccess}
                  onClick={() => handleBooking(slot.id)}
                  className={`w-full py-4 rounded-xl font-bold tracking-wider uppercase text-sm transition-all duration-300 ${
                    isThisSlotSuccess 
                      ? 'bg-emerald-500 text-black' 
                      : isThisSlotLoading
                        ? 'bg-zinc-800 text-zinc-400 cursor-wait'
                        : isAvailable 
                          ? 'bg-zinc-100 text-black hover:bg-emerald-500 hover:text-white' 
                          : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
                  }`}
                >
                  {isThisSlotSuccess 
                    ? 'Redirecting...' 
                    : isThisSlotLoading 
                      ? optimisticBookingState.message 
                      : isAvailable ? 'Book Slot' : 'Sold Out'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
