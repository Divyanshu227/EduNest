import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Megaphone, Pin, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function StudentAnnouncementsPage() {
  const session = await auth();

  if (!session?.user) {
    return <div className="p-6">Unauthorized</div>;
  }

  // Get announcements visible to students
  const announcements = await prisma.announcement.findMany({
    orderBy: [
      { pinned: 'desc' },
      { createdAt: 'desc' }
    ],
    include: {
      author: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Student Console</p>
        <h2 className="mt-2 font-[var(--font-heading)] text-4xl">Broadcasting & Updates</h2>
      </div>

      {/* Feed list */}
      <div className="space-y-4">
        {announcements.map((ann) => (
          <Card 
            key={ann.id} 
            className={`overflow-hidden border-border/60 bg-card/85 backdrop-blur transition-all ${
              ann.pinned ? 'border-primary/30 ring-1 ring-primary/10 shadow-glow' : ''
            }`}
          >
            <CardHeader className="pb-3 flex flex-row items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {ann.audience}
                  </Badge>
                  {ann.pinned && (
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary">
                      <Pin className="h-3 w-3 fill-current animate-bounce" />
                    </span>
                  )}
                </div>
                <CardTitle className="text-xl font-bold leading-tight">{ann.title}</CardTitle>
              </div>

              <span className="text-[10px] text-muted-foreground shrink-0 mt-1">
                {new Date(ann.createdAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{ann.message}</p>
              
              <div className="border-t border-border/40 pt-3 flex justify-between items-center text-[10px] text-muted-foreground">
                <span>By Teacher {ann.author.name}</span>
                <span>EduNest Broadcast</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {!announcements.length && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-card p-6 min-h-[300px] text-center">
            <Megaphone className="h-10 w-10 text-muted-foreground mb-3 animate-pulse" />
            <p className="text-muted-foreground font-semibold">No announcements have been posted yet. You are completely up to date!</p>
          </div>
        )}
      </div>
    </div>
  );
}
