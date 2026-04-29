'use server';

import prisma from '@/lib/prisma';

import { revalidatePath } from 'next/cache';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function submitSOSRequest(payload: {
  userId: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  isVoice?: boolean;
  transcription?: string;
}) {
  try {
    // 1. Save the SOS Request
    const sosRequest = await prisma.sosRequest.create({
      data: {
        userId: payload.userId,
        name: payload.name,
        type: payload.type,
        lat: payload.lat,
        lng: payload.lng,
        isVoice: payload.isVoice || false,
        priorityScore: 'MEDIUM', // Default, will be AI refined
        calculationFactors: payload.transcription ? { transcription: payload.transcription } : {},
        status: 'PENDING',
      },
    });

    // 2. Fetch all Shelters
    const shelters = await prisma.shelter.findMany();

    if (shelters.length === 0) {
      return { success: true, requestId: sosRequest.id, nearestShelter: null };
    }

    // 3. Find Nearest Shelter via Haversine
    let nearestShelter = shelters[0];
    let minDistance = calculateDistance(payload.lat, payload.lng, shelters[0].lat, shelters[0].lng);

    for (let i = 1; i < shelters.length; i++) {
      const dist = calculateDistance(payload.lat, payload.lng, shelters[i].lat, shelters[i].lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearestShelter = shelters[i];
      }
    }

    revalidatePath('/rescue/dashboard');
    revalidatePath('/admin/control-room');

    return { 
      success: true, 
      requestId: sosRequest.id, 
      nearestShelter: {
        id: nearestShelter.id,
        name: nearestShelter.name,
        lat: nearestShelter.lat,
        lng: nearestShelter.lng,
        distance: minDistance.toFixed(2)
      } 
    };
  } catch (error) {
    console.error('SOS Submission Error:', error);
    return { success: false, error: 'Failed to transmit SOS signal.' };
  }
}
