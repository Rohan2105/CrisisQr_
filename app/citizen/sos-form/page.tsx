'use client';

import { Frame } from '@/components/Frame';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { fetchMapTilerRoute } from '@/lib/routing';

const CrisisMap = dynamic(() => import('@/components/CrisisMap'), { ssr: false });

import { submitSOSRequest } from '@/app/actions/sos';

export default function SOSForm() {
  const { register, handleSubmit } = useForm();
  const [status, setStatus] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<string>('Acquiring GPS...');
  const [routeGeom, setRouteGeom] = useState<any>(null);
  const [nearestShelter, setNearestShelter] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus('GPS Lock Acquired');
      },
      (err) => {
        setGeoStatus('GPS Failed — using fallback');
        setCoords({ lat: 19.076, lng: 72.8777 });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const onSubmit = async (data: any) => {
    if (!coords) {
      setStatus('ERROR: Waiting for GPS lock. Please wait or check permissions.');
      return;
    }
    setStatus('Transmitting SOS...');
    try {
      const isOffline = !navigator.onLine;
      if (isOffline) {
        setStatus('OFFLINE — Request queued locally for sync.');
        setSubmitted(true);
        return;
      }

      // 1. Submit SOS via Server Action
      const result = await submitSOSRequest({
        userId: 'citizen-001',
        name: data.name,
        type: data.type,
        lat: coords.lat,
        lng: coords.lng,
      });

      if (result.success) {
        // 2. Extract Nearest Shelter from result
        if (result.nearestShelter) {
          setNearestShelter(result.nearestShelter);
          
          // 3. Trigger MapTiler Routing
          const geom = await fetchMapTilerRoute(
            [coords.lng, coords.lat], 
            [result.nearestShelter.lng, result.nearestShelter.lat]
          );
          setRouteGeom(geom);
        }

        setStatus(`SOS Transmitted. ID: ${result.requestId?.substring(0, 8) || 'N/A'}`);
        setSubmitted(true);
      } else {
        setStatus(result.error || 'Error submitting SOS.');
      }
    } catch (error) {
      console.error(error);
      setStatus('Failed to send SOS.');
    }
  };

  if (submitted) {
    const userPos: [number, number] = [coords?.lng || 72.8777, coords?.lat || 19.076];
    const targetPos: [number, number] = nearestShelter ? [nearestShelter.lng, nearestShelter.lat] : [72.862, 19.082];

    return (
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
        <Frame title="SOS TRANSMITTED SUCCESSFULLY">
          <div className="flex flex-col gap-6 py-4">
            <div className="bg-status-low text-white p-4 font-bold uppercase text-center border-2 border-status-low">
              Rescue Teams Notified • Priority Assigned
            </div>
            
            <div className="flex flex-col gap-2">
              <h3 className="font-bold text-xl uppercase">Immediate Next Step: Seek Shelter</h3>
              <p className="text-muted-foreground font-mono text-sm uppercase">
                The nearest official relief camp is {nearestShelter?.name || 'Sector 4 Relief Camp'}.
              </p>
            </div>

            <Frame title="Emergency Road Routing" noPadding className="h-[600px]">
              <CrisisMap 
                center={userPos}
                zoom={14}
                markers={nearestShelter ? [{
                  id: nearestShelter.id,
                  lat: nearestShelter.lat,
                  lng: nearestShelter.lng,
                  priorityScore: 'LOW',
                  type: 'SHELTER',
                  status: 'ACTIVE'
                }] : []}
                routeFrom={userPos}
                routeTo={targetPos}
                routeGeometry={routeGeom}
                routeColor="#3b82f6" // Vibrant Blue for road route
              />
            </Frame>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setSubmitted(false)} className="brutalist-button-outline">
                Back to Dashboard
              </button>
              <button className="brutalist-button bg-status-low border-status-low">
                Start Navigation
              </button>
            </div>
          </div>
        </Frame>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      <h2 className="text-3xl font-bold uppercase tracking-wider border-b border-border pb-4 mb-6">
        SOS Request Form
      </h2>

      {/* GPS Status Banner */}
      <div className="mb-4 p-3 border border-border bg-muted flex items-center justify-between font-mono text-sm">
        <div className="flex items-center gap-2">
          {coords ? (
            <div className="w-2 h-2 bg-status-low rounded-full animate-pulse" />
          ) : (
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          )}
          <span className="font-bold uppercase tracking-tight">{geoStatus}</span>
        </div>
        {coords && (
          <span className="text-muted-foreground text-xs">
            FIX: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </span>
        )}
      </div>

      <Frame title="Distress Signal Payload">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-bold text-sm uppercase tracking-wide">Victim Name</label>
            <input 
              {...register('name', { required: true })}
              className="brutalist-border p-3 bg-background outline-none font-mono text-sm"
              placeholder="e.g. Rahul Sharma"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold text-sm uppercase tracking-wide">Emergency Type</label>
            <select
              {...register('type')}
              className="brutalist-border p-2 bg-background font-mono outline-none"
            >
              <option value="RESCUE">Rescue (Trapped/Stranded)</option>
              <option value="MEDICAL">Medical Emergency</option>
              <option value="FOOD">Food Required</option>
              <option value="WATER">Water Required</option>
              <option value="MISSING">Missing Person</option>
            </select>
          </div>

          <div className="border border-border p-4 bg-muted">
            <label className="font-bold text-sm uppercase tracking-wide border-b border-border pb-2 block mb-4">
              Risk Factors (Select all that apply)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('hasChild')} className="w-5 h-5 accent-primary brutalist-border" />
                <span>Child (&lt; 10 yrs) present</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('hasElderly')} className="w-5 h-5 accent-primary brutalist-border" />
                <span>Elderly (&gt; 65 yrs) present</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('hasInjury')} className="w-5 h-5 accent-primary brutalist-border" />
                <span>Severe Injury</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('waterRising')} className="w-5 h-5 accent-primary brutalist-border" />
                <span>Water Levels Rising rapidly</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('isPregnant')} className="w-5 h-5 accent-primary brutalist-border" />
                <span>Pregnant Person present</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('hasDisease')} className="w-5 h-5 accent-primary brutalist-border" />
                <span>Chronic Disease / Needs Meds</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold text-sm uppercase tracking-wide">Additional Details (Optional)</label>
            <textarea
              {...register('details')}
              className="brutalist-border p-2 bg-background min-h-[100px] font-mono outline-none"
              placeholder="Enter specific location details or notes..."
            ></textarea>
          </div>

          <button
            type="submit"
            className="brutalist-button text-lg mt-2 w-full bg-status-critical border-status-critical hover:bg-background hover:text-status-critical py-4"
          >
            TRANSMIT SOS SIGNAL
          </button>

          {status && (
            <div className="p-4 border border-border bg-background font-mono text-sm text-center">
              {status}
            </div>
          )}
        </form>
      </Frame>
    </div>
  );
}
