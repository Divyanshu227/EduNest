import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

async function getStudentDashboardData(userId: string) {
  const [notes, homework, attendance, recentNotes, allAnnouncements] = await Promise.all([
    prisma.note.count({ where: { OR: [{ assignedStudentIds: { has: userId } }, { assignedStudentIds: { isEmpty: true } }] } }),
    prisma.homework.count({ 
      where: { 
        OR: [{ assignedStudentIds: { has: userId } }, { assignedStudentIds: { isEmpty: true } }],
        submissions: { none: { studentId: userId } }
      } 
    }),
    prisma.attendance.count({ where: { studentId: userId } }),
    prisma.note.findMany({ 
      where: { OR: [{ assignedStudentIds: { has: userId } }, { assignedStudentIds: { isEmpty: true } }] },
      orderBy: { lastUpdated: 'desc' }, take: 4, include: { subject: true, chapter: true } 
    }),
    prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } })
  ]);

  const announcements = allAnnouncements.filter(ann => {
    const aud = ann.audience;
    if (aud === 'all') return true;
    if (aud === 'all_students') return true;
    if (aud === `student:${userId}`) return true;
    return false;
  }).slice(0, 3);

  return { notes, homework, attendance, announcements, recentNotes };
}

export default async function StudentDashboardPage() {
  const session = await auth();
  if (!session?.user) return <div className="p-6">Unauthorized</div>;
  const data = await getStudentDashboardData(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Student Dashboard</p>
          <h2 className="mt-2 font-[var(--font-heading)] text-3xl sm:text-4xl">Welcome back, {session?.user.name}</h2>
        </div>
        <Badge>Role: Student</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
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