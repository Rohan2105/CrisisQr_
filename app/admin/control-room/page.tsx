'use client';

import { Frame } from '@/components/Frame';
import dynamic from 'next/dynamic';
import { useAlert } from '@/context/AlertContext';
import Link from 'next/link';
import { useEffect, useState, useMemo, Suspense } from 'react';
import { MapFallback, TableSkeleton, MetricsSkeleton } from '@/components/Skeletons';

const GovMap = dynamic(() => import('@/components/GovMap'), { 
  ssr: false,
  loading: () => <MapFallback />
});

import { addShelter, addRescueTeam, toggleTeamStatus } from '@/app/actions/gov';
import { useMapData } from '@/hooks/useMapData';

export default function ControlRoomPage() {
  const { setGlobalAlert } = useAlert();
  const { data: mapData, refresh } = useMapData(5000); // 5s poll for metrics
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const fetchBroadcasts = async () => {
    const res = await fetch('/api/broadcasts');
    const json = await res.json();
    if (json.success) setBroadcasts(json.data);
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  // Metrics calculation
  const activeCrises = useMemo(() => mapData.requests.filter(r => r.status === 'PENDING').length, [mapData.requests]);
  const deployedUnits = useMemo(() => mapData.teams.filter(t => t.isActive).length, [mapData.teams]);
  const networkLoad = useMemo(() => {
    if (mapData.shelters.length === 0) return 0;
    const totalCap = mapData.shelters.reduce((acc, s) => acc + s.capacity, 0);
    const totalOcc = mapData.shelters.reduce((acc, s) => acc + s.currentOccupancy, 0);
    return Math.round((totalOcc / totalCap) * 100);
  }, [mapData.shelters]);

  const handleShelterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await addShelter(formData);
    if (res.success) {
      setStatus('Shelter Added Successfully');
      e.currentTarget.reset();
      refresh();
    }
  };

  const handleTeamSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await addRescueTeam(formData);
    if (res.success) {
      setStatus('Rescue Team Added Successfully');
      e.currentTarget.reset();
      refresh();
    }
  };

  const handleTransmit = async () => {
    const severity = (document.getElementById('severity') as HTMLSelectElement).value as any;
    const message = (document.getElementById('message') as HTMLTextAreaElement).value;
    const type = (document.getElementById('alertType') as HTMLInputElement).value;

    if (!message || !type) return;

    const res = await fetch('/api/broadcasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ severity, message, alertType: type }),
    });

    if (res.ok) {
      setGlobalAlert(severity, message);
      fetchBroadcasts();
      (document.getElementById('message') as HTMLTextAreaElement).value = '';
    }
  };

  const toggleAlertStatus = async (id: string, currentStatus: boolean) => {
    await fetch('/api/broadcasts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !currentStatus }),
    });
    fetchBroadcasts();
  };

  return (
    <div className="flex flex-col gap-6 h-full flex-grow">
      <div className="flex justify-between items-end border-b border-border pb-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter italic">Gov Control Room</h2>
          <p className="text-muted-foreground font-mono text-xs uppercase">Strategic Infrastructure & Real-Time Crisis Intelligence</p>
        </div>
        <div className="flex gap-4">
          <Link href="/admin/resources" className="brutalist-button">
            Logistics Hub
          </Link>
        </div>
      </div>

      <Suspense fallback={<MetricsSkeleton />}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Frame title="Active Crisis">
            <div className="text-5xl font-black text-status-critical tracking-tighter italic">{activeCrises}</div>
            <div className="text-[10px] font-mono text-muted-foreground mt-2 uppercase">Pending Distressed Signals</div>
          </Frame>
          <Frame title="Deployed Units">
            <div className="text-5xl font-black text-primary tracking-tighter italic">{deployedUnits}</div>
            <div className="text-[10px] font-mono text-muted-foreground mt-2 uppercase">Active Field Teams</div>
          </Frame>
          <Frame title="Network Load">
            <div className="text-5xl font-black text-status-high tracking-tighter italic">{networkLoad}%</div>
            <div className="text-[10px] font-mono text-muted-foreground mt-2 uppercase">Shelter Occupancy Rate</div>
          </Frame>
          <Frame title="EBS Status">
            <div className="text-5xl font-black text-status-low tracking-tighter italic">LIVE</div>
            <div className="text-[10px] font-mono text-muted-foreground mt-2 uppercase">Broadcasting Active</div>
          </Frame>
        </div>
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Frame title="Strategic Situational Map — Universal Sync" noPadding>
             <div className="h-[450px]">
               <Suspense fallback={<MapFallback />}>
                 <GovMap 
                   requests={mapData.requests.filter(r => r.status === 'PENDING')} 
                   teams={mapData.teams.filter(t => t.isActive)} 
                   shelters={mapData.shelters} 
                 />
               </Suspense>
             </div>
          </Frame>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Frame title="Infrastructure: Add New Shelter">
              <form onSubmit={handleShelterSubmit} className="flex flex-col gap-3 p-2">
                <input name="name" className="brutalist-border p-2 bg-background font-mono text-xs outline-none" placeholder="SHELTER NAME" required />
                <div className="grid grid-cols-2 gap-2">
                  <input name="lat" type="number" step="0.0001" className="brutalist-border p-2 bg-background font-mono text-xs outline-none" placeholder="LATITUDE" required />
                  <input name="lng" type="number" step="0.0001" className="brutalist-border p-2 bg-background font-mono text-xs outline-none" placeholder="LONGITUDE" required />
                </div>
                <input name="capacity" type="number" className="brutalist-border p-2 bg-background font-mono text-xs outline-none" placeholder="MAX CAPACITY" required />
                <button type="submit" className="brutalist-button bg-black text-white py-2 text-xs font-bold uppercase">Initialize Node</button>
              </form>
            </Frame>

            <Frame title="Force Deployment: Add Rescue Team">
              <form onSubmit={handleTeamSubmit} className="flex flex-col gap-3 p-2">
                <input name="name" className="brutalist-border p-2 bg-background font-mono text-xs outline-none" placeholder="TEAM DESIGNATION" required />
                <div className="grid grid-cols-2 gap-2">
                  <input name="lat" type="number" step="0.0001" className="brutalist-border p-2 bg-background font-mono text-xs outline-none" placeholder="BASE LAT" required />
                  <input name="lng" type="number" step="0.0001" className="brutalist-border p-2 bg-background font-mono text-xs outline-none" placeholder="BASE LNG" required />
                </div>
                <button type="submit" className="brutalist-button bg-primary text-white py-2 text-xs font-bold uppercase">Deploy Unit</button>
              </form>
            </Frame>
          </div>

          <Frame title="Rescue Team Management Grid">
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-muted font-mono text-[10px] uppercase border-b border-border">
                     <th className="p-3">Team Name</th>
                     <th className="p-3">Location</th>
                     <th className="p-3">Status</th>
                     <th className="p-3">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-border">
                   {mapData.teams.map((t) => (
                     <tr key={t.id} className="text-[11px] font-mono hover:bg-muted/30">
                       <td className="p-3 font-bold uppercase">{t.name}</td>
                       <td className="p-3">{t.lat.toFixed(4)}, {t.lng.toFixed(4)}</td>
                       <td className="p-3">
                         <span className={`px-2 py-0.5 border ${t.isActive ? 'bg-status-low/10 text-status-low border-status-low' : 'bg-muted text-muted-foreground border-border'}`}>
                           {t.isActive ? 'ACTIVE' : 'OFF-DUTY'}
                         </span>
                       </td>
                       <td className="p-3">
                         <button 
                           onClick={() => toggleTeamStatus(t.id, !t.isActive).then(refresh)}
                           className="brutalist-button text-[9px] py-1 px-2 bg-background text-primary border-primary hover:bg-primary hover:text-white"
                         >
                           {t.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </Frame>
        </div>

        <div className="flex flex-col gap-6">
          <Frame title="Emergency Broadcast System" className="h-full">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm uppercase">Alert Type</label>
                <input id="alertType" className="brutalist-border p-2 bg-background font-mono text-sm" placeholder="e.g. Flood Warning" />
              </div>
              {/* ... broadcast form logic remains ... */}
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm uppercase">Severity Level</label>
                <select id="severity" className="brutalist-border p-2 bg-background font-mono">
                  <option value="CRITICAL">CRITICAL (Red Alert)</option>
                  <option value="HIGH">HIGH (Orange Alert)</option>
                  <option value="MEDIUM">MEDIUM (Yellow Alert)</option>
                  <option value="LOW">LOW (Green Advisory)</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm uppercase">Message (English)</label>
                <textarea id="message" className="brutalist-border p-2 bg-background min-h-[100px] outline-none font-mono" placeholder="Enter broadcast message..."></textarea>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm uppercase flex items-center justify-between">
                  Auto-Translate (AI)
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-primary" />
                </label>
                <div className="text-xs text-muted-foreground font-mono uppercase leading-tight">Will automatically translate and broadcast via SMS to Hindi, Marathi, Gujarati.</div>
              </div>
              <button 
                onClick={handleTransmit}
                className="brutalist-button bg-status-critical border-status-critical mt-auto py-4 font-black uppercase tracking-widest italic"
              >
                TRANSMIT BROADCAST
              </button>
              <button 
                onClick={() => setGlobalAlert(null, null)}
                className="brutalist-button bg-muted border-border text-primary py-2 text-xs font-bold"
              >
                CLEAR ACTIVE OVERLAY
              </button>
            </div>
          </Frame>
        </div>
      </div>
    </div>
  );
}
