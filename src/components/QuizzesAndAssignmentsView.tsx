import React, { useEffect, useState } from 'react';
import { CheckCircle2, Flame, HelpCircle, Layers, Play, Trophy } from 'lucide-react';
import { ASSIGNMENTS_LIST, DAILY_CHALLENGE, QUIZ_BANK } from '../data/assessments';
import { COURSE_CURRICULUM } from '../data/curriculum';
import { executePythonCode } from '../services/pyodideRunner';
import type { QuizCategory } from '../types';
import { FlashcardsDeck } from './FlashcardsDeck';

type QuizzesTab = QuizCategory | 'all' | 'flashcards';

interface QuizzesViewProps {
  initialCategory?: QuizzesTab;
  highlightedQuestionId?: string | null;
  quizSelectionKey?: number;
  quizScores: Record<string, number>;
  onRecordQuizScore: (category: string, scorePct: number) => void;
  onSolveChallenge: (id: string) => void;
}

const CATEGORY_TABS: Array<{ id: QuizzesTab; label: string }> = [
  { id: 'all', label: 'All Questions' },
  { id: 'mcq', label: 'Multiple Choice' },
  { id: 'true_false', label: 'True or False' },
  { id: 'find_output', label: 'Find the Output' },
  { id: 'debugging', label: 'Debugging' },
  { id: 'coding_challenge', label: 'Coding Challenges' },
  { id: 'flashcards', label: 'Flashcards' },
];

