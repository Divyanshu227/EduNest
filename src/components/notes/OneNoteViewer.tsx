"use client";

import { useState } from 'react';
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
  Share2
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'ios' | 'android' | 'desktop'>('android');
  const [previewMode, setPreviewMode] = useState<'office' | 'google'>('office');
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const cleanFileName = fileName || `EduNest_Notes_${noteId}.one`;
  const oneNoteFileName = cleanFileName.toLowerCase().endsWith('.one') 
    ? cleanFileName 
    : `${cleanFileName.replace(/\.[^/.]+$/, '')}.one`;

  // Deep links & Online viewers
  const officeOnlineUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`;
  const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  const msOneNoteProtocolUrl = `ms-onenote:ofe|u|${url}`;

  const handleDownload = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!url) return;

    try {
      setIsDownloading(true);
      const response = await fetch(url);
      const originalBlob = await response.blob();
      // Ensure OneNote binary MIME type
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
      // Fallback direct link
      window.open(url, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenMobileApp = () => {
    // Attempt launching Microsoft OneNote app via protocol
    window.location.href = msOneNoteProtocolUrl;
    // Fallback timer: download or open direct file if protocol handler isn't registered
    setTimeout(() => {
      handleDownload();
    }, 1200);
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

  return (
    <div className="space-y-6">
      {/* Hero / Action Card */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 via-background to-purple-900/20 p-6 sm:p-8 shadow-xl backdrop-blur">
        <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 h-56 w-56 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-semibold gap-1.5 px-3 py-1">
                <BookOpen className="h-3.5 w-3.5" /> Microsoft OneNote
              </Badge>
              <Badge variant="outline" className="border-purple-500/40 text-purple-300">
                .one section format
              </Badge>
              {subjectName && chapterName && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {subjectName} &middot; {chapterName}
                </span>
              )}
            </div>
            <h3 className="font-[var(--font-heading)] text-2xl sm:text-3xl font-bold tracking-tight">
              {title || 'Class Note Section'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xl">
              This note is saved in Microsoft OneNote format with handwritten diagrams, rich text, and embedded annotations.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Button
              onClick={handleOpenMobileApp}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-2xl shadow-lg shadow-purple-600/20 gap-2 h-12 px-6"
            >
              <Smartphone className="h-5 w-5" />
              <span>Open in OneNote App</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={isDownloading}
              className="rounded-2xl border-purple-500/30 hover:bg-purple-500/10 h-12 px-5 gap-2"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
              ) : (
                <Download className="h-4 w-4 text-purple-400" />
              )}
              <span>{isDownloading ? 'Downloading...' : 'Download .one'}</span>
            </Button>
          </div>
        </div>

        {/* Secondary Links Bar */}
        <div className="mt-6 flex flex-wrap items-center gap-2 sm:gap-4 border-t border-purple-500/20 pt-4 text-xs">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-purple-500/10 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Link Copied!' : 'Copy Direct Link'}</span>
          </button>

          <a
            href={officeOnlineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-muted-foreground hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open in Microsoft 365 Web</span>
          </a>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-muted-foreground hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Raw File URL</span>
          </a>
        </div>
      </div>

      {/* Mobile & Desktop How-to Guide Tabs */}
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
              <Smartphone className="h-3.5 w-3.5" /> Android Phone
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

        {/* Tab Content */}
        {activeGuideTab === 'android' && (
          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 text-[10px]">1</span>
                Get OneNote App
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Ensure free <a href="https://play.google.com/store/apps/details?id=com.microsoft.office.onenote" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline font-medium">Microsoft OneNote</a> is installed from Google Play Store.
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 text-[10px]">2</span>
                Tap Download or Open
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Tap <strong>&ldquo;Open in OneNote App&rdquo;</strong> or <strong>&ldquo;Download .one&rdquo;</strong> above.
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 text-[10px]">3</span>
                View Notes
              </div>
              <p className="text-muted-foreground leading-relaxed">
                OneNote will load the section, drawings, handwriting, and class highlights seamlessly.
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
                Download <a href="https://apps.apple.com/app/microsoft-onenote/id410395246" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline font-medium">Microsoft OneNote</a> from Apple App Store on your iPhone.
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 text-[10px]">2</span>
                Download Section
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Tap <strong>&ldquo;Download .one&rdquo;</strong> in Safari. Tap the Downloads icon in Safari toolbar.
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 text-[10px]">3</span>
                Share to OneNote
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Tap Share sheet &rarr; Select <strong>&ldquo;OneNote&rdquo;</strong> to import and open instantly.
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
                Click <strong>&ldquo;Download .one&rdquo;</strong> to save the notebook section locally.
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

      {/* Embedded Cloud Previewer Frame */}
      <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-lg flex flex-col h-[550px] sm:h-[700px]">
        <div className="flex flex-wrap items-center justify-between border-b border-border/60 bg-muted/40 px-4 sm:px-6 py-3 gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-purple-500" />
            <span className="text-xs sm:text-sm font-semibold">Web Document Preview</span>
            <Badge variant="outline" className="text-[10px] hidden sm:inline-block">
              {previewMode === 'office' ? 'Microsoft Office Viewer' : 'Google Docs Viewer'}
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
              className="text-xs h-8 px-2.5 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              <span>Switch to {previewMode === 'office' ? 'Google Viewer' : 'Office Viewer'}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
              className="text-xs h-8 px-3 rounded-lg"
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              <span>Download</span>
            </Button>
          </div>
        </div>

        <div className="flex-1 relative bg-zinc-950">
          {!iframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur z-10 space-y-3 p-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              <p className="text-xs sm:text-sm text-muted-foreground">
                Loading web preview... If preview doesn&apos;t load, tap &ldquo;Open in OneNote App&rdquo; above.
              </p>
            </div>
          )}

          <iframe
            src={previewMode === 'office' ? officeOnlineUrl : googleDocsViewerUrl}
            title="Microsoft OneNote Preview"
            className="h-full w-full border-0"
            onLoad={() => setIframeLoaded(true)}
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
