'use client';

import { Frame } from '@/components/Frame';
import { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ShelterNetwork() {
  const [transferStatus, setTransferStatus] = useState<string | null>(null);

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferStatus('Processing Transfer...');
    setTimeout(() => {
      setTransferStatus('SUCCESS: Resources reallocated and dispatch units notified.');
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto h-full">
      <div className="flex justify-between items-end border-b border-border pb-4">
        <div>
          <h2 className="text-3xl font-bold uppercase tracking-wider">Resource Allocation</h2>
          <p className="text-muted-foreground font-mono">Manage inventory distribution across shelter network.</p>
        </div>
        <Link href="/admin/control-room" className="brutalist-button flex items-center gap-2">
          <ArrowLeft size={16} /> Control Room
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Frame title="Current Inventory (Sector 4 Camp)">
          <table className="w-full text-left font-mono text-sm border-collapse">
            <tbody>
              <tr className="border-b border-border bg-muted/20">
                <td className="p-3 font-bold uppercase">Water (Liters)</td>
                <td className="p-3 text-right">4,500</td>
              </tr>
              <tr className="border-b border-border bg-background">
                <td className="p-3 font-bold uppercase">Food Rations</td>
                <td className="p-3 text-right">1,200</td>
              </tr>
              <tr className="border-b border-border bg-muted/20">
                <td className="p-3 font-bold uppercase">Medical Kits</td>
                <td className="p-3 text-right text-status-critical font-bold">15</td>
              </tr>
              <tr className="bg-background">
                <td className="p-3 font-bold uppercase">Blankets</td>
                <td className="p-3 text-right">300</td>
              </tr>
            </tbody>
          </table>
        </Frame>

        <Frame title="Current Inventory (City Stadium)">
          <table className="w-full text-left font-mono text-sm border-collapse">
            <tbody>
              <tr className="border-b border-border bg-muted/20">
                <td className="p-3 font-bold uppercase">Water (Liters)</td>
                <td className="p-3 text-right text-status-critical font-bold">200</td>
              </tr>
              <tr className="border-b border-border bg-background">
                <td className="p-3 font-bold uppercase">Food Rations</td>
                <td className="p-3 text-right">800</td>
              </tr>
              <tr className="border-b border-border bg-muted/20">
                <td className="p-3 font-bold uppercase">Medical Kits</td>
                <td className="p-3 text-right">150</td>
              </tr>
              <tr className="bg-background">
                <td className="p-3 font-bold uppercase">Blankets</td>
                <td className="p-3 text-right">1000</td>
              </tr>
            </tbody>
          </table>
        </Frame>
      </div>

      <Frame title="Execute Transfer Order">
        <form onSubmit={handleTransfer} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex flex-col gap-2 flex-1">
            <label className="font-bold text-sm uppercase tracking-wide">Origin Node</label>
            <select className="brutalist-border p-3 bg-background font-mono outline-none w-full">
              <option value="sector4">Sector 4 Camp</option>
              <option value="stadium">City Stadium</option>
              <option value="north">North High School</option>
            </select>
          </div>
          
          <div className="hidden md:flex pb-3 px-2 text-muted-foreground">
            <ArrowRightLeft size={24} />
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <label className="font-bold text-sm uppercase tracking-wide">Destination Node</label>
            <select className="brutalist-border p-3 bg-background font-mono outline-none w-full">
              <option value="stadium">City Stadium</option>
              <option value="sector4">Sector 4 Camp</option>
              <option value="north">North High School</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <label className="font-bold text-sm uppercase tracking-wide">Resource</label>
            <select className="brutalist-border p-3 bg-background font-mono outline-none w-full">
              <option value="water">Water (Liters)</option>
              <option value="food">Food Rations</option>
              <option value="medical">Medical Kits</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <label className="font-bold text-sm uppercase tracking-wide">Quantity</label>
            <input type="number" defaultValue={1000} className="brutalist-border p-3 bg-background font-mono outline-none w-full" />
          </div>

          <button type="submit" className="brutalist-button py-3 px-6 h-[46px] bg-status-medium border-status-medium text-black">
            AUTHORIZE
          </button>
        </form>

        {transferStatus && (
          <div className="mt-6 p-4 border border-border bg-background font-mono text-sm text-center">
            {transferStatus}
          </div>
        )}
      </Frame>
    </div>
  );
}
