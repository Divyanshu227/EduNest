"use client";

import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DownloadLinkProps {
  url: string;
  filename: string;
  className?: string;
  children?: React.ReactNode;
}

export function DownloadLink({ url, filename, className, children }: DownloadLinkProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDownloading || !url) return;
    
    try {
      setIsDownloading(true);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch file");
      
      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      
      let safeFilename = filename;
      if (!safeFilename.toLowerCase().match(/\.[a-z0-9]+$/i)) {
        safeFilename += ".pdf"; // Default to pdf for raw files if no extension
      }

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = safeFilename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 100);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback: just open the url
      window.open(url, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <a 
      href={url}
      onClick={handleDownload}
      className={cn("cursor-pointer", className, isDownloading && "opacity-70 pointer-events-none")}
    >
      {children}
      {isDownloading ? <Loader2 className="h-3 w-3 animate-spin ml-1" /> : null}
    </a>
  );
}

