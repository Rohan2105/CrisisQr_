import { Frame } from '@/components/Frame';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getPriorityQueue() {
  const requests = await prisma.sOSRequest.findMany({
    orderBy: [
      { priorityScore: 'asc' }, // Will sort CRITICAL, HIGH, LOW, MEDIUM alphabetically. Let's sort manually or based on a mapped score, but for demo we can fetch and sort in memory if needed.
      { createdAt: 'asc' }
    ]
  });
  
  const scoreOrder: Record<string, number> = {
    'CRITICAL': 4,
    'HIGH': 3,
    'MEDIUM': 2,
    'LOW': 1
  };
  
  return requests.sort((a, b) => scoreOrder[b.priorityScore] - scoreOrder[a.priorityScore]);
}

export default async function PriorityQueue() {
  const queue = await getPriorityQueue();

  // Mock data if queue is empty
  const displayQueue = queue.length > 0 ? queue : [
    {
      id: 'SOS-9942',
      type: 'RESCUE',
      priorityScore: 'CRITICAL',
      calculationFactors: { 'Elderly': 20, 'Disease': 15, 'Water Rising': 25, 'Time Waiting': 12 },
      status: 'PENDING'
    },
    {
      id: 'SOS-8831',
      type: 'MEDICAL',
      priorityScore: 'HIGH',
      calculationFactors: { 'Child': 20, 'Injury': 30 },
      status: 'PENDING'
    },
    {
      id: 'SOS-7720',
      type: 'FOOD',
      priorityScore: 'LOW',
      calculationFactors: { 'Time Waiting': 5 },
      status: 'PENDING'
    }
  ];

  const getBadgeClass = (score: string) => {
    switch(score) {
      case 'CRITICAL': return 'bg-status-critical text-white';
      case 'HIGH': return 'bg-status-high text-white';
      case 'MEDIUM': return 'bg-status-medium text-black';
      case 'LOW': return 'bg-status-low text-white';
      default: return 'bg-gray-200 text-black';
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <div className="flex justify-between items-end border-b border-border pb-4">
        <div>
          <h2 className="text-3xl font-bold uppercase tracking-wider">AI Priority Queue</h2>
          <p className="text-muted-foreground font-mono">Live ranked SOS signals based on algorithmic risk assessment.</p>
        </div>
        <Link href="/rescue/dashboard" className="brutalist-button flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Map
        </Link>
      </div>

      <Frame title="Active Distress Signals" noPadding className="flex-grow">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted border-b border-border text-sm uppercase tracking-wider">
                <th className="p-4 border-r border-border">ID</th>
                <th className="p-4 border-r border-border">Priority Score</th>
                <th className="p-4 border-r border-border">Emergency Type</th>
                <th className="p-4 border-r border-border min-w-[300px]">Calculation Factors</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm">
              {displayQueue.map((req: any, idx) => (
                <tr key={req.id} className={`border-b border-border hover:bg-muted/50 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                  <td className="p-4 border-r border-border font-bold">{req.id.substring(0,8)}</td>
                  <td className="p-4 border-r border-border">
                    <span className={`px-2 py-1 font-bold text-xs uppercase ${getBadgeClass(req.priorityScore)}`}>
                      {req.priorityScore === 'CRITICAL' && '🔴 '}
                      {req.priorityScore === 'HIGH' && '🟠 '}
                      {req.priorityScore === 'MEDIUM' && '🟡 '}
                      {req.priorityScore === 'LOW' && '🟢 '}
                      {req.priorityScore}
                    </span>
                  </td>
                  <td className="p-4 border-r border-border font-bold">{req.type}</td>
                  <td className="p-4 border-r border-border text-xs">
                    <div className="flex flex-wrap gap-2">
                      {req.calculationFactors && Object.entries(req.calculationFactors as Record<string, number>).map(([key, val]) => (
                        <span key={key} className="bg-gray-100 border border-border px-1">
                          {key}: +{val}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <button className="brutalist-button text-xs py-1 px-2">DISPATCH</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Frame>
    </div>
  );
}
