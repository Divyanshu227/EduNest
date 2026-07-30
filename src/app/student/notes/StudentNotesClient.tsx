"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Search, BookOpen, GraduationCap, Play, FileText, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface Chapter {
  id: string;
  name: string;
  slug: string;
}

interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  chapters: Chapter[];
}

interface Note {
  id: string;
  title: string;
  description: string | null;
  subjectId: string;
  chapterId: string;
  type: 'IMAGE' | 'PDF' | 'MIXED';
  pageCount: number;
  lastUpdated: string | Date;
  subject: { name: string; color: string };
  chapter: { name: string };
}

interface ReadingProgress {
  noteId: string;
  page: number;
  assetType: string;
}

interface StudentNotesClientProps {
  subjects: Subject[];
  notes: Note[];
  progress: ReadingProgress[];
}

export function StudentNotesClient({ subjects, notes, progress }: StudentNotesClientProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
  
  // Filter notes
  const filteredNotes = notes.filter(note => {
    const matchesSubject = note.subjectId === selectedSubjectId;
    const matchesChapter = selectedChapterId === 'all' || note.chapterId === selectedChapterId;
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSubject && matchesChapter && matchesSearch;
  });

  const getProgressForNote = (noteId: string, type: string, maxPages: number) => {
    if (maxPages <= 0) return 0;
    const record = progress.find(p => p.noteId === noteId && p.assetType === (type === 'MIXED' ? 'IMAGE' : type));
    if (!record) return 0;
    return Math.min(100, Math.round((record.page / maxPages) * 100));
  };

  const getProgressPageForNote = (noteId: string, type: string) => {
    const record = progress.find(p => p.noteId === noteId && p.assetType === (type === 'MIXED' ? 'IMAGE' : type));
    return record ? record.page : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Student console</p>
        <h2 className="mt-2 font-[var(--font-heading)] text-3xl sm:text-4xl">Study Materials</h2>
      </div>

      {/* Subject selector slider/grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {subjects.map((sub) => {
          const isActive = sub.id === selectedSubjectId;
          return (
            <button
              key={sub.id}
              onClick={() => {
                setSelectedSubjectId(sub.id);
                setSelectedChapterId('all');
              }}
              className={`relative overflow-hidden rounded-3xl border p-5 text-left transition-all ${
                isActive
                  ? 'border-primary bg-primary/5 shadow-glow ring-2 ring-primary/20'
                  : 'border-border/60 bg-card/60 hover:bg-card/80'
              }`}
            >
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-white mb-4"
                style={{ backgroundColor: sub.color }}
              >
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">{sub.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {notes.filter(n => n.subjectId === sub.id).length} study notes
              </p>
            </button>
          );
        })}
      </div>

      {/* Search and Chapter filtering */}
      {selectedSubject && (
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-t border-border/40 pt-6">
          {/* Chapter pills */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={() => setSelectedChapterId('all')}
              className={`rounded-2xl px-4 py-2 text-xs font-semibold border transition-all ${
                selectedChapterId === 'all'
                  ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                  : 'bg-card border-border/60 hover:bg-muted text-muted-foreground'
              }`}
            >
              All Chapters
            </button>
            {selectedSubject.chapters.map((chap) => (
              <button
                key={chap.id}
                onClick={() => setSelectedChapterId(chap.id)}
                className={`rounded-2xl px-4 py-2 text-xs font-semibold border transition-all ${
                  selectedChapterId === chap.id
                    ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                    : 'bg-card border-border/60 hover:bg-muted text-muted-foreground'
                }`}
              >
                {chap.name}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Notes Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredNotes.map((note) => {
          const completion = getProgressForNote(note.id, note.type, note.pageCount);
          const currentPage = getProgressPageForNote(note.id, note.type);
          
          return (
            <Card key={note.id} className="relative overflow-hidden border-border/60 bg-card/85 backdrop-blur hover:shadow-lg transition-all flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {note.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{note.chapter.name}</span>
                </div>
                <CardTitle className="line-clamp-1">{note.title}</CardTitle>
                <CardDescription className="line-clamp-2 mt-1 min-h-[40px]">{note.description || 'Review this material for your syllabus.'}</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-4">
                {/* Reading Progress indicator */}
                <div className="space-y-1.5 border-t border-border/40 pt-3">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{completion > 0 ? `Reading: Page ${currentPage}/${note.pageCount}` : 'Not started'}</span>
                    <span>{completion}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${completion}%`, backgroundColor: selectedSubject?.color }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-muted-foreground">
                    Updated {new Date(note.lastUpdated).toLocaleDateString()}
                  </span>
                  
                  <Link 
                    href={`/student/notes/${note.id}`}
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-primary text-primary-foreground rounded-2xl hover:opacity-90 shadow-glow transition-all"
                    style={{ backgroundColor: selectedSubject?.color }}
                  >
                    <Play className="h-3 w-3 fill-current" /> Read Note
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {!filteredNotes.length && (
          <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/20 text-center p-6">
            <GraduationCap className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No notes found for this subject or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
