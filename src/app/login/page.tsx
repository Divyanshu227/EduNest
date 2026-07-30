import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent } from '@/components/ui/card';

export default async function LoginPage() {
  const session = await auth();

  if (session?.user?.home) {
    redirect(session.user.home);
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="mb-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">EduNest</p>
          <h1 className="mt-2 font-[var(--font-heading)] text-3xl font-black">Sign in securely</h1>
          <p className="mt-1 text-xs text-muted-foreground">Sign in to access your dashboard.</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}