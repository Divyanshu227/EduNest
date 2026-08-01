import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getAuthorizedParentStudent } from '@/lib/parent-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileEdit } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default async function ParentTestsPage({
  searchParams,
}: {
  searchParams: { student?: string };
}) {
  const session = await auth();
  if (!session?.user) return <div className="p-6">Unauthorized</div>;

  const studentId = await getAuthorizedParentStudent(searchParams);
  if (!studentId) return <div className="p-6">No student selected.</div>;

  const testAttempts = await prisma.testAttempt.findMany({
    where: { studentId },
    orderBy: { completedAt: 'desc' },
    include: {
      test: {
        include: {
          subject: true,
          questions: true
        }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[var(--font-heading)] text-3xl">Tests & Assessments</h2>
        <p className="text-sm text-muted-foreground">Review test scores and performance.</p>
      </div>

      <div className="grid gap-6">
        {testAttempts.length === 0 ? (
          <Card className="glass border-border/60">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <FileEdit className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No Tests Taken</p>
              <p className="text-sm text-muted-foreground mt-1">There are currently no test records for this student.</p>
            </CardContent>
          </Card>
        ) : (
          testAttempts.map((attempt) => {
            const totalMarks = attempt.test.questions.reduce((sum, q) => sum + q.marks, 0);
            
            return (
              <Card key={attempt.id} className="glass border-border/60">
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <Badge variant="outline" className="mb-2" style={{ borderColor: attempt.test.subject.color, color: attempt.test.subject.color }}>
                        {attempt.test.subject.name}
                      </Badge>
                      <CardTitle>{attempt.test.title}</CardTitle>
                      <CardDescription>Taken on: {new Date(attempt.completedAt).toLocaleDateString()}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold font-[var(--font-heading)]">
                        {attempt.score} <span className="text-lg text-muted-foreground">/ {totalMarks}</span>
                      </div>
                      <Badge variant={attempt.percentage >= 80 ? 'default' : attempt.percentage >= 50 ? 'secondary' : 'destructive'} className="mt-1">
                        {attempt.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Performance Overview</span>
                      <span className="font-medium">{attempt.percentage >= 80 ? 'Excellent' : attempt.percentage >= 60 ? 'Good' : attempt.percentage >= 40 ? 'Average' : 'Needs Improvement'}</span>
                    </div>
                    <Progress value={attempt.percentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
