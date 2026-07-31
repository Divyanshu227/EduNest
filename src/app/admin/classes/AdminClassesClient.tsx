"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash, Video, Calendar, Clock, ExternalLink } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type StudentType = {
  id: string;
  name: string;
  email: string;
};

type LiveClassType = {
  id: string;
  title: string;
  meetLink: string;
  startTime: Date;
  durationMin: number;
  student: {
    name: string;
    email: string;
  }
};

export function AdminClassesClient({ initialClasses, students }: { initialClasses: any[], students: StudentType[] }) {
  const [classes, setClasses] = useState<LiveClassType[]>(initialClasses);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const upcomingClasses = classes.filter(c => new Date(new Date(c.startTime).getTime() + c.durationMin * 60000) >= new Date());
  const pastClasses = classes.filter(c => new Date(new Date(c.startTime).getTime() + c.durationMin * 60000) < new Date());
  const displayedClasses = activeTab === 'upcoming' ? upcomingClasses : pastClasses;

  const [formData, setFormData] = useState({
    title: '',
    meetLink: '',
    startTime: '',
    durationMin: 60,
    studentId: students[0]?.id || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const startTimeIso = new Date(formData.startTime).toISOString();

      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          startTime: startTimeIso
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to schedule class');
      }

      setClasses(prev => [...prev, data.data].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
      setIsOpen(false);
      
      // Reset form
      setFormData({
        title: '',
        meetLink: '',
        startTime: '',
        durationMin: 60,
        studentId: students[0]?.id || ''
      });
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled class?')) return;

    try {
      const res = await fetch(`/api/classes/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        throw new Error('Failed to cancel class');
      }
      
      setClasses(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-[var(--font-heading)] text-3xl">Live Classes</h2>
          <p className="text-sm text-muted-foreground">Schedule and manage 1-on-1 live sessions with your students.</p>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex bg-muted/50 p-1 rounded-xl">
            <Button 
              variant={activeTab === 'upcoming' ? 'default' : 'ghost'} 
              className="rounded-lg text-sm"
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming
            </Button>
            <Button 
              variant={activeTab === 'past' ? 'default' : 'ghost'} 
              className="rounded-lg text-sm"
              onClick={() => setActiveTab('past')}
            >
              Past
            </Button>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Class
              </Button>
            </DialogTrigger>
            <DialogContent className="glass max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Schedule a New Class</DialogTitle>
                <DialogDescription>
                  Provide the details of the session below. An invite will be available for the student.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="studentId">Select Student</Label>
                <select 
                  id="studentId" 
                  name="studentId" 
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.studentId}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled className="text-black">Choose a student...</option>
                  {students.map(s => (
                    <option key={s.id} className="text-black" value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Class Title</Label>
                <Input 
                  id="title" 
                  name="title" 
                  placeholder="e.g. Chapter 3 Doubt Clearing" 
                  required 
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Date & Time</Label>
                  <Input 
                    id="startTime" 
                    name="startTime" 
                    type="datetime-local" 
                    required 
                    value={formData.startTime}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durationMin">Duration (Minutes)</Label>
                  <Input 
                    id="durationMin" 
                    name="durationMin" 
                    type="number"
                    min="15"
                    step="5"
                    required 
                    value={formData.durationMin}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="meetLink">Google Meet Link</Label>
                <Input 
                  id="meetLink" 
                  name="meetLink" 
                  type="url" 
                  placeholder="https://meet.google.com/xxx-xxxx-xxx" 
                  required 
                  value={formData.meetLink}
                  onChange={handleChange}
                />
              </div>

              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Schedule Session
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {displayedClasses.length === 0 ? (
          <div className="col-span-full flex h-48 items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/20 text-center">
            <p className="text-muted-foreground">No {activeTab} classes scheduled. {activeTab === 'upcoming' && 'Click "Schedule Class" to add one.'}</p>
          </div>
        ) : (
          displayedClasses.map((c) => {
            const isPast = activeTab === 'past';
            return (
              <Card key={c.id} className="relative overflow-hidden border-border/60 bg-card/85 backdrop-blur flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant={isPast ? "secondary" : "default"} className="text-[10px]">
                      {isPast ? 'Completed' : 'Upcoming'}
                    </Badge>
                    <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-destructive/10 rounded-md" onClick={() => handleDelete(c.id)}>
                      <Trash className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                  <CardTitle className="text-xl line-clamp-1">{c.title}</CardTitle>
                  <CardDescription className="text-sm font-medium mt-1">
                    Student: {c.student.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border/40 pt-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-primary" />
                      {new Date(c.startTime).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-primary" />
                      {new Date(c.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({c.durationMin}m)
                    </div>
                  </div>
                  
                  {!isPast && (
                    <div className="border-t border-border/40 pt-3 flex justify-end">
                      <a href={c.meetLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                        <Video className="h-4 w-4" /> Open Meet <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
