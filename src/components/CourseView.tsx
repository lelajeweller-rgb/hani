import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Code2,
  DownloadCloud,
  Play,
  Sparkles,
} from 'lucide-react';
import { COURSE_CURRICULUM, TOTAL_LESSONS_COUNT } from '../data/curriculum';
import { executePythonCode } from '../services/pyodideRunner';
import type { LanguageCode, LessonContent } from '../types';

interface CourseViewProps {
  language: LanguageCode;
  completedLessons: string[];
  offlineLessonIds: string[];
  selectedLessonId: string | null;
  onSelectLesson: (lessonId: string | null) => void;
  onCompleteLesson: (lessonId: string) => void;
  onToggleOfflineLesson: (lesson: LessonContent) => void;
  onOpenInPlayground: (code: string) => void;
  onAskTutorTopic: (topicTitle: string) => void;
  onOpenOfflineManager?: () => void;
}

export const CourseView: React.FC<CourseViewProps> = ({
  language,
  completedLessons,
  offlineLessonIds,
  selectedLessonId,
  onSelectLesson,
  onCompleteLesson,
  onToggleOfflineLesson,
  onOpenInPlayground,
  onAskTutorTopic,
  onOpenOfflineManager,
}) => {
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<number | 'all'>('all');
  const [showOfflineOnly, setShowOfflineOnly] = useState(false);
  const [liveOutput, setLiveOutput] = useState<string | null>(null);
  const [runningInline, setRunningInline] = useState(false);
  const [miniSelected, setMiniSelected] = useState<number | null>(null);
  const [miniSubmitted, setMiniSubmitted] = useState(false);

  const allLessons = COURSE_CURRICULUM.flatMap((m) => m.lessons);
  const activeLessonIndex = selectedLessonId
    ? allLessons.findIndex((l) => l.id === selectedLessonId)
    : -1;
  const activeLesson = activeLessonIndex >= 0 ? allLessons[activeLessonIndex] : null;
  const activeModule = activeLesson
    ? COURSE_CURRICULUM.find((m) => m.id === activeLesson.moduleId)
    : null;

  const handleOpenLesson = (id: string) => {
    setLiveOutput(null);
    setMiniSelected(null);
    setMiniSubmitted(false);
    onSelectLesson(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRunInline = async (code: string) => {
    setRunningInline(true);
    const res = await executePythonCode(code);
    setLiveOutput(res.stderr ? `${res.stdout}\n${res.stderr}`.trim() : res.stdout || '(Done)');
    setRunningInline(false);
  };

  // Detailed 10-Section Lesson Reader View
  if (activeLesson && activeModule) {
    const isCompleted = completedLessons.includes(activeLesson.id);
    const isSavedOffline = offlineLessonIds.includes(activeLesson.id);
    const prevLesson = activeLessonIndex > 0 ? allLessons[activeLessonIndex - 1] : null;
    const nextLesson = activeLessonIndex < allLessons.length - 1 ? allLessons[activeLessonIndex + 1] : null;
    const quizItem = activeLesson.miniTest[0];

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Top Lesson Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onSelectLesson(null)}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>All 15 Modules</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleOfflineLesson(activeLesson)}
              className={`min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                isSavedOffline
                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <DownloadCloud className="h-4 w-4" />
              <span>{isSavedOffline ? 'Saved Offline' : 'Download Offline'}</span>
            </button>

            <button
              type="button"
              onClick={() => onAskTutorTopic(activeLesson.title)}
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition-colors whitespace-nowrap"
            >
              <Sparkles className="h-4 w-4" />
              <span>Ask AI Tutor</span>
            </button>
          </div>
        </div>

        {/* Lesson Header & 1. Topic Introduction */}
        <article className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-8">
          <header className="border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Module {String(activeModule.id).padStart(2, '0')}: {activeModule.title}</span>
              <span aria-hidden="true">·</span>
              <span>{activeLesson.difficulty}</span>
              <span aria-hidden="true">·</span>
              <span>{activeLesson.durationMinutes} min study</span>
              {isCompleted && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                  </span>
                </>
              )}
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {activeLesson.title}
            </h1>

            {/* Multilingual Summary Box */}
            <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 p-4 text-sm text-slate-700 dark:text-slate-300">
              {activeLesson.localizedKeyTakeaway[language]}
            </div>
          </header>

          {/* Section 1 & 2: Introduction & Simple Explanation */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              01. Topic Introduction & Simple Explanation
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              {activeLesson.introduction}
            </p>
            <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
              {activeLesson.simpleExplanation}
            </p>
          </section>

          {/* Section 3: Real-Life Example */}
          <section className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              02. Real-Life Engineering Analogy
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              {activeLesson.realLifeExample}
            </p>
          </section>

          {/* Section 4: Python Syntax */}
          <section className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              03. Python 3 Syntax
            </h2>
            <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-xs sm:text-sm leading-relaxed text-sky-300">
              <code>{activeLesson.syntax}</code>
            </pre>
          </section>

          {/* Section 5 & 6: Working Python Code & Expected Output */}
          <section className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                04. Working Python Code & Expected Output
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={runningInline}
                  onClick={() => handleRunInline(activeLesson.workingCode)}
                  className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 transition-colors whitespace-nowrap"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{runningInline ? 'Running...' : 'Run Here'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenInPlayground(activeLesson.workingCode)}
                  className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  <span>Edit in Playground</span>
                </button>
              </div>
            </div>

            <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-xs sm:text-sm leading-relaxed text-slate-100">
              <code>{activeLesson.workingCode}</code>
            </pre>

            <div className="rounded-xl bg-slate-900 p-4 font-mono text-xs sm:text-sm text-emerald-300">
              <div className="mb-1.5 text-[11px] font-sans font-medium text-slate-400">
                {liveOutput !== null ? 'Live Pyodide Execution Output:' : 'Expected Output:'}
              </div>
              <pre className="whitespace-pre-wrap">{liveOutput !== null ? liveOutput : activeLesson.expectedOutput}</pre>
            </div>
          </section>

          {/* Section 7: Step-by-Step Explanation */}
          <section className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              05. Step-by-Step Code Walkthrough
            </h2>
            <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-decimal pl-5">
              {activeLesson.stepByStep.map((step, i) => (
                <li key={i} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          </section>

          {/* Section 8: Common Mistakes */}
          <section className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              06. Common Mistakes to Avoid in Exams
            </h2>
            {activeLesson.commonMistakes.map((m, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-slate-50 dark:bg-slate-950/70 p-4 space-y-2 text-xs sm:text-sm"
              >
                <div className="font-mono text-rose-600 dark:text-rose-400">
                  Incorrect: {m.wrong}
                </div>
                <div className="font-mono text-emerald-700 dark:text-emerald-400">
                  Correct  : {m.right}
                </div>
                <p className="text-slate-600 dark:text-slate-300">{m.reason}</p>
              </div>
            ))}
          </section>

          {/* Section 9: Practice Questions */}
          <section className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              07. Self-Practice Questions
            </h2>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc pl-5">
              {activeLesson.practiceQuestions.map((pq, idx) => (
                <li key={idx} className="leading-relaxed">
                  {pq}
                </li>
              ))}
            </ul>
          </section>

          {/* Section 10: Interactive Mini Test */}
          {quizItem && (
            <section className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                08. Lesson Check Mini Test
              </h2>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {quizItem.question}
              </p>
              <div className="space-y-2">
                {quizItem.options.map((opt, idx) => {
                  const isChosen = miniSelected === idx;
                  const isRight = idx === quizItem.correctIndex;
                  let stateStyle =
                    'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60';
                  if (miniSubmitted) {
                    if (isRight) {
                      stateStyle = 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200';
                    } else if (isChosen) {
                      stateStyle = 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200';
                    }
                  } else if (isChosen) {
                    stateStyle = 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (!miniSubmitted) setMiniSelected(idx);
                      }}
                      className={`w-full min-h-[44px] text-left rounded-xl border px-4 py-3 text-sm transition-colors ${stateStyle}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={miniSelected === null || miniSubmitted}
                  onClick={() => {
                    setMiniSubmitted(true);
                    if (miniSelected === quizItem.correctIndex) {
                      onCompleteLesson(activeLesson.id);
                    }
                  }}
                  className="min-h-[44px] rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50 transition-colors"
                >
                  Check Answer & Complete Lesson
                </button>

                {!isCompleted && (
                  <button
                    type="button"
                    onClick={() => onCompleteLesson(activeLesson.id)}
                    className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Mark as Completed
                  </button>
                )}
              </div>

              {miniSubmitted && (
                <div className="rounded-xl bg-slate-50 dark:bg-slate-950/80 p-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <strong className="font-semibold text-slate-900 dark:text-slate-100">
                    {miniSelected === quizItem.correctIndex ? 'Correct! ' : 'Review Explanation: '}
                  </strong>
                  {quizItem.explanation}
                </div>
              )}
            </section>
          )}
        </article>

        {/* Bottom Prev / Next Navigation */}
        <div className="flex items-center justify-between gap-4 pt-2">
          {prevLesson ? (
            <button
              type="button"
              onClick={() => handleOpenLesson(prevLesson.id)}
              className="min-h-[48px] inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="truncate max-w-[160px] sm:max-w-xs">{prevLesson.title}</span>
            </button>
          ) : (
            <div />
          )}

          {nextLesson ? (
            <button
              type="button"
              onClick={() => handleOpenLesson(nextLesson.id)}
              className="min-h-[48px] inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-sky-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              <span className="truncate max-w-[160px] sm:max-w-xs">Next: {nextLesson.title}</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  // Curriculum Overview (All 15 Modules)
  const visibleModules = COURSE_CURRICULUM.filter((m) =>
    selectedModuleFilter === 'all' ? true : m.id === selectedModuleFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            15 Structured Modules · {TOTAL_LESSONS_COUNT} Lessons · Beginner to Advanced
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Complete Python 3.12 B.Tech Curriculum
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOfflineOnly((v) => !v)}
            className={`min-h-[40px] inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
              showOfflineOnly
                ? 'bg-sky-600 text-white'
                : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200'
            }`}
          >
            <DownloadCloud className="h-4 w-4" />
            <span>Offline Saved ({offlineLessonIds.length})</span>
          </button>

          {onOpenOfflineManager && (
            <button
              type="button"
              onClick={onOpenOfflineManager}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              <span>Manage Offline Downloads</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Module Filter Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => setSelectedModuleFilter('all')}
          className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
            selectedModuleFilter === 'all'
              ? 'bg-slate-900 text-white dark:bg-sky-600'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          All 15 Modules
        </button>
        {COURSE_CURRICULUM.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setSelectedModuleFilter(m.id)}
            className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              selectedModuleFilter === m.id
                ? 'bg-slate-900 text-white dark:bg-sky-600'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            M{m.id}: {m.title}
          </button>
        ))}
      </div>

      {/* Modules List */}
      <div className="space-y-6">
        {visibleModules.map((mod) => {
          const filteredLessons = showOfflineOnly
            ? mod.lessons.filter((l) => offlineLessonIds.includes(l.id))
            : mod.lessons;

          if (showOfflineOnly && filteredLessons.length === 0) return null;

          const doneCount = mod.lessons.filter((l) => completedLessons.includes(l.id)).length;
          const pct = Math.round((doneCount / mod.lessons.length) * 100);

          return (
            <section
              key={mod.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>Module {String(mod.id).padStart(2, '0')}</span>
                    <span aria-hidden="true">·</span>
                    <span>{mod.unitTag}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {doneCount}/{mod.lessons.length} completed ({pct}%)
                    </span>
                  </div>
                  <h2 className="mt-1 text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                    {mod.title}
                  </h2>
                  <p className="mt-0.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {mod.subtitle}
                  </p>
                </div>

                <div className="w-full sm:w-36">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-sky-600 transition-transform duration-200 origin-left"
                      style={{ transform: `scaleX(${pct / 100})` }}
                    />
                  </div>
                </div>
              </div>

              {/* Interactive Tap List Rows */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
                {filteredLessons.map((lesson, idx) => {
                  const done = completedLessons.includes(lesson.id);
                  const saved = offlineLessonIds.includes(lesson.id);
                  return (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between gap-3 py-3.5"
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenLesson(lesson.id)}
                        className="flex-1 min-h-[44px] flex items-center gap-3.5 text-left group"
                      >
                        <span
                          className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-xs font-mono font-semibold ${
                            done
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {done ? <CheckCircle2 className="h-4 w-4" /> : `${mod.id}.${idx + 1}`}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                            {lesson.title}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>{lesson.difficulty}</span>
                            <span aria-hidden="true">·</span>
                            <span>{lesson.durationMinutes} min</span>
                            {saved && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-sky-600 dark:text-sky-400">Offline Ready</span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onToggleOfflineLesson(lesson)}
                          aria-label={`Download ${lesson.title} for offline access`}
                          title={saved ? 'Saved for offline reading' : 'Save lesson offline'}
                          className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg transition-colors ${
                            saved
                              ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40'
                              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <DownloadCloud className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenLesson(lesson.id)}
                          aria-label={`Open ${lesson.title}`}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {showOfflineOnly && offlineLessonIds.length === 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-3">
            <BookOpen className="h-7 w-7 mx-auto text-slate-400" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              No Offline Lessons Saved Yet
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Tap the cloud download icon next to any lesson or bulk-download entire modules for zero-internet study.
            </p>
            {onOpenOfflineManager && (
              <button
                type="button"
                onClick={onOpenOfflineManager}
                className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition-colors"
              >
                <DownloadCloud className="h-4 w-4" />
                <span>Manage Offline Downloads</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
