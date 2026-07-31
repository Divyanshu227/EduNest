"use client";

import { useState } from 'react';
import { Plus, Edit2, Trash2, Youtube, Image as ImageIcon, FileText, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CloudinaryUploader } from '@/components/notes/CloudinaryUploader';

interface Chapter {
  id: string;
  name: string;
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
  chapters: Chapter[];
}

interface NoteImage {
  url: string;
  publicId: string;
  name?: string;
}

interface NotePdf {
  url: string;
  publicId: string;
  name?: string;
}

interface Note {
  id: string;
  title: string;
  description: string | null;
  subjectId: string;
  chapterId: string;
  type: 'IMAGE' | 'PDF' | 'MIXED';
  images: any; // NoteImage[]
  pdfs: any; // NotePdf[]
  pageCount: number;
  youtubeUrl: string | null;
  subject: { name: string; color: string };
  chapter: { name: string };
  assignedStudentIds: string[];
  lastUpdated: string | Date;
}

interface AdminNotesClientProps {
  initialNotes: any[];
  subjects: any[];
  students: Student[];
  fixedSubjectId?: string;
  fixedChapterId?: string;
}

export function AdminNotesClient({ initialNotes, subjects, students, fixedSubjectId, fixedChapterId }: AdminNotesClientProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(fixedSubjectId || subjects[0]?.id || '');
  const [selectedChapterId, setSelectedChapterId] = useState(fixedChapterId || '');
  const [noteType, setNoteType] = useState<'IMAGE' | 'PDF' | 'MIXED'>('IMAGE');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  
  // Media files states
  const [uploadedImages, setUploadedImages] = useState<NoteImage[]>([]);
  const [uploadedPdfs, setUploadedPdfs] = useState<NotePdf[]>([]);
  const [pageCountInput, setPageCountInput] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
  const chapters = selectedSubject?.chapters || [];

  // Update selected chapter when subject changes
  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    const sub = subjects.find(s => s.id === subjectId);
    setSelectedChapterId(sub?.chapters[0]?.id || '');
  };

  const openCreateForm = () => {
    setEditingNote(null);
    setTitle('');
    setDescription('');
    const firstSubId = fixedSubjectId || subjects[0]?.id || '';
    setSelectedSubjectId(firstSubId);
    if (!fixedChapterId) {
      const firstSub = subjects.find(s => s.id === firstSubId);
      setSelectedChapterId(firstSub?.chapters[0]?.id || '');
    } else {
      setSelectedChapterId(fixedChapterId);
    }
    setNoteType('IMAGE');
    setYoutubeUrl('');
    setUploadedImages([]);
    setUploadedPdfs([]);
    setPageCountInput('');
    setSelectedStudentIds(students.map(s => s.id));
    setIsFormOpen(true);
  };

  const openEditForm = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setDescription(note.description || '');
    setSelectedSubjectId(note.subjectId);
    setSelectedChapterId(note.chapterId);
    setNoteType(note.type);
    setYoutubeUrl(note.youtubeUrl || '');
    
    // Parse JSON lists safely
    const noteImages = Array.isArray(note.images) ? note.images : [];
    const notePdfs = Array.isArray(note.pdfs) ? note.pdfs : [];
    
    setUploadedImages(noteImages);
    setUploadedPdfs(notePdfs);
    setPageCountInput(note.pageCount?.toString() || '');
    setSelectedStudentIds(note.assignedStudentIds || []);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedSubjectId || !selectedChapterId) {
      alert('Please fill in all required fields.');
      return;
    }
    if (selectedStudentIds.length === 0) {
      alert('Please select at least one student.');
      return;
    }

    setSubmitting(true);
    const payload = {
      title,
      description,
      subjectId: selectedSubjectId,
      chapterId: selectedChapterId,
      noteType,
      youtubeUrl,
      images: noteType === 'PDF' ? [] : uploadedImages,
      pdfs: noteType === 'IMAGE' ? [] : uploadedPdfs,
      pageCount: noteType === 'PDF' ? (parseInt(pageCountInput) || uploadedPdfs.length) : uploadedImages.length,
      assignedStudentIds: selectedStudentIds
    };

    try {
      if (editingNote) {
        // Edit flow
        const res = await fetch(`/api/notes/${editingNote.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            type: noteType
          })
        });

        if (!res.ok) throw new Error('Update failed');
        const updated = await res.json();
        
        setNotes(prev => prev.map(n => n.id === editingNote.id ? { 
          ...updated.data, 
          subject: subjects.find((s: any) => s.id === selectedSubjectId), 
          chapter: chapters.find((c: any) => c.id === selectedChapterId) 
        } : n));
      } else {
        // Create flow
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Create failed');
        const created = await res.json();
        
        setNotes(prev => [
          { 
            ...created.data, 
            subject: subjects.find((s: any) => s.id === selectedSubjectId), 
            chapter: chapters.find((c: any) => c.id === selectedChapterId) 
          },
          ...prev
        ]);
      }
      setIsFormOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Delete failed');
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {!fixedChapterId && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Class Materials</p>
            <h2 className="mt-2 font-[var(--font-heading)] text-4xl">Manage Study Notes</h2>
          </div>
          <Button onClick={openCreateForm} className="flex items-center gap-2 rounded-2xl shadow-glow">
            <Plus className="h-4 w-4" /> Add New Note
          </Button>
        </div>
      )}
      {fixedChapterId && (
        <div className="flex justify-end">
          <Button onClick={openCreateForm} className="flex items-center gap-2 rounded-2xl shadow-glow">
            <Plus className="h-4 w-4" /> Add New Note
          </Button>
        </div>
      )}

      {/* Grid of Notes */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <Card key={note.id} className="relative overflow-hidden border-border/60 bg-card/80 backdrop-blur group flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                {!fixedSubjectId && (
                  <Badge style={{ backgroundColor: `${note.subject.color}15`, color: note.subject.color, borderColor: `${note.subject.color}30` }} variant="outline">
                    {note.subject.name}
                  </Badge>
                )}
                <Badge variant="secondary" className="uppercase text-[10px]">
                  {note.type}
                </Badge>
              </div>
              <CardTitle className="line-clamp-1">{note.title}</CardTitle>
              <CardDescription className="line-clamp-2 mt-1 min-h-[40px]">{note.description || 'No description provided.'}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-3">
                {!fixedChapterId && <span>{note.chapter.name}</span>}
                {fixedChapterId && <span>Pages: {note.pageCount || 0}</span>}
                {!fixedChapterId && <span>Pages: {note.pageCount || 0} | Assigned: {note.assignedStudentIds?.length || students.length}</span>}
                {fixedChapterId && <span>Assigned: {note.assignedStudentIds?.length || students.length}</span>}
              </div>
              
              <div className="flex items-center gap-2 border-t border-border/40 pt-3">
                {note.youtubeUrl && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                    <Youtube className="h-4 w-4" />
                  </div>
                )}
                {note.type !== 'PDF' && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                )}
                {note.type !== 'IMAGE' && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                    <FileText className="h-4 w-4" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-accent rounded-lg" onClick={() => openEditForm(note)}>
                  <Edit2 className="h-4 w-4 text-foreground" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-destructive/10 rounded-lg" onClick={() => handleDelete(note.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {!notes.length && (
          <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/20 text-center p-6">
            <p className="text-muted-foreground">No notes created yet. Click "Add New Note" to begin uploading study material.</p>
          </div>
        )}
      </div>

      {/* Create / Edit Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl rounded-3xl border border-border/60 bg-background/95 p-6 shadow-2xl backdrop-blur max-h-[90vh] overflow-y-auto"
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
                {editingNote ? 'Edit Notes Material' : 'Add Study Notes'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!fixedChapterId && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="subject">Subject *</Label>
                      <select
                        id="subject"
                        value={selectedSubjectId}
                        onChange={(e) => handleSubjectChange(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {subjects.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="chapter">Chapter *</Label>
                      <select
                        id="chapter"
                        value={selectedChapterId}
                        onChange={(e) => setSelectedChapterId(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {chapters.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter descriptive title"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain notes contents to the student"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="noteType">Format Type</Label>
                    <select
                      id="noteType"
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value as any)}
                      className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="IMAGE">Handwritten Notebook Images</option>
                      <option value="PDF">PDF Textbook/Document</option>
                      <option value="MIXED">Mixed Media (Images + PDF)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="youtube">Video Link (Optional)</Label>
                    <Input
                      id="youtube"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                </div>

                {/* Student Selection */}
                <div className="space-y-1.5 border-t border-border/40 pt-4">
                  <div className="flex items-center justify-between">
                    <Label>Assign to Students *</Label>
                    <div className="space-x-2 text-xs">
                      <button type="button" onClick={() => setSelectedStudentIds(students.map(s => s.id))} className="text-primary hover:underline">Select All</button>
                      <span className="text-muted-foreground">|</span>
                      <button type="button" onClick={() => setSelectedStudentIds([])} className="text-primary hover:underline">Deselect All</button>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 border border-border/60 rounded-xl p-3 max-h-40 overflow-y-auto bg-background/50">
                    {students.map(student => (
                      <label key={student.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1.5 rounded-md">
                        <input
                          type="checkbox"
                          className="rounded border-border/60 text-primary focus:ring-primary h-4 w-4"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudentIds(prev => [...prev, student.id]);
                            } else {
                              setSelectedStudentIds(prev => prev.filter(id => id !== student.id));
                            }
                          }}
                        />
                        <span className="truncate" title={student.name}>{student.name}</span>
                      </label>
                    ))}
                    {students.length === 0 && (
                      <p className="text-xs text-muted-foreground col-span-full py-2">No students found.</p>
                    )}
                  </div>
                  {selectedStudentIds.length === 0 && (
                    <p className="text-xs text-destructive mt-1">Please select at least one student.</p>
                  )}
                </div>

                {/* Upload Section depending on NoteType */}
                {noteType !== 'PDF' && (
                  <div className="space-y-2 border-t border-border/40 pt-4">
                    <Label>Notebook Page Images</Label>
                    <CloudinaryUploader
                      value={uploadedImages}
                      onChange={setUploadedImages}
                      accept="image/*"
                      folder="notes_images"
                    />
                  </div>
                )}

                {noteType !== 'IMAGE' && (
                  <div className="space-y-4 border-t border-border/40 pt-4">
                    <div className="space-y-2">
                      <Label>PDF Document</Label>
                      <CloudinaryUploader
                        value={uploadedPdfs}
                        onChange={setUploadedPdfs}
                        accept="application/pdf"
                        folder="notes_pdfs"
                        multiple={false}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pageCountInput">Total Pages in PDF</Label>
                      <Input
                        id="pageCountInput"
                        type="number"
                        min="1"
                        value={pageCountInput}
                        onChange={(e) => setPageCountInput(e.target.value)}
                        placeholder="e.g. 15 (Optional: defaults to 1)"
                      />
                      <p className="text-[10px] text-muted-foreground">Enter the total number of pages in the PDF for student reading progress tracking.</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t border-border/40 pt-4 mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={submitting} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="rounded-xl shadow-glow">
                    {submitting ? 'Saving...' : editingNote ? 'Save Changes' : 'Publish Note'}
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
