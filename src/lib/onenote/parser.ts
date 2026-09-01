import JSZip from 'jszip';
import { OneNoteDocument, OneNoteSection, OneNotePage, OneNoteBlock } from './types';

let toMarkdownFn: ((buffer: Uint8Array, options?: any) => Promise<string>) | null = null;
async function getToMarkdown() {
  if (!toMarkdownFn) {
    try {
      const mod = await import('@mdgate/onenote');
      toMarkdownFn = mod.toMarkdown || (mod as any).default?.toMarkdown;
    } catch (e) {
      console.warn('Could not import @mdgate/onenote:', e);
    }
  }
  return toMarkdownFn;
}

// Security constraints
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB max uploaded archive
const MAX_EXTRACTED_BYTES = 100 * 1024 * 1024; // 100MB max decompressed size
const MAX_SECTIONS = 50; // max sections in a single package

/**
 * Fallback binary text stream scanner for OneNote sections
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

/**
 * Parses raw markdown/text into structured OneNoteBlock elements
 */
export function parseContentToBlocks(content: string): OneNoteBlock[] {
  if (!content || !content.trim()) {
    return [];
  }

  const lines = content.split('\n');
  const blocks: OneNoteBlock[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let listItems: string[] = [];
  let isOrderedList = false;

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({
        type: 'list',
        ordered: isOrderedList,
        items: [...listItems]
      });
      listItems = [];
    }
  };

  const flushCode = () => {
    if (inCodeBlock && codeLines.length > 0) {
      blocks.push({
        type: 'code',
        code: codeLines.join('\n')
      });
      codeLines = [];
      inCodeBlock = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        flushCode();
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Empty line
    if (!line.trim()) {
      flushList();
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      flushList();
      blocks.push({
        type: 'heading',
        level: 1,
        content: line.replace(/^#\s+/, '').trim()
      });
      continue;
    }

    if (line.startsWith('## ')) {
      flushList();
      blocks.push({
        type: 'heading',
        level: 2,
        content: line.replace(/^##\s+/, '').trim()
      });
      continue;
    }

    if (line.startsWith('### ')) {
      flushList();
      blocks.push({
        type: 'heading',
        level: 3,
        content: line.replace(/^###\s+/, '').trim()
      });
      continue;
    }

    // Blockquotes
    if (line.startsWith('> ')) {
      flushList();
      blocks.push({
        type: 'quote',
        content: line.replace(/^>\s+/, '').trim()
      });
      continue;
    }

    // Task checkboxes
    if (line.match(/^\[([ xX])\]\s+/)) {
      flushList();
      const checked = !line.startsWith('[ ]');
      const text = line.replace(/^\[([ xX])\]\s+/, '').trim();
      blocks.push({
        type: 'task',
        text,
        checked
      });
      continue;
    }

    // Unordered list
    if (line.match(/^[-*]\s+/)) {
      if (listItems.length > 0 && isOrderedList) {
        flushList();
      }
      isOrderedList = false;
      listItems.push(line.replace(/^[-*]\s+/, '').trim());
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\.\s+/)) {
      if (listItems.length > 0 && !isOrderedList) {
        flushList();
      }
      isOrderedList = true;
      listItems.push(line.replace(/^\d+\.\s+/, '').trim());
      continue;
    }

    // Table row detection
    if (line.includes('|') && line.trim().startsWith('|') && line.trim().endsWith('|')) {
      flushList();
      const cols = line.split('|').slice(1, -1).map(c => c.trim());
      // Check if next or prev line is separator
      if (!cols.every(c => /^[-:]+$/.test(c))) {
        blocks.push({
          type: 'table',
          rows: [cols]
        });
      }
      continue;
    }

    // Regular text paragraph
    flushList();
    blocks.push({
      type: 'text',
      content: line.trim()
    });
  }

  flushList();
  flushCode();

  return blocks;
}

/**
 * Divides section blocks into logical pages (split on major headings or page markers)
 */
export function structurePagesFromBlocks(blocks: OneNoteBlock[], defaultTitle: string): OneNotePage[] {
  if (blocks.length === 0) {
    return [
      {
        id: 'page-1',
        title: defaultTitle,
        order: 1,
        blocks: []
      }
    ];
  }

  const pages: OneNotePage[] = [];
  let currentPageBlocks: OneNoteBlock[] = [];
  let currentPageTitle = defaultTitle;
  let pageIndex = 1;

  for (const block of blocks) {
    if (block.type === 'heading' && block.level === 1 && currentPageBlocks.length > 0) {
      // Start a new page on level 1 heading if current page already has content
      pages.push({
        id: `page-${pageIndex}`,
        title: currentPageTitle,
        order: pageIndex,
        blocks: currentPageBlocks
      });
      pageIndex++;
      currentPageBlocks = [block];
      currentPageTitle = block.content;
    } else {
      if (block.type === 'heading' && block.level === 1 && currentPageBlocks.length === 0) {
        currentPageTitle = block.content;
      }
      currentPageBlocks.push(block);
    }
  }

  if (currentPageBlocks.length > 0) {
    pages.push({
      id: `page-${pageIndex}`,
      title: currentPageTitle,
      order: pageIndex,
      blocks: currentPageBlocks
    });
  }

  return pages;
}

/**
 * Service to safely parse .one and .onepkg files
 */
export class OneNoteParserService {
  /**
   * Main parsing entrypoint
   */
  static async parseOneNoteBuffer(
    buffer: ArrayBuffer,
    fileName: string = 'Notebook.one',
    sourceUrl?: string
  ): Promise<OneNoteDocument> {
    const byteLength = buffer.byteLength;

    if (byteLength > MAX_FILE_SIZE) {
      throw new Error(`File exceeds maximum size limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    const uint8Array = new Uint8Array(buffer);
    const nodeBuffer = Buffer.from(buffer);

    // Detect if archive has ZIP signature (PK\x03\x04)
    const isZip = byteLength >= 4 &&
      uint8Array[0] === 0x50 && uint8Array[1] === 0x4B && uint8Array[2] === 0x03 && uint8Array[3] === 0x04;

    const isPackage = fileName.toLowerCase().endsWith('.onepkg') || isZip;

    if (isPackage) {
      return this.parseOnePkg(buffer, fileName, sourceUrl);
    } else {
      return this.parseSingleOne(buffer, fileName, sourceUrl);
    }
  }

  /**
   * Parse a single .one section file
   */
  private static async parseSingleOne(
    buffer: ArrayBuffer,
    fileName: string,
    sourceUrl?: string
  ): Promise<OneNoteDocument> {
    const uint8Array = new Uint8Array(buffer);
    const nodeBuffer = Buffer.from(buffer);
    const cleanSectionName = fileName.replace(/\.one$/i, '').replace(/^.*\//, '') || 'Section';

    let markdown = '';
    let parsedWithMdGate = false;

    try {
      const parseFn = await getToMarkdown();
      if (parseFn) {
        markdown = await parseFn(uint8Array, { path: fileName });
        if (markdown && markdown.trim().length > 0) {
          parsedWithMdGate = true;
        }
      }
    } catch (err) {
      console.warn('toMarkdown could not parse .one section, using fallback stream extractor');
    }

    if (!parsedWithMdGate || !markdown || !markdown.trim()) {
      markdown = extractFallbackText(nodeBuffer);
    }

    const blocks = parseContentToBlocks(markdown);
    const pages = structurePagesFromBlocks(blocks, cleanSectionName);

    const section: OneNoteSection = {
      id: 'section-1',
      name: cleanSectionName,
      fileName,
      byteSize: buffer.byteLength,
      order: 1,
      pages
    };

    return {
      type: 'onenote',
      version: '1.0',
      title: cleanSectionName,
      fileName,
      isPackage: false,
      totalSections: 1,
      totalPages: pages.length,
      totalBytes: buffer.byteLength,
      status: 'READY',
      sections: [section]
    };
  }

  /**
   * Parse a .onepkg notebook archive containing multiple sections
   */
  private static async parseOnePkg(
    buffer: ArrayBuffer,
    fileName: string,
    sourceUrl?: string
  ): Promise<OneNoteDocument> {
    const zip = await JSZip.loadAsync(buffer);
    const sections: OneNoteSection[] = [];
    let totalExtractedBytes = 0;
    let sectionOrder = 1;

    const fileEntries = Object.keys(zip.files);

    for (const entryName of fileEntries) {
      const entry = zip.files[entryName];

      // Security check: Path traversal prevention & system directory safety
      const normalizedName = entryName.replace(/\\/g, '/').toLowerCase();
      if (
        normalizedName.includes('..') ||
        normalizedName.startsWith('/') ||
        normalizedName.startsWith('etc/') ||
        normalizedName.startsWith('windows/') ||
        normalizedName.startsWith('system32/')
      ) {
        console.warn(`Skipping suspicious archive entry: ${entryName}`);
        continue;
      }

      // Ignore directories and table of contents files
      if (entry.dir || entryName.toLowerCase().endsWith('.onetoc2')) {
        continue;
      }

      // Enforce max section limit
      if (sections.length >= MAX_SECTIONS) {
        console.warn(`Package exceeds max section limit of ${MAX_SECTIONS}`);
        break;
      }

      // Process .one files or section streams
      if (entryName.toLowerCase().endsWith('.one') || !entryName.includes('.')) {
        const entryData = await entry.async('uint8array');
        totalExtractedBytes += entryData.byteLength;

        // Security check: Decompression bomb limit
        if (totalExtractedBytes > MAX_EXTRACTED_BYTES) {
          throw new Error('Decompression limit exceeded while extracting OneNote package');
        }

        const cleanSectionName = entryName
          .replace(/\.one$/i, '')
          .replace(/^.*[\\\/]/, '') || `Section ${sectionOrder}`;

        let sectionMarkdown = '';
        try {
          const parseFn = await getToMarkdown();
          if (parseFn) {
            sectionMarkdown = await parseFn(entryData, { path: entryName });
          }
        } catch (e) {
          // Fallback
        }

        if (!sectionMarkdown || !sectionMarkdown.trim()) {
          sectionMarkdown = extractFallbackText(Buffer.from(entryData));
        }

        const blocks = parseContentToBlocks(sectionMarkdown);
        const pages = structurePagesFromBlocks(blocks, cleanSectionName);

        sections.push({
          id: `section-${sectionOrder}`,
          name: cleanSectionName,
          fileName: entryName,
          byteSize: entryData.byteLength,
          order: sectionOrder,
          pages
        });

        sectionOrder++;
      }
    }

    if (sections.length === 0) {
      // If no valid sections found in zip, fallback to single stream parse
      return this.parseSingleOne(buffer, fileName, sourceUrl);
    }

    const totalPages = sections.reduce((acc, s) => acc + s.pages.length, 0);
    const notebookTitle = fileName.replace(/\.onepkg$/i, '').replace(/^.*\//, '') || 'Notebook Package';

    return {
      type: 'onenote',
      version: '1.0',
      title: notebookTitle,
      fileName,
      isPackage: true,
      totalSections: sections.length,
      totalPages,
      totalBytes: buffer.byteLength,
      status: 'READY',
      sections
    };
  }
}
