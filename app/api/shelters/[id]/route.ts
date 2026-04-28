import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const shelter = await prisma.shelter.findUnique({
      where: { id: params.id },
      include: { resources: true },
    });

    if (!shelter) {
      return NextResponse.json({ success: false, error: 'Shelter not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: shelter });
  } catch (error) {
    console.error('Error fetching shelter details:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
