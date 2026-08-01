'use client';

import { useParentContext } from './ParentContext';
import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
        <Select value={selectedStudentId || ''} onValueChange={setSelectedStudentId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a student" />
          </SelectTrigger>
          <SelectContent>
            {linkedStudents.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}
