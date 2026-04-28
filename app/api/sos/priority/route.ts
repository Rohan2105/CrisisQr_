import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PriorityScore } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { userId, type, lat, lng, factors, isOfflineSync, isVoice } = data;

    // factors = { hasChild, hasElderly, hasInjury, waterRising, isPregnant, hasDisease, timeWaitingMins }
    let score = 0;
    const calcFactors: Record<string, number> = {};

    if (factors.hasChild) { score += 20; calcFactors['Child'] = 20; }
    if (factors.hasElderly) { score += 20; calcFactors['Elderly'] = 20; }
    if (factors.hasInjury) { score += 30; calcFactors['Injury'] = 30; }
    if (factors.waterRising) { score += 25; calcFactors['Water Rising'] = 25; }
    if (factors.isPregnant) { score += 20; calcFactors['Pregnant'] = 20; }
    if (factors.hasDisease) { score += 15; calcFactors['Disease'] = 15; }
    if (factors.timeWaitingMins) {
      const timeScore = Math.min(factors.timeWaitingMins, 50); // Cap time score
      score += timeScore;
      calcFactors['Time Waiting'] = timeScore;
    }

    let priorityScore: PriorityScore = 'LOW';
    if (score >= 60) priorityScore = 'CRITICAL';
    else if (score >= 40) priorityScore = 'HIGH';
    else if (score >= 20) priorityScore = 'MEDIUM';

    // Ensure the user exists in this demo environment
    await prisma.user.upsert({
      where: { id: userId || 'temp-id' },
      update: {},
      create: {
        id: userId || 'temp-id',
        name: 'Citizen User',
        phone: '9876543210',
      }
    });

    const sosRequest = await prisma.sOSRequest.create({
      data: {
        userId: userId || 'temp-id',
        type,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        priorityScore,
        isVoice: isVoice || false,
        calculationFactors: calcFactors,
        isOfflineSync: isOfflineSync || false,
      }
    });

    return NextResponse.json({ success: true, data: sosRequest });
  } catch (error) {
    console.error('Error creating SOS Request:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
