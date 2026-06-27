'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Registration failed');
      }

      // Auto login after register
      await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      toast.success('Account created successfully');
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 font-sans text-white">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 md:p-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500" />
        <div className="flex items-center gap-3 mb-10">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 shadow-sm">
            <Zap className="w-6 h-6 text-cyan-500 fill-cyan-500" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">BookMySlot</span>
        </div>

        <h2 className="text-3xl font-black mb-2 tracking-tight">Create Account</h2>
        <p className="text-zinc-400 mb-8">Join the elite roster of athletes.</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors placeholder:text-zinc-600"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors placeholder:text-zinc-600"
              placeholder="athlete@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Password (Min 6 chars)</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors placeholder:text-zinc-600"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 text-black font-semibold py-3 rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>

        <p className="mt-8 text-center text-zinc-400 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-cyan-400 font-bold hover:underline">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}
