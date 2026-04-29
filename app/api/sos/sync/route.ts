import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { requests } = data; // Array of queued offline requests

    if (!Array.isArray(requests)) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    const createdRequests = [];

    for (const reqData of requests) {
      const { userId, type, lat, lng, factors, offlineTimestamp } = reqData;

      // Recalculate priority
      let score = 0;
      const calcFactors: Record<string, number> = {};

      if (factors.hasChild) { score += 20; calcFactors['Child'] = 20; }
      if (factors.hasElderly) { score += 20; calcFactors['Elderly'] = 20; }
      if (factors.hasInjury) { score += 30; calcFactors['Injury'] = 30; }
      if (factors.waterRising) { score += 25; calcFactors['Water Rising'] = 25; }
      if (factors.isPregnant) { score += 20; calcFactors['Pregnant'] = 20; }
      if (factors.hasDisease) { score += 15; calcFactors['Disease'] = 15; }
      
      // Calculate time waiting based on offline timestamp
      let timeWaitingMins = 0;
      if (offlineTimestamp) {
         timeWaitingMins = Math.floor((Date.now() - new Date(offlineTimestamp).getTime()) / 60000);
      } else if (factors.timeWaitingMins) {
         timeWaitingMins = factors.timeWaitingMins;
      }
      
      if (timeWaitingMins > 0) {
        const timeScore = Math.min(timeWaitingMins, 50);
        score += timeScore;
        calcFactors['Time Waiting'] = timeScore;
      }

      let priorityScore = 'LOW';
      if (score >= 60) priorityScore = 'CRITICAL';
      else if (score >= 40) priorityScore = 'HIGH';
      else if (score >= 20) priorityScore = 'MEDIUM';

      const sosRequest = await prisma.sosRequest.create({
        data: {
          userId,
          type,
          lat,
          lng,
          priorityScore,
          calculationFactors: calcFactors,
          isOfflineSync: true,
          createdAt: offlineTimestamp ? new Date(offlineTimestamp) : new Date(),
        }
      });

      createdRequests.push(sosRequest);
    }

    return NextResponse.json({ success: true, count: createdRequests.length, data: createdRequests });
  } catch (error) {
    console.error('Error syncing offline SOS Requests:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
