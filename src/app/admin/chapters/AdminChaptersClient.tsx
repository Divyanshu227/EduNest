"use client";

import { useState } from 'react';
import { Plus, BookOpen, Layers, X, AlertCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface Subject {
  id: string;
  name: string;
  color: string;
}

interface Chapter {
  id: string;
  name: string;
  slug: string;
  order: number;
  subjectId: string;
  subject: Subject;
}

interface AdminChaptersClientProps {
  subjects: Subject[];
  initialChapters: Chapter[];
}

export function AdminChaptersClient({ subjects, initialChapters }: AdminChaptersClientProps) {
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [order, setOrder] = useState('1');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subjectId) {
      alert('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    const payload = {
      name,
      order: parseInt(order) || 1,
      subjectId
    };

    try {
      const res = await fetch('/api/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Create chapter failed');
      const data = await res.json();

      const createdChapter = {
        ...data.data,
        subject: subjects.find((s: any) => s.id === subjectId)
      };

      setChapters(prev => [...prev, createdChapter].sort((a, b) => a.order - b.order));
      setIsFormOpen(false);
      setName('');
      setOrder('1');
      alert('Chapter created successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chapter? Note: This will delete all associated notes, homework, and tests!')) return;

    try {
      const res = await fetch(`/api/chapters/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Delete failed');
      setChapters(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Group chapters by subject name
  const groupedChapters = subjects.reduce((acc, sub) => {
    acc[sub.name] = {
      subject: sub,
      list: chapters.filter(c => c.subjectId === sub.id)
    };
    return acc;
  }, {} as Record<string, { subject: Subject; list: Chapter[] }>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Curriculum Core</p>
          <h2 className="mt-2 font-[var(--font-heading)] text-4xl">Subject Chapters</h2>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2 rounded-2xl shadow-glow">
          <Plus className="h-4 w-4" /> Create Chapter
        </Button>
      </div>

      {/* Chapters grouped by Subject */}
      <div className="space-y-8">
        {subjects.map((sub) => {
          const list = groupedChapters[sub.name]?.list || [];
          
          return (
            <div key={sub.id} className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge style={{ backgroundColor: `${sub.color}15`, color: sub.color, borderColor: `${sub.color}30` }} variant="outline" className="text-xs px-3 py-1 font-bold">
                  {sub.name}
                </Badge>
                <div className="h-[1px] flex-1 bg-border/60" />
                <span className="text-xs text-muted-foreground">{list.length} Chapters</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((ch) => (
                  <Card key={ch.id} className="border-border/60 bg-card/85 backdrop-blur overflow-hidden transition-all hover:border-primary/20">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className="text-[10px]">Order: {ch.order}</Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{ch.slug}</span>
                          <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-destructive/10 rounded-md" onClick={() => handleDelete(ch.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-lg font-bold mt-1.5 leading-tight">{ch.name}</CardTitle>
                    </CardHeader>
                  </Card>
                ))}

                {!list.length && (
                  <div className="col-span-full flex h-24 items-center justify-center rounded-3xl border border-dashed border-border/40 bg-muted/10 text-center p-4">
                    <p className="text-xs text-muted-foreground">No chapters defined for {sub.name}.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Chapter Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-3xl border border-border/60 bg-background/95 p-6 shadow-2xl backdrop-blur"
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
                Add New Chapter
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="subject">Subject *</Label>
                  <select
                    id="subject"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="name">Chapter Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Chapter 1: Introduction"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="order">Sort Order *</Label>
                  <Input
                    id="order"
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    placeholder="e.g. 1"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-border/40 pt-4 mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={submitting} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="rounded-xl shadow-glow">
                    {submitting ? 'Creating...' : 'Create Chapter'}
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
