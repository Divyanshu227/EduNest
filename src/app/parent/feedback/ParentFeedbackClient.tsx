"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import { useParentContext } from '../ParentContext';

type AdminUser = {
  id: string;
  name: string;
  email: string;
};

export function ParentFeedbackClient({ admins }: { admins: AdminUser[] }) {
  const { linkedStudents, selectedStudentId } = useParentContext();
  const currentStudent = linkedStudents.find(s => s.id === selectedStudentId) || linkedStudents[0];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    topic: 'PTM Request',
    teacherId: admins.length > 0 ? admins[0].id : '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          studentId: currentStudent.id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit feedback');

      setIsSuccess(true);
      setFormData({ topic: 'PTM Request', teacherId: admins.length > 0 ? admins[0].id : '', subject: '', message: '' });
      setTimeout(() => setIsSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[var(--font-heading)] text-3xl">Feedback & Requests</h2>
          <p className="text-sm text-muted-foreground">Request a Parent-Teacher Meeting or send feedback to the administration.</p>
        </div>
      </div>

      <Card className="max-w-2xl border-border/60 bg-card/85 backdrop-blur overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/20">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Submit a Request
          </CardTitle>
          <CardDescription>
            {currentStudent ? `Sending on behalf of student: ${currentStudent.name}` : 'Please select a student from the switcher above.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isSuccess ? (
             <div className="bg-muted/30 rounded-xl p-8 border border-border/50 flex flex-col items-center justify-center text-center h-[300px]">
               <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                 <CheckCircle2 className="w-8 h-8 text-primary" />
               </div>
               <h5 className="text-xl font-bold mb-2">Request Sent!</h5>
               <p className="text-muted-foreground text-sm">Your feedback has been successfully submitted to the administration. We will get back to you soon.</p>
               <Button variant="outline" className="mt-6" onClick={() => setIsSuccess(false)}>Send Another Request</Button>
             </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic Type</Label>
                <select 
                  id="topic" 
                  name="topic" 
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.topic}
                  onChange={handleChange}
                  required
                >
                  <option value="PTM Request" className="text-black">Parent-Teacher Meeting (PTM) Request</option>
                  <option value="Academic Concern" className="text-black">Academic Concern</option>
                  <option value="General Feedback" className="text-black">General Feedback</option>
                  <option value="Other" className="text-black">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="teacherId">Select Teacher</Label>
                <select 
                  id="teacherId" 
                  name="teacherId" 
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.teacherId}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled className="text-black">-- Select Teacher --</option>
                  {admins.map(admin => (
                    <option key={admin.id} value={admin.id} className="text-black">{admin.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input 
                  id="subject" 
                  name="subject" 
                  placeholder={formData.topic === 'PTM Request' ? "e.g., Requesting PTM regarding Math performance" : "Brief summary of your request"} 
                  required 
                  value={formData.subject}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message Details</Label>
                <textarea
                  id="message"
                  name="message"
                  required
                  placeholder="Provide more context here. For PTMs, please suggest 2-3 preferred dates/times."
                  rows={5}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                  value={formData.message}
                  onChange={handleChange}
                ></textarea>
              </div>

              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={isSubmitting || !currentStudent}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Sending...' : 'Submit Request'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
