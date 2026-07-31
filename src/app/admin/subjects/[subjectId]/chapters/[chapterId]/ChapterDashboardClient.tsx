"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, FolderHeart, Settings2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AdminNotesClient } from '@/app/admin/notes/AdminNotesClient';
import { AdminHomeworkClient } from '@/app/admin/homework/AdminHomeworkClient';
import { AdminTestsClient } from '@/app/admin/tests/AdminTestsClient';
import { motion, AnimatePresence } from 'framer-motion';

interface ChapterDashboardClientProps {
  chapter: any;
  subject: any;
  notes: any[];
  homeworks: any[];
  tests: any[];
  students: any[];
  allSubjects: any[];
}

export function ChapterDashboardClient({
  chapter,
  subject,
  notes,
  homeworks,
  tests,
  students,
  allSubjects
}: ChapterDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'notes' | 'homework' | 'tests'>('notes');

  const tabs = [
    { id: 'notes', label: 'Study Notes', icon: BookOpen, count: notes.length },
    { id: 'homework', label: 'Homework', icon: FolderHeart, count: homeworks.length },
    { id: 'tests', label: 'Quizzes', icon: Settings2, count: tests.length }
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Link href={`/admin/subjects/${subject.id}`} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 w-fit mb-2">
          <ArrowLeft className="h-4 w-4" /> Back to {subject.name} Chapters
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge style={{ backgroundColor: `${subject.color}15`, color: subject.color, borderColor: `${subject.color}30` }} variant="outline" className="text-xs px-2 py-0.5">
                {subject.name}
              </Badge>
              <Badge variant="secondary" className="text-xs px-2 py-0.5">Chapter {chapter.order}</Badge>
            </div>
            <h2 className="font-[var(--font-heading)] text-3xl md:text-4xl">{chapter.name}</h2>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-2 border-b border-border/40 gap-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors relative whitespace-nowrap ${
                isActive ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : ''}`} />
              <span className="font-medium text-sm">{tab.label}</span>
              <Badge variant={isActive ? 'default' : 'secondary'} className="ml-1 h-5 px-1.5 text-[10px]">
                {tab.count}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="pt-2 min-h-[500px]">
        <AnimatePresence mode="wait">
          {activeTab === 'notes' && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AdminNotesClient 
                initialNotes={notes} 
                subjects={allSubjects} 
                students={students} 
                fixedSubjectId={subject.id} 
                fixedChapterId={chapter.id} 
              />
            </motion.div>
          )}

          {activeTab === 'homework' && (
            <motion.div
              key="homework"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AdminHomeworkClient 
                initialHomework={homeworks} 
                subjects={allSubjects} 
                students={students} 
                fixedSubjectId={subject.id} 
                fixedChapterId={chapter.id} 
              />
            </motion.div>
          )}

          {activeTab === 'tests' && (
            <motion.div
              key="tests"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AdminTestsClient 
                initialTests={tests} 
                subjects={allSubjects} 
                fixedSubjectId={subject.id} 
                fixedChapterId={chapter.id} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
