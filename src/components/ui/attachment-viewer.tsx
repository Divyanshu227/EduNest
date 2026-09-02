"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  FileText, 
  Eye, 
  Download, 
  Image as ImageIcon, 
  Video, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw,
  Maximize2,
  X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DownloadLink } from "@/components/ui/download-link";
import { motion, AnimatePresence } from "framer-motion";

interface AttachmentItem {
  name?: string;
  url: string;
  type?: string;
  publicId?: string;
}

interface AttachmentViewerProps {
  attachments: (AttachmentItem | string)[];
  className?: string;
}

export function AttachmentViewer({ attachments, className = "" }: AttachmentViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (!attachments || !Array.isArray(attachments) || attachments.length === 0) return null;

  // Normalize attachments array
  const normalizedList = attachments.map((att, idx) => {
    if (typeof att === "string") {
      return { url: att, name: `Attachment ${idx + 1}` };
    }
    return {
      url: att?.url || "",
      name: att?.name || `Attachment ${idx + 1}`,
      type: att?.type,
      publicId: att?.publicId
    };
  }).filter(item => Boolean(item.url));

  if (normalizedList.length === 0) return null;

  const totalCount = normalizedList.length;
  const currentItem = normalizedList[currentIndex] || normalizedList[0];
  const currentUrl = currentItem?.url || "";
  const currentName = currentItem?.name || `Attachment ${currentIndex + 1}`;

  const isPdf = Boolean(
    currentUrl.match(/\.pdf(\?.*)?$/i) || 
    currentName.toLowerCase().endsWith(".pdf") || 
    currentUrl.toLowerCase().includes(".pdf")
  );
  const isVideo = !isPdf && Boolean(
    currentUrl.match(/\.(mp4|webm|ogg|mov)$/i) || 
    currentUrl.includes("/video/upload/")
  );
  const isImage = !isPdf && !isVideo;

  let viewerUrl = currentUrl;
  if (isPdf) {
    if (currentUrl.includes("/raw/upload/")) {
      viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(currentUrl)}&embedded=true`;
    } else {
      viewerUrl = currentUrl;
    }
  }

  const handlePrev = useCallback(() => {
    if (totalCount <= 1) return;
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : totalCount - 1));
    setZoom(1);
    setRotation(0);
  }, [totalCount]);

  const handleNext = useCallback(() => {
    if (totalCount <= 1) return;
    setCurrentIndex(prev => (prev < totalCount - 1 ? prev + 1 : 0));
    setZoom(1);
    setRotation(0);
  }, [totalCount]);

  const handleOpen = (index: number) => {
    setCurrentIndex(index);
    setZoom(1);
    setRotation(0);
    setIsOpen(true);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(3, prev + 0.25));
  const handleZoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.25));
  const handleRotateRight = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handlePrev, handleNext]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  return (
    <>
      {/* List of attachment trigger buttons */}
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {normalizedList.map((item, idx) => {
          const itemUrl = item.url;
          const itemName = item.name;
          const itemIsPdf = Boolean(itemUrl.match(/\.pdf(\?.*)?$/i) || itemName.toLowerCase().endsWith(".pdf") || itemUrl.toLowerCase().includes(".pdf"));
          const itemIsVideo = !itemIsPdf && Boolean(itemUrl.match(/\.(mp4|webm|ogg|mov)$/i) || itemUrl.includes("/video/upload/"));
          const itemIsImage = !itemIsPdf && !itemIsVideo;

          return (
            <Button
              key={idx}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpen(idx)}
              className="flex items-center gap-1.5 text-xs font-semibold rounded-xl px-3.5 py-2 hover:bg-muted bg-background/60 border-border/60 transition-all hover:border-primary/50 shadow-sm"
            >
              {itemIsVideo ? (
                <Video className="h-4 w-4 text-primary shrink-0" />
              ) : itemIsImage ? (
                <ImageIcon className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-primary shrink-0" />
              )}
              <span className="truncate max-w-[150px]">{itemName}</span>
              <Eye className="h-3 w-3 ml-1 text-muted-foreground shrink-0" />
            </Button>
          );
        })}
      </div>

      {/* Unified Multi-Item Lightbox Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl w-[96vw] h-[92vh] flex flex-col p-0 overflow-hidden sm:rounded-3xl border-border/60 bg-card shadow-2xl">
          {/* Dialog Header */}
          <DialogHeader className="px-4 py-3 border-b border-border/40 bg-card/95 backdrop-blur shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mr-6">
              <div className="flex items-center gap-2 min-w-0">
                {isVideo ? (
                  <Video className="h-4 w-4 text-primary shrink-0" />
                ) : isImage ? (
                  <ImageIcon className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                )}
                <DialogTitle className="truncate text-sm sm:text-base font-bold font-[var(--font-heading)]">
                  {currentName}
                </DialogTitle>
                {totalCount > 1 && (
                  <Badge variant="secondary" className="text-[11px] font-semibold px-2 py-0.5 rounded-lg shrink-0">
                    {currentIndex + 1} / {totalCount}
                  </Badge>
                )}
              </div>

              {/* Controls Toolbar */}
              <div className="flex items-center gap-1.5">
                {/* Image Zoom / Rotate Controls */}
                {isImage && (
                  <div className="flex items-center gap-1 bg-muted/40 border border-border/50 rounded-xl p-0.5 mr-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleZoomOut}
                      disabled={zoom <= 0.5}
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-[10px] text-muted-foreground font-medium px-1 min-w-[36px] text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleZoomIn}
                      disabled={zoom >= 3}
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                      title="Zoom In"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRotateRight}
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                      title="Rotate Image 90°"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                    </Button>
                    {(zoom !== 1 || rotation !== 0) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleReset}
                        className="h-7 w-7 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                        title="Reset View"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}

                {/* Left and Right Header Nav Buttons */}
                {totalCount > 1 && (
                  <div className="flex items-center gap-1 mr-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePrev}
                      className="h-8 px-2.5 rounded-xl text-xs flex items-center gap-1 font-semibold hover:bg-muted"
                      title="Previous (Left Arrow)"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Prev</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleNext}
                      className="h-8 px-2.5 rounded-xl text-xs flex items-center gap-1 font-semibold hover:bg-muted"
                      title="Next (Right Arrow)"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Download Button */}
                <DownloadLink
                  url={currentUrl}
                  filename={currentName}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-xl hover:bg-primary/90 transition-colors shadow-sm h-8"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </DownloadLink>
              </div>
            </div>
          </DialogHeader>

          {/* Main Viewport */}
          <div 
            className="flex-1 relative overflow-hidden bg-black/95 flex items-center justify-center select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {isVideo ? (
              <div className="w-full h-full flex items-center justify-center p-4">
                <video src={currentUrl} controls className="max-w-full max-h-full rounded-xl shadow-2xl" />
              </div>
            ) : isImage ? (
              <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${currentIndex}-${currentUrl}`}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-center w-full h-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentUrl}
                      alt={currentName}
                      className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl transition-transform duration-200"
                      style={{
                        transform: `scale(${zoom}) rotate(${rotation}deg)`
                      }}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            ) : (
              <iframe src={viewerUrl} className="w-full h-full border-0 bg-white" title={currentName} />
            )}

            {/* Prominent Floating Left & Right Image Buttons */}
            {totalCount > 1 && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={handlePrev}
                  className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 h-11 w-11 sm:h-13 sm:w-13 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white shadow-2xl border border-zinc-700/60 backdrop-blur transition-transform active:scale-95 z-20"
                  title="Previous image / file (Left Arrow)"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={handleNext}
                  className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 h-11 w-11 sm:h-13 sm:w-13 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white shadow-2xl border border-zinc-700/60 backdrop-blur transition-transform active:scale-95 z-20"
                  title="Next image / file (Right Arrow)"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>

          {/* Bottom Thumbnail Strip & Indicator */}
          {totalCount > 1 && (
            <div className="border-t border-border/40 bg-card/95 backdrop-blur px-4 py-2.5 shrink-0 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                className="text-xs h-8 px-2 rounded-xl text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>

              {/* Thumbnails or page dots */}
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-lg py-1 px-2">
                {normalizedList.map((item, idx) => {
                  const isSelected = idx === currentIndex;
                  const itemIsPdf = Boolean(item.url.match(/\.pdf(\?.*)?$/i) || item.name?.toLowerCase().endsWith(".pdf"));
                  const itemIsVideo = !itemIsPdf && Boolean(item.url.match(/\.(mp4|webm|ogg|mov)$/i) || item.url.includes("/video/upload/"));
                  const itemIsImg = !itemIsPdf && !itemIsVideo;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleOpen(idx)}
                      className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/40"
                          : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40"
                      }`}
                      title={item.name}
                    >
                      {itemIsImg ? (
                        <div
                          className="h-4 w-4 rounded bg-cover bg-center shrink-0 border border-white/20"
                          style={{ backgroundImage: `url(${item.url})` }}
                        />
                      ) : itemIsVideo ? (
                        <Video className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="truncate max-w-[80px] sm:max-w-[120px] text-[11px]">{idx + 1}. {item.name}</span>
                    </button>
                  );
                })}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleNext}
                className="text-xs h-8 px-2 rounded-xl text-muted-foreground hover:text-foreground"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

