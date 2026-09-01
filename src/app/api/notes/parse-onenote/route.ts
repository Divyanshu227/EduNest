import { NextResponse } from 'next/server';
import { requireUser, jsonError } from '@/lib/api';
import { toMarkdown } from '@mdgate/onenote';

/**
 * Fallback binary text extractor for OneNote sections
 * Extracts readable UTF-16LE and UTF-8 text, headings, and lines from .one files.
 */
function extractFallbackText(buffer: Buffer): string {
  try {
    // 1. Scan UTF-16LE text stream
    const utf16 = buffer.toString('utf16le');
    const utf16Matches = utf16.match(/[\u0020-\u007E\u00A0-\u024F\u0900-\u097F]{4,}/g) || [];

    // 2. Scan UTF-8 / ASCII text stream
    const utf8 = buffer.toString('utf8');
    const utf8Matches = utf8.match(/[A-Za-z0-9 .,!?:;()\-+='"/\\%$#@*\n\r]{6,}/g) || [];

    // Filter out internal GUIDs, binary signatures, and font table metadata
    const isGarbage = (s: string) => {
      const trimmed = s.trim();
      if (trimmed.length < 4) return true;
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i.test(trimmed)) return true;
      if (/^\{[0-9a-fA-F-]+\}$/.test(trimmed)) return true;
      if (/^(Arial|Calibri|Segoe UI|Times New Roman|Consolas|Tahoma|Verdana|MS Shell Dlg)/i.test(trimmed)) return true;
      if (/^(\?|\ufffd|[\x00-\x1F])+$/.test(trimmed)) return true;
      if (/^[0-9A-F]{16,}$/i.test(trimmed)) return true;
      return false;
    };

    const clean16 = utf16Matches.map(s => s.trim()).filter(s => !isGarbage(s));
    const clean8 = utf8Matches.map(s => s.trim()).filter(s => !isGarbage(s));

    // Combine and deduplicate consecutive identical lines
    const combined = [...clean16, ...clean8];
    const uniqueLines: string[] = [];
    const seen = new Set<string>();

    for (const line of combined) {
      const normalized = line.toLowerCase().replace(/\s+/g, ' ');
      if (!seen.has(normalized)) {
        seen.add(normalized);
        uniqueLines.push(line);
      }
    }

    if (uniqueLines.length === 0) {
      return '';
    }

    return uniqueLines.join('\n\n');
  } catch (e) {
    console.error('Binary fallback extraction failed:', e);
    return '';
  }
}

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

    // Fetch the .one file binary from Cloudinary / storage
    const response = await fetch(url);
    if (!response.ok) {
      return jsonError(`Failed to fetch file from storage (status ${response.status})`, 502);
    }

    const arrayBuf = await response.arrayBuffer();
    const nodeBuffer = Buffer.from(arrayBuf);
    const uint8Array = new Uint8Array(arrayBuf);

    let markdown = '';
    let parsedSuccessfully = false;

    // 1. Try standard parser
    try {
      markdown = await toMarkdown(uint8Array, { path: url });
      if (markdown && markdown.trim().length > 0) {
        parsedSuccessfully = true;
      }
    } catch (parseErr) {
      console.warn('toMarkdown could not parse section, using fallback extractor:', parseErr);
    }

    // 2. If standard parser returned empty or failed, use binary extractor
    if (!parsedSuccessfully || !markdown || markdown.trim().length === 0) {
      const fallbackText = extractFallbackText(nodeBuffer);
      if (fallbackText && fallbackText.trim().length > 0) {
        markdown = fallbackText;
        parsedSuccessfully = true;
      }
    }

    return NextResponse.json({
      success: true,
      markdown: markdown || '',
      bytesLength: uint8Array.length,
      hasContent: Boolean(markdown && markdown.trim().length > 0)
    });
  } catch (error: any) {
    console.error('OneNote parsing error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to parse OneNote file',
      markdown: '',
      hasContent: false
    }, { status: 200 });
  }
}
