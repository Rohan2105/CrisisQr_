import React from 'react';

export function MapFallback() {
  return (
    <div className="w-full h-full min-h-[500px] bg-background border border-black flex items-center justify-center font-mono text-[10px] uppercase tracking-widest animate-pulse">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border border-black flex items-center justify-center">
          <div className="w-4 h-4 bg-black" />
        </div>
        <span>Initializing Tactical WebGL Context...</span>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full animate-pulse">
      <div className="h-10 bg-muted border-b border-black mb-1" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-muted/20 border-b border-border mb-1" />
      ))}
    </div>
  );
}

export function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 bg-muted border border-border" />
      ))}
    </div>
  );
}
