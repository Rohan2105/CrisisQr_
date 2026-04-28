import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const requests = await prisma.sOSRequest.findMany({
      where: { status: { not: 'RESOLVED' } },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    const scoreOrder: Record<string, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    const sorted = requests.sort(
      (a, b) => scoreOrder[b.priorityScore] - scoreOrder[a.priorityScore]
    );

    return NextResponse.json({ success: true, data: sorted });
  } catch (error) {
    console.error('Error fetching SOS requests:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
