import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request: Request) {
  const auth = await requireUser();

  if ('error' in auth) {
    return auth.error;
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'edunest';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    try {
      const result = await uploadToCloudinary(file, folder);
      return NextResponse.json({
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        resourceType: result.resource_type
      });
    } catch (error: any) {
      console.warn('Cloudinary upload failed, using mock fallback:', error);
      
      // Mock fallback: if it's a PDF, return a dummy PDF link; otherwise return a mock image
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      const mockUrl = isPdf 
        ? 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
        : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60';

      return NextResponse.json({
        url: mockUrl,
        publicId: `mock_${Date.now()}`,
        format: isPdf ? 'pdf' : 'jpg',
        resourceType: isPdf ? 'image' : 'image',
        isMock: true
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
