'use client';

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronDown, ChevronUp } from 'lucide-react';

const PRIORITY_BADGE: Record<string, { bg: string; text: string }> = {
  CRITICAL: { bg: 'bg-status-critical', text: 'text-white' },
  HIGH: { bg: 'bg-status-high', text: 'text-white' },
  MEDIUM: { bg: 'bg-status-medium', text: 'text-black' },
  LOW: { bg: 'bg-status-low', text: 'text-white' },
};

interface VirtualizedSOSTableProps {
  data: any[];
  selectedId: string | null;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  handleRoute: (r: any) => void;
  handleComplete: (id: string) => void;
  getTimeElapsed: (date: string) => string;
}

export const VirtualizedSOSTable = React.memo(({
  data,
  selectedId,
  expandedId,
  setExpandedId,
  handleRoute,
  handleComplete,
  getTimeElapsed
}: VirtualizedSOSTableProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // Base row height
    overscan: 10,
  });

  return (
    <div
      ref={parentRef}
      className="w-full h-[400px] overflow-auto brutalist-border"
    >
      <div
        className="w-full relative"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const r = data[virtualRow.index];
          const isSelected = selectedId === r.id;
          const isExpanded = expandedId === r.id;

          return (
            <div
              key={virtualRow.key}
              className={`absolute top-0 left-0 w-full flex flex-col border-b border-border hover:bg-muted/30 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
              style={{
                height: isExpanded ? 'auto' : `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="flex items-center h-12">
                <div className="flex-[2] p-3 border-r border-border font-bold uppercase truncate text-xs">{r.name || 'Unknown'}</div>
                <div className="flex-[1] p-3 border-r border-border text-[10px] uppercase">{r.type}</div>
                <div className="flex-[1] p-3 border-r border-border text-center">
                  <span className={`px-2 py-0.5 font-bold text-[9px] ${PRIORITY_BADGE[r.priorityScore].bg} ${PRIORITY_BADGE[r.priorityScore].text}`}>
                    {r.priorityScore}
                  </span>
                </div>
                <div className="flex-[1] p-3 border-r border-border text-[9px] font-mono">{getTimeElapsed(r.createdAt)}</div>
                <div className="flex-[2] p-3 flex gap-2">
                  <button 
                    onClick={() => handleRoute(r)}
                    className={`brutalist-button py-1 px-3 text-[9px] flex-grow ${isSelected ? 'bg-status-low border-status-low text-white' : ''}`}
                  >
                    {isSelected ? 'ROUTED' : 'ROUTE'}
                  </button>
                  <button 
                    onClick={() => handleComplete(r.id)}
                    className="brutalist-button py-1 px-3 text-[9px] border-status-critical text-status-critical hover:bg-status-critical hover:text-white"
                  >
                    RESOLVE
                  </button>
                  {r.isVoice && (
                    <button 
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      className="p-1 hover:bg-muted"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}
                </div>
              </div>
              
              {isExpanded && (
                <div className="p-4 bg-muted/10 border-t border-border font-mono text-[9px] leading-relaxed">
                   <div className="font-bold text-primary mb-1">INTEL TRANSCRIPTION:</div>
                   <p className="italic mb-3">"{r.calculationFactors?.transcription || 'Analysis pending...'}"</p>
                   <div className="font-bold text-primary mb-1">AI ENTITY EXTRACTION:</div>
                   <pre>{JSON.stringify(r.calculationFactors || {}, null, 2)}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

VirtualizedSOSTable.displayName = 'VirtualizedSOSTable';
