"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
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

  const form = useForm<FormValues>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);

    const result = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false
    });

    if (!result?.ok) {
      setError('Invalid email or password.');
      return;
    }

    const session = await getSession();
    router.replace(session?.user.role === 'ADMIN' ? '/admin' : '/student');
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
          {error ? <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}