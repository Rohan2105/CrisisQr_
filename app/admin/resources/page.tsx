'use client';

import { Frame } from '@/components/Frame';
import { useEffect, useState } from 'react';
import { ArrowRightLeft, Droplets, Package, Stethoscope, BedDouble, AlertTriangle } from 'lucide-react';
import { transferResources } from '@/app/actions/resources';

const RESOURCE_ICONS: Record<string, any> = {
  WATER: Droplets,
  FOOD: Package,
  MEDICAL: Stethoscope,
  BLANKETS: BedDouble,
};

export default function ResourceAllocationPage() {
  const [shelters, setShelters] = useState<any[]>([]);
  const [originId, setOriginId] = useState<string>('');
  const [destinationId, setDestinationId] = useState<string>('');
  const [status, setStatus] = useState<{ success?: boolean; error?: string } | null>(null);

  useEffect(() => {
    async function fetchShelters() {
      const res = await fetch('/api/shelters');
      const json = await res.json();
      if (json.success) setShelters(json.data);
    }
    fetchShelters();
  }, []);

  // Fetch full details (with resources) when origin or destination changes
  const [originData, setOriginData] = useState<any>(null);
  const [destinationData, setDestinationData] = useState<any>(null);

  useEffect(() => {
    if (originId) {
      fetch(`/api/shelters/${originId}`).then(r => r.json()).then(j => setOriginData(j.data));
    } else {
      setOriginData(null);
    }
  }, [originId]);

  useEffect(() => {
    if (destinationId) {
      fetch(`/api/shelters/${destinationId}`).then(r => r.json()).then(j => setDestinationData(j.data));
    } else {
      setDestinationData(null);
    }
  }, [destinationId]);

  const handleTransfer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await transferResources(formData);
    setStatus(result);
    if (result.success) {
      // refresh data
      setOriginId(originId); 
      setDestinationId(destinationId);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      <div className="flex justify-between items-end border-b-2 border-primary pb-4">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">Resource Logistics Hub</h2>
          <p className="text-muted-foreground font-mono text-sm uppercase">Strategic Inventory Reallocation • AI Optimization Active</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Origin Node */}
        <div className="flex flex-col gap-4">
          <div className="font-bold text-xs uppercase bg-primary text-white px-2 py-1 self-start">Origin Node (Source)</div>
          <select 
            value={originId} 
            onChange={(e) => setOriginId(e.target.value)}
            className="brutalist-button-outline w-full text-left"
          >
            <option value="">Select Origin Shelter...</option>
            {shelters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <Frame title="Current Inventory" className="min-h-[200px]">
            {originData ? (
              <div className="grid grid-cols-2 gap-4 p-2">
                {originData.resources?.map((r: any) => {
                  const Icon = RESOURCE_ICONS[r.type] || Package;
                  return (
                    <div key={r.id} className="border border-border p-3 flex items-center gap-3 bg-white">
                      <Icon size={20} className="text-primary" />
                      <div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase">{r.type}</div>
                        <div className="font-mono font-bold">{r.quantity}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground font-mono text-xs uppercase">No Node Selected</div>
            )}
          </Frame>
        </div>

        {/* Destination Node */}
        <div className="flex flex-col gap-4">
          <div className="font-bold text-xs uppercase bg-status-low text-white px-2 py-1 self-start">Destination Node (Target)</div>
          <select 
            value={destinationId} 
            onChange={(e) => setDestinationId(e.target.value)}
            className="brutalist-button-outline w-full text-left"
          >
            <option value="">Select Destination Shelter...</option>
            {shelters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <Frame title="Current Inventory" className="min-h-[200px]">
            {destinationData ? (
              <div className="grid grid-cols-2 gap-4 p-2">
                {destinationData.resources?.map((r: any) => {
                  const Icon = RESOURCE_ICONS[r.type] || Package;
                  return (
                    <div key={r.id} className="border border-border p-3 flex items-center gap-3 bg-white">
                      <Icon size={20} className="text-primary" />
                      <div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase">{r.type}</div>
                        <div className="font-mono font-bold">{r.quantity}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground font-mono text-xs uppercase">No Node Selected</div>
            )}
          </Frame>
        </div>
      </div>

      {/* Transfer Order Form */}
      <Frame title="Execute Strategic Transfer Order">
        <form onSubmit={handleTransfer} className="flex flex-col md:flex-row items-end gap-6 p-4">
          <input type="hidden" name="originId" value={originId} />
          <input type="hidden" name="destinationId" value={destinationId} />
          
          <div className="flex flex-col gap-2 flex-grow">
            <label className="text-[10px] font-bold uppercase">Resource Type</label>
            <select name="type" className="brutalist-border p-2 bg-background font-mono text-sm outline-none w-full">
              <option value="WATER">WATER (Liters)</option>
              <option value="FOOD">FOOD (Rations)</option>
              <option value="MEDICAL">MEDICAL (Kits)</option>
              <option value="BLANKETS">BLANKETS (Units)</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 w-32">
            <label className="text-[10px] font-bold uppercase">Quantity</label>
            <input 
              name="quantity" 
              type="number" 
              className="brutalist-border p-2 bg-background font-mono text-sm outline-none w-full"
              placeholder="000"
            />
          </div>

          <button 
            type="submit"
            disabled={!originId || !destinationId}
            className="brutalist-button flex items-center gap-2 px-8 py-3 bg-primary border-primary disabled:opacity-50"
          >
            <ArrowRightLeft size={18} />
            EXECUTE ORDER
          </button>
        </form>

        {status && (
          <div className={`mx-4 mb-4 p-3 border font-mono text-xs uppercase font-bold flex items-center gap-2 ${status.success ? 'bg-status-low/10 border-status-low text-status-low' : 'bg-status-critical/10 border-status-critical text-status-critical'}`}>
            {status.success ? '● Transfer Successful: Database Revalidated' : `● Error: ${status.error}`}
          </div>
        )}
      </Frame>

      <div className="bg-muted border border-border p-4 flex gap-4 items-start">
        <AlertTriangle className="text-status-high shrink-0" size={24} />
        <div>
          <div className="font-bold text-xs uppercase">Operational Note</div>
          <p className="text-xs text-muted-foreground font-mono">Resource transfers are logged in real-time. Capacity limits at destination nodes are not automatically enforced by the logistics engine. Manual oversight required.</p>
        </div>
      </div>
    </div>
  );
}
