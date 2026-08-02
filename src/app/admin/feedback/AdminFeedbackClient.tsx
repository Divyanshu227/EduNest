"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Calendar, CheckCircle2, Phone, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

type FeedbackWithRelations = {
  id: string;
  topic: string;
  subject: string;
  message: string;
  status: string;
  createdAt: Date;
  parentId: string;
  studentId: string;
  parent: { name: string; email: string; phone: string | null };
  student: { name: string };
};

export function AdminFeedbackClient({ initialFeedbacks, teacherId, students }: { initialFeedbacks: any[], teacherId: string, students?: any[] }) {
  const [feedbacks, setFeedbacks] = useState<FeedbackWithRelations[]>(initialFeedbacks);
  
  // Schedule Modal State
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackWithRelations | null>(null);
  const [meetLink, setMeetLink] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Proactive Schedule Modal State
  const [isProactiveScheduleOpen, setIsProactiveScheduleOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const openScheduleModal = (fb: FeedbackWithRelations) => {
    setSelectedFeedback(fb);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    setStartTime(new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    setMeetLink('https://meet.google.com/new');
    setIsScheduleOpen(true);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedback) return;
    setIsSubmitting(true);

    try {
      // 1. Create a Live Class for the PTM
      const classRes = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `PTM: ${selectedFeedback.student.name}`,
          meetLink,
          startTime: new Date(startTime).toISOString(),
          durationMin: parseInt(duration, 10),
          teacherId,
          studentId: selectedFeedback.studentId
        })
      });

      if (!classRes.ok) throw new Error('Failed to schedule PTM class');

      // 2. Update Feedback Status
      const statusRes = await fetch(`/api/feedback/${selectedFeedback.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SCHEDULED' })
      });

      if (!statusRes.ok) throw new Error('Failed to update feedback status');

      // Update local state
      setFeedbacks(feedbacks.map(f => f.id === selectedFeedback.id ? { ...f, status: 'SCHEDULED' } : f));
      setIsScheduleOpen(false);
    } catch (error) {
      console.error(error);
      alert('Error scheduling PTM');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProactiveScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    setIsSubmitting(true);

    const student = students?.find(s => s.id === selectedStudentId);
    if (!student) return;

    try {
      const classRes = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `PTM: ${student.name}`,
          meetLink,
          startTime: new Date(startTime).toISOString(),
          durationMin: parseInt(duration, 10),
          teacherId,
          studentId: selectedStudentId
        })
      });

      if (!classRes.ok) throw new Error('Failed to schedule proactive PTM class');
      
      setIsProactiveScheduleOpen(false);
      alert('PTM scheduled successfully! The student and parent will be notified.');
    } catch (error) {
      console.error(error);
      alert('Error scheduling PTM');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkResolved = async (id: string) => {
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED' })
      });
      if (!res.ok) throw new Error('Failed to update feedback status');
      setFeedbacks(feedbacks.map(f => f.id === id ? { ...f, status: 'RESOLVED' } : f));
    } catch (error) {
      console.error(error);
      alert('Error marking as resolved');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Administration</p>
          <h2 className="mt-2 font-[var(--font-heading)] text-3xl sm:text-4xl">PTMs & Feedback</h2>
          <p className="text-muted-foreground mt-2">Manage meeting requests and feedback from parents.</p>
        </div>
        <Button onClick={() => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(10, 0, 0, 0);
          setStartTime(new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
          setMeetLink('https://meet.google.com/new');
          setSelectedStudentId('');
          setIsProactiveScheduleOpen(true);
        }}>
          <Calendar className="mr-2 h-4 w-4" /> Schedule New PTM
        </Button>
      </div>

      <div className="grid gap-6">
        {feedbacks.length === 0 ? (
          <Card className="border-border/60 bg-card/85 backdrop-blur">
            <CardContent className="pt-6 pb-6 text-center text-muted-foreground">
              No feedback or PTM requests found.
            </CardContent>
          </Card>
        ) : (
          feedbacks.map(fb => (
            <Card key={fb.id} className="border-border/60 bg-card/85 backdrop-blur">
              <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      {fb.topic}: {fb.subject}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Received {new Date(fb.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant={fb.status === 'PENDING' ? 'destructive' : fb.status === 'SCHEDULED' ? 'default' : 'secondary'}>
                    {fb.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex flex-wrap gap-4 text-sm bg-muted/30 p-3 rounded-lg border border-border/50">
                  <div className="flex-1 min-w-[200px]">
                    <span className="font-semibold block text-xs uppercase text-muted-foreground mb-1">Parent</span>
                    {fb.parent.name}
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <span className="font-semibold block text-xs uppercase text-muted-foreground mb-1">Student</span>
                    {fb.student.name}
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <span className="font-semibold block text-xs uppercase text-muted-foreground mb-1">Contact</span>
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {fb.parent.email}</span>
                      {fb.parent.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {fb.parent.phone}</span>}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="font-semibold block text-xs uppercase text-muted-foreground mb-1">Message</span>
                  <p className="text-sm whitespace-pre-wrap">{fb.message}</p>
                </div>

                <div className="flex gap-3 pt-2">
                  {fb.status === 'PENDING' && (
                    <Button onClick={() => openScheduleModal(fb)} className="gap-2">
                      <Calendar className="h-4 w-4" /> Schedule PTM
                    </Button>
                  )}
                  {fb.status !== 'RESOLVED' && (
                    <Button variant="outline" onClick={() => handleMarkResolved(fb.id)} className="gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Mark as Resolved
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Schedule Modal */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Parent-Teacher Meeting</DialogTitle>
            <DialogDescription>
              Create a Live Class specifically for this PTM. The parent and student will be notified.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleScheduleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Meeting Link (Google Meet / Zoom)</Label>
              <Input required value={meetLink} onChange={e => setMeetLink(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date & Time</Label>
                <Input type="datetime-local" required value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Duration (Minutes)</Label>
                <Input type="number" min="15" required value={duration} onChange={e => setDuration(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Scheduling...' : 'Schedule PTM'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Proactive Schedule Modal */}
      <Dialog open={isProactiveScheduleOpen} onOpenChange={setIsProactiveScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule a New Parent-Teacher Meeting</DialogTitle>
            <DialogDescription>
              Proactively schedule a PTM. The parent and student will be notified.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProactiveScheduleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Select Student</Label>
              <select 
                required 
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
              >
                <option value="" disabled className="text-black">-- Select a Student --</option>
                {students?.map((s: any) => (
                  <option key={s.id} value={s.id} className="text-black">{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Meeting Link (Google Meet / Zoom)</Label>
              <Input required value={meetLink} onChange={e => setMeetLink(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date & Time</Label>
                <Input type="datetime-local" required value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Duration (Minutes)</Label>
                <Input type="number" min="15" required value={duration} onChange={e => setDuration(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsProactiveScheduleOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Scheduling...' : 'Schedule PTM'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
