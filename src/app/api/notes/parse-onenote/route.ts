import { NextResponse } from 'next/server';
import { requireUser, jsonError } from '@/lib/api';
import { OneNoteParserService } from '@/lib/onenote/parser';

export async function POST(request: Request) {
  const session = await requireUser();

  if ('error' in session) {
    return session.error;
  }

  try {
    const { url, fileName } = await request.json();

    if (!url || typeof url !== 'string') {
      return jsonError('File URL is required', 400);
    }

    // Fetch the binary buffer from Cloudinary/storage
    const response = await fetch(url);
    if (!response.ok) {
      return jsonError(`Failed to fetch file from storage (status ${response.status})`, 502);
    }

    const arrayBuffer = await response.arrayBuffer();
    const effectiveFileName = fileName || url.split('?')[0].split('/').pop() || 'notebook.one';

    // Parse into normalized OneNoteDocument structure
    const document = await OneNoteParserService.parseOneNoteBuffer(
      arrayBuffer,
      effectiveFileName,
      url
    );

    return NextResponse.json({
      success: true,
      document,
      bytesLength: arrayBuffer.byteLength
    });
  } catch (error: any) {
    console.error('OneNote parsing error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to parse OneNote file',
      document: null
    }, { status: 200 });
  }
}
