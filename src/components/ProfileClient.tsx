'use client';

import { useState } from 'react';
import { User, Mail, CalendarDays, Check, X, Loader2, ShieldCheck, CreditCard } from 'lucide-react';
import { updateProfile } from '@/app/profile/actions';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ProfileClientProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    createdAt: Date;
    role: string;
  };
  totalBookings: number;
}

export function ProfileClient({ user, totalBookings }: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const { update } = useSession();
  const router = useRouter();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      
      await updateProfile(formData);
      await update({ name }); // Force session update for navbar
      
      toast.success('Profile updated successfully');
      setIsEditing(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-[#09090b] border border-white/[0.08] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm hover:border-white/[0.12] transition-colors">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-gradient-to-tr from-zinc-800 to-zinc-700 rounded-full flex items-center justify-center border border-white/10 shadow-inner">
            <span className="text-2xl font-medium text-white">
              {user.name ? user.name.charAt(0).toUpperCase() : ((user.email || '').charAt(0).toUpperCase() || '?')}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white mb-1.5 tracking-tight">{user.name || 'Anonymous User'}</h2>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 text-zinc-300 text-[11px] font-medium uppercase tracking-wider rounded-md">
                <ShieldCheck className="w-3.5 h-3.5" />
                {user.role}
              </div>
              <span className="text-sm text-zinc-500">ID: {user.id.substring(0, 8)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end min-w-[120px] px-6 py-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
          <span className="text-sm text-zinc-400 font-medium mb-1">Total Bookings</span>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-zinc-500" />
            <span className="text-2xl font-semibold text-white tracking-tight">{totalBookings}</span>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 gap-6">
        {/* Name Settings */}
        <div className="bg-[#09090b] border border-white/[0.08] rounded-2xl p-6 md:p-8 shadow-sm hover:border-white/[0.12] transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/5 mt-0.5">
                <User className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white mb-1">Display Name</h3>
                {!isEditing && <p className="text-zinc-400 text-sm">{user.name || 'Not provided'}</p>}
              </div>
            </div>
            
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-sm font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors px-4 py-1.5 rounded-lg"
              >
                Edit
              </button>
            )}
          </div>

          {isEditing && (
            <form onSubmit={handleSave} className="mt-5 ml-14 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="flex-1 bg-black border border-white/10 text-white text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-zinc-600"
                  disabled={isLoading}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setName(user.name || '');
                    }}
                    disabled={isLoading}
                    className="px-4 py-2.5 bg-white/5 text-zinc-300 rounded-lg hover:bg-white/10 border border-white/5 transition-colors flex items-center justify-center flex-1 sm:flex-none text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-5 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none text-sm"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Email & Date joined */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#09090b] border border-white/[0.08] rounded-2xl p-6 md:p-8 flex items-start justify-between shadow-sm hover:border-white/[0.12] transition-colors">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/5 mt-0.5">
                <Mail className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white mb-1">Email Address</h3>
                <p className="text-zinc-400 text-sm truncate max-w-[200px] sm:max-w-xs">{user.email}</p>
              </div>
            </div>
            <div className="inline-flex items-center px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium uppercase tracking-wider rounded-md">
              Verified
            </div>
          </div>
          
          <div className="bg-[#09090b] border border-white/[0.08] rounded-2xl p-6 md:p-8 flex items-start gap-4 shadow-sm hover:border-white/[0.12] transition-colors">
            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/5 mt-0.5">
              <CalendarDays className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-1">Member Since</h3>
              <p className="text-zinc-400 text-sm">
                {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
