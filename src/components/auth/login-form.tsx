"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getSession, signIn, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import { credentialsSchema } from '@/lib/validators';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FormValues = z.infer<typeof credentialsSchema>;

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'AccessRevoked' || err === 'revoked') {
      setError('Access revoked');
      signOut({ redirect: false });
    }
  }, [searchParams]);

  const form = useForm<FormValues>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);

    // Pre-flight credential check to accurately detect revoked access
    try {
      const statusRes = await fetch('/api/auth/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email, password: values.password })
      });

      if (statusRes.status === 403) {
        const data = await statusRes.json();
        if (data.isAccessRevoked) {
          setError('Access revoked');
          return;
        }
      }
    } catch {
      // Continue to signIn fallback
    }

    const result = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false
    });

    if (!result?.ok) {
      if (result?.error?.toLowerCase().includes('revoked') || result?.code?.toLowerCase().includes('revoked')) {
        setError('Access revoked');
      } else {
        setError('Invalid email or password.');
      }
      return;
    }

    const session = await getSession();

    if (session?.user?.isAccessRevoked) {
      setError('Access revoked');
      await signOut({ redirect: false });
      return;
    }

    const role = session?.user?.role;
    if (role === 'ADMIN') {
      router.replace('/admin');
    } else if (role === 'PARENT') {
      router.replace('/parent');
    } else {
      router.replace('/student');
    }
    router.refresh();
  });

  return (
    <Card className="glass border-border/50 shadow-2xl shadow-black/5">
      <CardHeader>
        <CardTitle className="font-[var(--font-heading)] text-3xl">Welcome back</CardTitle>
        <CardDescription>Sign in to continue to EduNest.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} placeholder="teacher@edunest.in" />
            {form.formState.errors.email ? <p className="text-sm text-destructive">{form.formState.errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" {...form.register('password')} placeholder="••••••••" />
            {form.formState.errors.password ? <p className="text-sm text-destructive">{form.formState.errors.password.message}</p> : null}
          </div>
          {error ? (
            <div className="flex items-center gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive animate-in fade-in">
              <ShieldAlert className="h-4 w-4 shrink-0 text-destructive" />
              <span>{error}</span>
            </div>
          ) : null}
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}