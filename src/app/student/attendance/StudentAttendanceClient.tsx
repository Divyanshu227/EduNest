"use client";

import { useState } from 'react';
import { Calendar as CalendarIcon, CheckCircle, XCircle, ChevronLeft, ChevronRight, Award, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Subject {
  id: string;
  name: string;
  color: string;
}

interface AttendanceLog {
  id: string;
  subjectId: string;
  date: string | Date;
  status: 'PRESENT' | 'ABSENT';
  note: string | null;
  subject: { name: string; color: string };
  markedBy: { name: string };
}

interface StudentAttendanceClientProps {
  logs: AttendanceLog[];
  subjects: Subject[];
}

export function StudentAttendanceClient({ logs, subjects }: StudentAttendanceClientProps) {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  // Statistics calculation
  const totalClasses = logs.length;
  const presentClasses = logs.filter(l => l.status === 'PRESENT').length;
  const absentClasses = logs.filter(l => l.status === 'ABSENT').length;
  const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 100;

  // Month navigation
  const prevMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Generate calendar days
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const monthName = currentMonthDate.toLocaleString('default', { month: 'long' });

  const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week (0-6)
  const totalDays = new Date(year, month + 1, 0).getDate(); // Days in month

  const calendarDays = [];
  
  // Fill empty slot prepending first day
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }

  // Fill actual month days
  for (let day = 1; day <= totalDays; day++) {
    calendarDays.push(day);
  }

  // Find attendance status for a given day
  const getDayAttendance = (day: number) => {
    const checkDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Find logs matching this date (disregarding time shifts)
    return logs.filter(log => {
      const logDateStr = new Date(log.date).toISOString().split('T')[0];
      return logDateStr === checkDateStr;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Student Console</p>
        <h2 className="mt-2 font-[var(--font-heading)] text-3xl sm:text-4xl">My Attendance</h2>
      </div>

      {/* Summary Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          ['Attendance Rate', `${attendancePercentage}%`, attendancePercentage >= 75 ? 'text-emerald-500' : 'text-amber-500', 'Target: Min 75%'],
          ['Total Marked Days', totalClasses, 'text-primary', 'All classes logged'],
          ['Days Present', presentClasses, 'text-emerald-500', `${presentClasses} active days`],
          ['Days Absent', absentClasses, 'text-red-500', `${absentClasses} missed days`]
        ].map(([label, value, colorClass, desc]) => (
          <Card key={label} className="border-border/60 bg-card/85 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className={`text-4xl font-black ${colorClass}`}>{value}</CardTitle>
              <CardDescription className="text-[10px] mt-1">{desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/60 bg-card/85 backdrop-blur">
            <CardHeader className="flex flex-col gap-3 border-b border-border/40 pb-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-lg sm:text-xl">Attendance Calendar</CardTitle>
                <CardDescription>Daily presence scorecard logs.</CardDescription>
              </div>

              {/* Month Selector Buttons */}
              <div className="flex w-full items-center justify-between gap-1.5 rounded-2xl border border-border/60 bg-muted/20 p-1 sm:w-auto sm:justify-start">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[100px] text-center text-sm font-bold">
                  {monthName} {year}
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={nextMonth} disabled={month === new Date().getMonth() && year === new Date().getFullYear()}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <div className="min-w-[640px]">
                  {/* Calendar Header Day names */}
                  <div className="mb-3 grid grid-cols-7 gap-2 text-center text-xs font-black uppercase text-muted-foreground">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, idx) => {
                      if (day === null) {
                        return <div key={`empty-${idx}`} className="aspect-square" />;
                      }

                      const dayLogs = getDayAttendance(day);
                      const isPresent = dayLogs.some(l => l.status === 'PRESENT');
                      const isAbsent = dayLogs.some(l => l.status === 'ABSENT');

                      let cellStyle = 'bg-muted/10 border-border/40';
                      if (isPresent) cellStyle = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold';
                      if (isAbsent) cellStyle = 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 font-bold';

                      return (
                        <div 
                          key={`day-${day}`}
                          className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl border transition-all ${cellStyle}`}
                        >
                          <span className="text-sm">{day}</span>
                          
                          {/* Dots/Badges */}
                          <div className="mt-1 flex gap-0.5">
                            {dayLogs.map((log) => (
                              <span 
                                key={log.id} 
                                className={`h-1.5 w-1.5 rounded-full ${
                                  log.status === 'PRESENT' ? 'bg-emerald-500' : 'bg-red-500'
                                }`}
                                title={`${log.subject.name}: ${log.status}`}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subject wise stats */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Subject-wise Analytics</h3>

          <div className="space-y-4">
            {subjects.map((sub) => {
              const subLogs = logs.filter(l => l.subjectId === sub.id);
              const subTotal = subLogs.length;
              const subPresent = subLogs.filter(l => l.status === 'PRESENT').length;
              const subPercentage = subTotal > 0 ? Math.round((subPresent / subTotal) * 100) : 100;

              return (
                <Card key={sub.id} className="border-border/60 bg-card/85 backdrop-blur overflow-hidden">
                  <CardHeader className="pb-3 flex flex-row justify-between items-start gap-2">
                    <div>
                      <Badge style={{ backgroundColor: `${sub.color}15`, color: sub.color, borderColor: `${sub.color}30` }} variant="outline" className="mb-1.5">
                        {sub.name}
                      </Badge>
                      <CardTitle className="text-sm font-semibold">{subPercentage}% Presence</CardTitle>
                    </div>
                    
                    <span className="text-xs text-muted-foreground font-semibold">
                      {subPresent} / {subTotal} Days
                    </span>
                  </CardHeader>
                  <CardContent className="pt-0 pb-4">
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${subPercentage}%`, backgroundColor: sub.color }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
