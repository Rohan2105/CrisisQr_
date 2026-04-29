import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [requests, teams, shelters] = await Promise.all([
      prisma.sosRequest.findMany({
        where: { status: { not: 'RESOLVED' } },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.rescueTeam.findMany(),
      prisma.shelter.findMany(),
    ]);

    return NextResponse.json({ 
      success: true, 
      data: {
        requests,
        teams,
        shelters,
      } 
    });
  } catch (error) {
    console.error('Error fetching Gov map data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
