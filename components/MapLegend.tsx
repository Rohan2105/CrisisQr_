'use client';

import React from 'react';

export default function MapLegend() {
  const items = [
    { color: '#d32f2f', label: 'CRITICAL SOS', shape: 'circle' },
    { color: '#f57c00', label: 'HIGH SOS', shape: 'circle' },
    { color: '#fbc02d', label: 'MEDIUM SOS', shape: 'circle' },
    { color: '#388e3c', label: 'LOW SOS', shape: 'circle' },
    { color: '#2563eb', label: 'RESCUE TEAM', shape: 'square' },
    { color: '#000000', label: 'SHELTER HUB', shape: 'triangle' },
    { color: '#3b82f6', label: 'OPTIMUM ROUTE', shape: 'line' },
  ];

  return (
    <div className="absolute bottom-4 right-4 bg-white border border-black p-3 shadow-none z-20 flex flex-col gap-2 min-w-[150px] font-mono pointer-events-none sm:pointer-events-auto">
      <div className="text-[10px] font-black uppercase border-b-2 border-black pb-1 mb-1 tracking-tighter italic">Signal Intelligence</div>
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3 text-[9px] uppercase font-bold text-black">
          {item.shape === 'circle' && (
            <div className="w-2.5 h-2.5 rounded-full border border-black" style={{ backgroundColor: item.color }} />
          )}
          {item.shape === 'square' && (
            <div className="w-2.5 h-2.5 border border-black" style={{ backgroundColor: item.color }} />
          )}
          {item.shape === 'triangle' && (
            <div className="w-3 h-3 bg-black" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
          )}
          {item.shape === 'line' && (
            <div className="w-5 h-[3px]" style={{ backgroundColor: item.color }} />
          )}
          <span className="tracking-tighter">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
