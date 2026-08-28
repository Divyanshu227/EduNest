import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getAuthorizedParentStudent } from '@/lib/parent-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Pin } from 'lucide-react';

export default async function ParentAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return <div className="p-6">Unauthorized</div>;

  const studentId = await getAuthorizedParentStudent(searchParams);
  if (!studentId) return <div className="p-6">No student selected.</div>;

  const student = await prisma.user.findUnique({ where: { id: studentId }, select: { name: true } });

  const getAudienceLabel = (audience: string) => {
    if (audience === 'all' || audience === 'all_students') return 'General';
    if (audience.startsWith('student:')) return student?.name ? `For ${student.name}` : 'Personal';
    return audience;
  };

  const allAnnouncements = await prisma.announcement.findMany({
    orderBy: [
      { pinned: 'desc' },
      { createdAt: 'desc' }
    ],
    include: {
      author: { select: { name: true } }
    }
  });

  const now = Date.now();
  const announcements = allAnnouncements
    .filter(ann => {
      const aud = ann.audience;
      if (aud === 'all') return true;
      if (aud === 'all_students') return true;
      if (aud === `student:${studentId}`) return true;
      return false;
    })
    .sort((a, b) => {
      const aPinned = a.pinned && (!a.pinUntil || new Date(a.pinUntil).getTime() > now);
      const bPinned = b.pinned && (!b.pinUntil || new Date(b.pinUntil).getTime() > now);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[var(--font-heading)] text-3xl">Announcements</h2>
        <p className="text-sm text-muted-foreground">Stay updated with the latest news and messages.</p>
      </div>

      <div className="grid gap-6">
        {announcements.length === 0 ? (
          <Card className="glass border-border/60">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No Announcements</p>
              <p className="text-sm text-muted-foreground mt-1">Check back later for updates from teachers and admin.</p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => {
            const isPinned = announcement.pinned && (!announcement.pinUntil || new Date(announcement.pinUntil).getTime() > now);
            return (
            <Card key={announcement.id} className={`glass border-border/60 ${isPinned ? 'border-primary/50 shadow-glow' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      {announcement.title}
                      {isPinned && <Pin className="h-4 w-4 text-primary fill-primary rotate-45" />}
                    </CardTitle>
                    <CardDescription>Posted by {announcement.author.name} on {new Date(announcement.createdAt).toLocaleDateString()}</CardDescription>
                  </div>
                  <Badge 
                    variant={isPinned ? "default" : "secondary"}
                    className={announcement.audience.startsWith('student:') ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20' : ''}
                  >
                    {getAudienceLabel(announcement.audience)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
                  {announcement.message}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
