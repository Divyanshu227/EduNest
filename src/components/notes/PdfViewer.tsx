"use client";

import { useState, useEffect } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { ExternalLink, FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import react-pdf-viewer styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface PdfViewerProps {
  noteId: string;
  url: string;
  initialPage?: number;
}

export function PdfViewer({ noteId, url, initialPage = 1 }: PdfViewerProps) {
  const [loadError, setLoadError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>('');
  const [isLoadingBlob, setIsLoadingBlob] = useState(true);
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  useEffect(() => {
    if (!url) return;
    
    let active = true;
    let objectUrl = '';

    async function loadPdfBlob() {
      try {
        setIsLoadingBlob(true);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP status ${response.status}`);
        const blob = await response.blob();
        
        // Force the correct MIME type so the viewer can read it as a PDF
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        objectUrl = window.URL.createObjectURL(pdfBlob);
        
        if (active) {
          setPdfBlobUrl(objectUrl);
          setLoadError(false);
        }
      } catch (error) {
        console.error('Failed to load PDF blob, falling back to direct URL:', error);
        if (active) {
          // If fetch fails (e.g. CORS), fallback to direct URL
          setPdfBlobUrl(url);
        }
      } finally {
        if (active) {
          setIsLoadingBlob(false);
        }
      }
    }

    loadPdfBlob();

    return () => {
      active = false;
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [url]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!url) return;
    
    try {
      setIsDownloading(true);
      
      let downloadUrl = pdfBlobUrl;
      if (!downloadUrl) {
        const response = await fetch(url);
        const blob = await response.blob();
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        downloadUrl = window.URL.createObjectURL(pdfBlob);
      }
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `EduNest_Notes_${noteId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (!pdfBlobUrl && downloadUrl) {
        setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
      }
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePageChange = (page: number) => {
    // Progress tracking removed
  };

  if (isLoadingBlob) {
    return (
      <div className="flex h-[600px] sm:h-[800px] flex-col items-center justify-center rounded-3xl border border-border/60 bg-card p-6 text-center space-y-4 shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading PDF reader...</p>
      </div>
    );
  }

  if (loadError || !pdfBlobUrl) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-3xl border border-border/60 bg-card p-6 text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <FileText className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Unable to render PDF inline</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            This might be due to security sandbox restrictions or resource accessibility. You can view it directly in your browser.
          </p>
        </div>
        <Button onClick={handleDownload} disabled={isDownloading}>
          <span className="flex items-center gap-2">
            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Download PDF'} 
            {!isDownloading && <Download className="h-4 w-4" />}
          </span>
        </Button>
      </div>
    );
  }

  // The worker version must match the version in package.json (pdfjs-dist is 3.11.174)
  const workerUrl = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

  return (
    <div className="h-[600px] sm:h-[800px] overflow-hidden rounded-3xl border border-border/60 bg-card shadow-lg flex flex-col">
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-6 py-3">
        <span className="text-sm font-medium">EduNest PDF Reader</span>
        <Button variant="outline" size="sm" onClick={handleDownload} disabled={isDownloading}>
          <span className="flex items-center gap-1.5 text-xs">
            {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Download PDF'} 
            {!isDownloading && <Download className="h-3.5 w-3.5" />}
          </span>
        </Button>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <Worker workerUrl={workerUrl}>
          <Viewer
            fileUrl={pdfBlobUrl}
            plugins={[defaultLayoutPluginInstance]}
            initialPage={initialPage - 1} // 0-indexed initial page
            onPageChange={(e) => handlePageChange(e.currentPage)}
          />
        </Worker>
      </div>
    </div>
  );
}
