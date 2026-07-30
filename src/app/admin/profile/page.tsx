import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, BookOpen } from 'lucide-react';
import { AvatarUpload } from '@/components/profile/AvatarUpload';

export default async function AdminProfilePage() {
  const session = await auth();

  if (!session?.user) {
    return <div className="p-6">Unauthorized</div>;
  }

  // Get subjects managed by this teacher
  const subjects = await prisma.subject.findMany({
    where: { teacherId: session.user.id }
  });

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Identity</p>
        <h2 className="mt-2 font-[var(--font-heading)] text-4xl">My Profile</h2>
      </div>

      <Card className="border-border/60 bg-card/85 backdrop-blur overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
          <div className="flex items-center gap-4">
            <AvatarUpload
              currentAvatarUrl={session.user.avatarUrl}
              userName={session.user.name ?? 'Teacher'}
              fallbackLetter={session.user.name?.[0] || 'T'}
            />
            <div>
              <CardTitle className="text-2xl font-bold">{session.user.name}</CardTitle>
              <CardDescription className="text-xs mt-1">Teacher Account — Click avatar to change</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
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

            <div className="space-y-2 col-span-2 border-t border-border/40 pt-4">
              <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" /> Assigned Subjects
              </span>
              <div className="flex gap-2 flex-wrap mt-1">
                {subjects.map((sub) => (
                  <Badge 
                    key={sub.id} 
                    style={{ backgroundColor: `${sub.color}15`, color: sub.color, borderColor: `${sub.color}30` }} 
                    variant="outline"
                  >
                    {sub.name}
                  </Badge>
                ))}
                {!subjects.length && (
                  <span className="text-xs text-muted-foreground">No subjects assigned.</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
