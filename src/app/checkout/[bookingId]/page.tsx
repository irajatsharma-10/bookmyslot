'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, ShieldCheck, Zap } from 'lucide-react';
import { use } from 'react';
import { toast } from 'sonner';

export default function CheckoutPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const router = useRouter();
  const { bookingId } = use(params);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');

  // Generate idempotency key ONCE per page mount — survives re-renders,
  // retries, and double-clicks. A new key is only created when the user
  // navigates to a fresh checkout page.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({ bookingId, amount: 100 }), // Flat rate for MVP
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || 'Payment failed');
      }

      const paymentData = await res.json();
      toast.success('Payment successful!');
      router.push('/tickets');
      
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Payment failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 font-sans text-white pt-20">
      <div className="max-w-xl w-full">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <Zap className="w-8 h-8 text-emerald-500 fill-emerald-500" />
          <h1 className="text-4xl font-bold tracking-tight">Checkout</h1>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 md:p-12 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
          
          <div className="flex items-center justify-between mb-8 pb-8 border-b border-zinc-800">
            <div>
              <p className="text-zinc-400 font-medium mb-1 uppercase tracking-widest text-sm">Total Amount</p>
              <h2 className="text-4xl font-black text-white">$100.00</h2>
            </div>
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-emerald-500" />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handlePayment} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Cardholder Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors placeholder:text-zinc-700 font-mono"
                placeholder="JOHN DOE"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Card Number</label>
              <input
                type="text"
                required
                maxLength={19}
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\W/gi, '').replace(/(.{4})/g, '$1 ').trim())}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors placeholder:text-zinc-700 font-mono"
                placeholder="0000 0000 0000 0000"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Expiry</label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value.replace(
                    /[^0-9]/g, '' // To allow only numbers
                  ).replace(
                    /^([2-9])$/g, '0$1' // To handle 3 > 03
                  ).replace(
                    /^(1{1})([3-9]{1})$/g, '0$1/$2' // 13 > 01/3
                  ).replace(
                    /^0{1,}/g, '0' // To handle 00 > 0
                  ).replace(
                    /^([0-1]{1}[0-9]{1})([0-9]{1,2}).*/g, '$1/$2' // To handle 113 > 11/3
                  ))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors placeholder:text-zinc-700 font-mono"
                  placeholder="MM/YY"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">CVV</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors placeholder:text-zinc-700 font-mono"
                  placeholder="123"
                />
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 text-white font-semibold py-4 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Processing Securely...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Pay $100.00</span>
                  </>
                )}
              </button>
            </div>
            
            <p className="text-center text-xs text-zinc-500 font-medium uppercase tracking-widest mt-6">
              Simulated Gateway • No real money charged
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
