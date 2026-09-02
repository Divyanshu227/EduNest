import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getAuthorizedParentStudent } from '@/lib/parent-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar } from 'lucide-react';
import { CalendarReminderDropdown } from '@/components/ui/calendar-reminder-dropdown';

export default async function ParentSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return <div className="p-6">Unauthorized</div>;

  const studentId = await getAuthorizedParentStudent(searchParams);
  if (!studentId) return <div className="p-6">No student selected.</div>;

  // We fetch all recent and future classes and sort them in memory
  // to properly handle ongoing classes based on duration.
  const allRelevantClasses = await prisma.liveClass.findMany({
    where: { 
      studentId, 
      // Fetch classes from last 24 hours to ensure we don't miss ongoing ones
      startTime: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
    },
    orderBy: { startTime: 'asc' },
    include: { teacher: true }
  });

  const now = new Date();
  
  const upcomingClasses = allRelevantClasses.filter(c => {
    const endTime = new Date(c.startTime.getTime() + c.durationMin * 60000);
    return endTime >= now;
  });

  // For previous classes, we can query specifically for classes that ended
  const previousClasses = await prisma.liveClass.findMany({
    where: { studentId, startTime: { lt: now } },
    orderBy: { startTime: 'desc' },
    take: 10,
    include: { teacher: true }
  }).then(classes => classes.filter(c => {
    const endTime = new Date(c.startTime.getTime() + c.durationMin * 60000);
    return endTime < now;
  }));

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
            <CardDescription>Scheduled and ongoing classes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No upcoming classes scheduled.</p>
            ) : (
              upcomingClasses.map((cls) => (
                <div key={cls.id} className="flex flex-col rounded-xl bg-muted/50 p-4 border border-border/50">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold">{cls.title}</h4>
                      <p className="text-sm text-muted-foreground">Teacher: {cls.teacher.name}</p>
                      <div className="mt-2 flex gap-2">
                        <Badge variant="outline">
                          {new Date(cls.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </Badge>
                        <Badge variant="secondary">{cls.durationMin} mins</Badge>
                      </div>
                    </div>
                    <CalendarReminderDropdown
                      title={`Live Class: ${cls.title}`}
                      description={`Meet Link: ${cls.meetLink}\nTeacher: ${cls.teacher.name}`}
                      startTime={cls.startTime}
                      durationMin={cls.durationMin}
                      location={cls.meetLink}
                      buttonText="Remind"
                    />
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/40">
                    <a href={cls.meetLink} target="_blank" rel="noopener noreferrer" className="block">
                      <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground h-9 px-4 text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors">
                        <Video className="h-4 w-4" /> Join Class
                      </button>
                    </a>
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
