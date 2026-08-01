"use client";

import { useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, FileText, CheckCircle2, AlertCircle, X, ExternalLink, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CloudinaryUploader } from '@/components/notes/CloudinaryUploader';
import { getCloudinaryDownloadUrl } from '@/lib/utils';

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Submission {
  id: string;
  homeworkId: string;
  studentId: string;
  submittedAt: string | Date;
  status: 'PENDING' | 'SUBMITTED' | 'LATE';
  textAnswer: string | null;
  attachments: any;
  feedback: string | null;
  score: number | null;
  student: Student;
}

interface Homework {
  id: string;
  title: string;
  instructions: string;
  dueDate: string | Date;
  subjectId: string;
  chapterId: string | null;
  attachments: any;
  subject: { name: string; color: string };
  chapter: { name: string } | null;
  submissions: Submission[];
  assignedStudentIds: string[];
}

interface AdminHomeworkClientProps {
  initialHomework: any[];
  subjects: any[];
  students: Student[];
  fixedSubjectId?: string;
  fixedChapterId?: string;
}

export function AdminHomeworkClient({ initialHomework, subjects, students, fixedSubjectId, fixedChapterId }: AdminHomeworkClientProps) {
  const [homeworkList, setHomeworkList] = useState<Homework[]>(initialHomework);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
  const [selectedHomeworkForGrading, setSelectedHomeworkForGrading] = useState<Homework | null>(null);
  const [filter, setFilter] = useState<'active' | 'past' | 'all'>('active');

  // Form states
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(fixedSubjectId || subjects[0]?.id || '');
  const [selectedChapterId, setSelectedChapterId] = useState(fixedChapterId || '');
  const [uploadedAttachments, setUploadedAttachments] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Grading form states
  const [gradingFeedback, setGradingFeedback] = useState<Record<string, string>>({});
  const [gradingScore, setGradingScore] = useState<Record<string, string>>({});
  const [gradingSubmitting, setGradingSubmitting] = useState<Record<string, boolean>>({});
  const [editingGrades, setEditingGrades] = useState<Record<string, boolean>>({});

  // Reassignment form states
  const [reassigningSubmission, setReassigningSubmission] = useState<Submission | null>(null);
  const [reassignInstructions, setReassignInstructions] = useState('');
  const [reassignDueDate, setReassignDueDate] = useState('');
  const [reassignSubmitting, setReassignSubmitting] = useState(false);

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
  const chapters = selectedSubject?.chapters || [];

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    const sub = subjects.find(s => s.id === subjectId);
    setSelectedChapterId(sub?.chapters[0]?.id || '');
  };

  const openCreateForm = () => {
    setEditingHomework(null);
    setTitle('');
    setInstructions('');
    
    // Default due date: tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDueDate(tomorrow.toISOString().slice(0, 16));
    
    const firstSubId = fixedSubjectId || subjects[0]?.id || '';
    setSelectedSubjectId(firstSubId);
    if (!fixedChapterId) {
      const firstSub = subjects.find(s => s.id === firstSubId);
      setSelectedChapterId(firstSub?.chapters[0]?.id || '');
    } else {
      setSelectedChapterId(fixedChapterId);
    }
    setUploadedAttachments([]);
    setSelectedStudentIds(students.map(s => s.id)); // Default to all students
    setIsFormOpen(true);
  };

  const openEditForm = (hw: Homework) => {
    setEditingHomework(hw);
    setTitle(hw.title);
    setInstructions(hw.instructions);
    
    const formattedDate = new Date(hw.dueDate).toISOString().slice(0, 16);
    setDueDate(formattedDate);
    
    setSelectedSubjectId(hw.subjectId);
    setSelectedChapterId(hw.chapterId || '');
    setUploadedAttachments(Array.isArray(hw.attachments) ? hw.attachments : []);
    setSelectedStudentIds(hw.assignedStudentIds || []);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !instructions || !dueDate || !selectedSubjectId) {
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
      instructions,
      dueDate: new Date(dueDate).toISOString(),
      subjectId: selectedSubjectId,
      chapterId: selectedChapterId || undefined,
      attachments: uploadedAttachments,
      assignedStudentIds: selectedStudentIds
    };

    try {
      if (editingHomework) {
        // Edit flow
        const res = await fetch(`/api/homework/${editingHomework.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Update failed');
        const updated = await res.json();
        
        setHomeworkList(prev => prev.map(h => h.id === editingHomework.id ? {
          ...h,
          ...updated.data,
          subject: subjects.find((s: any) => s.id === selectedSubjectId),
          chapter: chapters.find((c: any) => c.id === selectedChapterId) || null
        } : h));
      } else {
        // Create flow
        const res = await fetch('/api/homework', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Create failed');
        const created = await res.json();
        
        setHomeworkList(prev => [
          {
            ...created.data,
            subject: subjects.find((s: any) => s.id === selectedSubjectId),
            chapter: chapters.find((c: any) => c.id === selectedChapterId) || null,
            submissions: []
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
    if (!confirm('Are you sure you want to delete this homework? This will delete all student submissions too.')) return;

    try {
      const res = await fetch(`/api/homework/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Delete failed');
      setHomeworkList(prev => prev.filter(h => h.id !== id));
      if (selectedHomeworkForGrading?.id === id) {
        setSelectedHomeworkForGrading(null);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleGradeSubmit = async (submissionId: string) => {
    const feedback = gradingFeedback[submissionId] || '';
    const score = gradingScore[submissionId] || '';

    if (score === '') {
      alert('Please enter a score.');
      return;
    }

    setGradingSubmitting(prev => ({ ...prev, [submissionId]: true }));

    try {
      const res = await fetch('/api/homework/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          feedback,
          score
        })
      });

      if (!res.ok) throw new Error('Grading failed');
      const updated = await res.json();

      // Update in local state
      setHomeworkList(prev => prev.map(hw => {
        if (hw.submissions.some(s => s.id === submissionId)) {
          return {
            ...hw,
            submissions: hw.submissions.map(s => s.id === submissionId ? { ...s, ...updated.data } : s)
          };
        }
        return hw;
      }));

      // Update active grading view
      if (selectedHomeworkForGrading) {
        setSelectedHomeworkForGrading(prev => {
          if (!prev) return null;
          return {
            ...prev,
            submissions: prev.submissions.map(s => s.id === submissionId ? { ...s, ...updated.data } : s)
          };
        });
      }

      // Auto-reassign modal trigger if score < 5
      if (Number(score) < 5) {
        setReassigningSubmission(selectedHomeworkForGrading?.submissions.find(s => s.id === submissionId) || null);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setReassignDueDate(tomorrow.toISOString().slice(0, 16));
      } else {
        alert('Homework graded successfully!');
      }

      setEditingGrades(prev => ({ ...prev, [submissionId]: false }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGradingSubmitting(prev => ({ ...prev, [submissionId]: false }));
    }
  };

  const handleUngradeSubmit = async (submissionId: string) => {
    if (!confirm('Are you sure you want to ungrade this submission? The score and feedback will be removed.')) return;
    
    setGradingSubmitting(prev => ({ ...prev, [submissionId]: true }));
    try {
      const res = await fetch('/api/homework/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          feedback: null,
          score: null
        })
      });

      if (!res.ok) throw new Error('Ungrading failed');
      const updated = await res.json();

      setHomeworkList(prev => prev.map(hw => {
        if (hw.submissions.some(s => s.id === submissionId)) {
          return {
            ...hw,
            submissions: hw.submissions.map(s => s.id === submissionId ? { ...s, ...updated.data } : s)
          };
        }
        return hw;
      }));

      if (selectedHomeworkForGrading) {
        setSelectedHomeworkForGrading(prev => {
          if (!prev) return null;
          return {
            ...prev,
            submissions: prev.submissions.map(s => s.id === submissionId ? { ...s, ...updated.data } : s)
          };
        });
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGradingSubmitting(prev => ({ ...prev, [submissionId]: false }));
    }
  };

  const handleReassignSubmit = async (sub: Submission, hw: Homework) => {
    if (!reassignInstructions.trim() || !reassignDueDate) {
      alert("Please provide additional instructions and a new due date.");
      return;
    }

    setReassignSubmitting(true);
    const combinedInstructions = `[REASSIGNMENT INSTRUCTIONS]\n${reassignInstructions}\n\n------------------------\n[ORIGINAL INSTRUCTIONS]\n${hw.instructions}`;

    const payload = {
      title: `[Reassigned] ${hw.title}`,
      instructions: combinedInstructions,
      dueDate: new Date(reassignDueDate).toISOString(),
      subjectId: hw.subjectId,
      chapterId: hw.chapterId || undefined,
      attachments: hw.attachments,
      assignedStudentIds: [sub.studentId]
    };

    try {
      const res = await fetch('/api/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to reassign homework');
      const created = await res.json();
      
      setHomeworkList(prev => [
        {
          ...created.data,
          subject: subjects.find((s: any) => s.id === hw.subjectId),
          chapter: chapters.find((c: any) => c.id === hw.chapterId) || null,
          submissions: []
        },
        ...prev
      ]);

      alert('Homework reassigned successfully! The student will see it in their pending tasks.');
      setReassigningSubmission(null);
      setReassignInstructions('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReassignSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {!fixedChapterId && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Class Work</p>
            <h2 className="mt-2 font-[var(--font-heading)] text-4xl">Manage Homework</h2>
          </div>
          <Button onClick={openCreateForm} className="flex items-center gap-2 rounded-2xl shadow-glow">
            <Plus className="h-4 w-4" /> Create Homework
          </Button>
        </div>
      )}
      {fixedChapterId && (
        <div className="flex justify-end">
          <Button onClick={openCreateForm} className="flex items-center gap-2 rounded-2xl shadow-glow">
            <Plus className="h-4 w-4" /> Create Homework
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Homework List Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h3 className="font-semibold text-lg">Homework Assignments</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('active')}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  filter === 'active'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('past')}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  filter === 'past'
                    ? 'bg-destructive text-destructive-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Past Due
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  filter === 'all'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                All
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {homeworkList
              .filter(hw => {
                if (filter === 'all') return true;
                const isPastDue = new Date() > new Date(hw.dueDate);
                if (filter === 'active') return !isPastDue;
                if (filter === 'past') return isPastDue;
                return true;
              })
              .map((hw) => {
              const isPastDue = new Date() > new Date(hw.dueDate);
              const submissionCount = hw.submissions.length;
              
              return (
                <Card key={hw.id} className={`overflow-hidden border-border/60 bg-card/85 backdrop-blur hover:border-primary/30 transition-all ${
                  selectedHomeworkForGrading?.id === hw.id ? 'ring-2 ring-primary/20' : ''
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {!fixedSubjectId && (
                          <Badge style={{ backgroundColor: `${hw.subject.color}15`, color: hw.subject.color, borderColor: `${hw.subject.color}30` }} variant="outline">
                            {hw.subject.name}
                          </Badge>
                        )}
                        {!fixedChapterId && hw.chapter && (
                          <span className="text-xs text-muted-foreground">{hw.chapter.name}</span>
                        )}
                      </div>
                      <Badge variant={isPastDue ? "destructive" : "secondary"} className="text-[10px] flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due {new Date(hw.dueDate).toLocaleDateString()} {new Date(hw.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{hw.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-foreground/80 line-clamp-2">{hw.instructions}</p>
                    
                    {/* Attachments preview */}
                    {Array.isArray(hw.attachments) && hw.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {hw.attachments.map((att: any, idx: number) => (
                          <a 
                            key={idx}
                            href={getCloudinaryDownloadUrl(att.url, att.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="flex items-center gap-1 text-[10px] font-medium border border-border/60 rounded-xl px-3 py-1.5 hover:bg-muted bg-background/50"
                          >
                            <FileText className="h-3 w-3 text-primary" /> {att.name || 'Attachment'}
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-border/40 pt-3 mb-3">
                      <span className="text-[10px] font-semibold text-foreground/90 uppercase block mb-1">Assigned To:</span>
                      <p className="text-xs text-foreground line-clamp-2">
                        {!hw.assignedStudentIds?.length || hw.assignedStudentIds?.length === students.length 
                          ? 'All Students' 
                          : hw.assignedStudentIds?.map(id => students.find(s => s.id === id)?.name).filter(Boolean).join(', ') || 'No students assigned'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/40 pt-3">
                      <span className="text-xs text-foreground/80">
                        {submissionCount} / {hw.assignedStudentIds?.length || students.length} Submissions
                      </span>

                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedHomeworkForGrading(hw);
                            // Load existing grading feedback/score values
                            const feedback: Record<string, string> = {};
                            const scores: Record<string, string> = {};
                            hw.submissions.forEach(sub => {
                              feedback[sub.id] = sub.feedback || '';
                              scores[sub.id] = sub.score !== null ? String(sub.score) : '';
                            });
                            setGradingFeedback(feedback);
                            setGradingScore(scores);
                          }}
                          className="rounded-xl flex items-center gap-1"
                        >
                          <GraduationCap className="h-4 w-4" /> Grade submissions
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-accent rounded-lg" onClick={() => openEditForm(hw)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-destructive/10 rounded-lg" onClick={() => handleDelete(hw.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {!homeworkList.filter(hw => {
                if (filter === 'all') return true;
                const isPastDue = new Date() > new Date(hw.dueDate);
                return filter === 'active' ? !isPastDue : isPastDue;
              }).length && (
              <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/20 text-center p-6">
                <p className="text-muted-foreground">No homework tasks created yet. Click "Create Homework" to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Grading Panel */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Grading Desk</h3>
          
          {selectedHomeworkForGrading ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-border/60 bg-card p-5">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-lg leading-tight">{selectedHomeworkForGrading.title}</h4>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setSelectedHomeworkForGrading(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Grade and provide feedback to students below.</p>
              </div>

              {selectedHomeworkForGrading.submissions.length ? selectedHomeworkForGrading.submissions.map((sub) => (
                <Card key={sub.id} className="border-border/60 bg-card/85 backdrop-blur overflow-hidden">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <div className="flex justify-between items-center gap-2">
                      <div>
                        <h4 className="font-semibold text-sm">{sub.student.name}</h4>
                        <p className="text-[10px] text-muted-foreground">{sub.student.email}</p>
                      </div>
                      <Badge variant={sub.score !== null ? 'default' : sub.status === 'LATE' ? 'destructive' : 'secondary'} className="text-[9px]">
                        {sub.score !== null ? 'Graded' : sub.status === 'LATE' ? 'Submitted Late' : 'Submitted'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {sub.textAnswer && (
                      <div className="rounded-2xl bg-muted p-4 space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground">Student Response:</p>
                        <p className="text-sm whitespace-pre-wrap">{sub.textAnswer}</p>
                      </div>
                    )}

                    {/* Student Attachments */}
                    {Array.isArray(sub.attachments) && sub.attachments.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold text-muted-foreground">Uploaded Work:</p>
                        <div className="flex flex-wrap gap-2">
                          {sub.attachments.map((att: any, idx: number) => (
                            <a 
                              key={idx}
                              href={getCloudinaryDownloadUrl(att.url, att.name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="flex items-center gap-1 text-[10px] font-medium border border-border/60 rounded-xl px-3 py-1.5 hover:bg-muted bg-background/50"
                            >
                              <FileText className="h-3.5 w-3.5 text-primary" /> {att.name || 'Worksheet'} <ExternalLink className="h-2.5 w-2.5 ml-1" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Grading Form */}
                    <div className="space-y-3 pt-3 border-t border-border/40">
                      {sub.score !== null && !editingGrades[sub.id] ? (
                        <div className={`rounded-2xl border ${Number(sub.score) < 5 ? 'border-red-500/20 bg-red-500/5' : 'border-emerald-500/20 bg-emerald-500/5'} p-4 space-y-3`}>
                          <div className="flex items-center justify-between">
                            <div className={`flex items-center gap-2 ${Number(sub.score) < 5 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'} font-bold text-sm`}>
                              <CheckCircle2 className="h-4 w-4" /> Graded & Reviewed
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => {
                                setReassigningSubmission(sub);
                                const tomorrow = new Date();
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                setReassignDueDate(tomorrow.toISOString().slice(0, 16));
                              }} className="h-7 text-xs bg-background">
                                Reassign
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setEditingGrades(prev => ({...prev, [sub.id]: true}))} className="h-7 text-xs hover:bg-background/50">
                                <Edit2 className="h-3 w-3 mr-1" /> Edit
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleUngradeSubmit(sub.id)} disabled={gradingSubmitting[sub.id]} className="h-7 text-xs hover:bg-destructive/10 hover:text-destructive">
                                <Trash2 className="h-3 w-3 mr-1" /> Ungrade
                              </Button>
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Score</span>
                              <span className={`text-xl font-black ${Number(sub.score) < 5 ? 'text-red-600 dark:text-red-400' : 'text-primary'}`}>{sub.score}</span>
                            </div>
                            {sub.feedback && (
                              <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Feedback</span>
                                <span className={`text-sm ${Number(sub.score) < 5 ? 'text-red-700 dark:text-red-300' : 'text-foreground'}`}>{sub.feedback}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-4 items-center">
                            <div className="space-y-1 w-24">
                              <Label htmlFor={`score-${sub.id}`} className="text-xs">Score</Label>
                              <Input
                                id={`score-${sub.id}`}
                                type="number"
                                step="0.5"
                                placeholder="Score"
                                value={gradingScore[sub.id] || ''}
                                onChange={(e) => setGradingScore(prev => ({ ...prev, [sub.id]: e.target.value }))}
                              />
                            </div>
                            <div className="flex-1 space-y-1">
                              <Label htmlFor={`feedback-${sub.id}`} className="text-xs">Feedback / Comments</Label>
                              <Input
                                id={`feedback-${sub.id}`}
                                placeholder="Great job! Keep it up."
                                value={gradingFeedback[sub.id] || ''}
                                onChange={(e) => setGradingFeedback(prev => ({ ...prev, [sub.id]: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleGradeSubmit(sub.id)}
                              disabled={gradingSubmitting[sub.id]}
                              className="flex-1 rounded-xl flex items-center justify-center gap-1 text-xs"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> 
                              {gradingSubmitting[sub.id] ? 'Saving...' : (sub.score !== null ? 'Update Grade' : 'Submit Grade & Review')}
                            </Button>
                            {sub.score !== null && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingGrades(prev => ({...prev, [sub.id]: false}))}
                                className="rounded-xl text-xs"
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/20 text-center p-6 min-h-[200px]">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">No submissions have been uploaded for this homework yet.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/20 text-center p-6 min-h-[300px]">
              <GraduationCap className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">Select a homework assignment and click "Grade Submissions" to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Homework Creation Modal */}
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
                {editingHomework ? 'Edit Homework Assignment' : 'Create Homework Assignment'}
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
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="chapter">Chapter (Optional)</Label>
                      <select
                        id="chapter"
                        value={selectedChapterId}
                        onChange={(e) => setSelectedChapterId(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">No Chapter Assigned</option>
                        {chapters.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="title">Homework Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Chapter 2 Fraction Worksheet"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dueDate">Due Date & Time *</Label>
                    <Input
                      id="dueDate"
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="instructions">Instructions / Questions *</Label>
                  <Textarea
                    id="instructions"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Enter instructions, questions, or requirements..."
                    required
                    rows={4}
                  />
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

                {/* Attachments */}
                <div className="space-y-2 border-t border-border/40 pt-4">
                  <Label>Homework Worksheets / Documents (Optional)</Label>
                  <CloudinaryUploader
                    value={uploadedAttachments}
                    onChange={setUploadedAttachments}
                    accept="image/*,application/pdf"
                    folder="homework_attachments"
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-border/40 pt-4 mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={submitting} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="rounded-xl shadow-glow">
                    {submitting ? 'Saving...' : editingHomework ? 'Save Changes' : 'Publish Homework'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reassign Modal */}
      <AnimatePresence>
        {reassigningSubmission && selectedHomeworkForGrading && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl rounded-3xl border border-border/60 bg-background/95 p-6 shadow-2xl backdrop-blur max-h-[90vh] overflow-y-auto"
            >
              <h3 className="font-[var(--font-heading)] text-2xl font-bold mb-4">Reassign Homework</h3>
              <div className="space-y-4">
                <div className="border border-border/60 bg-muted/30 p-3 rounded-xl flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                    {reassigningSubmission.student.name[0]}
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Reassigning to</Label>
                    <p className="font-semibold text-sm">{reassigningSubmission.student.name}</p>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="reassignDueDate">New Due Date & Time *</Label>
                  <Input
                    id="reassignDueDate"
                    type="datetime-local"
                    value={reassignDueDate}
                    onChange={(e) => setReassignDueDate(e.target.value)}
                    className="rounded-xl h-10"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reassignInstructions">Additional Instructions for Student *</Label>
                  <Textarea
                    id="reassignInstructions"
                    value={reassignInstructions}
                    onChange={(e) => setReassignInstructions(e.target.value)}
                    placeholder="E.g., Please redo questions 4 and 5 as per my feedback..."
                    rows={4}
                    className="rounded-xl"
                  />
                </div>
                
                <div className="bg-muted p-4 rounded-xl border border-border/40">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground mb-2 block">Original Instructions Reference</Label>
                  <p className="text-xs whitespace-pre-wrap line-clamp-3 text-foreground/80">{selectedHomeworkForGrading.instructions}</p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border/40 mt-4">
                  <Button variant="outline" onClick={() => setReassigningSubmission(null)} disabled={reassignSubmitting} className="rounded-xl">Cancel</Button>
                  <Button onClick={() => handleReassignSubmit(reassigningSubmission, selectedHomeworkForGrading)} disabled={reassignSubmitting} className="rounded-xl shadow-glow">
                    {reassignSubmitting ? 'Reassigning...' : 'Confirm Reassign'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
