/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BarChart3,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  FileCode2,
  FolderKanban,
  GraduationCap,
  Home,
  Languages,
  Moon,
  PlayCircle,
  Sparkles,
  Sun,
  Target,
  Terminal,
  Users,
  X,
} from 'lucide-react';
import {
  AITutorView,
  CertificatesAndProgressView,
  CommunityForumView,
} from './components/AITutorAndForumView';
import { CourseView } from './components/CourseView';
import { GlobalSearchBar, type SearchSelectionTarget } from './components/GlobalSearchBar';
import { PlaygroundView } from './components/PlaygroundView';
import {
  ExamAndInterviewView,
  ProjectsView,
  VideoLessonsView,
} from './components/ProjectsAndVideosView';
import {
  AssignmentsView,
  DailyPracticeView,
  QuizzesView,
} from './components/QuizzesAndAssignmentsView';
import { OfflineDownloadsView } from './components/OfflineDownloadsView';
import { StudyPlannerView } from './components/StudyPlannerView';
import { COURSE_CURRICULUM, TOTAL_LESSONS_COUNT } from './data/curriculum';
import {
  INDIAN_UNIVERSITIES,
  SUPPORTED_LANGUAGES,
  UI_TRANSLATIONS,
} from './data/translations';
import { OfflineIndicator, PWAInstallButton } from './hooks/usePWA';
import heroAcademyImg from './assets/images/hero_btech_python_academy_1793538388710.jpg';
import {
  clearAllOfflineCache,
  removeLessonsFromOfflineCache,
  saveLessonsToOfflineCache,
  syncOfflineCacheWithIds,
} from './utils/offlineCache';
import { readSharedPlaygroundFromLocation } from './utils/shareCode';
import {
  buildStudyPlan,
  formatShortDate,
  loadStudyPlannerConfig,
  saveStudyPlannerConfig,
} from './utils/studyPlanner';
import type {
  AppView,
  LanguageCode,
  LessonContent,
  QuizCategory,
  StudentProfile,
  StudyPlannerConfig,
} from './types';

const PROFILE_STORAGE_KEY = 'python_master_btech_student_v1';
const THEME_STORAGE_KEY = 'python_master_theme_v1';

