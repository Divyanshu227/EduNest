"use client";

import { useState, useRef } from 'react';
import { Plus, Megaphone, Trash2, Pin, X, Users, Upload, FileText, Image as ImageIcon, Loader2, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DownloadLink } from '@/components/ui/download-link';

interface AttachmentType {
  url: string;
  name: string;
  type: string; // 'image' | 'pdf'
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: string;
  pinned: boolean;
  pinUntil?: string | Date | null;
  attachments?: AttachmentType[];
  createdAt: string | Date;
  author: { name: string; email: string };
}

interface UserType {
  id: string;
  name: string;
  role: string;
}

interface AdminAnnouncementsClientProps {
  initialAnnouncements: Announcement[];
  users: UserType[];
}

export function isEffectivelyPinned(ann: Announcement): boolean {
  return Boolean(ann.pinned && (!ann.pinUntil || new Date(ann.pinUntil).getTime() > Date.now()));
}

// Helper to format audience string to human-readable label
function audienceLabel(audience: string, users: UserType[]): string {
  if (audience === 'all') return 'Everyone';
  if (audience === 'all_students') return 'All Students';
  if (audience === 'all_teachers') return 'All Teachers';
  if (audience.startsWith('student:') || audience.startsWith('teacher:')) {
    const id = audience.split(':')[1];
    const user = users.find(u => u.id === id);
    return user ? user.name : audience;
  }
  return audience;
}

