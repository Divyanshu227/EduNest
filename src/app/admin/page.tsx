import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

async function getDashboardData() {
  const [notes, homework, tests, attendance, announcementsCount, recentAnnouncements] = await Promise.all([
    prisma.note.count(),
    prisma.homework.count(),
    prisma.test.count(),
    prisma.attendance.count(),
    prisma.announcement.count(),
    prisma.announcement.findMany({ orderBy: { createdAt: 'desc' }, take: 3 })
  ]);

  return { notes, homework, tests, attendance, announcementsCount, recentAnnouncements };
}

export default async function AdminDashboardPage() {
  const session = await auth();
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Admin Dashboard</p>
          <h2 className="mt-2 font-[var(--font-heading)] text-4xl">Hello, {session?.user.name}</h2>
        </div>
        <Badge>Role: Admin</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total Notes', data.notes],
          ['Homework Created', data.homework],
          ['Tests Created', data.tests],
          ['Total Announcements', data.announcementsCount]
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
            <CardTitle>Latest Announcements</CardTitle>
            <CardDescription>Keep the student informed with class updates and reminders.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recentAnnouncements.length ? data.recentAnnouncements.map((announcement) => (
              <div key={announcement.id} className="rounded-2xl bg-muted p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{announcement.title}</p>
                  {announcement.pinned ? <Badge>Pinned</Badge> : null}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{announcement.message}</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">No announcements yet.</p>}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Admin Scope</CardTitle>
            <CardDescription>Mathematics and language teacher permissions are enforced at the data layer and the route layer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Use this dashboard to manage the assigned subject set only.</p>
            <p>Upload image-based notes, PDF notes, homework, and tests from the module pages.</p>
            <p>Attendance and announcement changes can trigger push notifications when Firebase is configured.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}