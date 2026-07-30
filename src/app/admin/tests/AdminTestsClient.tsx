"use client";

import { useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, FileText, CheckCircle2, ChevronRight, X, ArrowUp, ArrowDown, Settings2, Sparkles, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Question {
  id?: string;
  type: 'MCQ' | 'SHORT_ANSWER';
  prompt: string;
  options: string[]; // Options for MCQ
  correctAnswer: string;
  marks: number;
  explanation: string;
}

interface TestAttempt {
  id: string;
  studentId: string;
  score: number;
  percentage: number;
  completedAt: string | Date;
  student: { name: string; email: string };
}

interface Test {
  id: string;
  title: string;
  description: string | null;
  durationMin: number;
  isPublished: boolean;
  subjectId: string;
  chapterId: string | null;
  subject: { name: string; color: string };
  chapter: { name: string } | null;
  questions: Question[];
  attempts: TestAttempt[];
}

interface AdminTestsClientProps {
  initialTests: any[];
  subjects: any[];
}

export function AdminTestsClient({ initialTests, subjects }: AdminTestsClientProps) {
  const [tests, setTests] = useState<Test[]>(initialTests);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [selectedTestForAttempts, setSelectedTestForAttempts] = useState<Test | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMin, setDurationMin] = useState(30);
  const [isPublished, setIsPublished] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
  const chapters = selectedSubject?.chapters || [];

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    const sub = subjects.find(s => s.id === subjectId);
    setSelectedChapterId(sub?.chapters[0]?.id || '');
  };

  const openCreateForm = () => {
    setEditingTest(null);
    setTitle('');
    setDescription('');
    setDurationMin(30);
    setIsPublished(false);
    
    const firstSubId = subjects[0]?.id || '';
    setSelectedSubjectId(firstSubId);
    const firstSub = subjects.find(s => s.id === firstSubId);
    setSelectedChapterId(firstSub?.chapters[0]?.id || '');
    setQuestions([]);
    setIsFormOpen(true);
  };

  const openEditForm = (test: Test) => {
    setEditingTest(test);
    setTitle(test.title);
    setDescription(test.description || '');
    setDurationMin(test.durationMin);
    setIsPublished(test.isPublished);
    setSelectedSubjectId(test.subjectId);
    setSelectedChapterId(test.chapterId || '');
    
    // Safely parse questions and option arrays
    const formattedQuestions = test.questions.map(q => ({
      ...q,
      options: Array.isArray(q.options) ? q.options : ['', '', '', '']
    }));
    
    setQuestions(formattedQuestions);
    setIsFormOpen(true);
  };

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        type: 'MCQ',
        prompt: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        marks: 1,
        explanation: ''
      }
    ]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const moveQuestion = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === questions.length - 1) return;

    setQuestions(prev => {
      const newList = [...prev];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      const temp = newList[idx];
      newList[idx] = newList[targetIdx];
      newList[targetIdx] = temp;
      return newList;
    });
  };

  const updateQuestionField = (idx: number, field: keyof Question, value: any) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const updateQuestionOption = (qIdx: number, oIdx: number, value: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === qIdx) {
        const newOptions = [...q.options];
        newOptions[oIdx] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedSubjectId) {
      alert('Please fill in all required fields.');
      return;
    }

    if (questions.length === 0) {
      alert('Please add at least one question to the test.');
      return;
    }

    // Validate that MCQs have correct answers selected or written
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt) {
        alert(`Please enter a prompt for Question ${i + 1}`);
        return;
      }
      if (!q.correctAnswer) {
        alert(`Please provide a correct answer for Question ${i + 1}`);
        return;
      }
      if (q.type === 'MCQ') {
        const filledOptions = q.options.filter(o => o.trim() !== '');
        if (filledOptions.length < 2) {
          alert(`Please fill in at least two options for MCQ Question ${i + 1}`);
          return;
        }
      }
    }

    setSubmitting(true);
    const payload = {
      title,
      description,
      subjectId: selectedSubjectId,
      chapterId: selectedChapterId || undefined,
      durationMin: Number(durationMin),
      isPublished,
      questions
    };

    try {
      if (editingTest) {
        // Edit flow
        const res = await fetch(`/api/tests/${editingTest.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Update failed');
        const updated = await res.json();

        setTests(prev => prev.map(t => t.id === editingTest.id ? {
          ...t,
          ...updated.data,
          subject: subjects.find((s: any) => s.id === selectedSubjectId),
          chapter: chapters.find((c: any) => c.id === selectedChapterId) || null
        } : t));
      } else {
        // Create flow
        const res = await fetch('/api/tests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Create failed');
        const created = await res.json();
        
        // Next.js POST currently creates the test, but doesn't create questions in same endpoint. 
        // Oh wait, in our PATCH handler we supported saving questions. But what about the POST endpoint?
        // Let's check: POST endpoint only creates the basic test record and doesn't write questions.
        // So after creating the test, we should call PATCH on the created test to write all questions!
        // This is a beautiful way to reuse the PATCH questions writer.
        const createdTest = created.data;

        const resQuestions = await fetch(`/api/tests/${createdTest.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            isPublished
          })
        });

        if (!resQuestions.ok) throw new Error('Saving questions failed');
        const finalCreated = await resQuestions.json();

        setTests(prev => [
          {
            ...finalCreated.data,
            subject: subjects.find((s: any) => s.id === selectedSubjectId),
            chapter: chapters.find((c: any) => c.id === selectedChapterId) || null,
            attempts: []
          },
          ...prev
        ]);
      }
      setIsFormOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test? All student marks/attempts will be permanently deleted.')) return;

    try {
      const res = await fetch(`/api/tests/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Delete failed');
      setTests(prev => prev.filter(t => t.id !== id));
      if (selectedTestForAttempts?.id === id) {
        setSelectedTestForAttempts(null);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Academic Tests</p>
          <h2 className="mt-2 font-[var(--font-heading)] text-4xl">Class Room Quizzes</h2>
        </div>
        <Button onClick={openCreateForm} className="flex items-center gap-2 rounded-2xl shadow-glow">
          <Plus className="h-4 w-4" /> Create Test Builder
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quiz List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-lg animate-fade-in">Syllabus Tests</h3>
          
          <div className="space-y-4">
            {tests.map((test) => (
              <Card key={test.id} className={`overflow-hidden border-border/60 bg-card/85 backdrop-blur hover:border-primary/30 transition-all ${
                selectedTestForAttempts?.id === test.id ? 'ring-2 ring-primary/20' : ''
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge style={{ backgroundColor: `${test.subject.color}15`, color: test.subject.color, borderColor: `${test.subject.color}30` }} variant="outline">
                        {test.subject.name}
                      </Badge>
                      {test.chapter && (
                        <span className="text-xs text-muted-foreground">{test.chapter.name}</span>
                      )}
                    </div>
                    <Badge variant={test.isPublished ? "outline" : "secondary"} className="text-[10px]">
                      {test.isPublished ? 'Published & Active' : 'Draft / Closed'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{test.title}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">
                    {test.description || 'Quick revision check for the students.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground bg-muted/40 rounded-2xl p-4 border border-border/30">
                    <div>Questions: <span className="font-semibold text-foreground">{test.questions.length}</span></div>
                    <div>Duration: <span className="font-semibold text-foreground">{test.durationMin} mins</span></div>
                    <div>Total Marks: <span className="font-semibold text-foreground">{test.questions.reduce((acc, q) => acc + q.marks, 0)}</span></div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/40 pt-3">
                    <span className="text-xs text-muted-foreground">
                      {test.attempts.length} attempts recorded
                    </span>

                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedTestForAttempts(test)}
                        className="rounded-xl flex items-center gap-1.5"
                      >
                        <Award className="h-4 w-4" /> View Scores
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-accent rounded-lg" onClick={() => openEditForm(test)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-destructive/10 rounded-lg" onClick={() => handleDelete(test.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {!tests.length && (
              <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/20 text-center p-6">
                <p className="text-muted-foreground">No quizzes created yet. Click "Create Test Builder" to design your first quiz.</p>
              </div>
            )}
          </div>
        </div>

        {/* Scores Panel */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Results Board</h3>
          
          {selectedTestForAttempts ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-border/60 bg-card p-5">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-lg leading-tight">{selectedTestForAttempts.title}</h4>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setSelectedTestForAttempts(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Student marks and scorecard rankings.</p>
              </div>

              {selectedTestForAttempts.attempts.length ? selectedTestForAttempts.attempts.map((attempt) => {
                const totalMarks = selectedTestForAttempts.questions.reduce((acc, q) => acc + q.marks, 0);
                return (
                  <Card key={attempt.id} className="border-border/60 bg-card/85 backdrop-blur overflow-hidden">
                    <CardHeader className="pb-3 border-b border-border/40">
                      <div className="flex justify-between items-center gap-2">
                        <div>
                          <h4 className="font-semibold text-sm">{attempt.student.name}</h4>
                          <p className="text-[10px] text-muted-foreground">{attempt.student.email}</p>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          {attempt.percentage}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Score</span>
                        <span className="text-2xl font-black text-primary">{attempt.score} / {totalMarks}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        Completed {new Date(attempt.completedAt).toLocaleDateString()}
                      </span>
                    </CardContent>
                  </Card>
                );
              }) : (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/20 text-center p-6 min-h-[200px]">
                  <p className="text-xs text-muted-foreground">No students have attempted this quiz yet.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/20 text-center p-6 min-h-[300px]">
              <Settings2 className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">Select a test from the side list and click "View Scores" to inspect scorecard standings.</p>
            </div>
          )}
        </div>
      </div>

      {/* Builder Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl rounded-3xl border border-border/60 bg-background/95 p-6 shadow-2xl backdrop-blur max-h-[90vh] overflow-y-auto"
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 h-8 w-8 rounded-lg hover:bg-muted"
                onClick={() => setIsFormOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>

              <h3 className="font-[var(--font-heading)] text-2xl font-bold mb-4">
                {editingTest ? 'Edit Quiz / Test Builder' : 'Create Quiz / Test Builder'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="subject">Subject *</Label>
                    <select
                      id="subject"
                      value={selectedSubjectId}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {subjects.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="chapter">Chapter (Optional)</Label>
                    <select
                      id="chapter"
                      value={selectedChapterId}
                      onChange={(e) => setSelectedChapterId(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">No Chapter Assigned</option>
                      {chapters.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="title">Quiz Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Weekly Mathematics Quiz"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="duration">Duration (Minutes) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={durationMin}
                      onChange={(e) => setDurationMin(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description">Quiz Description / Guidelines</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter short instructions or descriptions for the test..."
                  />
                </div>

                {/* Published check */}
                <div className="flex items-center gap-2">
                  <input
                    id="isPublished"
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="isPublished" className="cursor-pointer font-semibold text-sm">
                    Publish test immediately (making it visible and attemptable by student)
                  </Label>
                </div>

                {/* Questions Builder */}
                <div className="border-t border-border/40 pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-lg flex items-center gap-1.5">
                      <Sparkles className="h-5 w-5 text-primary" /> Questions Editor ({questions.length})
                    </h4>
                    <Button type="button" size="sm" onClick={addQuestion} className="rounded-xl flex items-center gap-1">
                      <Plus className="h-4 w-4" /> Add Question
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {questions.map((q, idx) => (
                      <Card key={idx} className="border-border/60 bg-muted/20 relative p-4 space-y-4">
                        <div className="flex justify-between items-center gap-2">
                          <Badge variant="secondary">Question #{idx + 1}</Badge>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-lg hover:bg-muted"
                              disabled={idx === 0}
                              onClick={() => moveQuestion(idx, 'up')}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-lg hover:bg-muted"
                              disabled={idx === questions.length - 1}
                              onClick={() => moveQuestion(idx, 'down')}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-lg hover:bg-destructive/10 text-destructive"
                              onClick={() => removeQuestion(idx)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="space-y-1.5 sm:col-span-2">
                            <Label>Question Type</Label>
                            <select
                              value={q.type}
                              onChange={(e) => updateQuestionField(idx, 'type', e.target.value as any)}
                              className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="MCQ">Multiple Choice (MCQ)</option>
                              <option value="SHORT_ANSWER">Short Written Answer</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <Label>Question Marks</Label>
                            <Input
                              type="number"
                              min="0.5"
                              step="0.5"
                              value={q.marks}
                              onChange={(e) => updateQuestionField(idx, 'marks', Number(e.target.value))}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label>Question Prompt / Text *</Label>
                          <Input
                            placeholder="e.g., What is 12 + 15?"
                            value={q.prompt}
                            onChange={(e) => updateQuestionField(idx, 'prompt', e.target.value)}
                            required
                          />
                        </div>

                        {/* MCQ Specific Fields */}
                        {q.type === 'MCQ' ? (
                          <div className="space-y-3 pt-2 border-t border-border/30">
                            <Label>MCQ Options (Provide at least 2) *</Label>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className="space-y-1">
                                  <Label className="text-xs">Option {String.fromCharCode(65 + oIdx)}</Label>
                                  <Input
                                    placeholder={`Option text`}
                                    value={opt}
                                    onChange={(e) => updateQuestionOption(idx, oIdx, e.target.value)}
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="space-y-1.5">
                              <Label>Correct Choice Option (Matching exact text or choose A/B/C/D) *</Label>
                              <select
                                value={q.correctAnswer}
                                onChange={(e) => updateQuestionField(idx, 'correctAnswer', e.target.value)}
                                className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                              >
                                <option value="">Select Correct Option...</option>
                                {q.options.map((opt, oIdx) => (
                                  opt.trim() !== '' && (
                                    <option key={oIdx} value={opt}>
                                      Option {String.fromCharCode(65 + oIdx)}: {opt}
                                    </option>
                                  )
                                ))}
                              </select>
                            </div>
                          </div>
                        ) : (
                          // Short Answer Specific Fields
                          <div className="space-y-1.5 pt-2 border-t border-border/30">
                            <Label>Correct Short Answer *</Label>
                            <Input
                              placeholder="e.g., Triangle"
                              value={q.correctAnswer}
                              onChange={(e) => updateQuestionField(idx, 'correctAnswer', e.target.value)}
                              required
                            />
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <Label>Answer Explanation (Optional)</Label>
                          <Textarea
                            placeholder="Explain why this answer is correct..."
                            value={q.explanation}
                            onChange={(e) => updateQuestionField(idx, 'explanation', e.target.value)}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-border/40 pt-4 mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={submitting} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="rounded-xl shadow-glow">
                    {submitting ? 'Saving...' : editingTest ? 'Save Quiz' : 'Publish Quiz'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
