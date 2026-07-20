'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function DownloadTicketButton({ bookingId }: { bookingId: string }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await fetch(`/api/bookings/${bookingId}/ticket`);
      
      if (!res.ok) {
        throw new Error('Failed to download ticket');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download ticket. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button 
      onClick={handleDownload}
      disabled={downloading}
      className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 font-bold uppercase tracking-widest px-6 py-3 rounded-xl transition-all duration-300 text-sm hover:shadow-[0_0_15px_rgba(52,211,153,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {downloading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {downloading ? 'Downloading...' : 'Download PDF'}
    </button>
  );
}
