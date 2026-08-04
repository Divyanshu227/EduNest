"use client";

import React from "react";
import { FileText, Eye, Download, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DownloadLink } from "@/components/ui/download-link";

interface AttachmentViewerProps {
  attachments: { name: string; url: string; type?: string }[];
}

export function AttachmentViewer({ attachments }: AttachmentViewerProps) {
  if (!attachments || !Array.isArray(attachments) || attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((att, idx) => {
        const isPdf = Boolean(att.url.match(/\.pdf$/i) || att.name?.toLowerCase().endsWith('.pdf'));
        const isImage = !isPdf && Boolean(att.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || att.url.includes("image"));
        
        let viewerUrl = att.url;
        if (isPdf) {
          viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(att.url)}&embedded=true`;
        }
        return (
          <Dialog key={idx}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs font-semibold rounded-xl px-4 py-2 hover:bg-muted bg-background/50 border-border/60">
                {isImage ? <ImageIcon className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />}
                <span className="truncate max-w-[150px]">{att.name || 'Attachment'}</span>
                <Eye className="h-3 w-3 ml-1 text-muted-foreground" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden sm:rounded-2xl">
              <DialogHeader className="p-4 border-b border-border/40 bg-card">
                <div className="flex items-center justify-between mr-8">
                  <DialogTitle className="truncate pr-4">{att.name || 'Attachment'}</DialogTitle>
                  <DownloadLink 
                    url={att.url} 
                    filename={att.name || 'Attachment'} 
                    className="flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    <Download className="h-4 w-4" /> Download
                  </DownloadLink>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-auto bg-muted/10 relative">
                {isImage ? (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={att.url} alt={att.name} className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
                  </div>
                ) : (
                  <iframe src={viewerUrl} className="w-full h-full border-0 bg-white" title={att.name} />
                )}
              </div>
            </DialogContent>
          </Dialog>
        );
      })}
    </div>
  );
}
