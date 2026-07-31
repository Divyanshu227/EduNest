"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Plus, X, Trash2, ArrowLeft, Layers, BookOpen, Hash, FolderHeart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  notes?: { id: string }[];
  homework?: { id: string }[];
  tests?: { id: string }[];
}

interface SubjectChaptersClientProps {
  subject: Subject;
  initialChapters: Chapter[];
}

export function SubjectChaptersClient({ subject, initialChapters }: SubjectChaptersClientProps) {
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [order, setOrder] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    const payload = {
      name,
      order: parseInt(order) || 1,
      subjectId: subject.id
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
        notes: [],
        homework: [],
        tests: []
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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin/subjects" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to Curriculum
          </Link>
          <div className="flex items-center gap-3">
            <h2 className="font-[var(--font-heading)] text-4xl">{subject.name} Chapters</h2>
            <Badge style={{ backgroundColor: `${subject.color}15`, color: subject.color, borderColor: `${subject.color}30` }} variant="outline" className="text-sm px-3 py-1 font-bold">
              {chapters.length} Chapters
            </Badge>
          </div>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2 rounded-2xl shadow-glow">
          <Plus className="h-4 w-4" /> Add Chapter
        </Button>
      </div>

      {/* Chapters Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {chapters.map((ch) => (
          <Link key={ch.id} href={`/admin/subjects/${subject.id}/chapters/${ch.id}`}>
            <Card className="border-border/60 bg-card/85 backdrop-blur overflow-hidden transition-all hover:border-primary/50 relative h-full flex flex-col justify-between">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[10px]">Order: {ch.order}</Badge>
                  <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-destructive/10 rounded-md z-10 relative" onClick={(e) => handleDelete(ch.id, e)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
                <CardTitle className="text-lg font-bold mt-1.5 leading-tight">{ch.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-2 gap-2 border-t border-border/40 pt-3 text-xs text-muted-foreground mt-2">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-primary" /> {ch.notes?.length || 0} Notes
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FolderHeart className="h-4 w-4 text-primary" /> {(ch.homework?.length || 0) + (ch.tests?.length || 0)} Homework/Tests
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {!chapters.length && (
          <div className="col-span-full flex h-24 flex-col items-center justify-center rounded-3xl border border-dashed border-border/40 bg-muted/10 text-center p-4">
            <p className="text-muted-foreground">No chapters defined for {subject.name}.</p>
          </div>
        )}
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
                Add New Chapter to {subject.name}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label htmlFor="order" className="flex items-center gap-1.5">
                    <Hash className="h-4 w-4 text-primary" /> Sort Order *
                  </Label>
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
