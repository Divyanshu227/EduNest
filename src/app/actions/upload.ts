"use server";

import { requireUser } from '@/lib/api';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function uploadAction(formData: FormData) {
  const auth = await requireUser();

  if ('error' in auth) {
    throw new Error('Unauthorized');
  }

  const file = formData.get('file') as File | null;
  const folder = (formData.get('folder') as string) || 'edunest';

  if (!file) {
    throw new Error('No file provided');
  }

  try {
    const result = await uploadToCloudinary(file, folder);
    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      resourceType: result.resource_type
    };
  } catch (error: any) {
    console.error('Cloudinary upload failed:', error);
    throw new Error(error.message || 'Cloudinary upload failed');
  }
}
