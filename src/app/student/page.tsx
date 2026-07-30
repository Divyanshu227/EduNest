import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

async function getStudentDashboardData() {
  const [notes, homework, attendance, announcements, recentNotes, readingProgress] = await Promise.all([
    prisma.note.count(),
    prisma.homework.count(),
    prisma.attendance.count(),
    prisma.announcement.findMany({ orderBy: { createdAt: 'desc' }, take: 3 }),
    prisma.note.findMany({ orderBy: { lastUpdated: 'desc' }, take: 4, include: { subject: true, chapter: true } }),
    prisma.readingProgress.findMany({ orderBy: { updatedAt: 'desc' }, take: 5 })
  ]);

  return { notes, homework, attendance, announcements, recentNotes, readingProgress };
}

export default async function StudentDashboardPage() {
  const session = await auth();
  const data = await getStudentDashboardData();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Student Dashboard</p>
          <h2 className="mt-2 font-[var(--font-heading)] text-4xl">Welcome back, {session?.user.name}</h2>
        </div>
        <Badge>Role: Student</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ['Continue Reading', data.readingProgress.length || 0],
          ['Homework Due', data.homework],
          ['Attendance Percentage', `${Math.round((data.attendance / Math.max(data.attendance || 1, 1)) * 100)}%`],
          ['Latest Announcement', data.announcements.length],
          ['Recently Added Notes', data.recentNotes.length]
        ].map(([label, value]) => (
          <Card key={label} className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-4xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Recent Notes</CardTitle>
            <CardDescription>Pick up exactly where you left off.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentNotes.length ? data.recentNotes.map((note) => (
              <div key={note.id} className="rounded-2xl bg-muted p-4">
                <p className="font-semibold">{note.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{note.subject.name} · {note.chapter.name}</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">No notes uploaded yet.</p>}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
            <CardDescription>The latest class messages appear here first.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.announcements.length ? data.announcements.map((announcement) => (
              <div key={announcement.id} className="rounded-2xl bg-muted p-4">
                <p className="font-semibold">{announcement.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{announcement.message}</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">No announcements yet.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}