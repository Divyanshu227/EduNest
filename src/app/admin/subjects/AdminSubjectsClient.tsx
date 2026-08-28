"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Plus, BookOpen, Layers, X, FolderHeart, Palette, Hash, Trash2, Edit2, Users, Check, UserMinus } from 'lucide-react';
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

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
  studentId?: string | null;
  student?: { id: string; name: string; email: string } | null;
  chapters: Chapter[];
  notes: Note[];
  homeworks: Homework[];
  tests: Test[];
}

interface AdminSubjectsClientProps {
  initialSubjects: Subject[];
  students: Student[];
}

const COLOR_PRESETS = [
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Sky Blue', hex: '#0ea5e9' },
  { name: 'Rose Red', hex: '#f43f5e' },
  { name: 'Amber Orange', hex: '#f59e0b' },
  { name: 'Violet Purple', hex: '#8b5cf6' },
  { name: 'Pink Rose', hex: '#ec4899' }
];

export function AdminSubjectsClient({ initialSubjects, students }: AdminSubjectsClientProps) {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('ALL');
  
  // Create modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [targetStudentId, setTargetStudentId] = useState<string>('');
  const [color, setColor] = useState(COLOR_PRESETS[0].hex);
  const [sortOrder, setSortOrder] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  // Edit / Manage Students modal state
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editName, setEditName] = useState('');
  const [editTargetStudentId, setEditTargetStudentId] = useState<string>('');
  const [editColor, setEditColor] = useState(COLOR_PRESETS[0].hex);
  const [editSortOrder, setEditSortOrder] = useState('1');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const filteredSubjects = subjects.filter(s => {
    if (selectedStudentFilter === 'ALL') return true;
    if (selectedStudentFilter === 'SHARED') return !s.studentId;
    return s.studentId === selectedStudentFilter;
  });

  const openCreateModal = () => {
    setName('');
    setColor(COLOR_PRESETS[0].hex);
    setSortOrder(String(subjects.length + 1));
    if (selectedStudentFilter !== 'ALL' && selectedStudentFilter !== 'SHARED') {
      setTargetStudentId(selectedStudentFilter);
    } else {
      setTargetStudentId('');
    }
    setIsCreateOpen(true);
  };

  const openEditModal = (sub: Subject) => {
    setEditingSubject(sub);
    setEditName(sub.name);
    setEditColor(sub.color || COLOR_PRESETS[0].hex);
    setEditSortOrder(String(sub.sortOrder || 1));
    setEditTargetStudentId(sub.studentId || '');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !color) {
      alert('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    const payload = {
      name,
      color,
      icon: 'BookOpen',
      sortOrder: parseInt(sortOrder) || 1,
      studentId: targetStudentId && targetStudentId.trim() !== '' ? targetStudentId : null
    };

    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Create subject failed');
      }

      const assignedStudent = students.find(s => s.id === payload.studentId);

      const createdSubject: Subject = {
        ...data.data,
        student: assignedStudent ? { id: assignedStudent.id, name: assignedStudent.name, email: assignedStudent.email } : null,
        chapters: [],
        notes: [],
        homeworks: [],
        tests: []
      };

      setSubjects(prev => [...prev, createdSubject].sort((a, b) => a.sortOrder - b.sortOrder));
      setIsCreateOpen(false);
      alert('Subject created successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;

    setEditSubmitting(true);
    const finalStudentId = editTargetStudentId && editTargetStudentId.trim() !== '' ? editTargetStudentId : null;
    const payload = {
      name: editName,
      color: editColor,
      sortOrder: parseInt(editSortOrder) || 1,
      studentId: finalStudentId
    };

    try {
      const res = await fetch(`/api/subjects/${editingSubject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update subject');

      const primaryStudent = students.find(s => s.id === finalStudentId);

      setSubjects(prev => prev.map(s => {
        if (s.id === editingSubject.id) {
          return {
            ...s,
            name: editName,
            color: editColor,
            sortOrder: parseInt(editSortOrder) || 1,
            studentId: finalStudentId,
            student: primaryStudent ? { id: primaryStudent.id, name: primaryStudent.name, email: primaryStudent.email } : null
          };
        }
        return s;
      }).sort((a, b) => a.sortOrder - b.sortOrder));

      setEditingSubject(null);
      alert('Subject updated successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEditSubmitting(false);
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
        <Button onClick={openCreateModal} className="flex items-center gap-2 rounded-2xl shadow-glow">
          <Plus className="h-4 w-4" /> Create Subject
        </Button>
      </div>

      {/* Student Selector Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/40 pb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">
          Active Student:
        </span>
        <button
          type="button"
          onClick={() => setSelectedStudentFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedStudentFilter === 'ALL'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/40 hover:bg-muted text-muted-foreground'
          }`}
        >
          All Subjects ({subjects.length})
        </button>
        {students.map(student => {
          const count = subjects.filter(s => s.studentId === student.id).length;
          return (
            <button
              key={student.id}
              type="button"
              onClick={() => setSelectedStudentFilter(student.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedStudentFilter === student.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/40 hover:bg-muted text-muted-foreground'
              }`}
            >
              <span>👤 {student.name}</span>
              <span className="opacity-75 text-[10px]">({count})</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setSelectedStudentFilter('SHARED')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedStudentFilter === 'SHARED'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/40 hover:bg-muted text-muted-foreground'
          }`}
        >
          Shared / Global ({subjects.filter(s => !s.studentId).length})
        </button>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredSubjects.map((sub) => {
          const isGlobal = !sub.studentId;

          return (
            <Card key={sub.id} className="relative h-full overflow-hidden border-border/60 bg-card/85 backdrop-blur flex flex-col justify-between hover:border-primary/50 transition-colors group">
              {/* Color Accent bar */}
              <div className="h-2 w-full" style={{ backgroundColor: sub.color }} />
              
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" style={{ borderColor: `${sub.color}30`, backgroundColor: `${sub.color}10`, color: sub.color }} className="text-[10px]">
                      Order: {sub.sortOrder}
                    </Badge>
                    
                    {isGlobal ? (
                      <Badge variant="secondary" className="text-[10px] text-muted-foreground bg-muted/60">
                        🌐 Shared (All Students)
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                        👤 {sub.student?.name || '1 Student'}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 hover:bg-primary/10 rounded-md" 
                      title="Edit Subject & Student Access"
                      onClick={(e) => {
                        e.preventDefault();
                        openEditModal(sub);
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5 text-primary" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 hover:bg-destructive/10 rounded-md" 
                      title="Delete Subject"
                      onClick={(e) => { 
                        e.preventDefault(); 
                        handleDelete(sub.id); 
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>

                <Link href={`/admin/subjects/${sub.id}`} className="block hover:text-primary transition-colors">
                  <CardTitle className="text-2xl font-bold">{sub.name}</CardTitle>
                </Link>
                
                <CardDescription className="text-xs line-clamp-2 mt-1">
                  {isGlobal
                    ? 'Shared curriculum scope across all students'
                    : `Custom curriculum for ${sub.student?.name || 'student'}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <Link href={`/admin/subjects/${sub.id}`}>
                  <div className="grid grid-cols-2 gap-2 border-t border-border/40 pt-3 text-xs text-muted-foreground hover:text-foreground transition-colors">
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
                </Link>

                <div className="pt-2 border-t border-border/30 flex justify-between items-center">
                  <span className="text-[11px] text-muted-foreground">
                    {isGlobal ? '🌐 Shared' : `👤 ${sub.student?.name || 'Assigned'}`}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs rounded-lg"
                    onClick={() => openEditModal(sub)}
                  >
                    <Users className="h-3 w-3 mr-1" /> Edit / Feed Student
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {!filteredSubjects.length && (
          <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/20 text-center p-6">
            <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-semibold">No subjects found for this selection.</p>
            <Button onClick={openCreateModal} variant="outline" className="mt-3 rounded-xl text-xs">
              + Create Subject
            </Button>
          </div>
        )}
      </div>

      {/* Create Subject Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl border border-border/60 bg-background/95 p-6 shadow-2xl backdrop-blur max-h-[90vh] overflow-y-auto"
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 h-8 w-8 rounded-lg hover:bg-muted"
                onClick={() => setIsCreateOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>

              <h3 className="font-[var(--font-heading)] text-2xl font-bold mb-4">
                Add New Subject
              </h3>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="createName">Subject Name *</Label>
                  <Input
                    id="createName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Science, Mathematics, History"
                    required
                  />
                </div>

                {/* Student Enrollment / Scope */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-muted/20 border border-border/40">
                  <Label htmlFor="createStudentSelect" className="flex items-center gap-1.5 font-semibold text-sm">
                    <Users className="h-4 w-4 text-primary" /> Assign / Feed Student
                  </Label>
                  
                  <select
                    id="createStudentSelect"
                    value={targetStudentId}
                    onChange={(e) => setTargetStudentId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">🌐 Shared / Global (All Students)</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        👤 {s.name} ({s.email})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground">
                    Select a student to make this a 1-on-1 dedicated subject, or leave as Shared to be accessible to all.
                  </p>
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
                  <Label htmlFor="createSortOrder" className="flex items-center gap-1.5">
                    <Hash className="h-4 w-4 text-primary" /> Sort Order *
                  </Label>
                  <Input
                    id="createSortOrder"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    placeholder="e.g. 1"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-border/40 pt-4 mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={submitting} className="rounded-xl">
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

      {/* Edit Subject & Feed / Remove Students Modal */}
      <AnimatePresence>
        {editingSubject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl border border-border/60 bg-background/95 p-6 shadow-2xl backdrop-blur max-h-[90vh] overflow-y-auto"
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 h-8 w-8 rounded-lg hover:bg-muted"
                onClick={() => setEditingSubject(null)}
              >
                <X className="h-4 w-4" />
              </Button>

              <h3 className="font-[var(--font-heading)] text-2xl font-bold mb-1">
                Edit Subject & Student Scope
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Feed, edit, or remove student access for <strong>{editingSubject.name}</strong>.
              </p>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="editName">Subject Name *</Label>
                  <Input
                    id="editName"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                {/* Student Feed / Edit / Remove Control */}
                <div className="space-y-3 p-3.5 rounded-2xl bg-muted/20 border border-border/40">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="editStudentSelect" className="flex items-center gap-1.5 font-semibold text-sm">
                      <Users className="h-4 w-4 text-primary" /> Student Assignment
                    </Label>
                    {editTargetStudentId && (
                      <button
                        type="button"
                        onClick={() => setEditTargetStudentId('')}
                        className="text-xs text-destructive hover:underline flex items-center gap-1"
                      >
                        <UserMinus className="h-3 w-3" /> Remove student (Make Global)
                      </button>
                    )}
                  </div>
                  
                  <select
                    id="editStudentSelect"
                    value={editTargetStudentId}
                    onChange={(e) => setEditTargetStudentId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">🌐 Shared / Global (All Students)</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        👤 {s.name} ({s.email})
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-muted-foreground">Current status:</span>
                    {editTargetStudentId ? (
                      <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                        👤 Assigned to {students.find(s => s.id === editTargetStudentId)?.name || 'Selected Student'}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                        🌐 Global / Shared (All Students)
                      </Badge>
                    )}
                  </div>
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
                        onClick={() => setEditColor(preset.hex)}
                        className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all ${
                          editColor === preset.hex 
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
                  <Label htmlFor="editSortOrder" className="flex items-center gap-1.5">
                    <Hash className="h-4 w-4 text-primary" /> Sort Order *
                  </Label>
                  <Input
                    id="editSortOrder"
                    type="number"
                    value={editSortOrder}
                    onChange={(e) => setEditSortOrder(e.target.value)}
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-border/40 pt-4 mt-6">
                  <Button type="button" variant="outline" onClick={() => setEditingSubject(null)} disabled={editSubmitting} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={editSubmitting} className="rounded-xl shadow-glow">
                    {editSubmitting ? 'Saving Changes...' : 'Save Changes'}
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
