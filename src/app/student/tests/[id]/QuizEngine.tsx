"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Timer, AlertTriangle, CheckCircle2, XCircle, Award, BookOpen, AlertCircle, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Question {
  id: string;
  type: 'MCQ' | 'SHORT_ANSWER';
  prompt: string;
  options: any; // string[]
  correctAnswer: string | null;
  marks: number;
  explanation: string | null;
}

interface Test {
  id: string;
  title: string;
  description: string | null;
  durationMin: number;
  subjectId: string;
  subject: { name: string; color: string };
  chapter: { name: string } | null;
  questions: Question[];
}

interface QuizEngineProps {
  test: Test;
  initialAttempt: any;
}

export function QuizEngine({ test, initialAttempt }: QuizEngineProps) {
  const [attempt, setAttempt] = useState<any>(initialAttempt);
  const [quizState, setQuizState] = useState<'start' | 'active' | 'review'>(
    initialAttempt ? 'review' : 'start'
  );

  // Quiz active states
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(test.durationMin * 60);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Evaluated answers returned from backend upon submit
  const [evaluation, setEvaluation] = useState<any>(null);

  const totalMarks = test.questions.reduce((acc, q) => acc + q.marks, 0);

  const startQuiz = () => {
    setAnswers({});
    setTimeLeft(test.durationMin * 60);
    setQuizState('active');
  };

  // Timer countdown hook
  useEffect(() => {
    if (quizState !== 'active') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Auto submit
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizState]);

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleTextAnswerChange = (questionId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
  };

  const submitQuiz = async (answersToSubmit = answers) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/tests/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: test.id,
          answers: answersToSubmit
        })
      });

      if (!res.ok) throw new Error('Submission failed');
      const result = await res.json();
      
      setAttempt(result.data.attempt);
      setEvaluation(result.data);
      setQuizState('review');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    console.log('Timer expired. Auto-submitting quiz.');
    submitQuiz();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getStudentAnswer = (questionId: string) => {
    if (evaluation) {
      return evaluation.evaluatedAnswers[questionId]?.studentAnswer || '';
    }
    // If viewing initial attempt, answers are saved in attempt.answers
    if (attempt) {
      return attempt.answers[questionId] || '';
    }
    return '';
  };

  const isAnswerCorrect = (questionId: string) => {
    if (evaluation) {
      return evaluation.evaluatedAnswers[questionId]?.isCorrect;
    }
    if (attempt) {
      const q = test.questions.find(quest => quest.id === questionId);
      const studentAns = (attempt.answers[questionId] || '').trim().toLowerCase();
      const correctAns = (q?.correctAnswer || '').trim().toLowerCase();
      return studentAns === correctAns;
    }
    return false;
  };

  // Screen 1: Start Screen
  if (quizState === 'start') {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Button variant="ghost" asChild className="rounded-xl">
          <Link href="/student/tests" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Quizzes
          </Link>
        </Button>

        <Card className="border-border/60 bg-card/85 backdrop-blur overflow-hidden">
          <div className="h-2 w-full" style={{ backgroundColor: test.subject.color }} />
          <CardHeader className="pb-4">
            <Badge style={{ backgroundColor: `${test.subject.color}15`, color: test.subject.color, borderColor: `${test.subject.color}30`, width: 'fit-content' }} variant="outline" className="mb-2">
              {test.subject.name}
            </Badge>
            <CardTitle className="text-3xl font-black">{test.title}</CardTitle>
            <CardDescription className="text-sm mt-1">{test.description || 'General curriculum checkpoint.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4 border-t border-border/40">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-muted/40 rounded-2xl p-4 border border-border/30">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Questions</span>
                <span className="text-xl font-bold block mt-1">{test.questions.length}</span>
              </div>
              <div className="bg-muted/40 rounded-2xl p-4 border border-border/30">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Duration</span>
                <span className="text-xl font-bold block mt-1">{test.durationMin} Mins</span>
              </div>
              <div className="bg-muted/40 rounded-2xl p-4 border border-border/30">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Total Marks</span>
                <span className="text-xl font-bold block mt-1">{totalMarks}</span>
              </div>
            </div>

            <div className="space-y-3 bg-primary/5 rounded-3xl p-5 border border-primary/10">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" /> Test Instructions:
              </h4>
              <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
                <li>Once you start, the timer cannot be paused.</li>
                <li>The quiz will automatically submit when time is up.</li>
                <li>Review your answers carefully before hitting Submit.</li>
                <li>Correct answers and grades are shown immediately after submission.</li>
              </ul>
            </div>

            <Button onClick={startQuiz} className="w-full rounded-2xl shadow-glow py-6 font-bold text-base" style={{ backgroundColor: test.subject.color }}>
              Start Quiz Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Screen 2: Active Quiz
  if (quizState === 'active') {
    return (
      <div className="space-y-6 max-w-3xl mx-auto pb-12">
        {/* Floating Timer Header */}
        <div className="sticky top-16 z-20 flex items-center justify-between bg-zinc-900 text-zinc-100 border border-zinc-800 rounded-2xl px-6 py-4 shadow-xl backdrop-blur-md">
          <div>
            <h4 className="font-bold text-sm leading-none">{test.title}</h4>
            <span className="text-[10px] text-zinc-400 mt-1 block">Subject: {test.subject.name}</span>
          </div>
          <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-4 py-2 text-primary border border-zinc-700">
            <Timer className="h-4 w-4 animate-pulse text-red-500" />
            <span className="font-mono font-black text-lg tracking-wider text-red-500">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Questions list */}
        <div className="space-y-6">
          {test.questions.map((q, idx) => {
            const studentAns = answers[q.id] || '';
            const options = Array.isArray(q.options) ? q.options : [];
            
            return (
              <Card key={q.id} className="border-border/60 bg-card/85 backdrop-blur overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center gap-2 mb-2">
                    <Badge variant="secondary">Question {idx + 1}</Badge>
                    <span className="text-xs text-muted-foreground">{q.marks} Marks</span>
                  </div>
                  <CardTitle className="text-base font-semibold leading-relaxed">{q.prompt}</CardTitle>
                </CardHeader>
                <CardContent className="pt-2 border-t border-border/40 bg-muted/10">
                  {q.type === 'MCQ' ? (
                    <div className="grid gap-3 sm:grid-cols-2 pt-2">
                      {options.map((opt, oIdx) => {
                        const isSelected = studentAns === opt;
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => handleSelectOption(q.id, opt)}
                            className={`flex items-center gap-3 w-full rounded-2xl border p-4 text-left transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5 font-semibold shadow-sm'
                                : 'border-border/60 hover:bg-muted bg-background/50'
                            }`}
                          >
                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                              isSelected 
                                ? 'border-primary bg-primary text-primary-foreground' 
                                : 'border-border/80 text-muted-foreground'
                            }`}>
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="text-sm">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="pt-2 space-y-1.5">
                      <Label htmlFor={`answer-${q.id}`} className="text-xs font-semibold text-muted-foreground">Type your answer below:</Label>
                      <Input
                        id={`answer-${q.id}`}
                        value={studentAns}
                        onChange={(e) => handleTextAnswerChange(q.id, e.target.value)}
                        placeholder="Type short answer here..."
                        className="h-12 rounded-2xl"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Submit action */}
        <div className="flex justify-between items-center bg-card border border-border/60 rounded-3xl p-5 shadow-lg">
          <span className="text-xs text-muted-foreground">
            Please make sure all answers are complete.
          </span>
          <Button 
            onClick={() => {
              if (confirm('Are you sure you want to submit your test?')) {
                submitQuiz();
              }
            }}
            disabled={submitting} 
            className="rounded-2xl px-8 shadow-glow"
            style={{ backgroundColor: test.subject.color }}
          >
            {submitting ? 'Submitting...' : 'Finish & Submit Test'}
          </Button>
        </div>
      </div>
    );
  }

  // Screen 3: Review / Scorecard Screen
  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <Button variant="ghost" asChild className="rounded-xl">
        <Link href="/student/tests" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Quizzes
        </Link>
      </Button>

      {/* Score Card Banner */}
      <Card className="border-border/60 bg-card/85 backdrop-blur overflow-hidden shadow-glow">
        <div className="h-2 w-full bg-emerald-500" />
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6 justify-between">
          <div className="space-y-2 text-center sm:text-left">
            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20" variant="outline">
              Quiz Completed
            </Badge>
            <h3 className="text-2xl font-black">{test.title}</h3>
            <p className="text-xs text-muted-foreground">
              Attempt recorded on {new Date(attempt?.completedAt || new Date()).toLocaleDateString()}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 min-w-[180px]">
            <Award className="h-8 w-8 text-emerald-500 mb-2" />
            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Your Score</span>
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {attempt?.score} / {totalMarks}
            </span>
            <span className="text-xs font-semibold text-muted-foreground mt-1">
              ({attempt?.percentage}%)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Question review */}
      <div className="space-y-6">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" /> Answer Sheet Review
        </h3>

        {test.questions.map((q, idx) => {
          const studentAns = getStudentAnswer(q.id);
          const correctAns = q.correctAnswer || '';
          const isCorrect = isAnswerCorrect(q.id);
          const options = Array.isArray(q.options) ? q.options : [];

          return (
            <Card key={q.id} className={`overflow-hidden border-border/60 bg-card/85 backdrop-blur ${
              isCorrect ? 'hover:border-emerald-500/30' : 'hover:border-red-500/30'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Question {idx + 1}</Badge>
                    <span className="text-xs text-muted-foreground">{q.marks} Marks</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" /> Correct
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400">
                        <XCircle className="h-4 w-4" /> Incorrect
                      </span>
                    )}
                  </div>
                </div>
                <CardTitle className="text-base font-semibold leading-relaxed">{q.prompt}</CardTitle>
              </CardHeader>
              
              <CardContent className="pt-4 border-t border-border/40 bg-muted/10 space-y-4">
                {/* Options display for MCQ */}
                {q.type === 'MCQ' && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {options.map((opt, oIdx) => {
                      const isSelected = studentAns === opt;
                      const isCorrectChoice = correctAns === opt;
                      
                      let btnStyle = 'border-border/60 bg-background/50';
                      if (isSelected) {
                        btnStyle = isCorrect 
                          ? 'border-emerald-500 bg-emerald-500/5 font-semibold text-emerald-600 dark:text-emerald-400' 
                          : 'border-red-500 bg-red-500/5 font-semibold text-red-600 dark:text-red-400';
                      } else if (isCorrectChoice) {
                        btnStyle = 'border-emerald-500 bg-emerald-500/5 font-semibold text-emerald-600 dark:text-emerald-400';
                      }

                      return (
                        <div
                          key={oIdx}
                          className={`flex items-center gap-3 w-full rounded-2xl border p-4 text-left ${btnStyle}`}
                        >
                          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                            isCorrectChoice 
                              ? 'border-emerald-500 bg-emerald-500 text-white' 
                              : isSelected 
                                ? 'border-red-500 bg-red-500 text-white' 
                                : 'border-border/80 text-muted-foreground'
                          }`}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="text-sm">{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Short Answer display */}
                {q.type === 'SHORT_ANSWER' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className={`rounded-2xl p-4 border ${
                      isCorrect ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'
                    }`}>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Your Answer</span>
                      <span className="text-sm font-semibold mt-1 block">{studentAns || '[No answer submitted]'}</span>
                    </div>

                    {!isCorrect && (
                      <div className="rounded-2xl p-4 border border-emerald-500/20 bg-emerald-500/5">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Correct Answer</span>
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1 block">{correctAns}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <div className="rounded-2xl border border-blue-500/10 bg-blue-500/5 p-4 space-y-1">
                    <span className="text-[10px] text-blue-500 uppercase font-black flex items-center gap-1">
                      <HelpCircle className="h-3.5 w-3.5" /> Teacher's Explanation:
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{q.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
