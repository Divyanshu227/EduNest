"use client";

import { useState, useRef } from 'react';
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
  Camera, 
  Shield, 
  ShieldAlert, 
  UserX, 
  UserCheck, 
  CheckCircle2, 
  Ban 
} from 'lucide-react';
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
  avatarUrl?: string | null;
  isAccessRevoked?: boolean;
  createdAt: Date;
  parents?: { parent: { name: string, phone: string | null } }[];
};

const MASTER_ADMIN_EMAIL = 'admin@edunest.dev';

export function AdminUsersClient({ initialUsers, currentUserId }: { initialUsers: UserType[]; currentUserId?: string }) {
  const router = useRouter();
  const [users, setUsers] = useState<UserType[]>(initialUsers);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    avatarUrl: '' as string | undefined,
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
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'STUDENT', avatarUrl: undefined, isAccessRevoked: false });
    setAvatarPreview(null);
    setIsOpen(true);
  };

  const openEditForm = (user: UserType) => {
    setEditingUser(user);
    setFormData({ 
      name: user.name, 
      email: user.email, 
      password: '', 
      role: user.role, 
      avatarUrl: user.avatarUrl || undefined,
      isAccessRevoked: Boolean(user.isAccessRevoked)
    });
    setAvatarPreview(user.avatarUrl || null);
    setIsOpen(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'avatars');

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();

      setAvatarPreview(data.url);
      setFormData(prev => ({ ...prev, avatarUrl: data.url }));
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleToggleAccess = async (user: UserType) => {
    if (isMasterAdmin(user.email) || user.id === currentUserId) {
      alert('Cannot revoke access for this account.');
      return;
    }

    const nextState = !user.isAccessRevoked;
    const actionText = nextState ? 'revoke login access for' : 'restore login access for';
    if (!confirm(`Are you sure you want to ${actionText} "${user.name}"?`)) {
      return;
    }

    setTogglingUserId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAccessRevoked: nextState })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update access status');

      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isAccessRevoked: nextState } : u));
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTogglingUserId(null);
    }
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
          role: formData.role,
          isAccessRevoked: formData.isAccessRevoked,
        };
        if (formData.password) {
          payload.password = formData.password;
        }
        if (formData.avatarUrl !== undefined) {
          payload.avatarUrl = formData.avatarUrl;
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
          role: data.user.role,
          avatarUrl: data.user.avatarUrl,
          isAccessRevoked: data.user.isAccessRevoked
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
            avatarUrl: null,
            isAccessRevoked: Boolean(data.user.isAccessRevoked),
            createdAt: new Date()
          },
          ...prev
        ]);
      }
      
      setIsOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'STUDENT', avatarUrl: undefined, isAccessRevoked: false });
      setAvatarPreview(null);
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

  const isMasterAdmin = (email: string) => email === MASTER_ADMIN_EMAIL;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-[var(--font-heading)] text-3xl font-bold">Manage Users</h2>
          <p className="text-sm text-muted-foreground">Add, manage, and control login access for student and teacher accounts.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateForm} className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="glass sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit Account' : 'Create New Account'}</DialogTitle>
              <DialogDescription>
                {editingUser 
                  ? "Modify the user's details and access status below. Leave password blank to keep unchanged."
                  : "Provide details for the new user. They will use the email and password to log in."
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {/* Avatar upload (shown when editing) */}
              {editingUser && (
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <div className="flex items-center gap-4">
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="h-14 w-14 rounded-xl object-cover border-2 border-primary/20 shadow" />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow">
                          {formData.name?.[0] || '?'}
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        {uploadingAvatar ? (
                          <Loader2 className="h-4 w-4 text-white animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Click to upload a new avatar for this user.
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                </div>
              )}

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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="STUDENT">Student</option>
                  <option value="ADMIN">Teacher (Admin)</option>
                </select>
              </div>

              {/* Login Access Status Toggle */}
              {editingUser && !isMasterAdmin(editingUser.email) && editingUser.id !== currentUserId && (
                <div className="rounded-xl border border-border/70 p-3 bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="isAccessRevoked" className="text-sm font-semibold cursor-pointer">
                        Login Access Status
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {formData.isAccessRevoked ? 'Access is currently revoked (Login disabled)' : 'Access is active (Can log in)'}
                      </p>
                    </div>
                    <select
                      id="isAccessRevoked"
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
              
              <Button type="submit" className="w-full" disabled={isSubmitting || uploadingAvatar}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingUser ? 'Save Changes' : 'Create Account'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass border-border/60 shadow-xl shadow-black/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Registered Users ({users.length})
          </CardTitle>
          <CardDescription>View, edit, and manage login access status for all users.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <div className="grid grid-cols-[auto_2fr_2fr_1fr_1fr_1fr_auto] border-b border-border/50 bg-muted/50 p-4 font-medium text-xs uppercase tracking-wider text-muted-foreground">
              <div className="w-10"></div>
              <div>Name</div>
              <div>Email</div>
              <div>Role</div>
              <div>Access Status</div>
              <div>Joined</div>
              <div className="w-24 text-right">Actions</div>
            </div>
            
            <div className="divide-y divide-border/50">
              {users.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No users found.</div>
              ) : (
                users.map((user) => {
                  const isRevoked = Boolean(user.isAccessRevoked);
                  const isToggling = togglingUserId === user.id;
                  const canToggle = !isMasterAdmin(user.email) && user.id !== currentUserId;

                  return (
                    <div key={user.id} className="grid grid-cols-[auto_2fr_2fr_1fr_1fr_1fr_auto] items-center p-4 text-sm transition-colors hover:bg-muted/20">
                      <div className="w-10">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-lg object-cover shadow-sm" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                            {user.name?.[0] || '?'}
                          </div>
                        )}
                      </div>
                      <div className="font-medium flex items-center gap-1.5">
                        <span className={isRevoked ? "line-through opacity-70" : ""}>{user.name}</span>
                        {isMasterAdmin(user.email) && (
                          <span title="Master Admin" aria-label="Master Admin">
                            <Shield className="h-3.5 w-3.5 text-amber-500" />
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground truncate pr-2">{user.email}</div>
                      <div>
                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </div>
                      <div>
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
                      <div className="text-muted-foreground text-xs">
                        {new Date(user.createdAt).toLocaleDateString()}
                        {user.role === 'STUDENT' && user.parents && user.parents.length > 0 && (
                          <div className="text-xs text-primary mt-0.5 truncate">
                            Parent: {user.parents[0].parent.name}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-end gap-1">
                        {canToggle && (
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
                            onClick={() => handleToggleAccess(user)}
                          >
                            {isToggling ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isRevoked ? (
                              <UserCheck className="h-4 w-4" />
                            ) : (
                              <UserX className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 hover:bg-accent rounded-lg" 
                          title="Edit User"
                          onClick={() => openEditForm(user)}
                        >
                          <Edit2 className="h-4 w-4 text-foreground" />
                        </Button>
                        {!isMasterAdmin(user.email) && user.id !== currentUserId && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 hover:bg-destructive/10 rounded-lg text-destructive" 
                            title="Delete User"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
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
