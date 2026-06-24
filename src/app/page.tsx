import { prisma } from '@/lib/db';
import { HeroSection } from '@/components/HeroSection';
import { HomePageClient } from '@/components/HomePageClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const venues = await prisma.venue.findMany({
    include: { slots: { orderBy: { startTime: 'asc' } } }
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <HeroSection />
      <HomePageClient venues={venues} />
    </div>
  );
}
