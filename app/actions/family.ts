'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateFamilyMember(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const age = parseInt(formData.get('age') as string);
  const bloodGroup = formData.get('bloodGroup') as string;
  const medicalConditions = formData.get('medicalConditions') as string;

  if (!id || !name || isNaN(age)) {
    return { success: false, error: 'Missing required fields' };
  }

  try {
    await prisma.familyMember.update({
      where: { id },
      data: {
        name,
        age,
        bloodGroup,
        medicalConditions,
      },
    });

    revalidatePath('/citizen/family');
    return { success: true };
  } catch (error) {
    console.error('Update family member error:', error);
    return { success: false, error: 'Failed to update family member' };
  }
}
