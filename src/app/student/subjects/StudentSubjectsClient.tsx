"use client";

import Link from 'next/link';
import { BookOpen, Layers, FolderHeart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface Subject {
  id: string;
  name: string;
  color: string;
  chapters: { id: string }[];
  notes: { id: string }[];
  homework: { id: string }[];
  tests: { id: string }[];
}

export function StudentSubjectsClient({ initialSubjects }: { initialSubjects: Subject[] }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">My Curriculum</p>
          <h2 className="mt-2 font-[var(--font-heading)] text-4xl">Subjects</h2>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {initialSubjects.map((sub) => (
          <Link key={sub.id} href={`/student/subjects/${sub.id}`}>
            <Card className="relative h-full overflow-hidden border-border/60 bg-card/85 backdrop-blur flex flex-col justify-between hover:border-primary/50 transition-colors">
              {/* Color Accent bar */}
              <div className="h-2 w-full" style={{ backgroundColor: sub.color }} />
              
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl font-bold">{sub.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-2 mt-1">
                  View your chapters, notes, and homework.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="grid grid-cols-2 gap-2 border-t border-border/40 pt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-primary" /> {sub.chapters?.length || 0} Chapters
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-primary" /> {sub.notes?.length || 0} Notes
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <FolderHeart className="h-4 w-4 text-primary" /> {(sub.homework?.length || 0) + (sub.tests?.length || 0)} Assignments
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {!initialSubjects.length && (
          <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/20 text-center p-6">
            <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-semibold">No subjects available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
