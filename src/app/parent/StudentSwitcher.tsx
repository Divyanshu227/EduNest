'use client';

import { useParentContext } from './ParentContext';
import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';

export function StudentSwitcher() {
  const { linkedStudents, selectedStudentId, setSelectedStudentId } = useParentContext();

  if (linkedStudents.length <= 1) return null;

  return (
    <Card className="glass border-border/60 p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-medium leading-none mb-1">Viewing Data For:</h3>
          <p className="text-sm text-muted-foreground">Select which student's dashboard to view.</p>
        </div>
      </div>
      
      <div className="w-64">
        <select 
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={selectedStudentId || ''} 
          onChange={(e) => setSelectedStudentId(e.target.value)}
        >
          <option value="" disabled>Select a student</option>
          {linkedStudents.map((student) => (
            <option key={student.id} value={student.id} className="text-black dark:text-white">
              {student.name}
            </option>
          ))}
        </select>
      </div>
    </Card>
  );
}
