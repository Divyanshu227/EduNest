import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getAuthorizedParentStudent } from '@/lib/parent-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar } from 'lucide-react';

export default async function ParentSchedulePage({
  searchParams,
}: {
  searchParams: { student?: string };
}) {
  const session = await auth();
  if (!session?.user) return <div className="p-6">Unauthorized</div>;

  const studentId = await getAuthorizedParentStudent(searchParams);
  if (!studentId) return <div className="p-6">No student selected.</div>;

  const now = new Date();
  
  const upcomingClasses = await prisma.liveClass.findMany({
    where: { studentId, startTime: { gte: now } },
    orderBy: { startTime: 'asc' },
    include: { teacher: true }
  });

  const previousClasses = await prisma.liveClass.findMany({
    where: { studentId, startTime: { lt: now } },
    orderBy: { startTime: 'desc' },
    take: 10,
    include: { teacher: true }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[var(--font-heading)] text-3xl">Class Schedule</h2>
        <p className="text-sm text-muted-foreground">View upcoming and past classes.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Classes
            </CardTitle>
            <CardDescription>Scheduled classes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No upcoming classes scheduled.</p>
            ) : (
              upcomingClasses.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between rounded-xl bg-muted/50 p-4 border border-border/50">
                  <div>
                    <h4 className="font-semibold">{cls.title}</h4>
                    <p className="text-sm text-muted-foreground">Teacher: {cls.teacher.name}</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="outline">{new Date(cls.startTime).toLocaleString()}</Badge>
                      <Badge variant="secondary">{cls.durationMin} mins</Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="glass border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Previous Classes
            </CardTitle>
            <CardDescription>Recently completed sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {previousClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No previous classes.</p>
            ) : (
              previousClasses.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between rounded-xl bg-muted/50 p-4 border border-border/50">
                  <div>
                    <h4 className="font-semibold">{cls.title}</h4>
                    <p className="text-sm text-muted-foreground">Teacher: {cls.teacher.name}</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="outline">{new Date(cls.startTime).toLocaleDateString()}</Badge>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">Completed</Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
