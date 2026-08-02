import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Shield, BookOpen, GraduationCap, Award, CheckCircle, Users, Phone } from 'lucide-react';
import { AvatarUpload } from '@/components/profile/AvatarUpload';

export default async function StudentProfilePage() {
  const session = await auth();

  if (!session?.user) {
    return <div className="p-6">Unauthorized</div>;
  }

  // Get aggregated stats and parents for this student
  const [attemptsCount, attendanceCount, studentData] = await Promise.all([
    prisma.testAttempt.count({ where: { studentId: session.user.id } }),
    prisma.attendance.count({ where: { studentId: session.user.id } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        parents: {
          include: {
            parent: {
              select: { name: true, email: true, phone: true }
            }
          }
        }
      }
    })
  ]);

  if (!studentData) {
    return <div className="p-6">Student profile not found.</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Student Console</p>
        <h2 className="mt-2 font-[var(--font-heading)] text-3xl sm:text-4xl">My Profile</h2>
      </div>

      <Card className="border-border/60 bg-card/85 backdrop-blur overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <AvatarUpload
              currentAvatarUrl={session.user.avatarUrl}
              userName={session.user.name ?? 'Student'}
              fallbackLetter={session.user.name?.[0] || 'S'}
            />
            <div>
              <CardTitle className="text-2xl font-bold">{session.user.name}</CardTitle>
              <CardDescription className="text-xs mt-1">Class 5 Student — Click avatar to change</CardDescription>
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
            <div className="grid grid-cols-1 gap-3 border-t border-border/40 pt-6 sm:col-span-2 sm:grid-cols-3">
              {[
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

      <Card className="border-border/60 bg-card/85 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Linked Parents
          </CardTitle>
          <CardDescription>Parent accounts connected to your profile.</CardDescription>
        </CardHeader>
        <CardContent>
          {studentData.parents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No parents linked to this account.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {studentData.parents.map(({ parent }) => (
                <div key={parent.email} className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
                  <div className="font-semibold text-lg">{parent.name}</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      {parent.email}
                    </div>
                    {parent.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {parent.phone}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
