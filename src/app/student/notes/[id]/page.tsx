import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Youtube, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotebookViewer } from '@/components/notes/NotebookViewer';
import { PdfViewer } from '@/components/notes/PdfViewer';
import { OneNoteViewer } from '@/components/notes/OneNoteViewer';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentNoteDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return <div className="p-6">Unauthorized</div>;
  }

  const note = await prisma.note.findUnique({
    where: { id },
    include: {
      subject: true,
      chapter: true
    }
  });

  if (!note) {
    notFound();
  }

  // Always start at page 1 since progress tracking is removed
  const initialPage = 1;

  // Extract YouTube ID safely for embedding
  const getYoutubeEmbedUrl = (url: string | null) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const youtubeEmbedUrl = getYoutubeEmbedUrl(note.youtubeUrl);

  // Safely parse JSON lists
  const images = Array.isArray(note.images) ? (note.images as any[]) : [];
  const pdfs = Array.isArray(note.pdfs) ? (note.pdfs as any[]) : [];
  const primaryPdf = pdfs[0];

  const isOneNote = note.type === 'ONENOTE' || 
    primaryPdf?.url?.toLowerCase().endsWith('.one') || 
    primaryPdf?.name?.toLowerCase().endsWith('.one') ||
    primaryPdf?.url?.toLowerCase().endsWith('.onepkg') || 
    primaryPdf?.name?.toLowerCase().endsWith('.onepkg');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back navigation */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <Button variant="ghost" asChild className="rounded-xl hover:bg-muted">
          <Link href="/student/notes" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Notes
          </Link>
        </Button>
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
          {note.subject.name} &middot; {note.chapter.name}
        </span>
      </div>

      {/* Note Header Details */}
      <div className="space-y-2">
        <h2 className="font-[var(--font-heading)] text-3xl font-bold">{note.title}</h2>
        {note.description && (
          <p className="text-muted-foreground text-sm leading-relaxed">{note.description}</p>
        )}
      </div>

      {/* Primary Content Viewer */}
      <div className="space-y-6">
        {(note.type === 'ONENOTE' || (note.type === 'PDF' && isOneNote)) && primaryPdf && (
          <OneNoteViewer
            noteId={note.id}
            url={primaryPdf.url}
            fileName={primaryPdf.name}
            title={note.title}
            subjectName={note.subject.name}
            chapterName={note.chapter.name}
          />
        )}

        {note.type === 'PDF' && !isOneNote && primaryPdf && (
          <PdfViewer 
            noteId={note.id} 
            url={primaryPdf.url} 
            initialPage={initialPage} 
          />
        )}

        {(note.type === 'IMAGE' || note.type === 'MIXED') && (
          <NotebookViewer 
            noteId={note.id} 
            images={images} 
            initialPage={initialPage} 
          />
        )}
        
        {note.type === 'MIXED' && primaryPdf && (
          <div className="border-t border-border/40 pt-8 mt-6">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <GraduationCap className="h-5 w-5 text-primary" /> {isOneNote ? 'Reference OneNote Section' : 'Reference Textbook PDF'}
            </h3>
            {isOneNote ? (
              <OneNoteViewer
                noteId={note.id}
                url={primaryPdf.url}
                fileName={primaryPdf.name}
                title={note.title}
                subjectName={note.subject.name}
                chapterName={note.chapter.name}
              />
            ) : (
              <PdfViewer 
                noteId={note.id} 
                url={primaryPdf.url} 
                initialPage={1} 
              />
            )}
          </div>
        )}
      </div>

      {/* Optional YouTube Video walkthrough */}
      {youtubeEmbedUrl && (
        <div className="border-t border-border/40 pt-8">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Youtube className="h-5 w-5 text-red-500" /> Video Explanation & Walkthrough
          </h3>
          <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-border/60 bg-muted shadow-lg">
            <iframe
              src={youtubeEmbedUrl}
              title="YouTube Video Explanation"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}
