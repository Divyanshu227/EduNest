/**
 * Normalized OneNote Document Schema for EduNest
 * Provides structured, isolated representation of parsed .one & .onepkg files.
 */

export interface OneNoteDocument {
  type: 'onenote';
  version: string;
  title: string;
  fileName: string;
  isPackage: boolean;
  totalSections: number;
  totalPages: number;
  totalBytes: number;
  status: 'READY' | 'PROCESSING' | 'FAILED' | 'PARTIAL';
  statusMessage?: string;
  sections: OneNoteSection[];
}

export interface OneNoteSection {
  id: string;
  name: string;
  fileName: string;
  byteSize: number;
  order: number;
  pages: OneNotePage[];
}

export interface OneNotePage {
  id: string;
  title: string;
  order: number;
  createdTime?: string;
  blocks: OneNoteBlock[];
}

export type OneNoteBlock =
  | { type: 'heading'; level: 1 | 2 | 3; content: string }
  | { type: 'text'; content: string; formatted?: boolean }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'task'; text: string; checked: boolean }
  | { type: 'code'; code: string; language?: string }
  | { type: 'quote'; content: string }
  | { type: 'table'; headers?: string[]; rows: string[][] }
  | { type: 'image'; url: string; alt?: string; width?: number; height?: number }
  | { type: 'attachment'; name: string; url?: string; size?: number }
  | { type: 'unsupported'; rawType: string; description: string };
