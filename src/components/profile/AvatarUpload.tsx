"use client";

import { useState, useRef, useCallback } from 'react';
import { Camera, Loader2, Check, X } from 'lucide-react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userName: string;
  fallbackLetter: string;
}

export function AvatarUpload({ currentAvatarUrl, userName, fallbackLetter }: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropper states
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [processingCrop, setProcessingCrop] = useState(false);

  const readErrorMessage = async (response: Response, fallback: string) => {
    const raw = await response.text();

    if (!raw) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(raw) as { error?: string; message?: string };
      return parsed.error || parsed.message || fallback;
    } catch {
      return raw;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageSrc(reader.result?.toString() || null);
      setIsCropDialogOpen(true);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    });
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setProcessingCrop(true);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      if (!croppedBlob) throw new Error('Failed to crop image');

      // Convert Blob back to File
      const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
      
      setUploading(true);
      setIsCropDialogOpen(false);

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'avatars');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        throw new Error(await readErrorMessage(uploadRes, 'Upload failed'));
      }
      const uploadData = await uploadRes.json();

      // Save to user profile
      const profileRes = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: uploadData.url })
      });

      if (!profileRes.ok) {
        throw new Error(await readErrorMessage(profileRes, 'Profile update failed'));
      }

      setAvatarUrl(uploadData.url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to update avatar: ${message}`);
    } finally {
      setProcessingCrop(false);
      setUploading(false);
    }
  };

  const handleCancelCrop = () => {
    setIsCropDialogOpen(false);
    setImageSrc(null);
  };

  return (
    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={userName}
          className="h-16 w-16 rounded-2xl object-cover shadow-glow border-2 border-primary/20"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-2xl shadow-glow">
          {fallbackLetter}
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
        {uploading ? (
          <Loader2 className="h-5 w-5 text-white animate-spin" />
        ) : (
          <Camera className="h-5 w-5 text-white" />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Cropper Dialog */}
      <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
        <DialogContent className="sm:max-w-[500px] w-full p-0 overflow-hidden flex flex-col h-[500px] sm:h-[600px]">
          <DialogHeader className="p-4 border-b bg-card">
            <DialogTitle>Crop Your Avatar</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 relative bg-black/90">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          
          <div className="p-4 bg-card border-t border-border/40">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" onClick={handleCancelCrop} disabled={processingCrop} className="rounded-xl">
                  <X className="h-4 w-4 mr-1.5" /> Cancel
                </Button>
                <Button onClick={handleCropSave} disabled={processingCrop} className="rounded-xl shadow-glow">
                  {processingCrop ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Check className="h-4 w-4 mr-1.5" />}
                  Save Avatar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
