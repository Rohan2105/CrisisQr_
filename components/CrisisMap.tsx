'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import MapLegend from './MapLegend';

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || '';
const STYLE_URL = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

// Priority color mapping — solid, flat, muted
const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#d32f2f',
  HIGH: '#f57c00',
  MEDIUM: '#fbc02d',
  LOW: '#388e3c',
};

export interface SOSMarker {
  id: string;
  lat: number;
  lng: number;
  priorityScore: string;
  type: string;
  status: string;
  isVoice?: boolean;
}

interface CrisisMapProps {
  markers?: SOSMarker[];
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  className?: string;
  routeFrom?: [number, number] | null; // [lng, lat]
  routeTo?: [number, number] | null;   // [lng, lat]
  routeGeometry?: any | null;          // GeoJSON from MapTiler
  routeColor?: string;
  onMarkerClick?: (marker: SOSMarker) => void;
}

export default function CrisisMap({
  markers = [],
  center = [72.8777, 19.076],
  zoom = 11,
  className = '',
  routeFrom = null,
  routeTo = null,
  routeGeometry = null,
  routeColor = '#1c1c1c',
  onMarkerClick,
}: CrisisMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const prevRouteKeyRef = useRef<string>('');

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: STYLE_URL,
      center: center,
      zoom: zoom,
      // Task 2: Explicitly ensure interactivity is enabled
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

  // Plot markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    markers.forEach((sos) => {
      const color = PRIORITY_COLORS[sos.priorityScore] || '#888888';

      const el = document.createElement('div');
      el.style.cursor = 'pointer';

      if (sos.type === 'SHELTER') {
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.backgroundColor = '#000000';
        el.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
      } else if (sos.type === 'TEAM') {
        el.style.width = '16px';
        el.style.height = '16px';
        el.style.backgroundColor = '#2563eb';
        el.style.border = '2px solid #1c1c1c';
      } else {
        el.style.width = '18px';
        el.style.height = '18px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = color;
        el.style.border = '2px solid #1c1c1c';
      }

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([sos.lng, sos.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 12, closeButton: false }).setHTML(
            `<div style="font-family:monospace;font-size:12px;padding:8px;border:2px solid #1c1c1c;background:#fff;max-width:200px;">
              <div style="font-weight:bold;border-bottom:1px solid #1c1c1c;margin-bottom:4px;padding-bottom:2px;display:flex;justify-content:space-between;">
                <span>${sos.type === 'SHELTER' ? 'SHELTER' : `ID: ${sos.id.substring(0, 8)}`}</span>
                ${sos.isVoice ? '<span style="background:#1c1c1c;color:#fff;padding:0 4px;font-size:10px;">VOICE</span>' : ''}
              </div>
              <div style="color:${sos.type === 'SHELTER' ? '#000' : color};font-weight:bold;">${sos.type === 'SHELTER' ? 'ACTIVE HUB' : sos.priorityScore}</div>
              <div>TYPE: ${sos.type}</div>
            </div>`
          )
        )
        .addTo(map);

      el.addEventListener('click', () => onMarkerClick?.(sos));
      markersRef.current.push(marker);
    });

    // Task 2: FIXED - Stop aggressive auto-centering during polls
    // Only fitBounds on initial load to allow user free movement thereafter
    if (isInitialLoad && markers.length > 0 && !routeTo) {
      const bounds = new maplibregl.LngLatBounds();
      markers.forEach(m => bounds.extend([m.lng, m.lat]));
      map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
      setIsInitialLoad(false); 
    }
  }, [markers, onMarkerClick, routeTo, isInitialLoad]);

  // Draw route
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentRouteKey = JSON.stringify({ routeFrom, routeTo, routeGeometry });
    const hasRouteChanged = currentRouteKey !== prevRouteKeyRef.current;

    const drawRoute = () => {
      if (map.getLayer('route-line')) map.removeLayer('route-line');
      if (map.getSource('route')) map.removeSource('route');

      if (!routeFrom || !routeTo) {
        prevRouteKeyRef.current = currentRouteKey;
        return;
      }

      const geometry = routeGeometry || {
        type: 'LineString',
        coordinates: [routeFrom, routeTo],
      };

      map.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry },
      });

      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': routeColor,
          'line-width': 5,
          'line-opacity': 0.8,
        },
      });

      // Task 2: FIXED - Only snap to route if the route has actually changed (e.g., new dispatch)
      if (hasRouteChanged) {
        const bounds = new maplibregl.LngLatBounds();
        if (routeGeometry && routeGeometry.coordinates) {
          routeGeometry.coordinates.forEach((coord: [number, number]) => bounds.extend(coord));
        } else {
          bounds.extend(routeFrom);
          bounds.extend(routeTo);
        }
        map.fitBounds(bounds, { padding: 80, animate: true });
        prevRouteKeyRef.current = currentRouteKey;
      }
    };

    if (map.isStyleLoaded()) {
      drawRoute();
    } else {
      map.on('load', drawRoute);
    }
  }, [routeFrom, routeTo, routeGeometry, routeColor]);

  return (
    <div
      ref={mapContainer}
      /* Task 1: FIXED - Absolute unbreakable height constraint to prevent 3-second collapse */
      className={`w-full h-[600px] min-h-[600px] border border-black relative ${className}`}
    >
      <MapLegend />
    </div>
  );
}
