"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw, 
  Maximize2, 
  Minimize2,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const touchStart = useRef<number | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const totalPages = images.length;
  const currentImage = images[currentPage - 1];

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      setZoom(1);
      setRotation(0);
    } else if (totalPages > 1) {
      setCurrentPage(totalPages);
      setZoom(1);
      setRotation(0);
    }
  }, [currentPage, totalPages]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      setZoom(1);
      setRotation(0);
    } else if (totalPages > 1) {
      setCurrentPage(1);
      setZoom(1);
      setRotation(0);
    }
  }, [currentPage, totalPages]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevPage();
      if (e.key === 'ArrowRight') handleNextPage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevPage, handleNextPage]);

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart.current - touchEnd;

    if (diff > 50) {
      handleNextPage();
    } else if (diff < -50) {
      handlePrevPage();
    }
    touchStart.current = null;
  };

  const handleDoubleTap = () => {
    setZoom(prev => (prev === 1 ? 2 : 1));
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
        isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen p-4' : 'h-[520px] sm:h-[680px] rounded-3xl shadow-xl'
      }`}
    >
      {/* Top Bar / Controls */}
      <div className="z-10 flex flex-wrap items-center justify-between bg-zinc-900/95 px-4 py-3 backdrop-blur border-b border-zinc-800 text-zinc-100 gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-zinc-800 text-zinc-200 text-xs px-2.5 py-1">
            Page {currentPage} of {totalPages}
          </Badge>
          {currentImage?.name && (
            <span className="text-xs text-zinc-400 truncate max-w-[160px] sm:max-w-xs hidden sm:inline">
              {currentImage.name}
            </span>
          )}
        </div>
        
        {/* Navigation & Zoom Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Top Left/Right Buttons */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 mr-1 sm:mr-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2.5 text-xs bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border-zinc-700 rounded-xl flex items-center gap-1 font-semibold"
                onClick={handlePrevPage}
                title="Previous Page (Left Arrow)"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Prev</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2.5 text-xs bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border-zinc-700 rounded-xl flex items-center gap-1 font-semibold"
                onClick={handleNextPage}
                title="Next Page (Right Arrow)"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center border border-zinc-800 bg-zinc-900 rounded-xl overflow-hidden p-0.5">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
              disabled={zoom <= 0.5}
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[10px] text-zinc-400 min-w-[36px] text-center font-medium">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
              onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
              disabled={zoom >= 3}
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Rotate Button */}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl border border-zinc-800"
            onClick={() => setRotation(prev => (prev + 90) % 360)}
            title="Rotate Page 90°"
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          {(zoom !== 1 || rotation !== 0) && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl border border-zinc-800"
              onClick={() => {
                setZoom(1);
                setRotation(0);
              }}
              title="Reset Zoom & Rotation"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl border border-zinc-800"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main Image Slider Viewport */}
      <div 
        className="relative flex-1 flex items-center justify-center overflow-auto p-4 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="relative flex h-full w-full items-center justify-center select-none"
            onDoubleClick={handleDoubleTap}
          >
            <motion.img
              src={currentImage?.url}
              alt={currentImage?.name || `Page ${currentPage}`}
              className="max-h-full max-w-full object-contain pointer-events-none shadow-2xl rounded-xl transition-transform duration-200"
              style={{ 
                transform: `scale(${zoom}) rotate(${rotation}deg)` 
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Prominent Left Arrow Button */}
        {totalPages > 1 && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 h-11 w-11 sm:h-13 sm:w-13 rounded-full shadow-2xl border border-zinc-700 bg-zinc-900/85 hover:bg-zinc-800 text-white backdrop-blur transition-transform active:scale-95 z-20"
            onClick={handlePrevPage}
            title="Previous Page (Left Arrow)"
            aria-label="Previous Page"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}

        {/* Prominent Right Arrow Button */}
        {totalPages > 1 && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 h-11 w-11 sm:h-13 sm:w-13 rounded-full shadow-2xl border border-zinc-700 bg-zinc-900/85 hover:bg-zinc-800 text-white backdrop-blur transition-transform active:scale-95 z-20"
            onClick={handleNextPage}
            title="Next Page (Right Arrow)"
            aria-label="Next Page"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Bottom Thumbnail Strip & Indicator */}
      {totalPages > 1 && (
        <div className="border-t border-zinc-800 bg-zinc-900/90 px-4 py-2 shrink-0 flex items-center justify-between gap-2 backdrop-blur">
          <Button
            size="sm"
            variant="ghost"
            onClick={handlePrevPage}
            className="h-8 px-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Prev
          </Button>

          {/* Quick Page Jump Thumbnails */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-md py-0.5 px-2">
            {images.map((img, idx) => {
              const isSelected = idx === currentPage - 1;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCurrentPage(idx + 1);
                    setZoom(1);
                    setRotation(0);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/40'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50'
                  }`}
                  title={`Page ${idx + 1}`}
                >
                  <div
                    className="h-3.5 w-3.5 rounded bg-cover bg-center shrink-0 border border-white/20"
                    style={{ backgroundImage: `url(${img.url})` }}
                  />
                  <span>Page {idx + 1}</span>
                </button>
              );
            })}
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleNextPage}
            className="h-8 px-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

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

