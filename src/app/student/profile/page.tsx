import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Shield, BookOpen, GraduationCap, Award, CheckCircle } from 'lucide-react';

export default async function StudentProfilePage() {
  const session = await auth();

  if (!session?.user) {
    return <div className="p-6">Unauthorized</div>;
  }

  // Get aggregated stats for this student
  const [progressCount, attemptsCount, attendanceCount] = await Promise.all([
    prisma.readingProgress.count({ where: { userId: session.user.id } }),
    prisma.testAttempt.count({ where: { studentId: session.user.id } }),
    prisma.attendance.count({ where: { studentId: session.user.id } })
  ]);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Student Console</p>
        <h2 className="mt-2 font-[var(--font-heading)] text-4xl">My Profile</h2>
      </div>

      <Card className="border-border/60 bg-card/85 backdrop-blur overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-2xl shadow-glow">
              {session.user.name?.[0] || 'S'}
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">{session.user.name}</CardTitle>
              <CardDescription className="text-xs mt-1">Class 5 Student</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                <Mail className="h-3 w-3" /> Email Address
              </span>
              <p className="text-sm font-semibold">{session.user.email}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                <Shield className="h-3 w-3" /> System Role
              </span>
              <div>
                <Badge className="bg-primary text-primary-foreground mt-0.5">{session.user.role}</Badge>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-3 gap-3 col-span-2 border-t border-border/40 pt-6">
              {[
                [GraduationCap, 'Notes Reading', progressCount, 'active books'],
                [Award, 'Quizzes Taken', attemptsCount, 'submitted attempts'],
                [CheckCircle, 'Attendance logs', attendanceCount, 'marked classes']
              ].map(([Icon, label, value, desc]) => {
                const IconComponent = Icon as any;
                return (
                  <div key={label as string} className="rounded-2xl border border-border/60 bg-muted/15 p-4 text-center">
                    <IconComponent className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-black">{value as any}</p>
                    <p className="text-[9px] text-muted-foreground font-bold mt-1 uppercase">{label as string}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{desc as string}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
