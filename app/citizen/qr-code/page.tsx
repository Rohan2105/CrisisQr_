'use client';

import { Frame } from '@/components/Frame';
import QRCode from 'react-qr-code';
import { Download, Printer } from 'lucide-react';
import { useRef } from 'react';

export default function QRCodeGenerator() {
  const qrRef = useRef<HTMLDivElement>(null);

  const familyData = {
    id: "FAM-8921",
    members: 4,
    hasElderly: true,
    medical: ["Diabetes", "Asthma"],
    shelterAssigned: "Sector 4 Relief Camp"
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-md mx-auto w-full flex flex-col gap-6">
      <h2 className="text-3xl font-bold uppercase tracking-wider border-b border-border pb-4">Rescue QR Profile</h2>
      
      <Frame title="Scan for Verification" className="print:border-none print:bg-white">
        <div ref={qrRef} className="flex flex-col items-center justify-center py-8 bg-white" style={{ background: 'white', padding: '2rem' }}>
          <QRCode 
            value={JSON.stringify(familyData)} 
            size={256}
            level="H"
            fgColor="#1c1c1c"
            bgColor="#ffffff"
          />
          <div className="mt-8 text-center font-mono text-sm text-primary">
            ID: {familyData.id}<br/>
            Members: {familyData.members}<br/>
            Shelter: {familyData.shelterAssigned}
          </div>
        </div>
      </Frame>

      <div className="flex gap-4 print:hidden">
        <button onClick={handlePrint} className="brutalist-button flex-1 flex items-center justify-center gap-2">
          <Printer size={18} /> Print
        </button>
        <button className="brutalist-button-outline flex-1 flex items-center justify-center gap-2">
          <Download size={18} /> Save
        </button>
      </div>
      
      <p className="text-sm text-muted-foreground print:hidden text-center mt-4">
        Keep this QR code saved on your device or printed. It allows rescue teams to instantly identify your family and medical needs offline.
      </p>
    </div>
  );
}
