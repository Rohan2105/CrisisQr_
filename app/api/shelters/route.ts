import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const shelters = await prisma.shelter.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: shelters });
  } catch (error) {
    console.error('Error fetching shelters:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
