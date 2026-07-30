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
    console.warn('Cloudinary upload failed, using mock fallback:', error);
    
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const mockUrl = isPdf 
      ? 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60';

    return {
      url: mockUrl,
      publicId: `mock_${Date.now()}`,
      format: isPdf ? 'pdf' : 'jpg',
      resourceType: isPdf ? 'raw' : 'image',
      isMock: true
    };
  }
}
