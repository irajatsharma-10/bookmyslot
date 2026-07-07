import Link from 'next/link';
import { Search, Trophy, ShieldCheck, Zap } from 'lucide-react';

export function HeroSection() {
  return (
    <div className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden border-b border-zinc-800">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#0a0a0a]/80 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2000&auto=format&fit=crop" 
          alt="Premium Sports Turf" 
          className="w-full h-full object-cover opacity-30 object-center"
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8">
            <Zap className="w-4 h-4 fill-emerald-500" />
            <span>Instant Booking Guaranteed</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.1]">
            Elevate Your Game.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">
              Book Premium Venues.
            </span>
          </h1>
          
          <p className="text-xl text-zinc-400 mb-10 leading-relaxed max-w-2xl">
            Join the elite network of athletes. Access top-tier turfs, courts, and studios with guaranteed availability and instant confirmation.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link 
              href="#venues" 
              className="bg-emerald-500 text-white font-semibold px-8 py-4 rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              Explore Venues
            </Link>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-20 pt-10 border-t border-zinc-800/50 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-bold text-white">Verified Venues</h3>
              <p className="text-sm text-zinc-400">Strictly vetted for quality.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Zap className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-bold text-white">Instant Booking</h3>
              <p className="text-sm text-zinc-400">No waiting for approvals.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-bold text-white">Premium Support</h3>
              <p className="text-sm text-zinc-400">24/7 dedicated assistance.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
