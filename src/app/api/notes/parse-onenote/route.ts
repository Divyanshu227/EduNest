import { NextResponse } from 'next/server';
import { requireUser, jsonError } from '@/lib/api';
import { toMarkdown } from '@mdgate/onenote';
import JSZip from 'jszip';

interface OneNoteSectionData {
  name: string;
  content: string;
  fileName: string;
  byteSize: number;
}

/**
 * Fallback binary text extractor for OneNote sections
 */
function extractFallbackText(buffer: Buffer): string {
  try {
    const utf16 = buffer.toString('utf16le');
    const utf16Matches = utf16.match(/[\u0020-\u007E\u00A0-\u024F\u0900-\u097F]{4,}/g) || [];

    const utf8 = buffer.toString('utf8');
    const utf8Matches = utf8.match(/[A-Za-z0-9 .,!?:;()\-+='"/\\%$#@*\n\r]{6,}/g) || [];

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

    return uniqueLines.join('\n\n');
  } catch (e) {
    return '';
  }
}

async function parseSingleOneSection(uint8: Uint8Array, name: string): Promise<string> {
  try {
    const md = await toMarkdown(uint8, { path: name });
    if (md && md.trim().length > 0) return md.trim();
  } catch (err) {
    // Fallback
  }
  const fallback = extractFallbackText(Buffer.from(uint8));
  return fallback || '';
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

    const response = await fetch(url);
    if (!response.ok) {
      return jsonError(`Failed to fetch file from storage (status ${response.status})`, 502);
    }

    const arrayBuf = await response.arrayBuffer();
    const nodeBuffer = Buffer.from(arrayBuf);
    const uint8Array = new Uint8Array(arrayBuf);

    // Check if the file is a ZIP package (.onepkg has PK\x03\x04 header)
    const isZipHeader = arrayBuf.byteLength > 4 && 
      uint8Array[0] === 0x50 && uint8Array[1] === 0x4b && uint8Array[2] === 0x03 && uint8Array[3] === 0x04;

    const isPackage = url.toLowerCase().includes('.onepkg') || isZipHeader;

    if (isPackage) {
      try {
        const zip = await JSZip.loadAsync(arrayBuf);
        const sections: OneNoteSectionData[] = [];
        const fileNames = Object.keys(zip.files);

        for (const fileName of fileNames) {
          const zipEntry = zip.files[fileName];
          if (!zipEntry.dir && (fileName.toLowerCase().endsWith('.one') || !fileName.includes('.'))) {
            const entryData = await zipEntry.async('uint8array');
            const cleanName = fileName.replace(/\.one$/i, '').replace(/^.*\//, '');
            const sectionContent = await parseSingleOneSection(entryData, fileName);

            sections.push({
              name: cleanName || 'Section',
              fileName: fileName,
              content: sectionContent,
              byteSize: entryData.byteLength
            });
          }
        }

        if (sections.length > 0) {
          const fullMarkdown = sections.map(s => `# ${s.name}\n\n${s.content}`).join('\n\n---\n\n');
          return NextResponse.json({
            success: true,
            isPackage: true,
            sections,
            markdown: fullMarkdown,
            bytesLength: arrayBuf.byteLength
          });
        }
      } catch (zipErr) {
        console.warn('JSZip extraction failed, attempting direct package parse:', zipErr);
      }
    }

    // Single .one section file parsing
    let markdown = '';
    try {
      markdown = await toMarkdown(uint8Array, { path: url });
    } catch (err) {
      console.warn('toMarkdown parsing failed:', err);
    }

    if (!markdown || markdown.trim().length === 0) {
      markdown = extractFallbackText(nodeBuffer);
    }

    return NextResponse.json({
      success: true,
      isPackage: false,
      sections: [
        {
          name: 'Main Section',
          fileName: 'Section.one',
          content: markdown || '',
          byteSize: arrayBuf.byteLength
        }
      ],
      markdown: markdown || '',
      bytesLength: arrayBuf.byteLength
    });
  } catch (error: any) {
    console.error('OneNote/OnePkg parsing error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to parse file',
      isPackage: false,
      sections: [],
      markdown: ''
    }, { status: 200 });
  }
}
