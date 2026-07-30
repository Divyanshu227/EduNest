"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Users, Trash, Edit2 } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type UserType = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
};

export function AdminUsersClient({ initialUsers }: { initialUsers: UserType[] }) {
  const router = useRouter();
  const [users, setUsers] = useState<UserType[]>(initialUsers);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openCreateForm = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'STUDENT' });
    setIsOpen(true);
  };

  const openEditForm = (user: UserType) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, password: '', role: user.role });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingUser) {
        const payload: any = {
          name: formData.name,
          email: formData.email,
          role: formData.role
        };
        // Only update password if provided
        if (formData.password) {
          payload.password = formData.password;
        }

        const res = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update user');

        setUsers(prev => prev.map(u => u.id === editingUser.id ? {
          ...u,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role
        } : u));
      } else {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create user');

        setUsers(prev => [
          {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            createdAt: new Date()
          },
          ...prev
        ]);
      }
      
      setIsOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'STUDENT' });
      router.refresh();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      
      setUsers(prev => prev.filter(u => u.id !== id));
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-[var(--font-heading)] text-3xl">Manage Users</h2>
          <p className="text-sm text-muted-foreground">Add and manage student and teacher accounts.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="glass">
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit Account' : 'Create New Account'}</DialogTitle>
              <DialogDescription>
                {editingUser 
                  ? "Modify the user's details below. Leave password blank if you do not wish to change it."
                  : "Provide details for the new user. They will use the email and password to log in."
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="e.g. John Doe" 
                  required 
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="e.g. student@edunest.dev" 
                  required 
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">{editingUser ? 'New Password (Optional)' : 'Temporary Password'}</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="text" 
                  placeholder={editingUser ? "Leave blank to keep unchanged" : "Enter a secure password"}
                  required={!editingUser}
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select 
                  id="role" 
                  name="role" 
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option className="text-black" value="STUDENT">Student</option>
                  <option className="text-black" value="ADMIN">Teacher (Admin)</option>
                </select>
              </div>

              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingUser ? 'Save Changes' : 'Create Account'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Registered Users
          </CardTitle>
          <CardDescription>A list of all users currently active in the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50">
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] border-b border-border/50 bg-muted/50 p-4 font-medium">
              <div>Name</div>
              <div>Email</div>
              <div>Role</div>
              <div>Joined</div>
              <div className="w-16"></div>
            </div>
            
            <div className="divide-y divide-border/50">
              {users.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No users found.</div>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] items-center p-4 text-sm transition-colors hover:bg-muted/20">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-muted-foreground">{user.email}</div>
                    <div>
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-accent rounded-lg" onClick={() => openEditForm(user)}>
                        <Edit2 className="h-4 w-4 text-foreground" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-destructive/10 rounded-lg" onClick={() => handleDelete(user.id)}>
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
