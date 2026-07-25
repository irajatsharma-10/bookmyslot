import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 font-sans">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Admin Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="sticky top-28 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl shadow-emerald-900/10">
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-zinc-800">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-bold tracking-tight">Admin Console</h2>
                  <p className="text-xs text-zinc-400 font-mono">{session.user?.email}</p>
                </div>
              </div>
              
              <nav className="flex flex-col gap-2">
                <Link 
                  href="/admin/venues"
                  className="px-4 py-3 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-400 font-medium transition-colors"
                >
                  Manage Venues
                </Link>
                <Link 
                  href="/admin/tickets"
                  className="px-4 py-3 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-400 font-medium transition-colors"
                >
                  All Tickets
                </Link>
              </nav>
            </div>
          </aside>

          {/* Admin Content */}
          <main className="flex-1">
            {children}
          </main>
          
        </div>
      </div>
    </div>
  );
}
