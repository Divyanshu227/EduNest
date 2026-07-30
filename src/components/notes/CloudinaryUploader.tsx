"use client";

import { useState } from 'react';
import { Upload, X, ArrowUp, ArrowDown, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UploadedFile {
  url: string;
  publicId: string;
  name?: string;
}

interface CloudinaryUploaderProps {
  value: UploadedFile[];
  onChange: (value: UploadedFile[]) => void;
  folder?: string;
  accept?: string;
  multiple?: boolean;
}

export function CloudinaryUploader({
  value = [],
  onChange,
  folder = 'edunest',
  accept = 'image/*',
  multiple = true
}: CloudinaryUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      throw new Error('Upload failed');
    }

    return res.json();
  };

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const data = await uploadFile(file);
        return {
          url: data.url,
          publicId: data.publicId,
          name: file.name
        };
      });

      const newUploadedFiles = await Promise.all(uploadPromises);
      if (multiple) {
        onChange([...value, ...newUploadedFiles]);
      } else {
        onChange(newUploadedFiles.slice(0, 1));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === value.length - 1) return;

    const newValue = [...value];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newValue[index];
    newValue[index] = newValue[targetIndex];
    newValue[targetIndex] = temp;
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border/60 hover:border-primary/50 bg-muted/30 hover:bg-muted/50'
        }`}
      >
        <input
          type="file"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={uploading}
        />
        
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background border border-border/60 shadow-sm text-muted-foreground">
            {uploading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <Upload className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="text-sm font-medium">
            {uploading ? 'Uploading assets...' : 'Drag & drop files here, or click to browse'}
          </div>
          <p className="text-xs text-muted-foreground">
            Supports Images or PDFs
          </p>
        </div>
      </div>

      {value.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {value.map((file, index) => {
            const isPdf = file.url.endsWith('.pdf') || file.name?.endsWith('.pdf');
            return (
              <div
                key={file.publicId + index}
                className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card p-3 shadow-sm"
              >
                {isPdf ? (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                    <FileText className="h-6 w-6" />
                  </div>
                ) : (
                  <div
                    className="h-14 w-14 shrink-0 rounded-xl bg-cover bg-center bg-no-repeat border border-border/40"
                    style={{ backgroundImage: `url(${file.url})` }}
                  />
                )}
                
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{file.name || 'File'}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{isPdf ? 'PDF document' : 'Image'}</p>
                </div>

                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 rounded-md hover:bg-muted"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-3 w-3 text-destructive" />
                  </Button>
                  
                  {multiple && value.length > 1 && (
                    <div className="flex items-center gap-0.5">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 rounded-md hover:bg-muted disabled:opacity-30"
                        disabled={index === 0}
                        onClick={() => moveFile(index, 'up')}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 rounded-md hover:bg-muted disabled:opacity-30"
                        disabled={index === value.length - 1}
                        onClick={() => moveFile(index, 'down')}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
