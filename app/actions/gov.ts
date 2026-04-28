'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addShelter(formData: FormData) {
  const name = formData.get('name') as string;
  const lat = parseFloat(formData.get('lat') as string);
  const lng = parseFloat(formData.get('lng') as string);
  const capacity = parseInt(formData.get('capacity') as string);

  if (!name || isNaN(lat) || isNaN(lng) || isNaN(capacity)) {
    return { success: false, error: 'Invalid shelter parameters.' };
  }

  try {
    await prisma.shelter.create({
      data: { name, lat, lng, capacity, currentOccupancy: 0 },
    });
    revalidatePath('/admin/control-room');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Database error creating shelter.' };
  }
}

export async function addRescueTeam(formData: FormData) {
  const name = formData.get('name') as string;
  const lat = parseFloat(formData.get('lat') as string);
  const lng = parseFloat(formData.get('lng') as string);

  if (!name || isNaN(lat) || isNaN(lng)) {
    return { success: false, error: 'Invalid team parameters.' };
  }

  try {
    await prisma.rescueTeam.create({
      data: { name, lat, lng, isActive: true, status: 'ACTIVE' },
    });
    revalidatePath('/admin/control-room');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Database error creating rescue team.' };
  }
}

export async function toggleTeamStatus(id: string, isActive: boolean) {
  try {
    await prisma.rescueTeam.update({
      where: { id },
      data: { isActive },
    });
    revalidatePath('/admin/control-room');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to toggle team status.' };
  }
}
