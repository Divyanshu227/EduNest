"use client";

import { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Download, 
  ExternalLink, 
  Smartphone, 
  Monitor, 
  Apple, 
  Copy, 
  Check, 
  Loader2, 
  RefreshCw, 
  Sparkles,
  Maximize2,
  Minimize2,
  Share2,
  Eye,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface OneNoteViewerProps {
  noteId: string;
  url: string;
  fileName?: string;
  title?: string;
  subjectName?: string;
  chapterName?: string;
}

export function OneNoteViewer({
  noteId,
  url,
  fileName,
  title,
  subjectName,
  chapterName
}: OneNoteViewerProps) {
  const [activeView, setActiveView] = useState<'visual' | 'guide'>('visual');
  const [previewMode, setPreviewMode] = useState<'office' | 'google'>('office');
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isOpeningMobile, setIsOpeningMobile] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'android' | 'ios' | 'desktop'>('android');

  const containerRef = useRef<HTMLDivElement>(null);

  const cleanFileName = fileName || `EduNest_Notes_${noteId}.one`;
  const oneNoteFileName = cleanFileName.toLowerCase().endsWith('.one') 
    ? cleanFileName 
    : `${cleanFileName.replace(/\.[^/.]+$/, '')}.one`;

  // Microsoft Office Online and Google Docs preview URLs
  const officeOnlineUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`;
  const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  const handleOpenMobileApp = async () => {
    setIsOpeningMobile(true);
    try {
      const response = await fetch(url);
      const originalBlob = await response.blob();
      const file = new File([originalBlob], oneNoteFileName, { type: 'application/onenote' });

      // Use native Web Share API on mobile phones (iOS & Android)
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title || 'OneNote Study Material',
          text: `Open ${title || 'OneNote Note'} in Microsoft OneNote`
        });
        return;
      }

      // Direct download with application/onenote MIME type
      const objectUrl = window.URL.createObjectURL(new Blob([originalBlob], { type: 'application/onenote' }));
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = oneNoteFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 2000);
    } catch (error) {
      console.error('Mobile open failed:', error);
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
      const blob = new Blob([originalBlob], { type: 'application/onenote' });

      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = oneNoteFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1500);
    } catch (error) {
      console.error('Download failed:', error);
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

  return (
    <div ref={containerRef} className={`space-y-5 ${isFullscreen ? 'fixed inset-0 z-50 bg-background overflow-y-auto p-4 sm:p-6' : ''}`}>
      {/* Top Banner / Mobile Launch Bar */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 via-background to-purple-900/20 p-5 sm:p-6 shadow-xl backdrop-blur">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-semibold gap-1.5 px-3 py-1">
                <BookOpen className="h-3.5 w-3.5" /> Microsoft OneNote
              </Badge>
              <Badge variant="outline" className="border-purple-500/40 text-purple-300">
                Visual Notebook
              </Badge>
              {subjectName && chapterName && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {subjectName} &middot; {chapterName}
                </span>
              )}
            </div>
            <h3 className="font-[var(--font-heading)] text-xl sm:text-2xl font-bold tracking-tight">
              {title || 'Class Note Section'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-xl">
              Contains handwritten pen notes, diagrams, and highlighted text. View directly in the cloud viewer below or tap &ldquo;Open on Phone&rdquo; to launch in the OneNote app.
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
              <span>Download .one</span>
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

        {/* View Switcher & Secondary Links */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-purple-500/20 pt-3">
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveView('visual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'visual'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Eye className="h-3.5 w-3.5" /> Visual Canvas
            </button>
            <button
              type="button"
              onClick={() => setActiveView('guide')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'guide'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" /> Mobile Guide
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <a
              href={officeOnlineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-purple-400 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Open in New Tab</span>
            </a>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View: Full Visual Canvas */}
      {activeView === 'visual' && (
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-xl flex flex-col h-[550px] sm:h-[750px]">
          {/* Viewer Toolbar */}
          <div className="flex flex-wrap items-center justify-between border-b border-border/60 bg-muted/40 px-4 sm:px-6 py-2.5 gap-2 backdrop-blur">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-500" />
              <span className="text-xs sm:text-sm font-semibold">Visual OneNote Viewer</span>
              <Badge variant="outline" className="text-[10px] hidden sm:inline-block border-border/60">
                {previewMode === 'office' ? 'Microsoft Office Web Engine' : 'Google Docs Web Engine'}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIframeLoaded(false);
                  setPreviewMode(prev => prev === 'office' ? 'google' : 'office');
                }}
                className="text-xs h-8 px-2.5 rounded-xl text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                <span>Switch to {previewMode === 'office' ? 'Google Engine' : 'Office Engine'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
                className="text-xs h-8 px-3 rounded-xl"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                <span>Save</span>
              </Button>
            </div>
          </div>

          {/* Iframe Viewport */}
          <div className="flex-1 relative bg-zinc-950">
            {!iframeLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur z-10 space-y-3 p-6 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
                  Rendering handwritten pages, ink, and diagrams...
                </p>
              </div>
            )}

            <iframe
              src={previewMode === 'office' ? officeOnlineUrl : googleDocsViewerUrl}
              title="Microsoft OneNote Visual Viewer"
              className="h-full w-full border-0"
              onLoad={() => setIframeLoaded(true)}
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Guide View */}
      {activeView === 'guide' && (
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
                  Get OneNote App
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Ensure <a href="https://play.google.com/store/apps/details?id=com.microsoft.office.onenote" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline font-medium">Microsoft OneNote</a> is installed on your Android device.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 text-[10px]">2</span>
                  Tap Open on Phone
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Tap <strong>&ldquo;Open on Phone&rdquo;</strong> to launch the native OneNote app directly.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 text-[10px]">3</span>
                  Full Ink & Diagrams
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  OneNote will load all handwritten pen strokes, highlighters, and diagrams with 100% native clarity.
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
                  Download <a href="https://apps.apple.com/app/microsoft-onenote/id410395246" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline font-medium">Microsoft OneNote</a> from the Apple App Store on your iPhone.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 text-[10px]">2</span>
                  Tap Open on Phone
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Tap <strong>&ldquo;Open on Phone&rdquo;</strong> in Safari to open the iOS share dialog.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 text-[10px]">3</span>
                  Open in OneNote
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Select <strong>&ldquo;OneNote&rdquo;</strong> to view full vector handwriting, drawing notes, and illustrations.
                </p>
              </div>
            </div>
          )}

          {activeGuideTab === 'desktop' && (
            <div className="grid sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 text-[10px]">1</span>
                  OneNote App
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Open with preinstalled OneNote for Windows 10/11 or Microsoft 365 on macOS.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 text-[10px]">2</span>
                  Click Download
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Click <strong>&ldquo;Download .one&rdquo;</strong> to save the notebook section file.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 text-[10px]">3</span>
                  Double-Click to Read
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Double-click the downloaded <code>.one</code> file to open it in your desktop notebook.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
