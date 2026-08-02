import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Users, BookOpen } from 'lucide-react';
import { AvatarUpload } from '@/components/profile/AvatarUpload';

export default async function ParentProfilePage() {
  const session = await auth();

  if (!session?.user) {
    return <div className="p-6">Unauthorized</div>;
  }

  const [parentData, allAdmins] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        parentOf: {
          include: {
            student: true
          }
        }
      }
    }),
    prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, name: true, email: true }
    })
  ]);

  if (!parentData) return <div className="p-6">Parent profile not found.</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Parent Portal</p>
        <h2 className="mt-2 font-[var(--font-heading)] text-3xl sm:text-4xl">My Profile</h2>
      </div>

      <Card className="border-border/60 bg-card/85 backdrop-blur overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <AvatarUpload
              currentAvatarUrl={parentData.avatarUrl}
              userName={parentData.name}
              fallbackLetter={parentData.name?.[0] || 'P'}
            />
            <div>
              <CardTitle className="text-2xl font-bold">{parentData.name}</CardTitle>
              <CardDescription className="text-xs mt-1">Parent Account</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                <Mail className="h-3 w-3" /> Email Address
              </span>
              <p className="text-sm font-semibold">{parentData.email}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                <Phone className="h-3 w-3" /> Phone Number
              </span>
              <p className="text-sm font-semibold">{parentData.phone || 'Not provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/85 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Linked Students
          </CardTitle>
          <CardDescription>Students assigned to this parent account.</CardDescription>
        </CardHeader>
        <CardContent>
          {parentData.parentOf.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students linked yet.</p>
          ) : (
            <div className="space-y-6">
              {parentData.parentOf.map(({ student }) => {
                return (
                  <div key={student.id} className="rounded-xl border border-border/50 bg-muted/20 p-4">
                    <div className="font-semibold text-lg">{student.name}</div>
                    <div className="text-sm text-muted-foreground mb-4">{student.email}</div>
                    
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                        <BookOpen className="h-3 w-3" /> Assigned Teachers
                      </span>
                      {allAdmins.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No teachers assigned.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {allAdmins.map(teacher => (
                            <Badge key={teacher.id} variant="secondary" className="font-normal">
                              {teacher.name} ({teacher.email})
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Password change instruction */}
      <div className="text-center text-sm text-muted-foreground pt-4">
        To change your password, please contact the system administrator.
      </div>
    </div>
  );
}
