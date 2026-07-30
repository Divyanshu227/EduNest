import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FolderHeart, Layers } from 'lucide-react';

export default async function AdminSubjectsPage() {
  const session = await auth();

  if (!session?.user) {
    return <div className="p-6">Unauthorized</div>;
  }

  // Get subjects managed by this teacher
  const subjects = await prisma.subject.findMany({
    where: { teacherId: session.user.id },
    include: {
      chapters: true,
      notes: true,
      homework: true,
      tests: true
    },
    orderBy: { sortOrder: 'asc' }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Academic Scope</p>
        <h2 className="mt-2 font-[var(--font-heading)] text-4xl">Managed Subjects</h2>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((sub) => (
          <Card key={sub.id} className="relative overflow-hidden border-border/60 bg-card/85 backdrop-blur flex flex-col justify-between">
            {/* Color Accent bar */}
            <div className="h-2 w-full" style={{ backgroundColor: sub.color }} />
            
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <Badge variant="outline" style={{ borderColor: `${sub.color}30`, backgroundColor: `${sub.color}10`, color: sub.color }} className="text-[10px]">
                  Sort order: {sub.sortOrder}
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold">{sub.name}</CardTitle>
              <CardDescription className="text-xs line-clamp-2 mt-1">
                Managed by {session.user.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-2 border-t border-border/40 pt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-primary" /> {sub.chapters.length} Chapters
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-primary" /> {sub.notes.length} Study Notes
                </div>
                <div className="flex items-center gap-1.5 col-span-2">
                  <FolderHeart className="h-4 w-4 text-primary" /> {sub.homework.length} Homework & {sub.tests.length} Quizzes
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!subjects.length && (
          <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/20 text-center p-6">
            <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-semibold">No subjects assigned to your account.</p>
          </div>
        )}
      </div>
    </div>
  );
}
