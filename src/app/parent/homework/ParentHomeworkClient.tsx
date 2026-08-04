"use client";

import { useState, useEffect, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, FileText, CheckCircle2, AlertCircle, ExternalLink, HelpCircle, Download, Clock, Paperclip, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CloudinaryUploader } from '@/components/notes/CloudinaryUploader';
import { DownloadLink } from '@/components/ui/download-link';
import { AttachmentViewer } from '@/components/ui/attachment-viewer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface Homework {
  id: string;
  title: string;
  instructions: string;
  dueDate: string | Date;
  createdAt: string | Date;
  subjectId: string;
  attachments: any;
  subject: { name: string; color: string };
  chapter: { name: string } | null;
  submissions: any[];
}

interface ParentHomeworkClientProps {
  homeworkList: Homework[];
  studentId: string;
}

export function ParentHomeworkClient({ homeworkList: initialList, studentId }: ParentHomeworkClientProps) {
  const router = useRouter();
  const [homeworkList, setHomeworkList] = useState<Homework[]>(initialList);
  const [selectedHwId, setSelectedHwId] = useState<string>(homeworkList[0]?.id || '');
  const [filter, setFilter] = useState<'active' | 'in_review' | 'completed' | 'rejected' | 'reassigned'>('active');

  const [textAnswer, setTextAnswer] = useState('');
  const [uploadedAttachments, setUploadedAttachments] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Unsaved changes dialog state
  const [pendingNavHw, setPendingNavHw] = useState<Homework | null>(null);
  const [pendingNavFilter, setPendingNavFilter] = useState<'active' | 'in_review' | 'completed' | 'rejected' | 'reassigned' | null>(null);
  const [pendingExternalNav, setPendingExternalNav] = useState<string | null>(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const selectedHw = homeworkList.find(h => h.id === selectedHwId);
  const userSubmission = selectedHw?.submissions[0] || null;

  const now = new Date();
  
  const activeHomework = homeworkList
    .filter(h => h.submissions.length === 0 && !h.title.startsWith('[Reassigned]'))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()); // Ascending

  const reassignedHomework = homeworkList
    .filter(h => h.submissions.length === 0 && h.title.startsWith('[Reassigned]'))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()); // Ascending

  const inReviewHomework = homeworkList
    .filter(h => h.submissions.length > 0 && h.submissions[0].score === null)
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()); // Descending

  const completedHomework = homeworkList
    .filter(h => h.submissions.length > 0 && h.submissions[0].score !== null && Number(h.submissions[0].score) >= 5)
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()); // Descending

  const rejectedHomework = homeworkList
    .filter(h => h.submissions.length > 0 && h.submissions[0].score !== null && Number(h.submissions[0].score) < 5)
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()); // Descending

  const activeList = 
    filter === 'active' ? activeHomework : 
    filter === 'in_review' ? inReviewHomework :
    filter === 'rejected' ? rejectedHomework :
    filter === 'reassigned' ? reassignedHomework :
    completedHomework;

  const handleSelectHomework = (hw: Homework) => {
    setSelectedHwId(hw.id);
    const sub = hw.submissions[0] || null;
    setTextAnswer(sub?.textAnswer || '');
    setUploadedAttachments(Array.isArray(sub?.attachments) ? sub.attachments : []);
  };

  useEffect(() => {
    const hasUnsavedChanges = uploadedAttachments.length > 0 && !userSubmission;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Shows generic browser warning
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!hasUnsavedChanges) return;
      
      const target = (e.target as Element).closest('a');
      if (target && target.href && target.origin === window.location.origin) {
        e.preventDefault();
        e.stopPropagation();
        setPendingExternalNav(target.href);
        setShowDiscardDialog(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleClick, { capture: true });

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, [uploadedAttachments, userSubmission]);

  const attemptSelectHomework = (hw: Homework) => {
    const hasUnsavedAttachments = uploadedAttachments.length > 0 && !userSubmission;
    const hasUnsavedText = textAnswer.trim().length > 0 && !userSubmission;
    
    if (hasUnsavedAttachments || hasUnsavedText) {
      setPendingNavHw(hw);
      setShowDiscardDialog(true);
    } else {
      handleSelectHomework(hw);
    }
  };

  const attemptSwitchTab = (newFilter: 'active' | 'in_review' | 'completed' | 'rejected' | 'reassigned', hwList: Homework[]) => {
    const hasUnsavedAttachments = uploadedAttachments.length > 0 && !userSubmission;
    const hasUnsavedText = textAnswer.trim().length > 0 && !userSubmission;
    
    if (hasUnsavedAttachments || hasUnsavedText) {
      setPendingNavFilter(newFilter);
      setPendingNavHw(hwList[0] || null);
      setShowDiscardDialog(true);
    } else {
      setFilter(newFilter);
      if (hwList[0]) {
        handleSelectHomework(hwList[0]);
      } else {
        setSelectedHwId('');
        setTextAnswer('');
        setUploadedAttachments([]);
      }
    }
  };

  const handleDiscard = async () => {
    if (uploadedAttachments.length > 0) {
      setIsDiscarding(true);
      try {
        const publicIds = uploadedAttachments.map(att => att.publicId).filter(Boolean);
        if (publicIds.length > 0) {
          await fetch('/api/upload', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicIds })
          });
        }
      } catch (err) {
        console.error('Failed to discard attachments:', err);
      } finally {
        setIsDiscarding(false);
      }
    }
    
    if (pendingExternalNav) {
      setIsNavigating(true);
      window.location.href = pendingExternalNav;
      return;
    }

    setShowDiscardDialog(false);
    if (pendingNavFilter) setFilter(pendingNavFilter);
    if (pendingNavHw) handleSelectHomework(pendingNavHw);
    setPendingNavHw(null);
    setPendingNavFilter(null);
    setPendingExternalNav(null);
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
          attachments: uploadedAttachments,
          studentId
        })
      });

      if (!res.ok) throw new Error('Submission failed');
      const data = await res.json();

      setHomeworkList(prev => prev.map(h => h.id === selectedHwId ? {
        ...h,
        submissions: [data.data]
      } : h));

      alert('Homework submitted successfully on behalf of student!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Parent Console</p>
        <h2 className="mt-2 font-[var(--font-heading)] text-3xl sm:text-4xl">Homework & Assignments</h2>
        <p className="text-sm text-muted-foreground mt-1">Track homework assignments and submission status.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border/40 pb-3">
        <button
          onClick={() => attemptSwitchTab('active', activeHomework)}
          className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-all sm:px-5 ${
            filter === 'active'
              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
              : 'border-border/60 bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Active ({activeHomework.length})
        </button>
        <button
          onClick={() => attemptSwitchTab('in_review', inReviewHomework)}
          className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-all sm:px-5 ${
            filter === 'in_review'
              ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
              : 'border-border/60 bg-card text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500'
          }`}
        >
          Under Review ({inReviewHomework.length})
        </button>
        <button
          onClick={() => attemptSwitchTab('completed', completedHomework)}
          className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-all sm:px-5 ${
            filter === 'completed'
              ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
              : 'border-border/60 bg-card text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500'
          }`}
        >
          Completed ({completedHomework.length})
        </button>
        <button
          onClick={() => attemptSwitchTab('rejected', rejectedHomework)}
          className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-all sm:px-5 ${
            filter === 'rejected'
              ? 'border-red-500 bg-red-500 text-white shadow-sm'
              : 'border-border/60 bg-card text-muted-foreground hover:bg-red-500/10 hover:text-red-500'
          }`}
        >
          Rejected ({rejectedHomework.length})
        </button>
        <button
          onClick={() => attemptSwitchTab('reassigned', reassignedHomework)}
          className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-all sm:px-5 ${
            filter === 'reassigned'
              ? 'border-purple-500 bg-purple-500 text-white shadow-sm'
              : 'border-border/60 bg-card text-muted-foreground hover:bg-purple-500/10 hover:text-purple-500'
          }`}
        >
          Reassigned ({reassignedHomework.length})
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
                onClick={() => attemptSelectHomework(hw)}
                className={`w-full text-left rounded-3xl border p-5 transition-all ${
                  isActive
                    ? 'border-primary bg-primary/5 shadow-glow ring-2 ring-primary/20'
                    : 'border-border/60 bg-card hover:bg-card/85'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-3">
                  <Badge style={{ backgroundColor: `${hw.subject.color}15`, color: hw.subject.color, borderColor: `${hw.subject.color}30` }} variant="outline">
                    {hw.subject.name}
                  </Badge>
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
                <p className={`text-xs mt-2 flex items-center gap-1 ${isPastDue ? 'text-destructive font-bold' : 'text-foreground font-bold'}`}>
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

        {/* Selected Homework detail */}
        <div className="min-w-0">
          {selectedHw ? (
            <Card className="min-w-0 border-border/60 bg-card/85 backdrop-blur">
              <CardHeader className="pb-4 border-b border-border/40">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-2xl">{selectedHw.title}</CardTitle>
                    <CardDescription className="mt-1">
                      Assigned: {new Date(selectedHw.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={`text-xs font-bold px-3 py-1 ${new Date() > new Date(selectedHw.dueDate) && !selectedHw.submissions.length ? 'border-destructive text-destructive bg-destructive/10' : ''}`}>
                    Due {new Date(selectedHw.dueDate).toLocaleDateString()} {new Date(selectedHw.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Instructions */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Instructions:</h4>
                  <div className="rounded-xl bg-muted/30 p-4 border border-border/50 text-sm whitespace-pre-wrap">
                    {selectedHw.instructions}
                  </div>
                </div>

                {/* Teacher Attachments */}
                {selectedHw.attachments && Array.isArray(selectedHw.attachments) && selectedHw.attachments.length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-border/50">
                    <h4 className="font-semibold text-sm flex items-center gap-1.5"><Paperclip className="w-4 h-4"/> Attachments:</h4>
                    <div className="flex flex-wrap gap-2">
                      <AttachmentViewer attachments={selectedHw.attachments} />
                    </div>
                  </div>
                )}

                {/* Submission status */}
                {userSubmission ? (
                  <div className={`rounded-3xl border p-5 space-y-4 ${
                    userSubmission.score !== null 
                      ? (Number(userSubmission.score) < 5 ? 'border-red-500/20 bg-red-500/5' : 'border-emerald-500/20 bg-emerald-500/5')
                      : 'border-amber-500/20 bg-amber-500/5'
                  }`}>
                    <div className={`flex items-center gap-2 font-bold text-lg ${
                      userSubmission.score !== null 
                        ? (Number(userSubmission.score) < 5 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400') 
                        : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {userSubmission.score !== null ? (
                        Number(userSubmission.score) < 5 ? (
                          <><AlertCircle className="h-5 w-5" /> Graded & Rejected, Reassigned</>
                        ) : (
                          <><CheckCircle2 className="h-5 w-5" /> Graded & Approved</>
                        )
                      ) : (
                        <><AlertCircle className="h-5 w-5" /> Pending Teacher Review</>
                      )}
                    </div>
                    
                    {userSubmission.score !== null && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="bg-background/80 rounded-2xl p-4 border border-border/40">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold block">Score</span>
                          <span className={`text-3xl font-black ${Number(userSubmission.score) < 5 ? 'text-red-600 dark:text-red-400' : 'text-primary'}`}>{userSubmission.score}</span>
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
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-2">Student's Submission Details</span>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{userSubmission.textAnswer || 'No written response.'}</p>
                      
                      {Array.isArray(userSubmission.attachments) && userSubmission.attachments.length > 0 && (
                        <div className="mt-4">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-2">Attached Files</span>
                          <AttachmentViewer attachments={userSubmission.attachments} />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmissionSubmit} className="space-y-4 border-t border-border/40 pt-6">
                    <h4 className="font-bold text-base">Submit on Behalf of Student</h4>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="textAnswer">Written Notes / Comments</Label>
                      <Textarea
                        id="textAnswer"
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        placeholder="Write a message or summary of the student's work..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2 pb-2">
                      <Label>Scanned Answer Sheets / Images / PDFs</Label>
                      <CloudinaryUploader
                        value={uploadedAttachments}
                        onChange={setUploadedAttachments}
                        accept="image/*,application/pdf,video/*"
                        folder="submissions_attachments"
                      />
                    </div>

                    {uploadedAttachments.length > 0 && (
                      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 flex gap-2 items-start text-amber-700 dark:text-amber-400">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-sm"><strong>Almost done!</strong> Your files are attached, but you must click the <strong>Submit Homework</strong> button below to send it to the teacher.</p>
                      </div>
                    )}

                    <Button type="submit" disabled={submitting} className="w-full rounded-2xl shadow-glow flex items-center justify-center gap-2 h-12 text-base font-bold bg-primary hover:bg-primary/90">
                      <Send className="h-5 w-5" /> {submitting ? 'Turning In...' : 'Submit Homework to Teacher'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-card p-6 min-h-[400px]">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Select a homework assignment from the side list to view details.</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showDiscardDialog} onOpenChange={(open) => {
        if (!open && !isDiscarding && !isNavigating) {
          setShowDiscardDialog(false);
          setPendingNavHw(null);
          setPendingNavFilter(null);
          setPendingExternalNav(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unsubmitted Homework</DialogTitle>
            <DialogDescription>
              You have attached files or written notes that haven't been submitted to the teacher yet. 
              Would you like to submit them now or discard them?
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-3 pt-4">
            <Button 
              onClick={async () => {
                await handleSubmissionSubmit(new Event('submit') as unknown as React.FormEvent);
                
                if (pendingExternalNav) {
                  setIsNavigating(true);
                  window.location.href = pendingExternalNav;
                  return;
                }

                setShowDiscardDialog(false);
                if (pendingNavFilter) setFilter(pendingNavFilter);
                if (pendingNavHw) handleSelectHomework(pendingNavHw);
                setPendingNavHw(null);
                setPendingNavFilter(null);
                setPendingExternalNav(null);
              }}
              disabled={submitting || isDiscarding || isNavigating} 
              className="w-full bg-primary flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isNavigating ? 'Redirecting...' : submitting ? 'Submitting...' : 'Submit to Teacher'}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDiscard}
              disabled={isDiscarding || submitting || isNavigating}
              className="w-full flex items-center justify-center gap-2"
            >
              {isNavigating ? 'Redirecting...' : isDiscarding ? 'Discarding...' : 'Discard Uploads'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDiscardDialog(false);
                setPendingNavHw(null);
                setPendingNavFilter(null);
                setPendingExternalNav(null);
              }}
              disabled={isDiscarding || submitting}
              className="w-full"
            >
              Cancel & Continue Editing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
