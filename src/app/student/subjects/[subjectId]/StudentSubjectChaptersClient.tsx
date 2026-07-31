"use client";

import Link from 'next/link';
import { ArrowLeft, BookOpen, FolderHeart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Chapter {
  id: string;
  name: string;
  order: number;
  notes: { id: string }[];
  homework: { id: string }[];
  tests: { id: string }[];
}

interface StudentSubjectChaptersClientProps {
  subject: any;
  chapters: Chapter[];
}

export function StudentSubjectChaptersClient({ subject, chapters }: StudentSubjectChaptersClientProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/student/subjects" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to Subjects
          </Link>
          <div className="flex items-center gap-3">
            <h2 className="font-[var(--font-heading)] text-4xl">{subject.name} Chapters</h2>
            <Badge style={{ backgroundColor: `${subject.color}15`, color: subject.color, borderColor: `${subject.color}30` }} variant="outline" className="text-sm px-3 py-1 font-bold">
              {chapters.length} Chapters
            </Badge>
          </div>
        </div>
      </div>

      {/* Chapters Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {chapters.map((ch) => (
          <Link key={ch.id} href={`/student/subjects/${subject.id}/chapters/${ch.id}`}>
            <Card className="border-border/60 bg-card/85 backdrop-blur overflow-hidden transition-all hover:border-primary/50 relative h-full flex flex-col justify-between">
              <CardHeader className="p-4 pb-2">
                <Badge variant="outline" className="text-[10px] w-fit mb-2">Chapter {ch.order}</Badge>
                <CardTitle className="text-lg font-bold mt-1.5 leading-tight">{ch.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-2 gap-2 border-t border-border/40 pt-3 text-xs text-muted-foreground mt-2">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-primary" /> {ch.notes?.length || 0} Notes
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FolderHeart className="h-4 w-4 text-primary" /> {(ch.homework?.length || 0) + (ch.tests?.length || 0)} Assignments
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {!chapters.length && (
          <div className="col-span-full flex h-24 flex-col items-center justify-center rounded-3xl border border-dashed border-border/40 bg-muted/10 text-center p-4">
            <p className="text-muted-foreground">No chapters available for this subject.</p>
          </div>
        )}
      </div>
    </div>
  );
}
