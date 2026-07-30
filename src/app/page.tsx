import Link from 'next/link';
import { ArrowRight, CheckCircle2, LibraryBig, ShieldCheck, WifiOff, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InstallAppButton } from '@/components/install-app-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { APP_NAME } from '@/lib/constants';

const features = [
  { icon: LibraryBig, title: 'Handwritten notes', body: 'Upload, reorder, preview, and study notebook-style image pages.' },
  { icon: WifiOff, title: 'Offline learning', body: 'Recently viewed notes and PDFs remain accessible without internet.' },
  { icon: BellRing, title: 'Real-time updates', body: 'Announcements, homework, and class reminders can trigger push notifications.' },
  { icon: ShieldCheck, title: 'Protected access', body: 'JWT auth, middleware protection, and role-based permissions keep data secure.' }
];

const subjects = [
  { name: 'Mathematics', chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3'] },
  { name: 'English', chapters: ['Grammar', 'Reading', 'Chapter 1'] },
  { name: 'Hindi', chapters: ['Chapter 1', 'व्याकरण'] },
  { name: 'EVS', chapters: ['Chapter 1', 'Chapter 2'] }
];

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <section className="relative isolate bg-hero-gradient text-white">
        <div className="container-shell grid min-h-screen items-center gap-16 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm backdrop-blur">
                Premium learning platform for one student, two teachers
              </div>
              <ThemeToggle />
            </div>

            <div className="space-y-6">
              <h1 className="max-w-3xl font-[var(--font-heading)] text-5xl leading-tight text-balance sm:text-6xl lg:text-7xl">
                A polished home tuition LMS built for clarity, pace, and momentum.
              </h1>
              <p className="max-w-2xl text-lg text-white/80 sm:text-xl">
                {APP_NAME} keeps handwritten notes, PDFs, homework, tests, attendance, and announcements in one secure installable PWA.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/login">
                  Enter Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <InstallAppButton />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ['3', 'Active accounts'],
                ['4', 'Subjects'],
                ['PWA', 'Installable offline app']
              ].map(([value, label]) => (
                <div key={label} className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
                  <p className="text-3xl font-bold">{value}</p>
                  <p className="mt-1 text-sm text-white/75">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="glass border-white/10 bg-white/10 text-white shadow-2xl shadow-black/10">
              <CardHeader>
                <CardTitle className="text-2xl">Everything the class needs</CardTitle>
                <CardDescription className="text-white/70">Notes, homework, tests, attendance, and progress in one polished interface.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {features.map((feature) => (
                    <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <feature.icon className="h-5 w-5 text-emerald-300" />
                      <h3 className="mt-3 font-semibold">{feature.title}</h3>
                      <p className="mt-2 text-sm text-white/70">{feature.body}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-white/10 bg-white/10 text-white">
              <CardHeader>
                <CardTitle>Role-aware access</CardTitle>
                <CardDescription className="text-white/70">Admin 1 handles Mathematics, Admin 2 handles English, Hindi, and EVS, while the student sees only learning content.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="container-shell py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Features</p>
            <h2 className="mt-2 font-[var(--font-heading)] text-4xl">Designed for focused study and quick administration.</h2>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
            <Card key={feature.title} className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
              <CardHeader>
                <feature.icon className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription>{feature.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-muted/30 py-20">
        <div className="container-shell">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Subjects</p>
              <h2 className="mt-2 font-[var(--font-heading)] text-4xl">Four subjects, organized by chapter.</h2>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {subjects.map((subject) => (
              <Card key={subject.name} className="border-border/60 bg-card/85 backdrop-blur">
                <CardHeader>
                  <CardTitle>{subject.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {subject.chapters.map((chapter) => (
                      <div key={chapter} className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        {chapter}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell py-20">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
                <CardTitle>Two teachers, one student</CardTitle>
              <CardDescription>The dashboard and permissions are scoped to the real classroom setup.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p><span className="font-semibold text-foreground">Admin 1</span> manages Mathematics only.</p>
              <p><span className="font-semibold text-foreground">Admin 2</span> manages English, Hindi, and EVS.</p>
              <p><span className="font-semibold text-foreground">Student</span> can study, submit homework, attempt tests, and track progress.</p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Contact</CardTitle>
              <CardDescription>Use the built-in forms to manage lessons, uploads, homework, and announcements after login.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">Secure auth</p>
                <p className="mt-1 font-semibold">Credentials, JWT sessions, middleware protection</p>
              </div>
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">Offline ready</p>
                <p className="mt-1 font-semibold">Service worker, manifest, cached study assets</p>
              </div>
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">Modern UX</p>
                <p className="mt-1 font-semibold">Dark mode, rounded cards, motion, skeletons</p>
              </div>
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">Push notifications</p>
                <p className="mt-1 font-semibold">Firebase Cloud Messaging integration</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}