export const QuizzesView: React.FC<QuizzesViewProps> = ({
  initialCategory,
  highlightedQuestionId,
  quizSelectionKey,
  quizScores,
  onRecordQuizScore,
  onSolveChallenge,
}) => {
  const [activeCat, setActiveCat] = useState<QuizzesTab>(initialCategory || 'all');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submittedIds, setSubmittedIds] = useState<Record<string, boolean>>({});
  const [codeDrafts, setCodeDrafts] = useState<Record<string, string>>({});
  const [codeResults, setCodeResults] = useState<Record<string, { passed: boolean; output: string }>>({});
  const [runningId, setRunningId] = useState<string | null>(null);

  useEffect(() => {
    if (initialCategory) {
      setActiveCat(initialCategory);
    }
  }, [initialCategory, quizSelectionKey]);

  useEffect(() => {
    if (!highlightedQuestionId) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`quiz-${highlightedQuestionId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [highlightedQuestionId, quizSelectionKey]);

  const visibleQuestions = QUIZ_BANK.filter((q) => (activeCat === 'all' ? true : q.category === activeCat));

  const handleCheckOption = (qId: string, correctIdx: number | undefined, cat: string) => {
    if (selectedAnswers[qId] === undefined) return;
    const nextSubmitted = { ...submittedIds, [qId]: true };
    setSubmittedIds(nextSubmitted);

    const catQuestions = QUIZ_BANK.filter((q) => q.category === cat && q.options);
    const correctCount = catQuestions.filter(
      (q) => (q.id === qId ? selectedAnswers[qId] === correctIdx : nextSubmitted[q.id] && selectedAnswers[q.id] === q.correctIndex)
    ).length;
    const pct = Math.round((correctCount / Math.max(catQuestions.length, 1)) * 100);
    onRecordQuizScore(cat, pct);
  };

  const handleRunChallenge = async (qId: string, starter: string, expected: string) => {
    setRunningId(qId);
    const src = codeDrafts[qId] ?? starter;
    const res = await executePythonCode(src);
    const out = (res.stderr ? `${res.stdout}\n${res.stderr}` : res.stdout).trim();
    const passed = !res.stderr && res.stdout.trim() === expected.trim();
    setCodeResults((prev) => ({ ...prev, [qId]: { passed, output: out || '(No output)' } }));
    setSubmittedIds((prev) => ({ ...prev, [qId]: true }));
    if (passed) {
      onSolveChallenge(qId);
      onRecordQuizScore('coding_challenge', 100);
    }
    setRunningId(null);
  };

  const totalEvaluated = Object.keys(submittedIds).length;
  const totalCorrect = QUIZ_BANK.filter((q) => {
    if (!submittedIds[q.id]) return false;
    if (q.category === 'coding_challenge') return codeResults[q.id]?.passed;
    return selectedAnswers[q.id] === q.correctIndex;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            5 Quiz Formats + Flashcards Mode · Instant Evaluation · Active Recall
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Python Quizzes & Skill Tests
          </h1>
        </div>

        <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 tabular-nums">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span>
            Session Score: {totalCorrect} / {Math.max(totalEvaluated, 1)} Correct
          </span>
          {Object.keys(quizScores).length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                Best Avg:{' '}
                {Math.round(
                  Object.values(quizScores).reduce((a, b) => a + b, 0) / Object.values(quizScores).length
                )}
                %
              </span>
            </>
          )}
        </div>
      </div>

      {/* Category Filter & Mode Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {CATEGORY_TABS.map((tab) => {
          const isFlashcards = tab.id === 'flashcards';
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCat(tab.id)}
              className={`min-h-[40px] inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeCat === tab.id
                  ? 'bg-sky-600 text-white'
                  : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {isFlashcards && <Layers className="h-3.5 w-3.5 shrink-0" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Flashcards Active Recall Mode vs Standard Questions Feed */}
      {activeCat === 'flashcards' ? (
        <FlashcardsDeck
          onMasteryChange={(pct) => onRecordQuizScore('flashcards', pct)}
        />
      ) : (
        <div className="space-y-5">
        {visibleQuestions.map((q, index) => {
          const isSubmitted = !!submittedIds[q.id];
          const chosen = selectedAnswers[q.id];

          return (
            <div
              id={`quiz-${q.id}`}
              key={q.id}
              className={`rounded-2xl border bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4 transition-colors ${
                highlightedQuestionId === q.id
                  ? 'border-sky-500 dark:border-sky-500 ring-2 ring-sky-500/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Question {index + 1}</span>
                <span aria-hidden="true">·</span>
                <span>{q.moduleRef}</span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{q.category.replace('_', ' ')}</span>
              </div>

              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                {q.question}
              </h2>

              {q.codeSnippet && (
                <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-xs sm:text-sm text-sky-300">
                  <code>{q.codeSnippet}</code>
                </pre>
              )}

              {q.options ? (
                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    let cls =
                      'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60';
                    if (isSubmitted) {
                      if (optIdx === q.correctIndex) {
                        cls = 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200';
                      } else if (chosen === optIdx) {
                        cls = 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200';
                      }
                    } else if (chosen === optIdx) {
                      cls = 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40';
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => {
                          if (!isSubmitted) {
                            setSelectedAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                          }
                        }}
                        className={`w-full min-h-[44px] text-left rounded-xl border px-4 py-3 text-sm transition-colors ${cls}`}
                      >
                        {opt}
                      </button>
                    );
                  })}

                  {!isSubmitted && (
                    <button
                      type="button"
                      disabled={chosen === undefined}
                      onClick={() => handleCheckOption(q.id, q.correctIndex, q.category)}
                      className="mt-2 min-h-[44px] rounded-xl bg-sky-600 px-5 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50 transition-colors"
                    >
                      Submit Answer
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    rows={6}
                    value={codeDrafts[q.id] ?? q.starterCode ?? ''}
                    onChange={(e) => setCodeDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    spellCheck={false}
                    className="w-full rounded-xl bg-slate-950 p-4 font-mono text-xs sm:text-sm text-slate-100 focus:outline-none"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500 font-mono">
                      Expected stdout: {q.expectedStdout}
                    </span>
                    <button
                      type="button"
                      disabled={runningId === q.id}
                      onClick={() => handleRunChallenge(q.id, q.starterCode || '', q.expectedStdout || '')}
                      className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50 transition-colors"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>{runningId === q.id ? 'Testing...' : 'Run & Verify Solution'}</span>
                    </button>
                  </div>
                  {codeResults[q.id] && (
                    <div className="rounded-xl bg-slate-900 p-3.5 font-mono text-xs text-slate-200">
                      Output: {codeResults[q.id].output} —{' '}
                      <span className={codeResults[q.id].passed ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                        {codeResults[q.id].passed ? 'PASSED' : 'TRY AGAIN'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {isSubmitted && (
                <div className="rounded-xl bg-slate-50 dark:bg-slate-950/80 p-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    Correct Answer: {q.correctAnswerText}
                  </div>
                  <p>{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};

interface DailyPracticeViewProps {
  streakDays: number;
  completedLessons: string[];
  onOpenLesson: (lessonId: string) => void;
  onMarkDailyDone: () => void;
}

export const DailyPracticeView: React.FC<DailyPracticeViewProps> = ({
  streakDays,
  completedLessons,
  onOpenLesson,
  onMarkDailyDone,
}) => {
  const [code, setCode] = useState(DAILY_CHALLENGE.starterCode);
  const [out, setOut] = useState<string | null>(null);
  const [passed, setPassed] = useState(false);
  const [running, setRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [dailyQuizPicked, setDailyQuizPicked] = useState<number | null>(null);

  const allLessons = COURSE_CURRICULUM.flatMap((m) => m.lessons);
  const nextRecommended = allLessons.find((l) => !completedLessons.includes(l.id)) || allLessons[0];

  const runDaily = async () => {
    setRunning(true);
    const res = await executePythonCode(code);
    const clean = res.stdout.trim();
    setOut(res.stderr ? `${res.stdout}\n${res.stderr}` : clean || '(No output)');
    if (!res.stderr && clean === DAILY_CHALLENGE.expectedOutput) {
      setPassed(true);
      onMarkDailyDone();
    }
    setRunning(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Daily Habit System · Lesson + Coding Challenge + Rapid Quiz
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Daily Python Practice
          </h1>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
          <Flame className="h-4 w-4 text-amber-500" />
          <span>{streakDays} Day Learning Streak</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Daily Recommended Lesson */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Step 1 of 3 · Today&apos;s Python Lesson
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {nextRecommended.title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {nextRecommended.introduction}
          </p>
          <button
            type="button"
            onClick={() => onOpenLesson(nextRecommended.id)}
            className="min-h-[44px] rounded-xl bg-slate-900 dark:bg-sky-600 px-5 py-2.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Start Today&apos;s Lesson ({nextRecommended.durationMinutes} min)
          </button>
        </div>

        {/* 2. Daily Rapid Quiz */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Step 2 of 3 · Daily Quick Quiz
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            What is the output of `print(bool([]), bool([0]))` in Python 3?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {['False False', 'False True', 'True True', 'True False'].map((opt, idx) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setDailyQuizPicked(idx);
                  if (idx === 1) onMarkDailyDone();
                }}
                className={`min-h-[44px] rounded-xl border px-3.5 py-2 text-xs font-mono font-medium text-left transition-colors ${
                  dailyQuizPicked === null
                    ? 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    : idx === 1
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
                    : dailyQuizPicked === idx
                    ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200'
                    : 'border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {dailyQuizPicked !== null && (
            <p className="text-xs text-slate-600 dark:text-slate-300">
              `[]` has length 0 so `bool([])` is `False`, whereas `[0]` has 1 element (`0`) so `bool([0])` is `True`!
            </p>
          )}
        </div>
      </div>

      {/* 3. Daily Coding Challenge */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Step 3 of 3 · Daily Coding Challenge
            </div>
            <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
              {DAILY_CHALLENGE.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowHint((h) => !h)}
            className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
          </button>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300">{DAILY_CHALLENGE.description}</p>
        {showHint && (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3.5 text-xs text-slate-700 dark:text-slate-300">
            Hint: {DAILY_CHALLENGE.hint}
          </div>
        )}

        <textarea
          rows={7}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="w-full rounded-xl bg-slate-950 p-4 font-mono text-xs sm:text-sm text-slate-100 focus:outline-none"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={running}
            onClick={runDaily}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-sky-700 transition-colors"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>{running ? 'Running...' : 'Run & Check Daily Solution'}</span>
          </button>

          {passed && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Daily Challenge Solved! Streak Updated.
            </span>
          )}
        </div>

        {out !== null && (
          <pre className="rounded-xl bg-slate-900 p-4 font-mono text-xs text-emerald-300 whitespace-pre-wrap">
            Output: {out}
          </pre>
        )}
      </div>
    </div>
  );
};

interface AssignmentsViewProps {
  highlightedAssignmentId?: string | null;
  assignmentSelectionKey?: number;
  submittedAssignments: string[];
  onSubmitAssignment: (id: string) => void;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  highlightedAssignmentId,
  assignmentSelectionKey,
  submittedAssignments,
  onSubmitAssignment,
}) => {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [outputs, setOutputs] = useState<Record<string, { ok: boolean; text: string }>>({});
  const [runningId, setRunningId] = useState<string | null>(null);

  useEffect(() => {
    if (!highlightedAssignmentId) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`assignment-${highlightedAssignmentId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [highlightedAssignmentId, assignmentSelectionKey]);

  const handleGrade = async (id: string, starter: string, expected: string) => {
    setRunningId(id);
    const code = drafts[id] ?? starter;
    const res = await executePythonCode(code);
    const out = (res.stderr ? `${res.stdout}\n${res.stderr}` : res.stdout).trim();
    const ok = !res.stderr && res.stdout.trim() === expected.trim();
    setOutputs((prev) => ({ ...prev, [id]: { ok, text: out || '(Empty output)' } }));
    if (ok) {
      onSubmitAssignment(id);
    }
    setRunningId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          University Lab Record Assignments · Automated Test-Case Verification
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Practical Python Lab Assignments
        </h1>
      </div>

      <div className="space-y-6">
        {ASSIGNMENTS_LIST.map((item) => {
          const isSubmitted = submittedAssignments.includes(item.id);
          const feedback = outputs[item.id];

          return (
            <section
              id={`assignment-${item.id}`}
              key={item.id}
              className={`rounded-2xl border bg-white dark:bg-slate-900 p-6 space-y-4 transition-colors ${
                highlightedAssignmentId === item.id
                  ? 'border-sky-500 dark:border-sky-500 ring-2 ring-sky-500/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{item.unit}</span>
                  <span aria-hidden="true">·</span>
                  <span>Expected Output: {item.expectedOutput}</span>
                </div>
                {isSubmitted && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> Verified & Submitted
                  </span>
                )}
              </div>

              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{item.title}</h2>
              <p className="text-sm text-slate-700 dark:text-slate-300">{item.problemStatement}</p>

              <textarea
                rows={6}
                value={drafts[item.id] ?? item.starterCode}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                spellCheck={false}
                className="w-full rounded-xl bg-slate-950 p-4 font-mono text-xs sm:text-sm text-slate-100 focus:outline-none"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">Tip: {item.hint}</span>
                <button
                  type="button"
                  disabled={runningId === item.id}
                  onClick={() => handleGrade(item.id, item.starterCode, item.expectedOutput)}
                  className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-sky-700 transition-colors"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{runningId === item.id ? 'Grading...' : 'Run & Submit Assignment'}</span>
                </button>
              </div>

              {feedback && (
                <div className="rounded-xl bg-slate-900 p-4 font-mono text-xs text-slate-200">
                  <div>Actual Output: {feedback.text}</div>
                  <div className={`mt-1 font-semibold ${feedback.ok ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {feedback.ok ? 'Test Case Passed — Assignment Marked Complete!' : 'Output mismatch — adjust code and re-run.'}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};
