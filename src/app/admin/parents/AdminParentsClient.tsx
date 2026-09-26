'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Plus, 
  Users, 
  Trash, 
  Edit2, 
  Link as LinkIcon, 
  Unlink, 
  UserX, 
  UserCheck, 
  CheckCircle2, 
  Ban, 
  ShieldAlert 
} from 'lucide-react';
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
  isAccessRevoked?: boolean;
  createdAt: Date;
  parentOf: { student: StudentType }[];
};

export function AdminParentsClient({ initialParents, allStudents }: { initialParents: ParentType[], allStudents: StudentType[] }) {
  const router = useRouter();
  const [parents, setParents] = useState<ParentType[]>(initialParents);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingParentId, setTogglingParentId] = useState<string | null>(null);
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
    isAccessRevoked: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const openCreateForm = () => {
    setEditingParent(null);
    setFormData({ name: '', email: '', password: '', phone: '', isAccessRevoked: false });
    setIsOpen(true);
  };

  const openEditForm = (parent: ParentType) => {
    setEditingParent(parent);
    setFormData({ 
      name: parent.name, 
      email: parent.email, 
      password: '', 
      phone: parent.phone || '',
      isAccessRevoked: Boolean(parent.isAccessRevoked),
    });
    setIsOpen(true);
  };

  const openLinkModal = (parentId: string) => {
    setSelectedParentId(parentId);
    setSelectedStudentId('');
    setLinkModalOpen(true);
  };

  const handleToggleAccess = async (parent: ParentType) => {
    const nextState = !parent.isAccessRevoked;
    const actionText = nextState ? 'revoke login access for' : 'restore login access for';
    if (!confirm(`Are you sure you want to ${actionText} parent "${parent.name}"?`)) {
      return;
    }

    setTogglingParentId(parent.id);
    try {
      const res = await fetch(`/api/admin/users/${parent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAccessRevoked: nextState })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update access status');

      setParents(prev => prev.map(p => p.id === parent.id ? { ...p, isAccessRevoked: nextState } : p));
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTogglingParentId(null);
    }
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
          phone: formData.phone,
          role: 'PARENT',
          isAccessRevoked: formData.isAccessRevoked,
        };
        if (formData.password) payload.password = formData.password;
        
        const res = await fetch(`/api/admin/users/${editingParent.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update parent');

        setParents(prev => prev.map(p => p.id === editingParent.id ? {
          ...p,
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone,
          isAccessRevoked: data.user.isAccessRevoked,
        } : p));
      } else {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, role: 'PARENT' })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create parent');

        setParents(prev => [
          {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            phone: data.user.phone,
            avatarUrl: null,
            isAccessRevoked: Boolean(data.user.isAccessRevoked),
            createdAt: new Date(),
            parentOf: []
          },
          ...prev
        ]);
      }
      setIsOpen(false);
      router.refresh();
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
      setParents(prev => prev.filter(p => p.id !== id));
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
          <h2 className="font-[var(--font-heading)] text-3xl font-bold">Parent Management</h2>
          <p className="text-sm text-muted-foreground">Manage parent accounts, linked students, and login access.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateForm} className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" />
              Add Parent
            </Button>
          </DialogTrigger>
          <DialogContent className="glass sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingParent ? 'Edit Parent Account' : 'Create Parent Account'}</DialogTitle>
              <DialogDescription>
                {editingParent ? 'Update parent profile, contact details, and login permissions.' : 'Create a new parent account and grant dashboard access.'}
              </DialogDescription>
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
                <Input id="phone" name="phone" placeholder="+91 98765 43210" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{editingParent ? 'New Password (Optional)' : 'Temporary Password'}</Label>
                <Input id="password" name="password" type="text" placeholder={editingParent ? "Leave blank to keep unchanged" : "Enter password"} required={!editingParent} value={formData.password} onChange={handleChange} />
              </div>

              {/* Login Access Status Toggle */}
              {editingParent && (
                <div className="rounded-xl border border-border/70 p-3 bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="parentAccessRevoked" className="text-sm font-semibold cursor-pointer">
                        Login Access Status
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {formData.isAccessRevoked ? 'Access is currently revoked (Login disabled)' : 'Access is active (Can log in)'}
                      </p>
                    </div>
                    <select
                      id="parentAccessRevoked"
                      name="isAccessRevoked"
                      className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium"
                      value={formData.isAccessRevoked ? 'true' : 'false'}
                      onChange={(e) => setFormData(prev => ({ ...prev, isAccessRevoked: e.target.value === 'true' }))}
                    >
                      <option value="false">Active</option>
                      <option value="true">Revoked</option>
                    </select>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingParent ? 'Save Changes' : 'Create Account'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Link Student Modal */}
        <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
          <DialogContent className="glass sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Link Student</DialogTitle>
              <DialogDescription>Select an existing student to link to this parent account.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleLinkStudent} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="student">Select Student</Label>
                <select 
                  id="student" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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

      <Card className="glass border-border/60 shadow-xl shadow-black/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Registered Parents ({parents.length})
          </CardTitle>
          <CardDescription>Manage parent accounts, access permissions, and linked students.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <div className="divide-y divide-border/50">
              {parents.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No parents found.</div>
              ) : (
                parents.map((parent) => {
                  const isRevoked = Boolean(parent.isAccessRevoked);
                  const isToggling = togglingParentId === parent.id;

                  return (
                    <div key={parent.id} className="p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center hover:bg-muted/20 transition-colors">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className={`font-semibold text-base ${isRevoked ? "line-through opacity-70" : ""}`}>
                            {parent.name}
                          </span>
                          {isRevoked ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                              <Ban className="h-3 w-3" />
                              Access Revoked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {parent.email} {parent.phone && `• 📞 ${parent.phone}`}
                        </div>
                        <div className="pt-1 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-muted-foreground font-medium">Linked Students:</span>
                          {parent.parentOf.length === 0 ? (
                            <span className="text-xs italic text-muted-foreground">None linked</span>
                          ) : (
                            parent.parentOf.map(({ student }) => (
                              <Badge key={student.id} variant="secondary" className="flex items-center gap-1 py-0.5 px-2">
                                {student.name}
                                <button 
                                  onClick={() => handleUnlinkStudent(parent.id, student.id)} 
                                  className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                                  title={`Unlink ${student.name}`}
                                >
                                  <Unlink className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 self-end md:self-center">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 rounded-lg text-xs" 
                          onClick={() => openLinkModal(parent.id)}
                        >
                          <LinkIcon className="h-3.5 w-3.5 mr-1.5" /> Link Student
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          disabled={isToggling}
                          className={`h-8 w-8 rounded-lg transition-colors ${
                            isRevoked 
                              ? "hover:bg-emerald-500/10 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400" 
                              : "hover:bg-amber-500/10 text-amber-600 hover:text-amber-700 dark:text-amber-400"
                          }`}
                          title={isRevoked ? "Restore login access" : "Revoke login access"}
                          onClick={() => handleToggleAccess(parent)}
                        >
                          {isToggling ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isRevoked ? (
                            <UserCheck className="h-4 w-4" />
                          ) : (
                            <UserX className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 hover:bg-accent rounded-lg" 
                          title="Edit Parent"
                          onClick={() => openEditForm(parent)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 hover:bg-destructive/10 text-destructive rounded-lg" 
                          title="Delete Parent"
                          onClick={() => handleDelete(parent.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
