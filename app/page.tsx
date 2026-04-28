'use client';

import { Frame } from '@/components/Frame';
import Link from 'next/link';
import dynamic from 'next/dynamic';

import { MapFallback } from '@/components/Skeletons';
import { Suspense } from 'react';

const PremiumGlobe = dynamic(() => import('@/components/PremiumGlobe'), { 
  ssr: false,
  loading: () => <MapFallback />
});

export default function SplashPage() {
  return (
    <div className="flex flex-col md:flex-row gap-8 items-stretch justify-center h-full flex-grow pt-10">
      <div className="flex flex-col justify-center max-w-md gap-6">
        <div>
          <h2 className="text-4xl font-bold uppercase tracking-widest border-b-2 border-border pb-2 mb-4 italic tracking-tighter font-black">
            System Online
          </h2>
          <p className="text-muted-foreground font-mono text-sm leading-relaxed">
            Welcome to CrisisQR 2.0. Global monitoring enabled. Select your portal to proceed. All signals are priority-routed through the AI rescue core.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Link href="/citizen/dashboard" className="brutalist-button text-center text-lg py-4">
            Citizen Portal
          </Link>
          <Link href="/rescue/dashboard" className="brutalist-button-outline text-center text-lg py-4">
            Rescue Command
          </Link>
          <Link href="/admin/control-room" className="brutalist-button-outline text-center text-lg py-4">
            Gov Control Room
          </Link>
        </div>
      </div>

      <div className="flex-grow min-h-[500px]">
        <Frame title="Global Status Map — AI Core" className="h-full w-full" noPadding>
          <Suspense fallback={<MapFallback />}>
            <PremiumGlobe />
          </Suspense>
        </Frame>
      </div>
    </div>
  );
}
