import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Megaphone, Pin, Users, FileText, Paperclip, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AttachmentType {
  url: string;
  name: string;
  type: string;
}

export default async function StudentAnnouncementsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'STUDENT') {
    redirect('/login');
  }

  const studentId = session.user.id;

  // Get ALL announcements then filter by audience
  const allAnnouncements = await prisma.announcement.findMany({
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

  // Filter to only show announcements visible to this student
  const announcements = allAnnouncements.filter(ann => {
    const aud = ann.audience;
    if (aud === 'all') return true;
    if (aud === 'all_students') return true;
    if (aud === `student:${studentId}`) return true;
    // Legacy support for old audience values
    if (aud === 'Mathematics' || aud === 'Languages') return true;
    return false;
  });

  // Map audience labels
  function audienceLabel(audience: string): string {
    if (audience === 'all') return 'Everyone';
    if (audience === 'all_students') return 'All Students';
    if (audience === 'all_teachers') return 'All Teachers';
    if (audience.startsWith('student:')) return 'For You';
    return audience;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Student Console</p>
        <h2 className="mt-2 font-[var(--font-heading)] text-4xl">Broadcasting & Updates</h2>
      </div>

      {/* Feed list */}
      <div className="space-y-4">
        {announcements.map((ann) => {
          const annAttachments: AttachmentType[] = (ann.attachments as AttachmentType[] | null) || [];

          return (
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
                      {audienceLabel(ann.audience)}
                    </Badge>
                    {ann.audience === `student:${studentId}` && (
                      <Badge variant="default" className="text-[10px]">Personal</Badge>
                    )}
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
                
                {/* Attachments */}
                {annAttachments.length > 0 && (
                  <div className="space-y-2 border-t border-border/40 pt-3">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                      <Paperclip className="h-3 w-3" /> Attachments
                    </p>
                    
                    {/* Image gallery */}
                    {annAttachments.filter(a => a.type === 'image').length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {annAttachments.filter(a => a.type === 'image').map((att, i) => (
                          <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="block">
                            <img src={att.url} alt={att.name} className="h-24 w-24 object-cover rounded-xl border border-border/40 hover:ring-2 hover:ring-primary transition-all" />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* PDF links */}
                    {annAttachments.filter(a => a.type === 'pdf').map((att, i) => (
                      <a
                        key={i}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-xl border border-border/40 px-3 py-2 text-sm font-medium hover:bg-muted/40 transition-colors w-fit"
                      >
                        <FileText className="h-4 w-4 text-red-400" />
                        <span className="max-w-[200px] truncate">{att.name}</span>
                        <Download className="h-3 w-3 text-muted-foreground ml-auto" />
                      </a>
                    ))}
                  </div>
                )}

                <div className="border-t border-border/40 pt-3 flex justify-between items-center text-[10px] text-muted-foreground">
                  <span>By Teacher {ann.author.name}</span>
                  <span>EduNest Broadcast</span>
                </div>
              </CardContent>
            </Card>
          );
        })}

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
