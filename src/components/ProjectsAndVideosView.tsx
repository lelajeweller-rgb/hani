import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Code2,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
} from 'lucide-react';
import { EXAM_PREP_UNITS, EXAM_QUESTIONS, PROJECTS_LIST, VIDEO_LESSONS } from '../data/assessments';
import { COURSE_CURRICULUM } from '../data/curriculum';
import { INDIAN_UNIVERSITIES } from '../data/translations';
import { executePythonCode } from '../services/pyodideRunner';

interface ProjectsViewProps {
  initialProjectId?: string | null;
  projectSelectionKey?: number;
  completedProjects: string[];
  onCompleteProject: (id: string) => void;
  onOpenInPlayground: (code: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  initialProjectId,
  projectSelectionKey,
  completedProjects,
  onCompleteProject,
  onOpenInPlayground,
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    initialProjectId && PROJECTS_LIST.some((p) => p.id === initialProjectId)
      ? initialProjectId
      : PROJECTS_LIST[0].id
  );
  const [liveOutput, setLiveOutput] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [testChoice, setTestChoice] = useState<number | null>(null);
  const [testSubmitted, setTestSubmitted] = useState(false);

  useEffect(() => {
    if (initialProjectId && PROJECTS_LIST.some((p) => p.id === initialProjectId)) {
      setSelectedId(initialProjectId);
      setLiveOutput(null);
      setTestChoice(null);
      setTestSubmitted(false);
    }
  }, [initialProjectId, projectSelectionKey]);

  const project = PROJECTS_LIST.find((p) => p.id === selectedId) || PROJECTS_LIST[0];
  const isDone = completedProjects.includes(project.id);

  const handleSelectProject = (id: string) => {
    setSelectedId(id);
    setLiveOutput(null);
    setTestChoice(null);
    setTestSubmitted(false);
  };

