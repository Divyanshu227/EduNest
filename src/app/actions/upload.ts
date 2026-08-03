"use server";

import { requireUser } from '@/lib/api';
import cloudinary, { uploadToCloudinary } from '@/lib/cloudinary';

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

export async function getCloudinarySignatureAction(folder: string) {
  const auth = await requireUser();

  if ('error' in auth) {
    throw new Error('Unauthorized');
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const paramsToSign = {
    timestamp,
    folder,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    timestamp,
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
  };
}
