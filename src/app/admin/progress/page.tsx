import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, User, Calendar, Award } from 'lucide-react';

export default async function AdminProgressPage() {
  const session = await auth();

  if (!session?.user) {
    return <div className="p-6">Unauthorized</div>;
  }

  // Get student reading progress logs
  const progressList = await prisma.readingProgress.findMany({
    include: {
      user: { select: { name: true, email: true } },
      note: { include: { subject: true, chapter: true } }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">analytics</p>
        <h2 className="mt-2 font-[var(--font-heading)] text-4xl">Student Reading Progress</h2>
      </div>

      {/* List */}
      <div className="space-y-4 max-w-4xl">
        {progressList.map((progress) => {
          const totalPages = progress.note.pageCount || 1;
          const currentPage = progress.page; // 1-indexed bookmark
          const completionPercentage = Math.round((currentPage / totalPages) * 100);

          return (
            <Card key={progress.id} className="border-border/60 bg-card/85 backdrop-blur overflow-hidden">
              <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" style={{ backgroundColor: `${progress.note.subject.color}15`, color: progress.note.subject.color, borderColor: `${progress.note.subject.color}30` }} className="text-[10px]">
                      {progress.note.subject.name}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {progress.note.chapter.name}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-bold">{progress.note.title}</CardTitle>
                  <CardDescription className="text-xs flex items-center gap-1.5 mt-1">
                    <User className="h-3.5 w-3.5 text-primary" /> Read by {progress.user.name} ({progress.user.email})
                  </CardDescription>
                </div>

                <div className="text-right sm:text-right shrink-0">
                  <span className="text-2xl font-black text-primary">{completionPercentage}%</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Page {currentPage} of {totalPages}</p>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%`, backgroundColor: progress.note.subject.color }}
                  />
                </div>
                
                <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Last read: {new Date(progress.updatedAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {completionPercentage === 100 && (
                    <span className="flex items-center gap-1 font-bold text-emerald-500">
                      <Award className="h-3.5 w-3.5" /> Completed
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {!progressList.length && (
          <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/20 text-center p-6">
            <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-semibold">No reading logs recorded yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Logs will appear when the student starts studying notebook notes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
