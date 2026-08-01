import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getAuthorizedParentStudent } from '@/lib/parent-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCheck, UserX, UserMinus } from 'lucide-react';

export default async function ParentAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return <div className="p-6">Unauthorized</div>;

  const studentId = await getAuthorizedParentStudent(searchParams);
  if (!studentId) return <div className="p-6">No student selected.</div>;

  const records = await prisma.attendance.findMany({
    where: { studentId },
    orderBy: { date: 'desc' },
    include: {
      subject: true,
      markedBy: { select: { name: true } }
    }
  });

  const total = records.length;
  const present = records.filter(r => r.status === 'PRESENT').length;
  const absent = records.filter(r => r.status === 'ABSENT').length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[var(--font-heading)] text-3xl">Attendance Records</h2>
        <p className="text-sm text-muted-foreground">Track attendance and missed classes.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-[var(--font-heading)]">{percentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">{present} out of {total} classes attended</p>
          </CardContent>
        </Card>
        
        <Card className="glass border-border/60">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Present Days</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{present}</div>
          </CardContent>
        </Card>

        <Card className="glass border-border/60">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Absent Days</CardTitle>
            <UserX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{absent}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-border/60">
        <CardHeader>
          <CardTitle>Detailed Records</CardTitle>
          <CardDescription>Recent class attendance history.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50">
            <div className="divide-y divide-border/50">
              {records.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No attendance records found.</div>
              ) : (
                records.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 hover:bg-muted/20">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${record.status === 'PRESENT' ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                        {record.status === 'PRESENT' ? <UserCheck className="h-5 w-5" /> : <UserX className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {record.subject.name}
                          <Badge variant="outline" className="text-[10px]">{new Date(record.date).toLocaleDateString()}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Marked by Teacher: {record.markedBy.name}
                        </div>
                        {record.note && (
                          <div className="text-xs mt-1 text-muted-foreground italic">Note: {record.note}</div>
                        )}
                      </div>
                    </div>
                    <Badge variant={record.status === 'PRESENT' ? 'default' : 'destructive'} className={record.status === 'PRESENT' ? 'bg-green-500 hover:bg-green-600' : ''}>
                      {record.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
