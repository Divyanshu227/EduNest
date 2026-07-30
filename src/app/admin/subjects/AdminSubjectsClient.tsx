"use client";

import { useState } from 'react';
import { Plus, BookOpen, Layers, X, FolderHeart, Palette, Hash, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface Chapter {
  id: string;
}

interface Note {
  id: string;
}

interface Homework {
  id: string;
}

interface Test {
  id: string;
}

interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
  chapters: Chapter[];
  notes: Note[];
  homeworks: Homework[];
  tests: Test[];
}

interface AdminSubjectsClientProps {
  initialSubjects: Subject[];
}

const COLOR_PRESETS = [
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Sky Blue', hex: '#0ea5e9' },
  { name: 'Rose Red', hex: '#f43f5e' },
  { name: 'Amber Orange', hex: '#f59e0b' },
  { name: 'Violet Purple', hex: '#8b5cf6' },
  { name: 'Pink Rose', hex: '#ec4899' }
];

export function AdminSubjectsClient({ initialSubjects }: AdminSubjectsClientProps) {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_PRESETS[0].hex);
  const [sortOrder, setSortOrder] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !color) {
      alert('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    const payload = {
      name,
      color,
      icon: 'BookOpen', // default icon
      sortOrder: parseInt(sortOrder) || 1
    };

    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Create subject failed');
      const data = await res.json();

      const createdSubject: Subject = {
        ...data.data,
        chapters: [],
        notes: [],
        homeworks: [],
        tests: []
      };

      setSubjects(prev => [...prev, createdSubject].sort((a, b) => a.sortOrder - b.sortOrder));
      setIsFormOpen(false);
      setName('');
      setSortOrder('1');
      alert('Subject created successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subject? Note: This will delete all chapters, notes, homework, and tests in this subject!')) return;

    try {
      const res = await fetch(`/api/subjects/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Delete failed');
      setSubjects(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Academic Scope</p>
          <h2 className="mt-2 font-[var(--font-heading)] text-4xl">Managed Subjects</h2>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2 rounded-2xl shadow-glow">
          <Plus className="h-4 w-4" /> Create Subject
        </Button>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((sub) => (
          <Card key={sub.id} className="relative overflow-hidden border-border/60 bg-card/85 backdrop-blur flex flex-col justify-between">
            {/* Color Accent bar */}
            <div className="h-2 w-full" style={{ backgroundColor: sub.color }} />
            
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <Badge variant="outline" style={{ borderColor: `${sub.color}30`, backgroundColor: `${sub.color}10`, color: sub.color }} className="text-[10px]">
                  Sort order: {sub.sortOrder}
                </Badge>
                <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-destructive/10 rounded-md" onClick={() => handleDelete(sub.id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
              <CardTitle className="text-2xl font-bold">{sub.name}</CardTitle>
              <CardDescription className="text-xs line-clamp-2 mt-1">
                Managed Curriculum Scope
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-2 border-t border-border/40 pt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-primary" /> {sub.chapters?.length || 0} Chapters
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-primary" /> {sub.notes?.length || 0} Study Notes
                </div>
                <div className="flex items-center gap-1.5 col-span-2">
                  <FolderHeart className="h-4 w-4 text-primary" /> {sub.homeworks?.length || 0} Homework & {sub.tests?.length || 0} Quizzes
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!subjects.length && (
          <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/20 text-center p-6">
            <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-semibold">No subjects assigned to your account.</p>
          </div>
        )}
      </div>

      {/* Create Subject Modal */}
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
                Add New Subject
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Subject Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Science, Social Studies"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Palette className="h-4 w-4 text-primary" /> Theme Color Preset *
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => setColor(preset.hex)}
                        className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all ${
                          color === preset.hex 
                            ? 'border-primary bg-primary/10 text-foreground' 
                            : 'border-border/60 hover:bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: preset.hex }} />
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sortOrder" className="flex items-center gap-1.5">
                    <Hash className="h-4 w-4 text-primary" /> Sort Order (Sorting precedence) *
                  </Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    placeholder="e.g. 5"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-border/40 pt-4 mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={submitting} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="rounded-xl shadow-glow">
                    {submitting ? 'Creating...' : 'Create Subject'}
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