  const handleRunProject = async () => {
    setRunning(true);
    const res = await executePythonCode(project.sourceCode, project.sampleInput);
    setLiveOutput(res.stderr ? `${res.stdout}\n${res.stderr}` : res.stdout);
    setRunning(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          8 Practical Portfolio Systems · Full Python 3 Source · Final Viva Verification
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          B.Tech Python Mini Projects
        </h1>
      </div>

      {/* Project Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {PROJECTS_LIST.map((p) => {
          const done = completedProjects.includes(p.id);
          const active = p.id === project.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectProject(p.id)}
              className={`min-h-[42px] inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-sky-600 text-white'
                  : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
              <span>{p.title}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Project Detail */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{project.difficulty}</span>
            <span aria-hidden="true">·</span>
            <span>Concepts: {project.requiredConcepts.join(' / ')}</span>
            {isDone && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Completed</span>
              </>
            )}
          </div>
          <h2 className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {project.title}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-700 dark:text-slate-300">
            {project.description}
          </p>
        </div>

        {/* Step-by-Step Build Instructions */}
        <div className="space-y-2.5">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Step-by-Step Implementation Plan
          </h3>
          <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
            {project.instructions.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>

        {/* Complete Source Code + Run */}
        <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Complete Working Python 3 Source Code
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={running}
                onClick={handleRunProject}
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition-colors"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{running ? 'Running...' : 'Execute Project'}</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenInPlayground(project.sourceCode)}
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>Customize in Playground</span>
              </button>
            </div>
          </div>

          <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-xs sm:text-sm leading-relaxed text-slate-100">
            <code>{project.sourceCode}</code>
          </pre>

          <div className="rounded-xl bg-slate-900 p-4 font-mono text-xs sm:text-sm text-emerald-300">
            <div className="mb-1 font-sans text-[11px] text-slate-400">
              {liveOutput !== null ? 'Live Execution Output:' : 'Expected Project Output:'}
            </div>
            <pre className="whitespace-pre-wrap">{liveOutput !== null ? liveOutput : project.expectedOutput}</pre>
          </div>
        </div>

        {/* Final Project Test */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Final Project Viva Check
          </h3>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {project.finalTest.question}
          </p>
          <div className="space-y-2">
            {project.finalTest.options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (!testSubmitted) setTestChoice(idx);
                }}
                className={`w-full min-h-[44px] text-left rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                  testSubmitted
                    ? idx === project.finalTest.correctIndex
                      ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                      : testChoice === idx
                      ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/30'
                      : 'border-slate-200 dark:border-slate-800 opacity-60'
                    : testChoice === idx
                    ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={testChoice === null || testSubmitted}
            onClick={() => {
              setTestSubmitted(true);
              if (testChoice === project.finalTest.correctIndex) {
                onCompleteProject(project.id);
              }
            }}
            className="min-h-[44px] rounded-xl bg-slate-900 dark:bg-sky-600 px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            Verify Viva Answer & Complete Project
          </button>

          {testSubmitted && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {project.finalTest.explanation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const VideoLessonsView: React.FC = () => {
  const [selectedVidId, setSelectedVidId] = useState(VIDEO_LESSONS[0].id);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  const video = VIDEO_LESSONS.find((v) => v.id === selectedVidId) || VIDEO_LESSONS[0];
  const currentStep = video.steps[stepIdx] || video.steps[0];

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= video.steps.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2400);
    return () => window.clearInterval(timer);
  }, [playing, video.steps.length]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Interactive Code Execution Walkthroughs · Synchronized Memory & Call-Stack Trace
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Visual Video Walkthrough Lessons
        </h1>
      </div>

      {/* Lesson Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {VIDEO_LESSONS.map((v) => {
          const active = v.id === video.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                setSelectedVidId(v.id);
                setStepIdx(0);
                setPlaying(false);
              }}
              className={`text-left rounded-2xl border p-4 transition-colors ${
                active
                  ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {v.moduleRef} · {v.duration}
              </div>
              <div className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                {v.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* Two-Zone Sandbox Player (6_education_simulations.md) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Stage: Highlighted Code Execution */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-6 text-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 pb-4 border-b border-slate-800">
              <span>{video.title}</span>
              <span className="font-mono tabular-nums">
                Frame {stepIdx + 1} / {video.steps.length}
              </span>
            </div>

            <div className="mt-4 space-y-1.5 font-mono text-xs sm:text-sm">
              {video.codeLines.map((line, idx) => {
                const lineNum = idx + 1;
                const isActiveLine = currentStep.lineNumber === lineNum;
                return (
                  <div
                    key={lineNum}
                    className={`flex items-center gap-4 rounded-lg px-3 py-2 transition-colors ${
                      isActiveLine
                        ? 'bg-sky-500/20 text-sky-200 ring-1 ring-sky-500/50'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="w-5 text-right text-slate-500 select-none tabular-nums">
                      {lineNum}
                    </span>
                    <pre className="whitespace-pre">{line}</pre>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Playback Controls */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition-colors"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
              <span>{playing ? 'Pause Walkthrough' : 'Auto-Play Walkthrough'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setStepIdx((prev) => (prev + 1) % video.steps.length);
              }}
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-900 transition-colors"
            >
              <SkipForward className="h-4 w-4" />
              <span>Step Forward</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setStepIdx(0);
              }}
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-900 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Right Concept & Memory Deck */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div>
            <div className="text-xs font-semibold text-sky-600 dark:text-sky-400">
              Instructor Narration
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
              {currentStep.narration}
            </p>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Live Python Memory / Stack Variables
            </div>
            <div className="mt-2.5 divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800">
              {Object.entries(currentStep.variablesState).map(([varName, val]) => (
                <div key={varName} className="flex items-center justify-between px-3.5 py-2.5 text-xs font-mono">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{varName}</span>
                  <span className="text-sky-600 dark:text-sky-400">{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Console Output (stdout)
            </div>
            <pre className="mt-2 rounded-xl bg-slate-950 p-3.5 font-mono text-xs text-emerald-300 min-h-[52px]">
              {currentStep.consoleOutput || '(No output emitted yet at this step)'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ExamAndInterviewProps {
  mode: 'exam_prep' | 'interview';
  university: string;
  semester: string;
  onUpdateUniversity: (uni: string, sem: string) => void;
  onOpenLesson: (lessonId: string) => void;
  onOpenPlanner?: () => void;
}

export const ExamAndInterviewView: React.FC<ExamAndInterviewProps> = ({
  mode,
  university,
  semester,
  onUpdateUniversity,
  onOpenLesson,
  onOpenPlanner,
}) => {
  const interviewModule = COURSE_CURRICULUM.find((m) => m.id === 15);

  if (mode === 'interview' && interviewModule) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Campus Placement Readiness · Technical Viva · O(n) Coding Patterns
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            B.Tech Python Interview Preparation
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {interviewModule.lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Module 15 · {lesson.durationMinutes} min · {lesson.difficulty}
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {lesson.title}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {lesson.introduction}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenLesson(lesson.id)}
                className="self-start min-h-[42px] rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition-colors"
              >
                Open {lesson.title} Guide
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          AICTE Common B.Tech 1st Year Python Core · Unit Notes · 2M / 10M & Viva Questions
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          University Examination Preparation Hub
        </h1>
      </div>

      {/* University & Semester Selector (Does not invent university-specific syllabus codes) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Select Your University & Semester Context
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              University / Board
            </label>
            <select
              value={university}
              onChange={(e) => onUpdateUniversity(e.target.value, semester)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100"
            >
              {INDIAN_UNIVERSITIES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Academic Semester
            </label>
            <select
              value={semester}
              onChange={(e) => onUpdateUniversity(university, e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="Semester 1">B.Tech 1st Year · Semester 1</option>
              <option value="Semester 2">B.Tech 1st Year · Semester 2</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            Study Track: <strong>{university} · {semester}</strong>. The 5 units below follow standard AICTE 1st-Year CSE Python Programming topics—cross-check exact unit order against your department&apos;s official syllabus handout.
          </p>
          {onOpenPlanner && (
            <button
              type="button"
              onClick={onOpenPlanner}
              className="min-h-[40px] rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition-colors whitespace-nowrap shrink-0"
            >
              Plan Study Schedule by Exam Date →
            </button>
          )}
        </div>
      </div>

      {/* 5-Unit Revision Notes */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Unit-Wise Revision Notes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EXAM_PREP_UNITS.map((u) => (
            <div
              key={u.unit}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2.5"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{u.unit}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{u.topics}</p>
              <ul className="list-disc pl-4 space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                {u.keyNotes.map((n, idx) => (
                  <li key={idx}>{n}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Short Answer & Long Answer Paper Bank */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Short Answer Questions (2 Marks)
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {EXAM_QUESTIONS.shortTwoMarks.map((item, idx) => (
              <div key={idx} className="py-3 first:pt-0 last:pb-0 space-y-1">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {item.q}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Long Answer & Previous Paper Questions (10 Marks)
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {EXAM_QUESTIONS.longTenMarks.map((item, idx) => (
              <div key={idx} className="py-3 first:pt-0 last:pb-0 space-y-1">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {item.q}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  Answer Structure: {item.outline}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Practical Lab External Examination Checklist
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {EXAM_QUESTIONS.practicalViva.map((pv, i) => (
                <li key={i}>{pv}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