const DEFAULT_STUDENT: StudentProfile = {
  name: 'Aarav Kumar',
  email: '',
  university: INDIAN_UNIVERSITIES[0],
  semester: 'Semester 1',
  preferredLanguage: 'en',
  completedLessons: ['m1-l1', 'm1-l2'],
  offlineLessonIds: ['m1-l1'],
  solvedChallenges: [],
  submittedAssignments: [],
  completedProjects: [],
  quizScores: {},
  streakDays: 3,
  lastActiveDate: new Date().toISOString().slice(0, 10),
  dailyCompletedDates: [],
};

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved) return saved === 'dark';
    return false;
  });

  const [student, setStudent] = useState<StudentProfile>(() => {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StudentProfile;
        return { ...DEFAULT_STUDENT, ...parsed };
      }
    } catch {
      // Fallback to default
    }
    return DEFAULT_STUDENT;
  });

  const [sharedInitialPayload] = useState(() => readSharedPlaygroundFromLocation());

  const [activeView, setActiveView] = useState<AppView>(() =>
    sharedInitialPayload ? 'playground' : 'dashboard'
  );
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [playgroundSeed, setPlaygroundSeed] = useState<{
    code: string;
    stdin?: string;
    fileName?: string;
  } | null>(() =>
    sharedInitialPayload
      ? {
          code: sharedInitialPayload.code,
          stdin: sharedInitialPayload.stdin,
          fileName: sharedInitialPayload.fileName,
        }
      : null
  );
  const [playgroundChallengeTarget, setPlaygroundChallengeTarget] = useState<{
    id: string;
    key: number;
  } | null>(null);
  const [projectTarget, setProjectTarget] = useState<{ id: string; key: number } | null>(null);
  const [quizTarget, setQuizTarget] = useState<{
    category: QuizCategory | 'all';
    questionId: string | null;
    key: number;
  } | null>(null);
  const [assignmentTarget, setAssignmentTarget] = useState<{ id: string; key: number } | null>(
    null
  );
  const [tutorSeed, setTutorSeed] = useState<{ prompt?: string; code?: string }>({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [heroImgOk, setHeroImgOk] = useState(true);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [plannerConfig, setPlannerConfig] = useState<StudyPlannerConfig>(() =>
    loadStudyPlannerConfig()
  );

  // Sync dark mode class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem(THEME_STORAGE_KEY, darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Automatic Streak & Local Persistence + Optional Cloud Sync
  useEffect(() => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(student));
    if (student.email.trim()) {
      fetch('/api/student/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student),
      }).catch(() => {
        // Offline silent queue
      });
    }
  }, [student]);

  // Update daily streak on launch if new calendar day
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (student.lastActiveDate !== today) {
      const prev = new Date(student.lastActiveDate);
      const curr = new Date(today);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      setStudent((s) => ({
        ...s,
        streakDays: diffDays === 1 ? s.streakDays + 1 : Math.max(1, s.streakDays),
        lastActiveDate: today,
      }));
    }
  }, [student.lastActiveDate]);

  // Persist study planner configuration
  useEffect(() => {
    saveStudyPlannerConfig(plannerConfig);
  }, [plannerConfig]);

  // Ensure initial offlineLessonIds have full lesson payloads cached in localStorage
  useEffect(() => {
    syncOfflineCacheWithIds(student.offlineLessonIds);
  }, []);

  const plannerSummary = useMemo(
    () => buildStudyPlan(plannerConfig, student.completedLessons),
    [plannerConfig, student.completedLessons]
  );

  const lang: LanguageCode = student.preferredLanguage;
  const t = UI_TRANSLATIONS[lang];

  const allLessons = COURSE_CURRICULUM.flatMap((m) => m.lessons);
  const nextLesson =
    allLessons.find((l) => !student.completedLessons.includes(l.id)) || allLessons[0];
  const nextModule =
    COURSE_CURRICULUM.find((m) => m.id === nextLesson.moduleId) || COURSE_CURRICULUM[0];
  const coursePct = Math.round((student.completedLessons.length / TOTAL_LESSONS_COUNT) * 100);
  const totalSolved =
    student.solvedChallenges.length +
    student.submittedAssignments.length +
    student.completedProjects.length;

  const navigateTo = (view: AppView) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setActiveView('course');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompleteLesson = (lessonId: string) => {
    setStudent((prev) => {
      if (prev.completedLessons.includes(lessonId)) return prev;
      return {
        ...prev,
        completedLessons: [...prev.completedLessons, lessonId],
      };
    });
  };

  const handleToggleOfflineLesson = (lesson: LessonContent) => {
    setStudent((prev) => {
      const exists = prev.offlineLessonIds.includes(lesson.id);
      const nextIds = exists
        ? removeLessonsFromOfflineCache([lesson.id], prev.offlineLessonIds)
        : saveLessonsToOfflineCache([lesson], prev.offlineLessonIds);

      return { ...prev, offlineLessonIds: nextIds };
    });
  };

  const handleSaveLessonsOffline = (lessons: LessonContent[]) => {
    setStudent((prev) => ({
      ...prev,
      offlineLessonIds: saveLessonsToOfflineCache(lessons, prev.offlineLessonIds),
    }));
  };

  const handleRemoveLessonsOffline = (lessonIds: string[]) => {
    setStudent((prev) => ({
      ...prev,
      offlineLessonIds: removeLessonsFromOfflineCache(lessonIds, prev.offlineLessonIds),
    }));
  };

  const handleClearAllOffline = () => {
    setStudent((prev) => ({
      ...prev,
      offlineLessonIds: clearAllOfflineCache(),
    }));
  };

  const handleOpenInPlayground = (code: string, stdin?: string) => {
    setPlaygroundChallengeTarget(null);
    setPlaygroundSeed({ code, stdin });
    navigateTo('playground');
  };

  const handleSelectSearchResult = (target: SearchSelectionTarget) => {
    const stamp = Date.now();
    switch (target.kind) {
      case 'lesson':
        handleOpenLesson(target.lessonId);
        break;
      case 'playground_challenge':
        setPlaygroundSeed(null);
        setPlaygroundChallengeTarget({ id: target.challengeId, key: stamp });
        navigateTo('playground');
        break;
      case 'daily_challenge':
        navigateTo('daily');
        break;
      case 'assignment':
        setAssignmentTarget({ id: target.assignmentId, key: stamp });
        setActiveView('assignments');
        break;
      case 'quiz_coding':
        setQuizTarget({
          category: 'coding_challenge',
          questionId: target.questionId,
          key: stamp,
        });
        setActiveView('quizzes');
        break;
      case 'project':
        setProjectTarget({ id: target.projectId, key: stamp });
        navigateTo('projects');
        break;
    }
  };

  const handleAskTutorWithCode = (code: string, errorMsg?: string) => {
    setTutorSeed({
      code,
      prompt: errorMsg
        ? `Please explain why this error occurred and guide me to fix it:\n${errorMsg}`
        : 'Please explain this Python program line by line.',
    });
    navigateTo('tutor');
  };

  const handleAskTutorTopic = (topicTitle: string) => {
    setTutorSeed({
      prompt: `Explain "${topicTitle}" simply with a B.Tech exam example.`,
    });
    navigateTo('tutor');
  };

  const handleRestoreCloudProfile = async (emailToFetch: string) => {
    const clean = emailToFetch.trim().toLowerCase();
    if (!clean) return;
    try {
      const res = await fetch(`/api/student/${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = (await res.json()) as { student: Partial<StudentProfile> };
        setStudent((prev) => ({
          ...prev,
          ...data.student,
          completedLessons: Array.from(
            new Set([...prev.completedLessons, ...(data.student.completedLessons || [])])
          ),
        }));
        setSyncNotice('Cloud learning record restored and synced!');
      } else {
        setSyncNotice('New cloud student record created and synced!');
      }
    } catch {
      setSyncNotice('Saved locally (will sync automatically when online).');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 pb-20 lg:pb-10">
      {/* Top Navigation Bar with Global Search */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-5 px-4 sm:px-6 h-14 sm:h-16">
          {/* Wordmark */}
          <button
            type="button"
            onClick={() => navigateTo('dashboard')}
            className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 text-left"
          >
            PYTHON MASTER
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 shrink-0">
            {[
              { id: 'dashboard' as AppView, label: 'Dashboard' },
              { id: 'course' as AppView, label: 'Curriculum' },
              { id: 'playground' as AppView, label: 'Playground' },
              { id: 'tutor' as AppView, label: 'AI Tutor' },
              { id: 'community' as AppView, label: 'Community' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'course') setSelectedLessonId(null);
                  navigateTo(item.id);
                }}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 dark:hover:text-white ${
                  activeView === item.id
                    ? 'text-sky-600 dark:text-sky-400 underline underline-offset-8 decoration-2'
                    : ''
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Global Search + Student Profile Action */}
          <div className="flex flex-1 lg:flex-initial items-center justify-end gap-2.5 sm:gap-3 min-w-0">
            <GlobalSearchBar
              completedLessons={student.completedLessons}
              solvedChallenges={student.solvedChallenges}
              submittedAssignments={student.submittedAssignments}
              completedProjects={student.completedProjects}
              onSelectResult={handleSelectSearchResult}
            />

            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="min-h-[40px] rounded-lg bg-slate-900 dark:bg-sky-600 px-3.5 sm:px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
            >
              {student.name}
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Utility Strip (Language Selector on Home/Workspace, Theme Toggle, PWA Install) */}
      <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-100/70 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5">
          {/* 7-Language Selector */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <Languages className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap shrink-0">
              {t.languageLabel}:
            </span>
            <div className="flex items-center gap-1 rounded-lg bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800">
              {SUPPORTED_LANGUAGES.map((opt) => {
                const active = student.preferredLanguage === opt.code;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() =>
                      setStudent((prev) => ({ ...prev, preferredLanguage: opt.code }))
                    }
                    className={`min-h-[32px] rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {opt.nativeLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Toggle & PWA Install */}
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />
            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
              <span>{darkMode ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Responsive Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeView === 'dashboard' && (
          <div className="space-y-8">
            {/* Hero 2-Column Split: 1. Continue Learning Focal Anchor + Campus Visual */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 flex flex-col justify-between gap-6">
                <div className="space-y-3">
                  <div className="text-xs font-medium text-sky-600 dark:text-sky-400">
                    {t.welcomeKicker} · {student.university.split('(')[0].trim()} · {student.semester}
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 [text-wrap:balance]">
                    {t.continueLearning}: {nextLesson.title}
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                    Module {String(nextModule.id).padStart(2, '0')}: {nextModule.title} —{' '}
                    {nextLesson.introduction}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                      <span>Overall B.Tech Python Mastery</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {student.completedLessons.length} / {TOTAL_LESSONS_COUNT} Lessons ({coursePct}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-sky-600 origin-left transition-transform duration-200"
                        style={{ transform: `scaleX(${Math.max(coursePct, 2) / 100})` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenLesson(nextLesson.id)}
                      className="min-h-[48px] inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-700 transition-colors whitespace-nowrap shrink-0"
                    >
                      <PlayCircle className="h-4 w-4" />
                      <span>{t.resumeLesson}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateTo('playground')}
                      className="min-h-[48px] inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-3 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Terminal className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                      <span>{t.codingPlayground}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column Hero Media */}
              <div className="lg:col-span-5 relative min-h-[240px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900">
                {heroImgOk ? (
                  <img
                    src={heroAcademyImg}
                    alt="Indian B.Tech computer science laboratory students collaborating on Python programs"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgOk(false)}
                    className="h-full w-full object-cover"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-6 flex flex-col justify-end">
                  <div className="text-xs font-medium text-sky-300">
                    PYTHON MASTER – B.Tech Learning Academy
                  </div>
                  <p className="mt-1 text-base font-bold text-white">
                    Step-by-step from `print(&quot;Namaste&quot;)` to OOP, SQLite3, NumPy & Campus Placements.
                  </p>
                </div>
              </div>
            </section>

            {/* Full-Width 4-Column KPI Summary Row */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: t.lessonsDone,
                  value: `${student.completedLessons.length} / ${TOTAL_LESSONS_COUNT}`,
                  meta: `${coursePct}% curriculum complete`,
                },
                {
                  label: t.streakLabel,
                  value: `${student.streakDays} Days`,
                  meta: 'Consistent daily learning',
                },
                {
                  label: t.problemsSolved,
                  value: `${totalSolved}`,
                  meta: 'Challenges, labs & projects',
                },
                {
                  label: t.offlineSaved,
                  value: `${student.offlineLessonIds.length} Lessons`,
                  meta: 'Cached for zero-internet study',
                  actionLabel: 'Manage Downloads →',
                  onAction: () => navigateTo('offline_downloads'),
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{kpi.label}</div>
                    <div className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {kpi.value}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {kpi.meta}
                    </div>
                  </div>
                  {'onAction' in kpi && kpi.onAction && (
                    <button
                      type="button"
                      onClick={kpi.onAction}
                      className="self-start text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      {kpi.actionLabel}
                    </button>
                  )}
                </div>
              ))}
            </section>

            {/* Target Exam Countdown & Active Study Planner Focus Strip */}
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    <span className="font-semibold text-sky-600 dark:text-sky-400">
                      Study Planner
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {plannerSummary.calendarDaysLeft < 0
                        ? 'Target date passed'
                        : plannerSummary.calendarDaysLeft === 0
                        ? 'Exam today'
                        : `${plannerSummary.calendarDaysLeft} days to ${formatShortDate(
                            plannerConfig.targetExamDate
                          )}`}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      Goal: {plannerSummary.activeTargetCount}{' '}
                      {plannerSummary.activeTargetCount === 1 ? 'lesson' : 'lessons'}/
                      {plannerConfig.cadence === 'daily' ? 'day' : 'week'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{plannerSummary.statusLabel}</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                    {plannerConfig.examTitle} —{' '}
                    {plannerConfig.cadence === 'daily'
                      ? "Today's Suggested Lessons"
                      : "This Week's Suggested Lessons"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => navigateTo('planner')}
                  className="min-h-[42px] self-start sm:self-center inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
                >
                  <Target className="h-4 w-4" />
                  <span>Open Study Planner</span>
                </button>
              </div>

              {plannerSummary.suggestedLessons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {plannerSummary.suggestedLessons.slice(0, 3).map((item) => (
                    <button
                      key={item.lesson.id}
                      type="button"
                      onClick={() => handleOpenLesson(item.lesson.id)}
                      className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 p-3.5 hover:border-sky-500/70 transition-colors flex flex-col justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                          Module {String(item.moduleId).padStart(2, '0')} ·{' '}
                          {item.lesson.durationMinutes} min
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                          {item.lesson.title}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                        Start Lesson →
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 px-4 py-3 text-xs sm:text-sm text-emerald-900 dark:text-emerald-100">
                  <span>
                    All lessons in your current exam scope are complete. Update your target exam or switch to revision.
                  </span>
                  <button
                    type="button"
                    onClick={() => navigateTo('exam_prep')}
                    className="font-semibold underline whitespace-nowrap"
                  >
                    Open Exam Prep →
                  </button>
                </div>
              )}
            </section>

            {/* All Home Dashboard Modules & Academy Hubs */}
            <section className="space-y-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Academy Learning Hub
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Tap any module to launch
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    view: 'course' as AppView,
                    title: t.pythonCourse,
                    meta: `15 Modules · ${TOTAL_LESSONS_COUNT} Step-by-Step Lessons`,
                    desc: 'Complete Python 3.12 course from Variables and Loops to OOP, File I/O, Libraries, and SQLite.',
                    icon: BookOpen,
                  },
                  {
                    view: 'daily' as AppView,
                    title: t.dailyPractice,
                    meta: `${student.streakDays} Day Streak · 3 Daily Tasks`,
                    desc: 'Build unstoppable coding consistency with a daily lesson, coding problem, and rapid quiz.',
                    icon: CalendarCheck,
                  },
                  {
                    view: 'videos' as AppView,
                    title: t.videoLessons,
                    meta: 'Interactive Execution Trace · Memory View',
                    desc: 'Step through loops, recursion call stacks, and OOP object creation frame-by-frame.',
                    icon: PlayCircle,
                  },
                  {
                    view: 'playground' as AppView,
                    title: t.codingPlayground,
                    meta: 'Python 3.12 WASM · Error Explainer',
                    desc: 'Write and execute real Python code safely in your browser with beginner error translations.',
                    icon: Code2,
                  },
                  {
                    view: 'quizzes' as AppView,
                    title: t.quizzesTests,
                    meta: 'MCQ · True/False · Output · Debugging',
                    desc: 'Test conceptual clarity across 5 assessment formats with instant explanations.',
                    icon: ClipboardCheck,
                  },
                  {
                    view: 'assignments' as AppView,
                    title: t.assignments,
                    meta: `${student.submittedAssignments.length}/4 Submitted · Auto-Graded`,
                    desc: 'Solve university unit lab assignments verified live against expected outputs.',
                    icon: FileCode2,
                  },
                  {
                    view: 'projects' as AppView,
                    title: t.miniProjects,
                    meta: '8 Complete Systems · Source & Viva Test',
                    desc: 'Build Student Registry, ATM, Library, Calculator, Marks, Weather & Expense Tracker apps.',
                    icon: FolderKanban,
                  },
                  {
                    view: 'interview' as AppView,
                    title: t.interviewPrep,
                    meta: 'Placements · Technical Viva · Big-O',
                    desc: 'Master mutable vs immutable, shallow vs deep copy, LEGB scope, and O(n) hash patterns.',
                    icon: GraduationCap,
                  },
                  {
                    view: 'exam_prep' as AppView,
                    title: t.examPrep,
                    meta: 'Units I–V Notes · 2M & 10M Questions',
                    desc: 'Select your university & semester for unit-wise notes, previous paper practice & lab viva.',
                    icon: CheckCircle2,
                  },
                  {
                    view: 'tutor' as AppView,
                    title: t.aiTutor,
                    meta: 'English · తెలుగు · हिन्दी & 4 More',
                    desc: 'Ask Professor PyMaster to simplify concepts, debug errors, or give step-by-step hints.',
                    icon: Sparkles,
                  },
                  {
                    view: 'certificates' as AppView,
                    title: t.certificates,
                    meta: 'Verifiable Academic SVG Credentials',
                    desc: 'Unlock and download official PYTHON MASTER milestone certificates as you progress.',
                    icon: Award,
                  },
                  {
                    view: 'progress' as AppView,
                    title: t.myProgress,
                    meta: `${coursePct}% Mastery · Module Breakdown`,
                    desc: 'Track completed lessons, solved coding problems, quiz averages, and module completion.',
                    icon: BarChart3,
                  },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.view}
                      type="button"
                      onClick={() => {
                        if (card.view === 'course') setSelectedLessonId(null);
                        navigateTo(card.view);
                      }}
                      className="group text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-sky-500/70 dark:hover:border-sky-500/70 transition-colors flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {card.meta}
                          </span>
                          <Icon className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {card.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          {card.desc}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                        Open Section →
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Supportive Community Banner */}
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Peer-to-Peer Collaborative Learning
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {t.communityForum} — Discuss Lab Viva Questions & Share Snippets
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Connect with fellow 1st-year B.Tech CSE students across JNTU, Anna University, VTU, SPPU, KTU, and NITs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('community')}
                className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-sky-600 px-5 py-2.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
              >
                <Users className="h-4 w-4" />
                <span>Join Student Forum</span>
              </button>
            </section>
          </div>
        )}

        {activeView === 'course' && (
          <CourseView
            language={lang}
            completedLessons={student.completedLessons}
            offlineLessonIds={student.offlineLessonIds}
            selectedLessonId={selectedLessonId}
            onSelectLesson={setSelectedLessonId}
            onCompleteLesson={handleCompleteLesson}
            onToggleOfflineLesson={handleToggleOfflineLesson}
            onOpenInPlayground={handleOpenInPlayground}
            onAskTutorTopic={handleAskTutorTopic}
            onOpenOfflineManager={() => navigateTo('offline_downloads')}
          />
        )}

        {activeView === 'playground' && (
          <PlaygroundView
            initialCode={playgroundSeed?.code}
            initialStdin={playgroundSeed?.stdin}
            initialFileName={playgroundSeed?.fileName}
            initialChallengeId={playgroundChallengeTarget?.id}
            challengeSelectionKey={playgroundChallengeTarget?.key}
            solvedChallenges={student.solvedChallenges}
            onSolveChallenge={(id) =>
              setStudent((prev) =>
                prev.solvedChallenges.includes(id)
                  ? prev
                  : { ...prev, solvedChallenges: [...prev.solvedChallenges, id] }
              )
            }
            onAskTutorWithCode={handleAskTutorWithCode}
          />
        )}

        {activeView === 'daily' && (
          <DailyPracticeView
            streakDays={student.streakDays}
            completedLessons={student.completedLessons}
            onOpenLesson={handleOpenLesson}
            onMarkDailyDone={() => {
              const today = new Date().toISOString().slice(0, 10);
              setStudent((prev) => {
                if (prev.dailyCompletedDates.includes(today)) return prev;
                return {
                  ...prev,
                  streakDays: prev.streakDays + 1,
                  dailyCompletedDates: [...prev.dailyCompletedDates, today],
                };
              });
            }}
          />
        )}

        {activeView === 'videos' && <VideoLessonsView />}

        {activeView === 'quizzes' && (
          <QuizzesView
            initialCategory={quizTarget?.category}
            highlightedQuestionId={quizTarget?.questionId}
            quizSelectionKey={quizTarget?.key}
            quizScores={student.quizScores}
            onRecordQuizScore={(cat, score) =>
              setStudent((prev) => ({
                ...prev,
                quizScores: {
                  ...prev.quizScores,
                  [cat]: Math.max(prev.quizScores[cat] || 0, score),
                },
              }))
            }
            onSolveChallenge={(id) =>
              setStudent((prev) =>
                prev.solvedChallenges.includes(id)
                  ? prev
                  : { ...prev, solvedChallenges: [...prev.solvedChallenges, id] }
              )
            }
          />
        )}

        {activeView === 'assignments' && (
          <AssignmentsView
            highlightedAssignmentId={assignmentTarget?.id}
            assignmentSelectionKey={assignmentTarget?.key}
            submittedAssignments={student.submittedAssignments}
            onSubmitAssignment={(id) =>
              setStudent((prev) =>
                prev.submittedAssignments.includes(id)
                  ? prev
                  : { ...prev, submittedAssignments: [...prev.submittedAssignments, id] }
              )
            }
          />
        )}

        {activeView === 'projects' && (
          <ProjectsView
            initialProjectId={projectTarget?.id}
            projectSelectionKey={projectTarget?.key}
            completedProjects={student.completedProjects}
            onCompleteProject={(id) =>
              setStudent((prev) =>
                prev.completedProjects.includes(id)
                  ? prev
                  : { ...prev, completedProjects: [...prev.completedProjects, id] }
              )
            }
            onOpenInPlayground={handleOpenInPlayground}
          />
        )}

        {(activeView === 'interview' || activeView === 'exam_prep') && (
          <ExamAndInterviewView
            mode={activeView}
            university={student.university}
            semester={student.semester}
            onUpdateUniversity={(university, semester) =>
              setStudent((prev) => ({ ...prev, university, semester }))
            }
            onOpenLesson={handleOpenLesson}
            onOpenPlanner={() => navigateTo('planner')}
          />
        )}

        {activeView === 'planner' && (
          <StudyPlannerView
            config={plannerConfig}
            completedLessons={student.completedLessons}
            onChangeConfig={setPlannerConfig}
            onOpenLesson={handleOpenLesson}
            onCompleteLesson={handleCompleteLesson}
            onNavigate={navigateTo}
          />
        )}

        {activeView === 'offline_downloads' && (
          <OfflineDownloadsView
            offlineLessonIds={student.offlineLessonIds}
            onSaveLessonsOffline={handleSaveLessonsOffline}
            onRemoveLessonsOffline={handleRemoveLessonsOffline}
            onClearAllOffline={handleClearAllOffline}
            onOpenLesson={handleOpenLesson}
            onBackToCourse={() => {
              setSelectedLessonId(null);
              navigateTo('course');
            }}
          />
        )}

        {activeView === 'tutor' && (
          <AITutorView
            language={lang}
            initialPrompt={tutorSeed.prompt}
            initialCodeContext={tutorSeed.code}
            onOpenInPlayground={handleOpenInPlayground}
          />
        )}

        {activeView === 'community' && (
          <CommunityForumView student={student} onOpenInPlayground={handleOpenInPlayground} />
        )}

        {(activeView === 'certificates' || activeView === 'progress') && (
          <CertificatesAndProgressView
            mode={activeView}
            student={student}
            onEditProfile={() => setShowProfileModal(true)}
          />
        )}
      </main>

      {/* Quiet Academic Footer */}
      <footer className="hidden lg:block border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-5">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>PYTHON MASTER – B.Tech Learning Academy · Verified Python 3.12 Curriculum</span>
          <div className="flex items-center gap-5">
            <button type="button" onClick={() => navigateTo('planner')} className="hover:underline">
              Study Planner
            </button>
            <button
              type="button"
              onClick={() => navigateTo('offline_downloads')}
              className="hover:underline"
            >
              Offline Downloads
            </button>
            <button type="button" onClick={() => navigateTo('exam_prep')} className="hover:underline">
              Exam Prep
            </button>
            <button type="button" onClick={() => navigateTo('projects')} className="hover:underline">
              Mini Projects
            </button>
            <button type="button" onClick={() => navigateTo('certificates')} className="hover:underline">
              Certificates
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile-First Fixed Bottom Thumb Tab Bar (< lg:) */}
      <nav
        aria-label="Mobile bottom navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md"
      >
        <div className="grid grid-cols-5 items-center h-16">
          {[
            { id: 'dashboard' as AppView, label: 'Home', icon: Home },
            { id: 'course' as AppView, label: 'Course', icon: BookOpen },
            { id: 'playground' as AppView, label: 'Code', icon: Code2 },
            { id: 'tutor' as AppView, label: 'AI Tutor', icon: Sparkles },
            { id: 'progress' as AppView, label: 'Progress', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.id === 'course') setSelectedLessonId(null);
                  navigateTo(tab.id);
                }}
                className={`min-h-[48px] flex flex-col items-center justify-center transition-colors ${
                  active
                    ? 'text-sky-600 dark:text-sky-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Student Profile & Cloud Sync Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Student Profile & Record Sync
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowProfileModal(false);
                  setSyncNotice(null);
                }}
                aria-label="Close profile dialog"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Student Full Name (Appears on Certificates)
                </label>
                <input
                  type="text"
                  value={student.name}
                  onChange={(e) => setStudent((s) => ({ ...s, name: e.target.value }))}
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  College Email (For Automatic Server Backup & Multi-Device Sync)
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={student.email}
                    placeholder="rollno@college.edu.in"
                    onChange={(e) => setStudent((s) => ({ ...s, email: e.target.value }))}
                    className="flex-1 min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2"
                  />
                  <button
                    type="button"
                    onClick={() => handleRestoreCloudProfile(student.email)}
                    className="min-h-[42px] rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-700 whitespace-nowrap"
                  >
                    Sync Now
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  University
                </label>
                <select
                  value={student.university}
                  onChange={(e) => setStudent((s) => ({ ...s, university: e.target.value }))}
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2"
                >
                  {INDIAN_UNIVERSITIES.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Semester
                </label>
                <select
                  value={student.semester}
                  onChange={(e) => setStudent((s) => ({ ...s, semester: e.target.value }))}
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2"
                >
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                </select>
              </div>

              {syncNotice && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  {syncNotice}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowProfileModal(false);
                setSyncNotice(null);
              }}
              className="w-full min-h-[44px] rounded-xl bg-slate-900 dark:bg-sky-600 py-2.5 text-xs font-semibold text-white"
            >
              Save & Continue Learning
            </button>
          </div>
        </div>
      )}

      <OfflineIndicator />
    </div>
  );
}
