'use client';

import { Frame } from '@/components/Frame';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ShieldAlert, Users, QrCode, Mic } from 'lucide-react';
import dynamic from 'next/dynamic';
import { calculateHaversineDistance } from '@/lib/utils';
import { useMapData } from '@/hooks/useMapData';

import { MapFallback } from '@/components/Skeletons';
import { useMemo, Suspense } from 'react';

const CrisisMap = dynamic(() => import('@/components/CrisisMap'), { 
  ssr: false,
  loading: () => <MapFallback />
});

export default function CitizenDashboard() {
  const [isOffline, setIsOffline] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const { data: mapData } = useMapData(15000);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [selectedShelter, setSelectedShelter] = useState<any>(null);

  const markers = useMemo(() => [
    ...mapData.shelters.map((s: any) => ({
      id: s.id,
      lat: s.lat,
      lng: s.lng,
      priorityScore: 'LOW',
      type: 'SHELTER',
      status: s.currentOccupancy >= s.capacity ? 'FULL' : 'ACTIVE',
    })),
    ...mapData.requests.filter((r: any) => r.status === 'PENDING').map((r: any) => ({
      id: r.id,
      lat: r.lat,
      lng: r.lng,
      priorityScore: r.priorityScore,
      type: r.type,
      status: 'PENDING',
    }))
  ], [mapData.shelters, mapData.requests]);

  useEffect(() => {
    async function fetchAlerts() {
      const res = await fetch('/api/broadcasts');
      const json = await res.json();
      if (json.success) {
        setActiveAlerts(json.data.filter((a: any) => a.isActive));
      }
    }
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const shelters = mapData.shelters;
  const citizenPos: [number, number] = [72.8777, 19.076];

  const handleShelterClick = (shelter: any) => {
    setSelectedShelter(shelter);
    setShowRoute(true);
    window.scrollTo({ top: 600, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Task 3: Active Alerts Section */}
      {activeAlerts.length > 0 && (
        <div className="flex flex-col gap-3">
          {activeAlerts.map(alert => (
            <div 
              key={alert.id}
              className={`border-2 p-4 font-bold uppercase tracking-wider flex items-center justify-between shadow-none ${
                alert.severity === 'CRITICAL' ? 'bg-status-critical text-white border-status-critical' : 'bg-status-high text-white border-status-high'
              }`}
            >
              <div className="flex items-center gap-4">
                <ShieldAlert size={24} />
                <div>
                  <div className="text-xs opacity-80">{alert.alertType}</div>
                  <div className="text-lg">{alert.message}</div>
                </div>
              </div>
              <div className="font-mono text-xs opacity-80">{new Date(alert.createdAt).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-end border-b border-border pb-4">
        <div>
          <h2 className="text-3xl font-bold uppercase tracking-wider italic font-black">Citizen Hub</h2>
          <p className="text-muted-foreground font-mono text-xs uppercase tracking-tight">Manage family, request SOS, and view shelter routing.</p>
        </div>
        <div className={`px-3 py-1 text-sm font-bold border ${isOffline ? 'bg-status-critical text-white border-status-critical' : 'bg-status-low text-white border-status-low'}`}>
          {isOffline ? 'SYSTEM OFFLINE - SOS QUEUED' : 'SYSTEM ONLINE'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/citizen/sos-form" className="block">
          <Frame className="h-full hover:bg-background cursor-pointer transition-colors" title="Emergency SOS">
            <div className="flex flex-col items-center justify-center p-6 gap-4 text-center">
              <ShieldAlert size={48} className="text-status-critical" />
              <div className="font-bold uppercase tracking-widest text-lg">Send SOS</div>
              <p className="text-sm text-muted-foreground">Submit structured distress signal</p>
            </div>
          </Frame>
        </Link>
        
        <Link href="/citizen/voice-sos" className="block">
          <Frame className="h-full hover:bg-background cursor-pointer transition-colors" title="Voice SOS">
            <div className="flex flex-col items-center justify-center p-6 gap-4 text-center">
              <Mic size={48} className="text-status-high" />
              <div className="font-bold uppercase tracking-widest text-lg">Voice SOS</div>
              <p className="text-sm text-muted-foreground">AI Multilingual extraction</p>
            </div>
          </Frame>
        </Link>

        <Link href="/citizen/family" className="block">
          <Frame className="h-full hover:bg-background cursor-pointer transition-colors" title="Family Status">
            <div className="flex flex-col items-center justify-center p-6 gap-4 text-center">
              <Users size={48} className="text-primary" />
              <div className="font-bold uppercase tracking-widest text-lg">Family Data</div>
              <p className="text-sm text-muted-foreground">Manage members & health info</p>
            </div>
          </Frame>
        </Link>

        <Link href="/citizen/qr-code" className="block">
          <Frame className="h-full hover:bg-background cursor-pointer transition-colors" title="Rescue QR">
            <div className="flex flex-col items-center justify-center p-6 gap-4 text-center">
              <QrCode size={48} className="text-primary" />
              <div className="font-bold uppercase tracking-widest text-lg">Generate QR</div>
              <p className="text-sm text-muted-foreground">Offline verifiable ID</p>
            </div>
          </Frame>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        <div className="lg:col-span-2 flex flex-col gap-6">
           <Frame title="Emergency Shelter Routing" noPadding className="relative">
             <div className="h-[500px] w-full">
               <Suspense fallback={<MapFallback />}>
                 <CrisisMap
                   center={citizenPos}
                   zoom={13}
                   markers={markers}
                   routeFrom={showRoute && selectedShelter ? citizenPos : null}
                   routeTo={showRoute && selectedShelter ? [selectedShelter.lng, selectedShelter.lat] : null}
                 />
               </Suspense>
               
               {showRoute && selectedShelter && (
                 <button 
                   onClick={() => { setShowRoute(false); setSelectedShelter(null); }} 
                   className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white border-2 border-black px-6 py-3 font-bold uppercase tracking-widest shadow-none hover:bg-muted transition-colors whitespace-nowrap"
                 >
                   Clear Route
                 </button>
               )}
             </div>
             
             <div className="p-4 border-t border-border bg-muted">
               <div className="font-bold text-lg uppercase italic">
                 {selectedShelter ? selectedShelter.name : 'Select a Shelter Node to Begin Routing'}
               </div>
               <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-tight">
                 {selectedShelter 
                   ? `LOC: ${selectedShelter.lng.toFixed(4)}, ${selectedShelter.lat.toFixed(4)} • STATUS: ${selectedShelter.currentOccupancy}/${selectedShelter.capacity} OCCUPIED`
                   : 'Proximity detection active... monitoring network nodes...'}
               </div>
             </div>
           </Frame>

           <Frame title="Available Relief Camps — Proximity Ordered">
             <div className="flex flex-col divide-y divide-border border border-border">
               {shelters
                 .filter((s: any) => s.currentOccupancy < s.capacity)
                 .map((s: any) => {
                   const distance = calculateHaversineDistance(citizenPos[1], citizenPos[0], s.lat, s.lng);
                   return (
                     <div 
                       key={s.id} 
                       onClick={() => handleShelterClick(s)}
                       className={`p-4 flex justify-between items-center cursor-pointer transition-colors hover:bg-muted/50 ${selectedShelter?.id === s.id ? 'bg-primary/5 border-l-4 border-primary' : ''}`}
                     >
                       <div>
                         <div className="font-bold uppercase text-sm">{s.name}</div>
                         <div className="text-[10px] font-mono text-muted-foreground">
                           {distance.toFixed(2)} KM • LAT: {s.lat.toFixed(4)}
                         </div>
                         <div className="mt-2 text-[10px] font-bold bg-muted px-2 py-0.5 border border-border inline-block uppercase">
                           Remaining Capacity: {s.capacity - s.currentOccupancy} Spaces
                         </div>
                       </div>
                       <div className="text-right">
                         <div className="font-bold text-xs">{s.currentOccupancy} / {s.capacity}</div>
                         <div className="text-[9px] uppercase font-bold text-status-low">Available</div>
                       </div>
                     </div>
                   );
                 })}
             </div>
           </Frame>
        </div>
        <div>
          <Frame title="Local Area Advisories" className="h-full">
            <div className="flex flex-col gap-3">
               {activeAlerts.length > 0 ? (
                 activeAlerts.map(alert => (
                   <div 
                     key={alert.id}
                     className={`border-l-4 p-3 ${
                       alert.severity === 'CRITICAL' 
                         ? 'border-status-critical bg-status-critical/5' 
                         : 'border-status-high bg-status-high/5'
                     }`}
                   >
                     <div className={`font-bold text-[10px] uppercase ${
                       alert.severity === 'CRITICAL' ? 'text-status-critical' : 'text-status-high'
                     }`}>
                       {alert.alertType}
                     </div>
                     <div className="text-xs mt-1 font-medium">{alert.message}</div>
                   </div>
                 ))
               ) : (
                 <div className="text-xs text-muted-foreground font-mono uppercase italic">No active advisories in your sector.</div>
               )}
            </div>
          </Frame>
        </div>
      </div>
    </div>
  );
}
