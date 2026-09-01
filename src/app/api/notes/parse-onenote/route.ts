import { NextResponse } from 'next/server';
import { requireUser, jsonError } from '@/lib/api';
import { toMarkdown } from '@mdgate/onenote';

export async function POST(request: Request) {
  const session = await requireUser();

  if ('error' in session) {
    return session.error;
  }

  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return jsonError('File URL is required', 400);
    }

    // Fetch the .one file binary from the stored URL
    const response = await fetch(url);
    if (!response.ok) {
      return jsonError(`Failed to fetch file from storage (status ${response.status})`, 502);
    }

    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Convert the OneNote binary data into structured Markdown
    const markdown = await toMarkdown(uint8Array, { path: url });

    return NextResponse.json({
      success: true,
      markdown: markdown || '',
      bytesLength: uint8Array.length
    });
  } catch (error: any) {
    console.error('OneNote parsing error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to parse OneNote file',
      markdown: ''
    }, { status: 200 }); // Return 200 with fallback indicator so client can handle smoothly
  }
}
