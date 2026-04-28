import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const alerts = await prisma.broadcastAlert.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: alerts });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const alert = await prisma.broadcastAlert.create({
      data: {
        alertType: body.alertType,
        message: body.message,
        severity: body.severity,
        isActive: true,
      },
    });
    return NextResponse.json({ success: true, data: alert });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create alert' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const alert = await prisma.broadcastAlert.update({
      where: { id: body.id },
      data: { isActive: body.isActive },
    });
    return NextResponse.json({ success: true, data: alert });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update alert' }, { status: 500 });
  }
}
