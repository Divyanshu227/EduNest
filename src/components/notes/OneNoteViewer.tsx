"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Download, 
  Smartphone, 
  Monitor, 
  Apple, 
  Copy, 
  Check, 
  Loader2, 
  Sparkles,
  Maximize2,
  Minimize2,
  Search,
  Sun,
  Moon,
  Coffee,
  Printer,
  FileText,
  HelpCircle,
  Layers,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  CheckSquare,
  Square,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { OneNoteDocument, OneNoteSection, OneNotePage, OneNoteBlock } from '@/lib/onenote/types';

interface OneNoteViewerProps {
  noteId: string;
  url: string;
  fileName?: string;
  title?: string;
  subjectName?: string;
  chapterName?: string;
}

type ReaderTheme = 'default' | 'sepia' | 'light';

export function OneNoteViewer({
  noteId,
  url,
  fileName,
  title,
  subjectName,
  chapterName
}: OneNoteViewerProps) {
  // Document state
  const [doc, setDoc] = useState<OneNoteDocument | null>(null);
  const [activeSectionIdx, setActiveSectionIdx] = useState<number>(0);
  const [activePageIdx, setActivePageIdx] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<'reader' | 'guide'>('reader');
  const [theme, setTheme] = useState<ReaderTheme>('default');
  const [fontSize, setFontSize] = useState<number>(16);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isOpeningMobile, setIsOpeningMobile] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'android' | 'ios' | 'desktop'>('android');

  const containerRef = useRef<HTMLDivElement>(null);

  const isOnePkg = url?.toLowerCase().includes('.onepkg') || fileName?.toLowerCase().endsWith('.onepkg');
  const extension = isOnePkg ? 'onepkg' : 'one';
  const cleanFileName = fileName || `EduNest_Notes_${noteId}.${extension}`;
  const properFileName = cleanFileName.toLowerCase().endsWith(`.${extension}`)
    ? cleanFileName
    : `${cleanFileName.replace(/\.[^/.]+$/, '')}.${extension}`;

  // Fetch parsed document from backend
  useEffect(() => {
    let isMounted = true;

    async function loadDoc() {
      if (!url) return;
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/notes/parse-onenote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, fileName: properFileName })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        if (isMounted) {
          if (data.success && data.document) {
            setDoc(data.document);
            setActiveSectionIdx(0);
            setActivePageIdx(0);
          } else {
            setError(data.error || 'Failed to parse OneNote document');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Failed to parse OneNote file:', err);
          setError(err.message || 'Failed to load content');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDoc();

    return () => {
      isMounted = false;
    };
  }, [url, properFileName]);

  const currentSection: OneNoteSection | undefined = doc?.sections[activeSectionIdx] || doc?.sections[0];
  const pages: OneNotePage[] = currentSection?.pages || [];
  const currentPage: OneNotePage | undefined = pages[activePageIdx] || pages[0];

  const handleNextPage = () => {
    if (activePageIdx < pages.length - 1) {
      setActivePageIdx(prev => prev + 1);
    } else if (doc && activeSectionIdx < doc.sections.length - 1) {
      // Go to next section's first page
      setActiveSectionIdx(prev => prev + 1);
      setActivePageIdx(0);
    }
  };

  const handlePrevPage = () => {
    if (activePageIdx > 0) {
      setActivePageIdx(prev => prev - 1);
    } else if (activeSectionIdx > 0 && doc) {
      // Go to previous section's last page
      const prevSection = doc.sections[activeSectionIdx - 1];
      setActiveSectionIdx(prev => prev - 1);
      setActivePageIdx(Math.max(0, prevSection.pages.length - 1));
    }
  };

  const handleOpenMobileApp = async () => {
    setIsOpeningMobile(true);
    try {
      const response = await fetch(url);
      const originalBlob = await response.blob();
      const mimeType = isOnePkg ? 'application/zip' : 'application/onenote';
      const file = new File([originalBlob], properFileName, { type: mimeType });

      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title || 'OneNote Notebook',
          text: `Open ${title || 'OneNote Note'} in Microsoft OneNote`
        });
        return;
      }

      const objectUrl = window.URL.createObjectURL(new Blob([originalBlob], { type: mimeType }));
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = properFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 2000);
    } catch (err) {
      console.error('Mobile open failed:', err);
      window.open(url, '_blank');
    } finally {
      setIsOpeningMobile(false);
    }
  };

  const handleDownload = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!url) return;

    try {
      setIsDownloading(true);
      const response = await fetch(url);
      const originalBlob = await response.blob();
      const mimeType = isOnePkg ? 'application/zip' : 'application/onenote';
      const blob = new Blob([originalBlob], { type: mimeType });

      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = properFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1500);
    } catch (err) {
      console.error('Download failed:', err);
      window.open(url, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatInlineText = (text: string) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      return text;
    }
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="bg-yellow-300 text-black px-1 rounded font-semibold">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const renderBlock = (block: OneNoteBlock, index: number) => {
    switch (block.type) {
      case 'heading':
        if (block.level === 1) {
          return (
            <h1 key={`h1-${index}`} className="mt-6 mb-3 text-2xl sm:text-3xl font-bold font-[var(--font-heading)] border-b pb-2 border-purple-500/20 text-purple-400">
              {formatInlineText(block.content)}
            </h1>
          );
        }
        if (block.level === 2) {
          return (
            <h2 key={`h2-${index}`} className="mt-5 mb-2.5 text-xl sm:text-2xl font-bold text-foreground">
              {formatInlineText(block.content)}
            </h2>
          );
        }
        return (
          <h3 key={`h3-${index}`} className="mt-4 mb-2 text-lg sm:text-xl font-semibold text-foreground/90">
            {formatInlineText(block.content)}
          </h3>
        );

      case 'text':
        return (
          <p key={`p-${index}`} className="my-2.5 leading-relaxed">
            {formatInlineText(block.content)}
          </p>
        );

      case 'list':
        if (block.ordered) {
          return (
            <ol key={`ol-${index}`} className="my-3 space-y-1.5 list-decimal list-inside pl-2">
              {block.items.map((item, i) => (
                <li key={i} className="leading-relaxed">
                  {formatInlineText(item)}
                </li>
              ))}
            </ol>
          );
        }
        return (
          <ul key={`ul-${index}`} className="my-3 space-y-1.5 list-disc list-inside pl-2">
            {block.items.map((item, i) => (
              <li key={i} className="leading-relaxed">
                {formatInlineText(item)}
              </li>
            ))}
          </ul>
        );

      case 'task':
        return (
          <div key={`task-${index}`} className="my-2 flex items-center gap-2.5 leading-relaxed">
            {block.checked ? (
              <CheckSquare className="h-4 w-4 text-purple-500 flex-shrink-0" />
            ) : (
              <Square className="h-4 w-4 opacity-50 flex-shrink-0" />
            )}
            <span className={block.checked ? 'line-through opacity-60' : ''}>
              {formatInlineText(block.text)}
            </span>
          </div>
        );

      case 'quote':
        return (
          <blockquote key={`q-${index}`} className="my-3.5 border-l-4 border-purple-500 bg-purple-500/5 px-4 py-2.5 rounded-r-xl italic text-foreground/80">
            {formatInlineText(block.content)}
          </blockquote>
        );

      case 'code':
        return (
          <pre key={`code-${index}`} className="my-4 overflow-x-auto rounded-2xl bg-zinc-950 p-4 text-xs font-mono text-zinc-100 border border-zinc-800">
            <code>{block.code}</code>
          </pre>
        );

      case 'table':
        return (
          <div key={`tbl-${index}`} className="my-4 overflow-x-auto rounded-xl border border-border/60">
            <table className="min-w-full divide-y divide-border/60 text-xs">
              <tbody className="divide-y divide-border/40">
                {block.rows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx === 0 ? 'bg-muted/40 font-semibold' : ''}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2 whitespace-pre-wrap">
                        {formatInlineText(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'unsupported':
        return (
          <div key={`unsupported-${index}`} className="my-3 rounded-xl border border-dashed border-purple-500/30 bg-purple-500/5 p-3 flex items-center gap-2 text-xs opacity-75">
            <AlertCircle className="h-4 w-4 text-purple-400 flex-shrink-0" />
            <span>{block.description || 'Unsupported OneNote ink/drawing block'}</span>
          </div>
        );

      default:
        return null;
    }
  };

  const themeClasses = {
    default: 'bg-zinc-950 text-zinc-100 border-zinc-800',
    sepia: 'bg-[#fbf0d9] text-[#433422] border-[#e4d4b8] dark:bg-[#2b221b] dark:text-[#eedec5] dark:border-[#3e3229]',
    light: 'bg-white text-zinc-900 border-zinc-200'
  };

  return (
    <div ref={containerRef} className={`space-y-5 ${isFullscreen ? 'fixed inset-0 z-50 bg-background overflow-y-auto p-4 sm:p-6' : ''}`}>
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 via-background to-purple-900/20 p-5 sm:p-6 shadow-xl backdrop-blur">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-semibold gap-1.5 px-3 py-1">
                <BookOpen className="h-3.5 w-3.5" /> Microsoft OneNote
              </Badge>
              <Badge variant="outline" className="border-purple-500/40 text-purple-300">
                {doc?.isPackage ? 'Notebook Package (.onepkg)' : 'Section File (.one)'}
              </Badge>
              {doc?.totalBytes ? (
                <Badge variant="secondary" className="text-[10px]">
                  {Math.round(doc.totalBytes / 1024) > 1024 
                    ? `${(doc.totalBytes / (1024 * 1024)).toFixed(1)} MB` 
                    : `${Math.round(doc.totalBytes / 1024)} KB`}
                </Badge>
              ) : null}
              {subjectName && chapterName && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {subjectName} &middot; {chapterName}
                </span>
              )}
            </div>
            <h3 className="font-[var(--font-heading)] text-xl sm:text-2xl font-bold tracking-tight">
              {title || doc?.title || 'OneNote Notebook'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-xl">
              {doc?.isPackage 
                ? `Contains ${doc.sections.length} sections and ${doc.totalPages} pages. Browse sections below or open in the OneNote app.` 
                : 'Contains digital study notes. Read inline below or open in the OneNote app.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <Button
              onClick={handleOpenMobileApp}
              disabled={isOpeningMobile}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-2xl shadow-lg shadow-purple-600/20 gap-2 h-11 px-5 text-xs sm:text-sm flex-1 sm:flex-initial"
            >
              {isOpeningMobile ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Smartphone className="h-4 w-4" />
              )}
              <span>Open on Phone</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={isDownloading}
              className="rounded-2xl border-purple-500/30 hover:bg-purple-500/10 h-11 px-4 text-xs sm:text-sm gap-1.5"
            >
              <Download className="h-4 w-4 text-purple-400" />
              <span>Download .{extension}</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-11 w-11 rounded-2xl hover:bg-purple-500/10 text-muted-foreground hover:text-foreground hidden sm:inline-flex"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Viewer"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Multi-Section Tabs for .onepkg packages */}
        {doc && doc.sections.length > 1 && (
          <div className="mt-5 border-t border-purple-500/20 pt-4">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-purple-300">
              <Layers className="h-3.5 w-3.5" />
              <span>Notebook Sections ({doc.sections.length}):</span>
            </div>
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
              {doc.sections.map((sec, idx) => (
                <button
                  key={sec.id || idx}
                  type="button"
                  onClick={() => {
                    setActiveSectionIdx(idx);
                    setActivePageIdx(0);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeSectionIdx === idx
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-400/40'
                      : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>{sec.name}</span>
                  <span className="text-[10px] opacity-70 ml-0.5">({sec.pages.length}p)</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* View Switcher & Copy Link */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-purple-500/20 pt-3">
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('reader')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'reader'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> Digital Reader
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'guide'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5" /> Mobile Guide
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Copied' : 'Copy Direct Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab 1: Reader */}
      {activeTab === 'reader' && (
        <div className={`overflow-hidden rounded-3xl border shadow-xl flex flex-col transition-colors ${themeClasses[theme]}`}>
          {/* Reader Toolbar: Page Navigation, Search, Font, Theme */}
          <div className="flex flex-wrap items-center justify-between border-b border-inherit bg-black/10 px-4 sm:px-6 py-2.5 gap-3 backdrop-blur">
            {/* Page Navigation Controls */}
            {pages.length > 1 && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevPage}
                  disabled={activeSectionIdx === 0 && activePageIdx === 0}
                  className="h-8 w-8 rounded-lg hover:bg-black/10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1 text-xs font-semibold px-1">
                  <span>Page {activePageIdx + 1}</span>
                  <span className="opacity-60">/ {pages.length}</span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextPage}
                  disabled={Boolean(doc && activeSectionIdx === doc.sections.length - 1 && activePageIdx === pages.length - 1)}
                  className="h-8 w-8 rounded-lg hover:bg-black/10"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* In-Note Search */}
            <div className="relative flex-1 min-w-[130px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-60" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search note..."
                className="h-8 pl-8 text-xs bg-transparent border-inherit focus-visible:ring-purple-500 rounded-lg"
              />
            </div>

            {/* Theme & Typography Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Font Size */}
              <div className="flex items-center border border-inherit rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
                  className="px-2.5 py-1 text-xs font-bold hover:bg-black/10 transition-colors"
                >
                  A-
                </button>
                <span className="px-1.5 text-[10px] opacity-70">{fontSize}px</span>
                <button
                  type="button"
                  onClick={() => setFontSize(prev => Math.min(28, prev + 2))}
                  className="px-2.5 py-1 text-xs font-bold hover:bg-black/10 transition-colors"
                >
                  A+
                </button>
              </div>

              {/* Theme Buttons */}
              <div className="flex items-center border border-inherit rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setTheme('default')}
                  className={`p-1.5 rounded-md text-xs transition-colors ${theme === 'default' ? 'bg-purple-600 text-white' : 'opacity-60 hover:opacity-100'}`}
                  title="Dark Theme"
                >
                  <Moon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('sepia')}
                  className={`p-1.5 rounded-md text-xs transition-colors ${theme === 'sepia' ? 'bg-[#c59b6d] text-white' : 'opacity-60 hover:opacity-100'}`}
                  title="Sepia Book Theme"
                >
                  <Coffee className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-1.5 rounded-md text-xs transition-colors ${theme === 'light' ? 'bg-zinc-200 text-zinc-900' : 'opacity-60 hover:opacity-100'}`}
                  title="Light Theme"
                >
                  <Sun className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Print Button */}
              <button
                type="button"
                onClick={() => window.print()}
                className="p-1.5 rounded-lg border border-inherit opacity-70 hover:opacity-100 hover:bg-black/10 transition-colors hidden sm:inline-flex"
                title="Print Note"
              >
                <Printer className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Document Content Viewport */}
          <div className="p-5 sm:p-10 min-h-[450px] overflow-y-auto max-h-[75vh]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <p className="text-sm opacity-70 font-medium">
                  {isOnePkg ? 'Extracting and rendering notebook package...' : 'Parsing OneNote section...'}
                </p>
              </div>
            ) : currentPage && currentPage.blocks.length > 0 ? (
              <div 
                className="max-w-3xl mx-auto space-y-3 font-normal"
                style={{ fontSize: `${fontSize}px` }}
              >
                {/* Page Title Header */}
                {currentPage.title && (
                  <div className="border-b border-purple-500/20 pb-3 mb-5">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-purple-400">
                      {currentSection?.name} &middot; Page {activePageIdx + 1}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold font-[var(--font-heading)]">
                      {formatInlineText(currentPage.title)}
                    </h2>
                  </div>
                )}

                {/* Render Normalized Page Blocks */}
                {currentPage.blocks.map((block, idx) => renderBlock(block, idx))}

                {/* Page Footer Navigation */}
                {pages.length > 1 && (
                  <div className="flex items-center justify-between border-t border-inherit pt-6 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={activeSectionIdx === 0 && activePageIdx === 0}
                      className="rounded-xl border-inherit text-xs"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous Page
                    </Button>
                    <span className="text-xs opacity-70">
                      Page {activePageIdx + 1} of {pages.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={Boolean(doc && activeSectionIdx === doc.sections.length - 1 && activePageIdx === pages.length - 1)}
                      className="rounded-xl border-inherit text-xs"
                    >
                      Next Page <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 max-w-md mx-auto">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-inner">
                  <BookOpen className="h-8 w-8" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-lg">OneNote Notebook Document</h4>
                  <p className="text-xs opacity-75 leading-relaxed">
                    This file contains specialized visual ink or drawings. Tap &ldquo;Open on Phone&rdquo; below to view full handwriting in the official OneNote app.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5 pt-2 w-full sm:w-auto">
                  <Button 
                    onClick={handleOpenMobileApp} 
                    className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs h-10 px-5 gap-2"
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Open in Phone OneNote</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleDownload} 
                    className="rounded-xl text-xs h-10 px-4 border-inherit"
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    <span>Download .{extension}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Tab 2: Mobile Guide */}
      {activeTab === 'guide' && (
        <div className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-semibold">How to Open on Your Device</span>
            </div>

            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveGuideTab('android')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeGuideTab === 'android'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" /> Android
              </button>
              <button
                type="button"
                onClick={() => setActiveGuideTab('ios')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeGuideTab === 'ios'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Apple className="h-3.5 w-3.5" /> iPhone / iPad
              </button>
              <button
                type="button"
                onClick={() => setActiveGuideTab('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeGuideTab === 'desktop'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Monitor className="h-3.5 w-3.5" /> PC / Mac
              </button>
            </div>
          </div>

          {activeGuideTab === 'android' && (
            <div className="grid sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 text-[10px]">1</span>
                  Install OneNote App
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Get <a href="https://play.google.com/store/apps/details?id=com.microsoft.office.onenote" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline font-medium">Microsoft OneNote</a> from the Google Play Store.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 text-[10px]">2</span>
                  Tap Open on Phone
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Tap <strong>&ldquo;Open on Phone&rdquo;</strong> to share directly into the OneNote app.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 text-[10px]">3</span>
                  Study Handdrawn Notes
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  OneNote will load all handwritten ink strokes, highlighters, and formulas.
                </p>
              </div>
            </div>
          )}

          {activeGuideTab === 'ios' && (
            <div className="grid sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 text-[10px]">1</span>
                  Install OneNote iOS
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Download <a href="https://apps.apple.com/app/microsoft-onenote/id410395246" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline font-medium">Microsoft OneNote</a> from the Apple App Store.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 text-[10px]">2</span>
                  Tap Open on Phone
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Tap <strong>&ldquo;Open on Phone&rdquo;</strong> in Safari to open the iOS share sheet.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 text-[10px]">3</span>
                  Open in OneNote
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Select <strong>&ldquo;OneNote&rdquo;</strong> to import and view drawings and handwritten notes.
                </p>
              </div>
            </div>
          )}

          {activeGuideTab === 'desktop' && (
            <div className="grid sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 text-[10px]">1</span>
                  Desktop OneNote
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Works with OneNote for Windows 10/11 or Microsoft 365 on macOS.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 text-[10px]">2</span>
                  Download File
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Click <strong>&ldquo;Download .{extension}&rdquo;</strong> to save the notebook locally.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 text-[10px]">3</span>
                  Double-Click
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Double-click the downloaded file to unpack and browse in your desktop OneNote.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
