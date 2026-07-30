"use client";

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface NoteImage {
  url: string;
  publicId: string;
  name?: string;
}

interface NotebookViewerProps {
  noteId: string;
  images: NoteImage[];
  initialPage?: number;
}

export function NotebookViewer({ noteId, images = [], initialPage = 1 }: NotebookViewerProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const touchStart = useRef<number | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const totalPages = images.length;
  const currentImage = images[currentPage - 1];

  // Save reading progress on page change
  useEffect(() => {
    if (!noteId || currentPage < 1) return;
    
    const saveProgress = async () => {
      try {
        await fetch('/api/reading-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            noteId,
            assetType: 'IMAGE',
            page: currentPage
          })
        });
      } catch (error) {
        console.error('Error saving reading progress:', error);
      }
    };

    const timer = setTimeout(saveProgress, 1000); // Debounce database saves
    return () => clearTimeout(timer);
  }, [noteId, currentPage]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setZoom(1); // Reset zoom
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setZoom(1); // Reset zoom
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevPage();
      if (e.key === 'ArrowRight') handleNextPage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages]);

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart.current - touchEnd;

    // Detect swipe (threshold of 50px)
    if (diff > 50) {
      handleNextPage();
    } else if (diff < -50) {
      handlePrevPage();
    }
    touchStart.current = null;
  };

  const handleDoubleTap = () => {
    setZoom(prev => prev === 1 ? 2 : 1);
  };

  const toggleFullscreen = () => {
    if (!viewerRef.current) return;

    if (!document.fullscreenElement) {
      viewerRef.current.requestFullscreen().then(() => {
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

  if (!totalPages) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-border/60 bg-card p-6 text-center">
        <p className="text-muted-foreground">No notebook images available for this note.</p>
      </div>
    );
  }

  return (
    <div 
      ref={viewerRef}
      className={`relative flex flex-col overflow-hidden bg-zinc-950 border border-zinc-800 transition-all ${
        isFullscreen ? 'h-screen w-screen p-4' : 'h-[500px] sm:h-[650px] rounded-3xl'
      }`}
    >
      {/* Top Bar / Controls */}
      <div className="z-10 flex items-center justify-between bg-zinc-900/90 px-4 py-3 backdrop-blur border-b border-zinc-800 text-zinc-100">
        <div className="text-sm font-semibold tracking-wider">
          Page {currentPage} of {totalPages}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
            onClick={() => setZoom(prev => Math.max(1, prev - 0.25))}
            disabled={zoom <= 1}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-zinc-400 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
            onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
            disabled={zoom >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
            onClick={() => setZoom(1)}
            disabled={zoom === 1}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
            onClick={toggleFullscreen}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Image Slider Wrapper */}
      <div 
        className="relative flex-1 flex items-center justify-center overflow-auto p-4 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="relative flex h-full w-full items-center justify-center select-none"
            onDoubleClick={handleDoubleTap}
          >
            <motion.img
              src={currentImage?.url}
              alt={currentImage?.name || `Page ${currentPage}`}
              className="max-h-full max-w-full object-contain pointer-events-none shadow-2xl rounded-lg"
              style={{ scale: zoom }}
              animate={{ scale: zoom }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Left Arrow */}
        {currentPage > 1 && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full shadow-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-white border-none"
            onClick={handlePrevPage}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}

        {/* Right Arrow */}
        {currentPage < totalPages && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full shadow-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-white border-none"
            onClick={handleNextPage}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Bottom Page Indicator Line */}
      <div className="h-1.5 w-full bg-zinc-900">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(currentPage / totalPages) * 100}%` }}
        />
      </div>
    </div>
  );
}
