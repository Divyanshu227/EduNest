import Link from 'next/link';
import { ArrowRight, BellRing, BookOpenText, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InstallAppButton } from '@/components/install-app-button';
import { APP_NAME } from '@/lib/constants';

export default async function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.22),transparent_28%),linear-gradient(135deg,#0f172a_0%,#0b3b53_45%,#14532d_100%)] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-20 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute right-[-6%] top-1/3 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-[34rem] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
      </div>

      <section className="container-shell relative flex min-h-screen items-center py-10 sm:py-16 lg:py-20">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:gap-14">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/80 backdrop-blur">
              Learning dashboard for teachers and students
            </div>
            <div className="mt-6 mb-2">
              <img src="/logo.png" alt="EduNest" className="h-24 sm:h-32 w-auto object-contain drop-shadow-xl filter brightness-[1.1] contrast-[1.1]" />
            </div>
            <h1 className="mt-4 font-[var(--font-heading)] text-4xl leading-tight text-balance sm:text-5xl lg:text-7xl">
              A cleaner, calmer home for everyday school learning.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-white/78 sm:text-lg">
              {APP_NAME} keeps notes, homework, tests, announcements, and progress in one clear space so the day feels
              organized instead of scattered.
            </p>

            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="shadow-lg shadow-black/15">
                <Link href="/login">
                  Open Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <InstallAppButton />
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                <p className="text-2xl font-semibold">1</p>
                <p className="mt-1 text-sm text-white/70">simple place for study flow</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                <p className="text-2xl font-semibold">5</p>
                <p className="mt-1 text-sm text-white/70">core learning areas covered</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                <p className="text-2xl font-semibold">24/7</p>
                <p className="mt-1 text-sm text-white/70">access across desktop and mobile</p>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-white/12 bg-white/8 p-5 backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/70">Download App</p>
                  <p className="mt-2 text-lg font-semibold text-white">Install EduNest on your phone or desktop.</p>
                  <p className="mt-1 max-w-xl text-sm text-white/68">
                    Use the install button when it appears. If your browser doesn&apos;t show it yet, open the browser
                    menu and choose <span className="font-semibold text-white">Install App</span> or{' '}
                    <span className="font-semibold text-white">Add to Home Screen</span>.
                  </p>
                </div>
                <div className="shrink-0">
                  <InstallAppButton />
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/35 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-white/55">Today at a glance</p>
                    <h2 className="mt-2 font-[var(--font-heading)] text-2xl">Steady, focused, ready.</h2>
                  </div>
                  <div className="rounded-full bg-emerald-300/20 px-3 py-1 text-xs font-semibold text-emerald-100">
                    Live sync
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/6 p-4">
                    <BookOpenText className="mt-0.5 h-5 w-5 text-cyan-200" />
                    <div>
                      <p className="font-medium">Chapter-based notes</p>
                      <p className="mt-1 text-sm text-white/65">Organized lessons with reading progress built in.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/6 p-4">
                    <BellRing className="mt-0.5 h-5 w-5 text-amber-200" />
                    <div>
                      <p className="font-medium">Homework and announcements</p>
                      <p className="mt-1 text-sm text-white/65">Important updates stay visible without feeling noisy.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/6 p-4">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-200" />
                    <div>
                      <p className="font-medium">Role-based access</p>
                      <p className="mt-1 text-sm text-white/65">Teachers manage content while students stay focused.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
