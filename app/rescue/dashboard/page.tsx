'use client';

import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { Frame } from '@/components/Frame';
import dynamic from 'next/dynamic';
import { Navigation, Radio, List, X, Filter, Voice, FileText, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import type { SOSMarker } from '@/components/CrisisMap';
import { fetchMapTilerRoute } from '@/lib/routing';
import { MapFallback, TableSkeleton, MetricsSkeleton } from '@/components/Skeletons';
import { VirtualizedSOSTable } from '@/components/VirtualizedTable';
import { completeSOS, addFamilyToShelter } from '@/app/actions/rescue';
import { useMapData } from '@/hooks/useMapData';

const CrisisMap = dynamic(() => import('@/components/CrisisMap'), { 
  ssr: false,
  loading: () => <MapFallback />
});

// Dispatch center coords (Mumbai — default)
const DISPATCH_CENTER: [number, number] = [72.8777, 19.076];

const PRIORITY_BADGE: Record<string, { emoji: string; bg: string; text: string; label: string }> = {
  CRITICAL: { emoji: '🔴', bg: 'bg-status-critical', text: 'text-white', label: 'Critical' },
  HIGH: { emoji: '🟠', bg: 'bg-status-high', text: 'text-white', label: 'High' },
  MEDIUM: { emoji: '🟡', bg: 'bg-status-medium', text: 'text-black', label: 'Medium' },
  LOW: { emoji: '🟢', bg: 'bg-status-low', text: 'text-white', label: 'Low' },
};

export default function RescueDashboard() {
  const { data: mapData, refresh } = useMapData(10000);
  const [routeTo, setRouteTo] = useState<[number, number] | null>(null);
  const [routeFrom, setRouteFrom] = useState<[number, number] | null>(null);
  const [routeGeom, setRouteGeom] = useState<any>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const requests = mapData.requests.filter(r => r.status === 'PENDING');
  const shelters = mapData.shelters;

  const handleComplete = async (id: string) => {
    const res = await completeSOS(id);
    if (res.success) {
      setRouteTo(null);
      setRouteFrom(null);
      setRouteGeom(null);
      refresh();
    }
  };

  const handlePlacementSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await addFamilyToShelter(formData);
    if (res.success) {
      setStatus('Placement Confirmed • Capacity Updated');
      e.currentTarget.reset();
      refresh();
    }
  };

  const toggleFilter = (priority: string) => {
    setActiveFilters(prev => 
      prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]
    );
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(r => activeFilters.includes(r.priorityScore));
  }, [requests, activeFilters]);

  const standardRequests = useMemo(() => {
    return filteredRequests.filter(r => !r.isVoice);
  }, [filteredRequests]);

  const voiceRequests = useMemo(() => {
    return filteredRequests.filter(r => r.isVoice);
  }, [filteredRequests]);

  const markers: SOSMarker[] = useMemo(() => {
    const sosMarkers = filteredRequests.map(r => ({
      id: r.id,
      lat: r.lat,
      lng: r.lng,
      priorityScore: r.priorityScore,
      type: r.type,
      status: r.status,
      isVoice: r.isVoice,
    }));

    const shelterMarkers = shelters.map(s => ({
      id: s.id,
      lat: s.lat,
      lng: s.lng,
      priorityScore: 'LOW', // Default for shelters
      type: 'SHELTER',
      status: 'ACTIVE',
    }));

    const teamMarkers = mapData.teams.filter(t => t.isActive).map(t => ({
      id: t.id,
      lat: t.lat,
      lng: t.lng,
      priorityScore: 'LOW',
      type: 'TEAM',
      status: 'ACTIVE',
    }));

    return [...sosMarkers, ...shelterMarkers, ...teamMarkers];
  }, [filteredRequests, shelters, mapData.teams]);

  const handleRoute = useCallback(async (r: any) => {
    if (shelters && shelters.length > 0) {
      const sorted = [...shelters].sort((a: any, b: any) => {
        const dA = Math.hypot(a.lat - r.lat, a.lng - r.lng);
        const dB = Math.hypot(b.lat - r.lat, b.lng - r.lng);
        return dA - dB;
      });
      const nearest = sorted[0];
      const from: [number, number] = [nearest.lng, nearest.lat];
      const to: [number, number] = [r.lng, r.lat];
      
      setRouteFrom(from);
      setRouteTo(to);
      setSelectedId(r.id);

      const geom = await fetchMapTilerRoute(from, to);
      setRouteGeom(geom);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [shelters]);

  const getTimeElapsed = useCallback((dateString: string) => {
    const start = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 60000);
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex justify-between items-end border-b-2 border-primary pb-4">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter italic">Rescue Command Center</h2>
          <p className="text-muted-foreground font-mono text-sm">Unit 4 • Active Signals: {filteredRequests.length} / {requests.length}</p>
        </div>
        <div className="font-mono text-xs text-right hidden sm:block">
          <div className="text-status-low animate-pulse font-bold flex items-center gap-2 justify-end">
            <Activity size={14} /> SYSTEM SYNCHRONIZED
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Frame title="Unit Deployment & Signal Monitor" noPadding className="h-[600px]">
            <Suspense fallback={<MapFallback />}>
              <CrisisMap
                markers={markers}
                center={DISPATCH_CENTER}
                zoom={11}
                routeFrom={routeFrom}
                routeTo={routeTo}
                routeGeometry={routeGeom}
                routeColor="#111111"
                onMarkerClick={handleRoute}
              />
            </Suspense>
          </Frame>

          <Frame title="AI Priority Triage Queue — Tactical Virtualization" noPadding>
            <div className="flex flex-col">
              <div className="bg-muted border-b border-border p-3 flex gap-4 overflow-x-auto no-scrollbar">
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
                  <button
                    key={p}
                    onClick={() => toggleFilter(p)}
                    className={`px-3 py-1 text-[10px] font-bold border-2 transition-colors ${
                      activeFilters.includes(p) 
                        ? `${PRIORITY_BADGE[p].bg} ${PRIORITY_BADGE[p].text} border-black` 
                        : 'bg-background border-border text-muted-foreground'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              
              <Suspense fallback={<TableSkeleton rows={10} />}>
                <VirtualizedSOSTable 
                  data={filteredRequests}
                  selectedId={selectedId}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                  handleRoute={handleRoute}
                  handleComplete={handleComplete}
                  getTimeElapsed={getTimeElapsed}
                />
              </Suspense>
            </div>
          </Frame>
        </div>

        <div className="flex flex-col gap-6">
          <Frame title="Unit Deployment Controls">
             <div className="p-4 flex flex-col gap-4">
               <button className="brutalist-button w-full bg-black text-white py-3 flex items-center justify-center gap-3 font-bold uppercase tracking-widest">
                 <Radio className="animate-pulse" size={18} /> Broadcast Dispatch
               </button>
               <div className="grid grid-cols-2 gap-3">
                 <button className="brutalist-button-outline py-2 text-[10px] font-bold uppercase">Manual Assign</button>
                 <button className="brutalist-button-outline py-2 text-[10px] font-bold uppercase">Sector Scan</button>
               </div>
             </div>
          </Frame>

          <Frame title="Rescue Action: Shelter Placement">
            <form onSubmit={handlePlacementSubmit} className="flex flex-col gap-4 p-2">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase">Target Relief Camp</label>
                <select name="shelterId" className="brutalist-border p-2 bg-background font-mono text-xs outline-none" required>
                  <option value="">SELECT LIVE SHELTER...</option>
                  {shelters.map(s => (
                    <option key={s.id} value={s.id}>{s.name.toUpperCase()} (LOAD: {s.currentOccupancy}/{s.capacity})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase">Rescued Individuals</label>
                <input name="count" type="number" min="1" className="brutalist-border p-2 bg-background font-mono text-xs outline-none" placeholder="e.g. 5" required />
              </div>
              <button type="submit" className="brutalist-button bg-status-low border-status-low text-white font-bold py-2 uppercase text-xs">
                Confirm & Sync Capacity
              </button>
              {status && <div className="text-[10px] font-bold text-status-low uppercase mt-1 animate-bounce">✓ {status}</div>}
            </form>
          </Frame>
        </div>
      </div>
    </div>
  );
}
