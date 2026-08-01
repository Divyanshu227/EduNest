import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getAuthorizedParentStudent } from '@/lib/parent-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function ParentNotesPage({
  searchParams,
}: {
  searchParams: { student?: string };
}) {
  const session = await auth();
  if (!session?.user) return <div className="p-6">Unauthorized</div>;

  const studentId = await getAuthorizedParentStudent(searchParams);
  if (!studentId) return <div className="p-6">No student selected.</div>;

  const notes = await prisma.note.findMany({
    where: { 
      OR: [
        { assignedStudentIds: { has: studentId } },
        { assignedStudentIds: { isEmpty: true } }
      ]
    },
    orderBy: { lastUpdated: 'desc' },
    include: {
      subject: true,
      chapter: true
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[var(--font-heading)] text-3xl">Study Notes</h2>
        <p className="text-sm text-muted-foreground">Access study materials and resources.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {notes.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 opacity-20 mb-4" />
            <p>No study notes available.</p>
          </div>
        ) : (
          notes.map((note) => {
            const pdfFiles = (note.pdfs as any[]) || [];
            
            return (
              <Card key={note.id} className="glass border-border/60 flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" style={{ borderColor: note.subject.color, color: note.subject.color }}>
                      {note.subject.name}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {note.type}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl line-clamp-2">{note.title}</CardTitle>
                  <CardDescription className="line-clamp-1">{note.chapter.name}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-4">
                  {note.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{note.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Uploaded {new Date(note.createdAt).toLocaleDateString()}
                  </div>
                  
                  {pdfFiles.length > 0 && (
                    <div className="pt-4 border-t border-border/50">
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={pdfFiles[0].url} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-2 h-4 w-4" /> Download PDF
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
