import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { LoginForm } from '@/components/auth/login-form';
import { Suspense } from 'react';

export default async function LoginPage() {
  const session = await auth();

  if (session?.user?.home && !session?.user?.isAccessRevoked && session?.user?.role) {
    redirect(session.user.home);
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="mb-4 flex flex-col items-center text-center">
          <img src="/logo.png" alt="EduNest" className="h-28 w-auto object-contain mb-2 drop-shadow-md" />
          <h1 className="mt-2 font-[var(--font-heading)] text-3xl font-black">Sign in securely</h1>
          <p className="mt-1 text-xs text-muted-foreground">Sign in to access your dashboard.</p>
        </div>
        <Suspense fallback={<div className="h-64 rounded-2xl bg-card/50 animate-pulse" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}