export function AdminAnnouncementsClient({ initialAnnouncements, users }: AdminAnnouncementsClientProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');
  const [pinned, setPinned] = useState(false);
  const [pinDuration, setPinDuration] = useState<'permanent' | '1day' | '3days' | '7days' | 'custom'>('permanent');
  const [customPinUntil, setCustomPinUntil] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [togglingPinId, setTogglingPinId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<AttachmentType[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const students = users.filter(u => u.role === 'STUDENT');
  const teachers = users.filter(u => u.role === 'ADMIN');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newAttachments: AttachmentType[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'announcements');

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();

        const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
        newAttachments.push({
          url: data.url,
          name: file.name,
          type: isPdf ? 'pdf' : 'image'
        });
      } catch (err: any) {
        alert(`Failed to upload ${file.name}: ${err.message}`);
      }
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    setUploading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const calculatePinUntil = (): string | null => {
    if (!pinned) return null;
    if (pinDuration === 'permanent') return null;
    if (pinDuration === '1day') return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    if (pinDuration === '3days') return new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    if (pinDuration === '7days') return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    if (pinDuration === 'custom' && customPinUntil) return new Date(customPinUntil).toISOString();
    return null;
  };

  const handleTogglePin = async (ann: Announcement) => {
    const willBePinned = !isEffectivelyPinned(ann);
    setTogglingPinId(ann.id);

    try {
      const res = await fetch(`/api/announcements/${ann.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pinned: willBePinned,
          pinUntil: willBePinned ? null : null // Reset or toggle pin
        })
      });

      if (!res.ok) throw new Error('Failed to update pin status');
      const data = await res.json();

      setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, pinned: data.data.pinned, pinUntil: data.data.pinUntil } : a));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTogglingPinId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      alert('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    const pinUntilDate = calculatePinUntil();
    const payload = {
      title,
      message,
      audience,
      pinned,
      pinUntil: pinUntilDate,
      attachments
    };

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Broadcast failed');
      const data = await res.json();

      setAnnouncements(prev => [
        {
          ...data.data,
          author: { name: 'Me', email: '' }
        },
        ...prev
      ]);
      setIsFormOpen(false);
      setTitle('');
      setMessage('');
      setAudience('all');
      setPinned(false);
      setPinDuration('permanent');
      setCustomPinUntil('');
      setAttachments([]);
      alert('Announcement broadcasted successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Delete failed');
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Broadcasting</p>
          <h2 className="mt-2 font-[var(--font-heading)] text-4xl">Class Announcements</h2>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2 rounded-2xl shadow-glow">
          <Plus className="h-4 w-4" /> Create Broadcast
        </Button>
      </div>

      {/* Grid of Broadcasts */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {announcements.map((ann) => {
          const annAttachments: AttachmentType[] = (ann.attachments as AttachmentType[] | undefined) || [];
          const pinnedActive = isEffectivelyPinned(ann);
          const isToggling = togglingPinId === ann.id;

          return (
            <Card key={ann.id} className={`relative overflow-hidden border bg-card/85 backdrop-blur flex flex-col justify-between transition-all ${
              pinnedActive ? 'border-primary/50 shadow-glow ring-1 ring-primary/20' : 'border-border/60'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="secondary" className="text-[10px] flex items-center gap-1.5 uppercase">
                    <Users className="h-3 w-3" /> {audienceLabel(ann.audience, users)}
                  </Badge>
                  <div className="flex items-center gap-2">
                    {/* Pin/Unpin Interactive Action */}
                    {pinnedActive ? (
                      <button
                        type="button"
                        onClick={() => handleTogglePin(ann)}
                        disabled={isToggling}
                        title="Click to unpin this announcement"
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 hover:bg-red-500/15 hover:text-red-600 hover:border-red-500/30 transition-all cursor-pointer group"
                      >
                        <Pin className="h-3 w-3 fill-current rotate-45 text-emerald-600 group-hover:text-red-600" />
                        <span>
                          {ann.pinUntil
                            ? `${new Date(ann.pinUntil).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}`
                            : 'Pinned'}
                        </span>
                        <span className="hidden group-hover:inline text-[9px] font-bold underline ml-0.5">Unpin</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleTogglePin(ann)}
                        disabled={isToggling}
                        title="Click to pin to top"
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] text-muted-foreground hover:text-primary hover:bg-primary/10 border border-border/40 hover:border-primary/30 transition-all cursor-pointer"
                      >
                        <Pin className="h-3 w-3" />
                        <span>Pin</span>
                      </button>
                    )}

                    <span className="text-[10px] text-muted-foreground">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <CardTitle className="text-xl leading-snug line-clamp-1">{ann.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4 whitespace-pre-wrap">{ann.message}</p>
                
                {/* Attachments display */}
                {annAttachments.length > 0 && (
                  <div className="space-y-2 border-t border-border/40 pt-3">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                      <Paperclip className="h-3 w-3" /> Attachments ({annAttachments.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {annAttachments.map((att, i) => (
                        att.type === 'image' ? (
                          <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="block">
                            <img src={att.url} alt={att.name} className="h-16 w-16 object-cover rounded-lg border border-border/40 hover:ring-2 hover:ring-primary transition-all" />
                          </a>
                        ) : (
                          <DownloadLink key={i} url={att.url} filename={att.name || 'Attachment'} className="flex items-center gap-1.5 rounded-lg border border-border/40 px-2.5 py-1.5 text-[11px] font-medium hover:bg-muted/40 transition-colors">
                            <FileText className="h-3.5 w-3.5 text-red-400" />
                            <span className="max-w-[100px] truncate">{att.name}</span>
                          </DownloadLink>
                        )
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-border/40 pt-3">
                  <span className="text-[10px] text-muted-foreground">
                    By {ann.author.name}
                  </span>
                  <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-destructive/10 rounded-lg" onClick={() => handleDelete(ann.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {!announcements.length && (
          <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/20 text-center p-6">
            <Megaphone className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No announcements broadcasted yet. Click "Create Broadcast" to post a message.</p>
          </div>
        )}
      </div>

      {/* Broadcast Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border/60 bg-background/95 p-6 shadow-2xl backdrop-blur"
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 h-8 w-8 rounded-lg hover:bg-muted"
                onClick={() => setIsFormOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>

              <h3 className="font-[var(--font-heading)] text-2xl font-bold mb-4">
                Broadcast Announcement
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title">Broadcast Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Tomorrow Class Timing Change"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message">Announcement Message *</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write announcement contents..."
                    required
                    rows={4}
                  />
                </div>

                {/* Target Audience */}
                <div className="space-y-1.5">
                  <Label htmlFor="audience">Target Audience</Label>
                  <select
                    id="audience"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <optgroup label="Groups">
                      <option value="all">Everyone</option>
                      <option value="all_students">All Students</option>
                      <option value="all_teachers">All Teachers</option>
                    </optgroup>
                    {students.length > 0 && (
                      <optgroup label="Individual Students">
                        {students.map(s => (
                          <option key={s.id} value={`student:${s.id}`}>{s.name}</option>
                        ))}
                      </optgroup>
                    )}
                    {teachers.length > 0 && (
                      <optgroup label="Individual Teachers">
                        {teachers.map(t => (
                          <option key={t.id} value={`teacher:${t.id}`}>{t.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                {/* File Attachments */}
                <div className="space-y-2">
                  <Label>Attachments (Images & PDFs)</Label>
                  <div
                    className="flex items-center justify-center w-full h-20 rounded-xl border-2 border-dashed border-border/60 bg-muted/10 hover:bg-muted/20 cursor-pointer transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Upload className="h-4 w-4" /> Click to upload images or PDFs
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  {/* Attachment previews */}
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {attachments.map((att, i) => (
                        <div key={i} className="relative group">
                          {att.type === 'image' ? (
                            <img src={att.url} alt={att.name} className="h-16 w-16 object-cover rounded-lg border border-border/40" />
                          ) : (
                            <div className="flex items-center gap-1.5 h-16 rounded-lg border border-border/40 px-3 bg-muted/20">
                              <FileText className="h-5 w-5 text-red-400" />
                              <span className="text-[11px] max-w-[80px] truncate">{att.name}</span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeAttachment(i)}
                            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3 p-3.5 rounded-2xl bg-muted/20 border border-border/40">
                  <div className="flex items-center gap-2">
                    <input
                      id="pinned"
                      type="checkbox"
                      checked={pinned}
                      onChange={(e) => setPinned(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="pinned" className="cursor-pointer font-semibold text-sm flex items-center gap-1.5">
                      <Pin className="h-3.5 w-3.5 text-primary" /> Pin to top of feed
                    </Label>
                  </div>

                  {pinned && (
                    <div className="space-y-2 pt-2 border-t border-border/30 animate-in fade-in-50 duration-200">
                      <Label className="text-xs text-muted-foreground">Pin Duration / Time Limit</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {[
                          { id: 'permanent', label: 'Permanent' },
                          { id: '1day', label: '24 Hours' },
                          { id: '3days', label: '3 Days' },
                          { id: '7days', label: '1 Week' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setPinDuration(opt.id as any)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                              pinDuration === opt.id
                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                : 'bg-background hover:bg-muted/50 border-border/60 text-muted-foreground'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setPinDuration('custom')}
                          className={`text-xs font-semibold transition-colors ${
                            pinDuration === 'custom' ? 'text-primary underline' : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          + Set Custom Expiry Date & Time
                        </button>
                      </div>

                      {pinDuration === 'custom' && (
                        <div className="space-y-1 pt-1">
                          <Input
                            type="datetime-local"
                            value={customPinUntil}
                            min={new Date().toISOString().slice(0, 16)}
                            onChange={(e) => setCustomPinUntil(e.target.value)}
                            className="h-9 text-xs rounded-xl"
                            required={pinDuration === 'custom'}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 border-t border-border/40 pt-4 mt-6">
                  <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setAttachments([]); }} disabled={submitting} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting || uploading} className="rounded-xl shadow-glow">
                    {submitting ? 'Broadcasting...' : 'Post Broadcast'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
