'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Users, Trash, Edit2, Link as LinkIcon, Unlink } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type StudentType = { id: string; name: string; email: string };
type ParentType = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl?: string | null;
  createdAt: Date;
  parentOf: { student: StudentType }[];
};

export function AdminParentsClient({ initialParents, allStudents }: { initialParents: ParentType[], allStudents: StudentType[] }) {
  const router = useRouter();
  const [parents, setParents] = useState<ParentType[]>(initialParents);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingParent, setEditingParent] = useState<ParentType | null>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openCreateForm = () => {
    setEditingParent(null);
    setFormData({ name: '', email: '', password: '', phone: '' });
    setIsOpen(true);
  };

  const openEditForm = (parent: ParentType) => {
    setEditingParent(parent);
    setFormData({ name: parent.name, email: parent.email, password: '', phone: parent.phone || '' });
    setIsOpen(true);
  };

  const openLinkModal = (parentId: string) => {
    setSelectedParentId(parentId);
    setSelectedStudentId('');
    setLinkModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingParent) {
        const payload: any = {
          name: formData.name,
          email: formData.email,
          role: 'PARENT'
        };
        if (formData.password) payload.password = formData.password;
        
        const res = await fetch(`/api/admin/users/${editingParent.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update parent');

        // Note: The phone number might require a separate patch or adding it to the /users endpoint if supported.
        
        router.refresh();
      } else {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, role: 'PARENT' })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create parent');
        router.refresh();
      }
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this parent account? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParentId || !selectedStudentId) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/parents/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: selectedParentId, studentId: selectedStudentId })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Linking failed');
      }
      setLinkModalOpen(false);
      router.refresh();
    } catch(err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlinkStudent = async (parentId: string, studentId: string) => {
    if(!confirm("Unlink this student from parent?")) return;
    try {
      const res = await fetch('/api/admin/parents/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId, studentId })
      });
      if(!res.ok) throw new Error('Unlink failed');
      router.refresh();
    } catch(err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-[var(--font-heading)] text-3xl">Parent Management</h2>
          <p className="text-sm text-muted-foreground">Manage parent accounts and link them to students.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Parent
            </Button>
          </DialogTrigger>
          <DialogContent className="glass">
            <DialogHeader>
              <DialogTitle>{editingParent ? 'Edit Parent Account' : 'Create Parent Account'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" required value={formData.name} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{editingParent ? 'New Password (Optional)' : 'Temporary Password'}</Label>
                <Input id="password" name="password" type="text" required={!editingParent} value={formData.password} onChange={handleChange} />
              </div>
              {error && <div className="text-sm text-destructive">{error}</div>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingParent ? 'Save Changes' : 'Create Account'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Link Student Modal */}
        <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
          <DialogContent className="glass">
            <DialogHeader>
              <DialogTitle>Link Student</DialogTitle>
              <DialogDescription>Select an existing student to link to this parent account.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleLinkStudent} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="student">Select Student</Label>
                <select 
                  id="student" 
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-black"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a student...</option>
                  {allStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Link Student
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Registered Parents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50">
            <div className="divide-y divide-border/50">
              {parents.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No parents found.</div>
              ) : (
                parents.map((parent) => (
                  <div key={parent.id} className="p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center hover:bg-muted/20">
                    <div>
                      <div className="font-medium text-lg">{parent.name}</div>
                      <div className="text-sm text-muted-foreground">{parent.email} {parent.phone && `• ${parent.phone}`}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {parent.parentOf.map(({ student }) => (
                          <Badge key={student.id} variant="secondary" className="flex items-center gap-1">
                            {student.name}
                            <button onClick={() => handleUnlinkStudent(parent.id, student.id)} className="ml-1 text-destructive hover:text-destructive/80">
                              <Unlink className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => openLinkModal(parent.id)}>
                        <LinkIcon className="h-4 w-4 mr-2" /> Link Student
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openEditForm(parent)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="hover:bg-destructive/10" onClick={() => handleDelete(parent.id)}>
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
