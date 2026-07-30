"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Timer, FileText, CheckCircle2, AlertCircle, ArrowRight, Play, Eye, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Question {
  id: string;
  marks: number;
}

interface TestAttempt {
  id: string;
  score: number;
  percentage: number;
  completedAt: string | Date;
}

interface Test {
  id: string;
  title: string;
  description: string | null;
  durationMin: number;
  isPublished: boolean;
  subjectId: string;
  subject: { name: string; color: string };
  chapter: { name: string } | null;
  questions: Question[];
  attempts: TestAttempt[];
}

interface StudentTestsClientProps {
  tests: Test[];
}

export function StudentTestsClient({ tests }: StudentTestsClientProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const pendingTests = tests.filter(t => t.attempts.length === 0);
  const completedTests = tests.filter(t => t.attempts.length > 0);

  const getFilteredList = () => {
    if (filter === 'pending') return pendingTests;
    if (filter === 'completed') return completedTests;
    return tests;
  };

  const activeList = getFilteredList();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Student Console</p>
        <h2 className="mt-2 font-[var(--font-heading)] text-3xl sm:text-4xl">Quizzes & Tests</h2>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border/40 pb-3">
        {[
          ['all', `All Tests (${tests.length})`],
          ['pending', `Pending (${pendingTests.length})`],
          ['completed', `Completed (${completedTests.length})`]
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-all sm:px-5 ${
              filter === key
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border/60 bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid of Quizzes */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {activeList.map((test) => {
          const attempt = test.attempts[0] || null;
          const totalMarks = test.questions.reduce((acc, q) => acc + q.marks, 0);

          return (
            <Card key={test.id} className="relative overflow-hidden border-border/60 bg-card/85 backdrop-blur hover:shadow-lg transition-all flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge style={{ backgroundColor: `${test.subject.color}15`, color: test.subject.color, borderColor: `${test.subject.color}30` }} variant="outline">
                    {test.subject.name}
                  </Badge>
                  {attempt ? (
                    <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      Completed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] border-primary/20 bg-primary/5 text-primary">
                      Ready to Start
                    </Badge>
                  )}
                </div>
                <CardTitle className="line-clamp-1">{test.title}</CardTitle>
                <CardDescription className="line-clamp-2 mt-1 min-h-[40px]">
                  {test.description || 'Test your knowledge on this syllabus material.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border/40 pt-3">
                  <div className="flex items-center gap-1">
                    <Timer className="h-3.5 w-3.5" />
                    <span>{test.durationMin} Min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{test.questions.length} Questions</span>
                  </div>
                </div>

                {/* Score indicator if completed */}
                {attempt && (
                  <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 px-4 py-3 flex items-center justify-between text-sm">
                    <span className="font-semibold text-muted-foreground">My Score:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-lg">
                      {attempt.score} / {totalMarks} ({attempt.percentage}%)
                    </span>
                  </div>
                )}

                {/* Action button */}
                <div className="flex items-center justify-end border-t border-border/40 pt-3 mt-2">
                  {attempt ? (
                    <Link 
                      href={`/student/tests/${test.id}`}
                      className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 border border-border/60 hover:bg-muted rounded-2xl transition-all"
                    >
                      <Eye className="h-4 w-4" /> Review Answers
                    </Link>
                  ) : (
                    <Link 
                      href={`/student/tests/${test.id}`}
                      className="flex items-center gap-1.5 text-xs font-semibold px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl hover:opacity-90 shadow-glow transition-all"
                      style={{ backgroundColor: test.subject.color }}
                    >
                      <Play className="h-3.5 w-3.5 fill-current" /> Start Test
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {!activeList.length && (
          <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/20 text-center p-6">
            <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No tests found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
