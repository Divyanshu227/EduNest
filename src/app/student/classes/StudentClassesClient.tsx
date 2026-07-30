"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar, Clock } from 'lucide-react';

type LiveClassType = {
  id: string;
  title: string;
  meetLink: string;
  startTime: Date;
  durationMin: number;
  teacher: {
    name: string;
    email: string;
  }
};

export function StudentClassesClient({ initialClasses }: { initialClasses: any[] }) {
  const [classes] = useState<LiveClassType[]>(initialClasses);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-[var(--font-heading)] text-3xl">My Live Classes</h2>
          <p className="text-sm text-muted-foreground">View and join your scheduled live sessions with teachers.</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {classes.length === 0 ? (
          <div className="col-span-full flex flex-col h-64 items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/20 text-center p-6">
            <Video className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-semibold">No live classes scheduled for you right now.</p>
          </div>
        ) : (
          classes.map((c) => {
            const isPast = new Date(c.startTime) < new Date();
            
            return (
              <Card key={c.id} className="relative overflow-hidden border-border/60 bg-card/85 backdrop-blur flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant={isPast ? "secondary" : "default"} className="text-[10px]">
                      {isPast ? 'Completed' : 'Upcoming'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl line-clamp-1">{c.title}</CardTitle>
                  <CardDescription className="text-sm font-medium mt-1">
                    Teacher: {c.teacher.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border/40 pt-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-primary" />
                      {new Date(c.startTime).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-primary" />
                      {new Date(c.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({c.durationMin}m)
                    </div>
                  </div>
                  
                  <div className="border-t border-border/40 pt-4 mt-2">
                    <a href={c.meetLink} target="_blank" rel="noopener noreferrer" className="block">
                      <Button className="w-full flex items-center justify-center gap-2 rounded-xl shadow-glow" variant={isPast ? "secondary" : "default"}>
                        <Video className="h-4 w-4" /> {isPast ? 'View Past Meeting Link' : 'Join Now'}
                      </Button>
                    </a>
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
