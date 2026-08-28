"use client";

import { useState } from 'react';
import { Check, X, Calendar, ClipboardCheck, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Subject {
  id: string;
  name: string;
  color: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

interface AttendanceLog {
  id: string;
  studentId: string;
  subjectId: string;
  date: string | Date;
  status: 'PRESENT' | 'ABSENT';
  note: string | null;
  student: { name: string; email: string };
  subject: { name: string; color: string };
}

interface AdminAttendanceClientProps {
  subjects: Subject[];
  students: Student[];
  initialLogs: any[];
}

export function AdminAttendanceClient({ subjects, students, initialLogs }: AdminAttendanceClientProps) {
  const [logs, setLogs] = useState<AttendanceLog[]>(initialLogs);
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Status mapping: studentId -> 'PRESENT' | 'ABSENT'
  const [attendanceStates, setAttendanceStates] = useState<Record<string, 'PRESENT' | 'ABSENT'>>({});
  // Notes mapping: studentId -> noteText
  const [attendanceNotes, setAttendanceNotes] = useState<Record<string, string>>({});
  // Submitting per student state: studentId -> boolean
  const [savingStudentId, setSavingStudentId] = useState<string | null>(null);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [saveSuccessMap, setSaveSuccessMap] = useState<Record<string, boolean>>({});

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  // Sync states when date or subject changes
  const getExistingLog = (studentId: string) => {
    return logs.find(log => {
      const logDate = new Date(log.date).toISOString().split('T')[0];
      return logDate === selectedDate && log.subjectId === selectedSubjectId && log.studentId === studentId;
    });
  };

  const handleStatusChange = (studentId: string, status: 'PRESENT' | 'ABSENT') => {
    setAttendanceStates(prev => ({ ...prev, [studentId]: status }));
    setSaveSuccessMap(prev => ({ ...prev, [studentId]: false }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setAttendanceNotes(prev => ({ ...prev, [studentId]: note }));
    setSaveSuccessMap(prev => ({ ...prev, [studentId]: false }));
  };

  // Save attendance for a single student independently
  const handleSaveSingleStudent = async (studentId: string) => {
    if (!selectedSubjectId || !selectedDate) {
      alert('Please select both a subject and date.');
      return;
    }

    const status = attendanceStates[studentId] || getExistingLog(studentId)?.status;
    if (!status) {
      alert('Please select Present or Absent before saving.');
      return;
    }

    const student = students.find(s => s.id === studentId);
    setSavingStudentId(studentId);

    try {
      const payload = {
        studentId,
        subjectId: selectedSubjectId,
        date: new Date(`${selectedDate}T12:00:00`).toISOString(),
        status,
        note: attendanceNotes[studentId] !== undefined ? attendanceNotes[studentId] : (getExistingLog(studentId)?.note || undefined)
      };

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save attendance');

      // Update local logs
      const savedRecord = {
        ...data.data,
        student: student ? { name: student.name, email: student.email } : { name: 'Student', email: '' },
        subject: selectedSubject || { name: 'Subject', color: '#6366f1' }
      };

      setLogs(prev => {
        const filtered = prev.filter(log => {
          const formattedLogDate = new Date(log.date).toISOString().split('T')[0];
          return !(formattedLogDate === selectedDate && log.subjectId === selectedSubjectId && log.studentId === studentId);
        });
        return [savedRecord, ...filtered];
      });

      setSaveSuccessMap(prev => ({ ...prev, [studentId]: true }));
      setTimeout(() => {
        setSaveSuccessMap(prev => ({ ...prev, [studentId]: false }));
      }, 3000);

    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingStudentId(null);
    }
  };

  // Save all marked students (non-blocking)
  const handleSaveAllMarked = async () => {
    if (!selectedSubjectId || !selectedDate) {
      alert('Please select both a subject and date.');
      return;
    }

    const markedStudents = students.filter(s => attendanceStates[s.id] || getExistingLog(s.id));
    if (markedStudents.length === 0) {
      alert('Please mark at least one student before saving.');
      return;
    }

    setBulkSubmitting(true);

    try {
      const promises = markedStudents.map(async (student) => {
        const status = attendanceStates[student.id] || getExistingLog(student.id)?.status;
        const payload = {
          studentId: student.id,
          subjectId: selectedSubjectId,
          date: new Date(`${selectedDate}T12:00:00`).toISOString(),
          status,
          note: attendanceNotes[student.id] !== undefined ? attendanceNotes[student.id] : (getExistingLog(student.id)?.note || undefined)
        };

        const res = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`Failed to save attendance for ${student.name}`);
        return res.json();
      });

      const results = await Promise.all(promises);

      const newLogs = results.map(res => ({
        ...res.data,
        student: students.find(s => s.id === res.data.studentId),
        subject: selectedSubject
      }));

      setLogs(prev => {
        const savedIds = new Set(newLogs.map(n => n.studentId));
        const filtered = prev.filter(log => {
          const formattedLogDate = new Date(log.date).toISOString().split('T')[0];
          return !(formattedLogDate === selectedDate && log.subjectId === selectedSubjectId && savedIds.has(log.studentId));
        });
        return [...newLogs, ...filtered];
      });

      alert(`Successfully saved attendance for ${markedStudents.length} student(s)!`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBulkSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Attendance Center</p>
        <h2 className="mt-2 font-[var(--font-heading)] text-4xl">Class Attendance Register</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Mark and submit attendance individually per student as their sessions finish, or mark all at once.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Marking Sheet */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/60 bg-card/85 backdrop-blur">
            <CardHeader className="pb-4 border-b border-border/40">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="date">Select Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject">Subject *</Label>
                  <select
                    id="subject"
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base flex items-center gap-1.5">
                  <ClipboardCheck className="h-5 w-5 text-primary" /> Marking Register ({students.length} Students)
                </h3>
                <span className="text-xs text-muted-foreground">
                  Individual instant save enabled
                </span>
              </div>

              <div className="space-y-4">
                {students.map((student) => {
                  const existingLog = getExistingLog(student.id);
                  const currentStatus = attendanceStates[student.id] || existingLog?.status;
                  const currentNote = attendanceNotes[student.id] !== undefined ? attendanceNotes[student.id] : (existingLog?.note || '');
                  const isSavingThis = savingStudentId === student.id;
                  const justSaved = saveSuccessMap[student.id];

                  return (
                    <div 
                      key={student.id} 
                      className={`flex flex-col gap-3 p-4 border rounded-3xl transition-all ${
                        existingLog 
                          ? 'border-emerald-500/30 bg-emerald-500/5' 
                          : 'border-border/60 bg-muted/20'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0 flex items-center gap-2">
                          <div>
                            <p className="font-bold text-sm">{student.name}</p>
                            <p className="text-[10px] text-muted-foreground">{student.email}</p>
                          </div>
                          {existingLog && (
                            <Badge variant="outline" className={`text-[10px] ml-2 ${
                              existingLog.status === 'PRESENT' ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10' : 'border-red-500/40 text-red-600 bg-red-500/10'
                            }`}>
                              Saved: {existingLog.status}
                            </Badge>
                          )}
                        </div>

                        {justSaved && (
                          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" /> Saved!
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1 border-t border-border/30">
                        {/* Notes Input */}
                        <div className="flex-1">
                          <Input
                            placeholder="Note (e.g. Completed Chapter 1, on-time)"
                            value={currentNote}
                            onChange={(e) => handleNoteChange(student.id, e.target.value)}
                            className="h-8 text-xs rounded-xl"
                          />
                        </div>

                        {/* Status selectors */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant={currentStatus === 'PRESENT' ? 'default' : 'outline'}
                            onClick={() => handleStatusChange(student.id, 'PRESENT')}
                            className={`rounded-xl flex items-center gap-1 text-xs px-3 h-8 ${
                              currentStatus === 'PRESENT' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" /> Present
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={currentStatus === 'ABSENT' ? 'destructive' : 'outline'}
                            onClick={() => handleStatusChange(student.id, 'ABSENT')}
                            className={`rounded-xl flex items-center gap-1 text-xs px-3 h-8 ${
                              currentStatus === 'ABSENT' ? 'bg-red-600 hover:bg-red-700 text-white' : ''
                            }`}
                          >
                            <X className="h-3.5 w-3.5" /> Absent
                          </Button>

                          {/* Single Student Save Button */}
                          <Button
                            type="button"
                            size="sm"
                            disabled={!currentStatus || isSavingThis}
                            onClick={() => handleSaveSingleStudent(student.id)}
                            className="rounded-xl text-xs h-8 px-3 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                          >
                            {isSavingThis ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {students.length > 1 && (
                <Button
                  onClick={handleSaveAllMarked}
                  disabled={bulkSubmitting}
                  variant="outline"
                  className="w-full rounded-2xl py-5 font-bold border-primary/40 hover:bg-primary/5 text-primary"
                >
                  {bulkSubmitting ? 'Saving All Marked...' : 'Save All Marked Students'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar History Logs */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Recent History</h3>
          
          <div className="space-y-3">
            {logs.map((log) => {
              const formattedDate = new Date(log.date).toLocaleDateString([], {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              });
              const isPresent = log.status === 'PRESENT';

              return (
                <Card key={log.id} className="border-border/60 bg-card/85 backdrop-blur overflow-hidden">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge style={{ backgroundColor: `${log.subject.color}15`, color: log.subject.color, borderColor: `${log.subject.color}30` }} variant="outline" className="text-[10px]">
                          {log.subject.name}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{formattedDate}</span>
                      </div>
                      <h4 className="font-semibold text-sm leading-tight">{log.student.name}</h4>
                      {log.note && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                          <FileText className="h-3 w-3" /> {log.note}
                        </p>
                      )}
                    </div>

                    <Badge 
                      className={`text-xs px-2.5 py-1 rounded-lg ${
                        isPresent 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}
                      variant="outline"
                    >
                      {log.status}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}

            {!logs.length && (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/20 text-center p-6 min-h-[200px]">
                <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">No recent attendance records logged.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
