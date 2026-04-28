'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import MapLegend from './MapLegend';

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || '';
const STYLE_URL = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#d32f2f',
  HIGH: '#f57c00',
  MEDIUM: '#fbc02d',
  LOW: '#388e3c',
};

interface GovMapProps {
  requests: any[];
  teams: any[];
  shelters: any[];
  center?: [number, number];
  zoom?: number;
}

export default function GovMap({
  requests = [],
  teams = [],
  shelters = [],
  center = [78.9629, 20.5937], // Center of India
  zoom = 4,
}: GovMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: STYLE_URL,
      center: center,
      zoom: zoom,
      dragPan: true,
      scrollZoom: true,
      doubleClickZoom: true,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Plot SOS Requests (Circles)
    requests.forEach((req) => {
      const color = PRIORITY_COLORS[req.priorityScore] || '#888888';
      const el = document.createElement('div');
      el.style.width = '14px';
      el.style.height = '14px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = color;
      el.style.border = '1px solid #1c1c1c';

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([req.lng, req.lat])
        .setPopup(new maplibregl.Popup({ offset: 10 }).setHTML(`
          <div style="font-family:monospace;font-size:10px;padding:8px;border:1px solid #1c1c1c;background:#fff;">
            <div style="font-weight:bold;color:${color};border-bottom:1px solid #eee;margin-bottom:4px;">${req.priorityScore} SIGNAL</div>
            <div style="font-weight:bold;text-transform:uppercase;">${req.type}</div>
            <div style="font-size:9px;color:#666;margin-top:2px;">SOURCE: ${req.isVoice ? 'VOICE AI' : 'FORM'}</div>
          </div>
        `))
        .addTo(map);
      
      markersRef.current.push(marker);
    });

    // Plot Rescue Teams (Blue Squares)
    teams.forEach((team) => {
      const el = document.createElement('div');
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.backgroundColor = '#2563eb';
      el.style.border = '1px solid #1c1c1c';

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([team.lng, team.lat])
        .setPopup(new maplibregl.Popup({ offset: 10 }).setHTML(`
          <div style="font-family:monospace;font-size:10px;padding:8px;border:1px solid #1c1c1c;background:#fff;">
            <div style="font-weight:bold;color:#2563eb;border-bottom:1px solid #eee;margin-bottom:4px;">RESCUE UNIT</div>
            <div style="font-weight:bold;text-transform:uppercase;">${team.name}</div>
            <div style="font-size:9px;color:#666;margin-top:2px;">STATUS: ${team.status}</div>
          </div>
        `))
        .addTo(map);
      
      markersRef.current.push(marker);
    });

    // Plot Shelters (Black Triangles)
    shelters.forEach((shelter) => {
      const el = document.createElement('div');
      el.style.width = '18px';
      el.style.height = '18px';
      el.style.backgroundColor = '#000000';
      el.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
      el.style.cursor = 'pointer';

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([shelter.lng, shelter.lat])
        .setPopup(new maplibregl.Popup({ offset: 10 }).setHTML(`
          <div style="font-family:monospace;font-size:10px;padding:8px;border:1px solid #1c1c1c;background:#fff;">
            <div style="font-weight:bold;color:#000;border-bottom:1px solid #eee;margin-bottom:4px;">RELIEF HUB</div>
            <div style="font-weight:bold;text-transform:uppercase;">${shelter.name}</div>
            <div style="font-size:9px;color:#666;margin-top:2px;">LOAD: ${shelter.currentOccupancy}/${shelter.capacity}</div>
          </div>
        `))
        .addTo(map);
      
      markersRef.current.push(marker);
    });

    // Task 2: FIXED - Only fit bounds on first load to prevent camera snap-back
    if (isInitialLoadRef.current && (requests.length > 0 || teams.length > 0 || shelters.length > 0)) {
      const bounds = new maplibregl.LngLatBounds();
      requests.forEach(r => bounds.extend([r.lng, r.lat]));
      teams.forEach(t => bounds.extend([t.lng, t.lat]));
      shelters.forEach(s => bounds.extend([s.lng, s.lat]));
      map.fitBounds(bounds, { padding: 50, maxZoom: 12 });
      isInitialLoadRef.current = false;
    }
  }, [requests, teams, shelters]);

  return (
    <div 
      ref={mapContainer} 
      /* Task 1: FIXED - Hard height lock for stability */
      className="w-full h-[600px] min-h-[600px] brutalist-border relative"
    >
      <MapLegend />
    </div>
  );
}
