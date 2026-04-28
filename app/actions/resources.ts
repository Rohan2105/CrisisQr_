'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function transferResources(formData: FormData) {
  const originId = formData.get('originId') as string;
  const destinationId = formData.get('destinationId') as string;
  const resourceType = formData.get('type') as string;
  const quantity = parseInt(formData.get('quantity') as string);

  if (!originId || !destinationId || !resourceType || isNaN(quantity) || quantity <= 0) {
    return { success: false, error: 'Invalid transfer parameters.' };
  }

  if (originId === destinationId) {
    return { success: false, error: 'Origin and destination must be different.' };
  }

  try {
    // 1. Check if origin has enough resource
    const originResource = await prisma.resource.findFirst({
      where: { shelterId: originId, type: resourceType },
    });

    if (!originResource || originResource.quantity < quantity) {
      return { success: false, error: 'Insufficient resources at origin.' };
    }

    // 2. Perform transfer in a transaction
    await prisma.$transaction([
      prisma.resource.update({
        where: { id: originResource.id },
        data: { quantity: { decrement: quantity } },
      }),
      prisma.resource.updateMany({
        where: { shelterId: destinationId, type: resourceType },
        data: { quantity: { increment: quantity } },
      }),
    ]);

    revalidatePath('/admin/resources');
    revalidatePath('/admin/control-room');
    return { success: true };
  } catch (error) {
    console.error('Transfer error:', error);
    return { success: false, error: 'Internal Server Error during transfer.' };
  }
}
