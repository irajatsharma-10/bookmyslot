'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Zap } from 'lucide-react';
import { toast } from 'sonner';

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/register') return null;

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 transition-colors group-hover:border-emerald-500/50">
              <Zap className="w-5 h-5 text-emerald-500 fill-emerald-500" />
            </div>
            <span className="text-xl font-bold tracking-wide text-white">BookMySlot</span>
          </Link>

          {/* Auth Actions */}
          <div className="flex items-center gap-4">
            {status === 'loading' ? (
              <div className="w-20 h-8 bg-zinc-800 rounded animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-6">
                <Link href="/profile" className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors hidden sm:block flex items-center gap-2">
                  {session.user?.name || session.user?.email}
                  {session.user?.role === 'ADMIN' && (
                    <span className="ml-2 bg-emerald-500/10 text-emerald-400 text-xs px-2 py-1 rounded">ADMIN</span>
                  )}
                </Link>
                <Link 
                  href="/tickets"
                  className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block"
                >
                  My Tickets
                </Link>
                {session.user?.role === 'ADMIN' && (
                  <Link 
                    href="/admin/venues"
                    className="text-sm font-medium text-emerald-500 hover:text-emerald-400 transition-colors hidden sm:block"
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => {
                    toast.success('Successfully logged out');
                    signOut({ callbackUrl: '/login' });
                  }}
                  className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="bg-white text-black px-5 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
