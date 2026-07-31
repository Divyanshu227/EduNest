"use client";

import { useState } from 'react';
import { Calendar, FileText, CheckCircle2, AlertCircle, Send, ExternalLink, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CloudinaryUploader } from '@/components/notes/CloudinaryUploader';

interface Homework {
  id: string;
  title: string;
  instructions: string;
  dueDate: string | Date;
  subjectId: string;
  attachments: any;
  subject: { name: string; color: string };
  chapter: { name: string } | null;
  submissions: any[];
}

interface StudentHomeworkClientProps {
  homeworkList: Homework[];
  fixedSubjectId?: string;
  fixedChapterId?: string;
}

export function StudentHomeworkClient({ homeworkList: initialList, fixedSubjectId, fixedChapterId }: StudentHomeworkClientProps) {
  const [homeworkList, setHomeworkList] = useState<Homework[]>(initialList);
  const [selectedHwId, setSelectedHwId] = useState<string>(homeworkList[0]?.id || '');
  const [filter, setFilter] = useState<'todo' | 'overdue' | 'in_review' | 'completed'>('todo');

  // Submission Form State
  const [textAnswer, setTextAnswer] = useState('');
  const [uploadedAttachments, setUploadedAttachments] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const selectedHw = homeworkList.find(h => h.id === selectedHwId);
  const userSubmission = selectedHw?.submissions[0] || null;

  // Split homework by status and date
  const now = new Date();
  
  const todoHomework = homeworkList
    .filter(h => h.submissions.length === 0 && new Date(h.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const overdueHomework = homeworkList
    .filter(h => h.submissions.length === 0 && new Date(h.dueDate) < now)
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  const inReviewHomework = homeworkList
    .filter(h => h.submissions.length > 0 && h.submissions[0].score === null)
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  const completedHomework = homeworkList
    .filter(h => h.submissions.length > 0 && h.submissions[0].score !== null)
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  const activeList = 
    filter === 'todo' ? todoHomework : 
    filter === 'overdue' ? overdueHomework : 
    filter === 'in_review' ? inReviewHomework :
    completedHomework;

  const handleSelectHomework = (hw: Homework) => {
    setSelectedHwId(hw.id);
    const sub = hw.submissions[0] || null;
    setTextAnswer(sub?.textAnswer || '');
    setUploadedAttachments(Array.isArray(sub?.attachments) ? sub.attachments : []);
  };

  const handleSubmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHwId) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/homework/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeworkId: selectedHwId,
          textAnswer,
          attachments: uploadedAttachments
        })
      });

      if (!res.ok) throw new Error('Submission failed');
      const data = await res.json();

      // Update the local list state
      setHomeworkList(prev => prev.map(h => h.id === selectedHwId ? {
        ...h,
        submissions: [data.data]
      } : h));

      alert('Homework submitted successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {!fixedSubjectId && (
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Student Center</p>
          <h2 className="mt-2 font-[var(--font-heading)] text-3xl sm:text-4xl">My Homework</h2>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border/40 pb-3">
        <button
          onClick={() => {
            setFilter('todo');
            if (todoHomework[0]) handleSelectHomework(todoHomework[0]);
          }}
          className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-all sm:px-5 ${
            filter === 'todo'
              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
              : 'border-border/60 bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          To-Do ({todoHomework.length})
        </button>
        <button
          onClick={() => {
            setFilter('overdue');
            if (overdueHomework[0]) handleSelectHomework(overdueHomework[0]);
          }}
          className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-all sm:px-5 ${
            filter === 'overdue'
              ? 'border-destructive bg-destructive text-destructive-foreground shadow-sm'
              : 'border-border/60 bg-card text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
          }`}
        >
          Overdue ({overdueHomework.length})
        </button>
        <button
          onClick={() => {
            setFilter('in_review');
            if (inReviewHomework[0]) handleSelectHomework(inReviewHomework[0]);
          }}
          className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-all sm:px-5 ${
            filter === 'in_review'
              ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
              : 'border-border/60 bg-card text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500'
          }`}
        >
          In Review ({inReviewHomework.length})
        </button>
        <button
          onClick={() => {
            setFilter('completed');
            if (completedHomework[0]) handleSelectHomework(completedHomework[0]);
          }}
          className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-all sm:px-5 ${
            filter === 'completed'
              ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
              : 'border-border/60 bg-card text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500'
          }`}
        >
          Completed ({completedHomework.length})
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        {/* Active homework list */}
        <div className="space-y-3 min-w-0">
          {activeList.map((hw) => {
            const isActive = hw.id === selectedHwId;
            const isPastDue = new Date() > new Date(hw.dueDate);
            const sub = hw.submissions[0];
            
            return (
              <button
                key={hw.id}
                onClick={() => handleSelectHomework(hw)}
                className={`w-full text-left rounded-3xl border p-5 transition-all ${
                  isActive
                    ? 'border-primary bg-primary/5 shadow-glow ring-2 ring-primary/20'
                    : 'border-border/60 bg-card hover:bg-card/85'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-3">
                  {!fixedSubjectId && (
                    <Badge style={{ backgroundColor: `${hw.subject.color}15`, color: hw.subject.color, borderColor: `${hw.subject.color}30` }} variant="outline">
                      {hw.subject.name}
                    </Badge>
                  )}
                  {sub && (
                    <Badge variant={sub.status === 'LATE' ? 'destructive' : 'secondary'} className="text-[9px]">
                      {sub.status === 'LATE' ? 'Submitted Late' : 'Submitted'}
                    </Badge>
                  )}
                  {!sub && isPastDue && (
                    <Badge variant="destructive" className="text-[9px]">
                      Overdue
                    </Badge>
                  )}
                </div>
                <h4 className="font-semibold text-base line-clamp-1">{hw.title}</h4>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Due {new Date(hw.dueDate).toLocaleDateString()}
                </p>
              </button>
            );
          })}

          {!activeList.length && (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/20 text-center p-6 min-h-[200px]">
              <HelpCircle className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No homework tasks in this category.</p>
            </div>
          )}
        </div>

        {/* Selected Homework detail and Submission box */}
        <div className="min-w-0">
          {selectedHw ? (
            <Card className="min-w-0 border-border/60 bg-card/85 backdrop-blur">
              <CardHeader className="pb-4 border-b border-border/40">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-2xl">{selectedHw.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {selectedHw.chapter ? selectedHw.chapter.name : 'General syllabus'}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Due {new Date(selectedHw.dueDate).toLocaleDateString()} {new Date(selectedHw.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Instructions */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Instructions:</h4>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{selectedHw.instructions}</p>
                </div>

                {/* Teacher Attachments */}
                {Array.isArray(selectedHw.attachments) && selectedHw.attachments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Download Worksheets:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedHw.attachments.map((att: any, idx: number) => (
                        <a 
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold border border-border/60 rounded-xl px-4 py-2 hover:bg-muted bg-background/50"
                        >
                          <FileText className="h-4 w-4 text-primary" /> {att.name || 'Attachment'} <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submission status or editor */}
                {userSubmission ? (
                  // Submitted view
                  <div className={`rounded-3xl border p-5 space-y-4 ${
                    userSubmission.score !== null 
                      ? 'border-emerald-500/20 bg-emerald-500/5' 
                      : 'border-amber-500/20 bg-amber-500/5'
                  }`}>
                    <div className={`flex items-center gap-2 font-bold text-lg ${
                      userSubmission.score !== null ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {userSubmission.score !== null ? (
                        <><CheckCircle2 className="h-5 w-5" /> Graded & Approved</>
                      ) : (
                        <><AlertCircle className="h-5 w-5" /> Pending Teacher Review</>
                      )}
                    </div>
                    
                    {userSubmission.score !== null && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="bg-background/80 rounded-2xl p-4 border border-border/40">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold block">Score</span>
                          <span className="text-3xl font-black text-primary">{userSubmission.score}</span>
                        </div>
                        {userSubmission.feedback && (
                          <div className="bg-background/80 rounded-2xl p-4 border border-border/40">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Teacher Feedback</span>
                            <span className="text-sm text-foreground mt-1 block">{userSubmission.feedback}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="bg-background/80 rounded-2xl p-4 border border-border/40 mt-4">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-2">Your Submission Details</span>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{userSubmission.textAnswer || 'No written response.'}</p>
                      
                      {Array.isArray(userSubmission.attachments) && userSubmission.attachments.length > 0 && (
                        <div className="mt-4">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-2">Attached Files</span>
                          <div className="flex flex-wrap gap-2">
                            {userSubmission.attachments.map((att: any, idx: number) => (
                              <a 
                                key={idx}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs font-semibold border border-border/60 rounded-xl px-4 py-2 hover:bg-muted bg-background/50"
                              >
                                <FileText className="h-4 w-4 text-primary" /> {att.name || 'Attachment'} <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Editable/Submit view
                  <form onSubmit={handleSubmissionSubmit} className="space-y-4 border-t border-border/40 pt-6">
                    <h4 className="font-bold text-base">Submit My Answer Sheets</h4>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="textAnswer">Written Notes / Comments</Label>
                      <Textarea
                        id="textAnswer"
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        placeholder="Write a message or summary of your work..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Scanned Answer Sheets / Images / PDFs</Label>
                      <CloudinaryUploader
                        value={uploadedAttachments}
                        onChange={setUploadedAttachments}
                        accept="image/*,application/pdf,video/*"
                        folder="submissions_attachments"
                      />
                    </div>

                    <Button type="submit" disabled={submitting} className="w-full rounded-2xl shadow-glow flex items-center justify-center gap-2">
                      <Send className="h-4 w-4" /> {submitting ? 'Submitting...' : 'Upload Submission'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-card p-6 min-h-[400px]">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Select a homework assignment from the side list to read instructions and submit.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
