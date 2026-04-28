'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function completeSOS(id: string) {
  try {
    await prisma.sosRequest.update({
      where: { id },
      data: { status: 'RESOLVED' },
    });
    revalidatePath('/rescue/dashboard');
    revalidatePath('/admin/control-room');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to resolve SOS signal.' };
  }
}

export async function addFamilyToShelter(formData: FormData) {
  const shelterId = formData.get('shelterId') as string;
  const count = parseInt(formData.get('count') as string);

  if (!shelterId || isNaN(count) || count <= 0) {
    return { success: false, error: 'Invalid placement parameters.' };
  }

  try {
    await prisma.$transaction([
      prisma.shelter.update({
        where: { id: shelterId },
        data: { currentOccupancy: { increment: count } },
      }),
      // We could also create a Family record here if we had member names, 
      // but the prompt focuses on capacity synchronization.
    ]);
    
    revalidatePath('/rescue/dashboard');
    revalidatePath('/admin/control-room');
    revalidatePath('/citizen/dashboard');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update shelter occupancy.' };
  }
}
