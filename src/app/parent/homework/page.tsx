import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getAuthorizedParentStudent } from '@/lib/parent-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, CheckCircle, Clock } from 'lucide-react';

export default async function ParentHomeworkPage({
  searchParams,
}: {
  searchParams: { student?: string };
}) {
  const session = await auth();
  if (!session?.user) return <div className="p-6">Unauthorized</div>;

  const studentId = await getAuthorizedParentStudent(searchParams);
  if (!studentId) return <div className="p-6">No student selected.</div>;

  const homework = await prisma.homework.findMany({
    where: { 
      OR: [
        { assignedStudentIds: { has: studentId } },
        { assignedStudentIds: { isEmpty: true } }
      ]
    },
    orderBy: { dueDate: 'asc' },
    include: {
      subject: true,
      submissions: {
        where: { studentId }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[var(--font-heading)] text-3xl">Homework & Assignments</h2>
        <p className="text-sm text-muted-foreground">Track homework assignments and submission status.</p>
      </div>

      <div className="grid gap-6">
        {homework.length === 0 ? (
          <Card className="glass border-border/60">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No Homework Assigned</p>
              <p className="text-sm text-muted-foreground mt-1">There are currently no active assignments.</p>
            </CardContent>
          </Card>
        ) : (
          homework.map((hw) => {
            const submission = hw.submissions[0];
            const isSubmitted = !!submission;
            const isLate = !isSubmitted && new Date(hw.dueDate) < new Date();
            
            return (
              <Card key={hw.id} className="glass border-border/60">
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <Badge variant="outline" className="mb-2" style={{ borderColor: hw.subject.color, color: hw.subject.color }}>
                        {hw.subject.name}
                      </Badge>
                      <CardTitle>{hw.title}</CardTitle>
                      <CardDescription>Assigned: {new Date(hw.createdAt).toLocaleDateString()}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSubmitted ? (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600 flex gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> Submitted
                        </Badge>
                      ) : isLate ? (
                        <Badge variant="destructive" className="flex gap-1">
                          <Clock className="h-3.5 w-3.5" /> Overdue
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex gap-1">
                          <Clock className="h-3.5 w-3.5" /> Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl bg-muted/30 p-4 border border-border/50 text-sm whitespace-pre-wrap">
                    {hw.instructions}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center text-sm border-t border-border/50 pt-4">
                    <div>
                      <span className="text-muted-foreground mr-2">Due Date:</span>
                      <span className={`font-semibold ${isLate ? 'text-destructive' : ''}`}>
                        {new Date(hw.dueDate).toLocaleString()}
                      </span>
                    </div>
                    {isSubmitted && submission.score !== null && (
                      <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-medium">
                        Score: {submission.score}
                      </div>
                    )}
                  </div>
                  {isSubmitted && submission.feedback && (
                    <div className="mt-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 p-4 border border-blue-200 dark:border-blue-900/50">
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Teacher Feedback</p>
                      <p className="text-sm text-blue-700 dark:text-blue-400">{submission.feedback}</p>
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
