'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError('Invalid email or password');
      toast.error('Invalid email or password');
      setLoading(false);
    } else {
      toast.success('Successfully logged in');
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 font-sans text-white">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 md:p-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
        <div className="flex items-center gap-3 mb-10">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 shadow-sm">
            <Zap className="w-6 h-6 text-emerald-500 fill-emerald-500" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">BookMySlot</span>
        </div>

        <h2 className="text-3xl font-black mb-2 tracking-tight">Welcome Back</h2>
        <p className="text-zinc-400 mb-8">Log in to book your next session.</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors placeholder:text-zinc-600"
              placeholder="athlete@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors placeholder:text-zinc-600"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 text-white font-semibold py-3 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="mt-8 text-center text-zinc-400 text-sm">
          Don't have an account?{' '}
          <Link href="/register" className="text-emerald-400 font-bold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
