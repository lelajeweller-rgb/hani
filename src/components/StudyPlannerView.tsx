import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  GraduationCap,
  Minus,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Target,
} from 'lucide-react';
import { COURSE_CURRICULUM } from '../data/curriculum';
import type {
  AppView,
  StudyCadence,
  StudyPlannerConfig,
  StudyScopePreset,
} from '../types';
import {
  addDaysToDateStr,
  buildStudyPlan,
  createDefaultStudyPlannerConfig,
  formatFullDate,
  getTodayDateString,
  type PlannerReadinessStatus,
} from '../utils/studyPlanner';

interface StudyPlannerViewProps {
  config: StudyPlannerConfig;
  completedLessons: string[];
  onChangeConfig: (next: StudyPlannerConfig) => void;
  onOpenLesson: (lessonId: string) => void;
  onCompleteLesson: (lessonId: string) => void;
  onNavigate: (view: AppView) => void;
}

const EXAM_PRESETS = [
  'End-Semester Python Exam',
  'Mid-Semester Test (Units I–II)',
  'Practical Lab External & Viva',
  'Campus Placement Python Test',
];

const SCOPE_OPTIONS: Array<{ id: StudyScopePreset; label: string; hint: string }> = [
  { id: 'all', label: 'All 15 Modules', hint: 'Complete 91-lesson track' },
  { id: 'university_core', label: 'Units I–V Core', hint: 'Modules 1–11' },
  { id: 'interview_sprint', label: 'Libs & Placement', hint: 'Modules 12–15' },
  { id: 'custom', label: 'Custom Modules', hint: 'Pick exact syllabus units' },
];

function getStatusStyles(status: PlannerReadinessStatus): {
  container: string;
  iconColor: string;
  Icon: React.ComponentType<{ className?: string }>;
} {
  switch (status) {
    case 'completed':
    case 'on_track':
      return {
        container:
          'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        Icon: CheckCircle2,
      };
    case 'tight':
      return {
        container:
          'border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100',
        iconColor: 'text-amber-600 dark:text-amber-400',
        Icon: Clock,
      };
    case 'behind':
    case 'exam_passed':
      return {
        container:
          'border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-100',
        iconColor: 'text-rose-600 dark:text-rose-400',
        Icon: AlertTriangle,
      };
  }
}

export const StudyPlannerView: React.FC<StudyPlannerViewProps> = ({
  config,
  completedLessons,
  onChangeConfig,
  onOpenLesson,
  onCompleteLesson,
  onNavigate,
}) => {
  const [expandedBuckets, setExpandedBuckets] = useState(false);

  const todayStr = getTodayDateString();
  const plan = useMemo(
    () => buildStudyPlan(config, completedLessons, todayStr),
    [config, completedLessons, todayStr]
  );

  const completedSet = useMemo(() => new Set(completedLessons), [completedLessons]);
  const statusMeta = getStatusStyles(plan.status);
  const StatusIcon = statusMeta.Icon;

  const setCadence = (cadence: StudyCadence) => {
    onChangeConfig({ ...config, cadence });
  };

  const handleToggleCustomModule = (moduleId: number) => {
    const exists = config.customModuleIds.includes(moduleId);
    const nextIds = exists
      ? config.customModuleIds.filter((id) => id !== moduleId)
      : [...config.customModuleIds, moduleId].sort((a, b) => a - b);

    if (nextIds.length === 0) return;
    onChangeConfig({
      ...config,
      scopePreset: 'custom',
      customModuleIds: nextIds,
    });
  };

  const handleStepGoal = (delta: number) => {
    const base = plan.activeTargetCount || 1;
    const maxVal = Math.max(1, plan.remainingLessons.length);
    const nextVal = Math.max(1, Math.min(maxVal, base + delta));
    if (config.cadence === 'daily') {
      onChangeConfig({ ...config, customDailyGoal: nextVal });
    } else {
      onChangeConfig({ ...config, customWeeklyGoal: nextVal });
    }
  };

  const handleUseAutoPace = () => {
    if (config.cadence === 'daily') {
      onChangeConfig({ ...config, customDailyGoal: null });
    } else {
      onChangeConfig({ ...config, customWeeklyGoal: null });
    }
  };

  const handleResetDefaults = () => {
    onChangeConfig(createDefaultStudyPlannerConfig(todayStr));
  };

  const visibleBuckets = expandedBuckets
    ? plan.scheduleBuckets
    : plan.scheduleBuckets.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header & Cadence Segmented Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Target Exam Countdown · Adaptive Daily &amp; Weekly Pacing · Actionable Lesson Queue
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 [text-wrap:balance]">
            B.Tech Python Study Planner
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div
            role="tablist"
            aria-label="Study goal cadence"
            className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1"
          >
            {(
              [
                { id: 'daily', label: 'Daily Goals' },
                { id: 'weekly', label: 'Weekly Goals' },
              ] as const
            ).map((tab) => {
              const active = config.cadence === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCadence(tab.id)}
                  className={`min-h-[38px] rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            title="Reset planner defaults"
            className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 4-Column Tabular KPI Summary Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Exam Countdown</div>
          <div className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {plan.calendarDaysLeft < 0
              ? 'Passed'
              : plan.calendarDaysLeft === 0
              ? 'Today'
              : `${plan.calendarDaysLeft} Days`}
          </div>
          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
            Target: {formatFullDate(config.targetExamDate)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Syllabus Scope Done</div>
          <div className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {plan.completedInScopeCount} / {plan.totalScopedLessons}
          </div>
          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {plan.scopeProgressPct}% complete · {plan.remainingLessons.length} left
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {config.cadence === 'daily' ? 'Daily Lesson Target' : 'Weekly Lesson Target'}
          </div>
          <div className="mt-1 text-xl sm:text-2xl font-bold text-sky-600 dark:text-sky-400 tabular-nums">
            {plan.activeTargetCount}{' '}
            {plan.activeTargetCount === 1 ? 'Lesson' : 'Lessons'}
          </div>
          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            ~{plan.estimatedMinutesPerPeriod} min/{config.cadence === 'daily' ? 'day' : 'week'} ·{' '}
            {plan.isUsingCustomTarget ? 'Custom target' : 'Auto-paced'}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Projected Finish</div>
          <div className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {plan.projectedFinishDate ? formatFullDate(plan.projectedFinishDate).split(',')[1]?.trim() || plan.projectedFinishDate : '—'}
          </div>
          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {plan.remainingLessons.length === 0
              ? 'Ready for revision'
              : `${plan.projectedStudyDaysNeeded} days at current pace`}
          </div>
        </div>
      </section>

      {/* Dual-Coded Schedule Readiness Banner */}
      <div className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${statusMeta.container}`}>
        <div className="flex items-start gap-3">
          <StatusIcon className={`h-5 w-5 shrink-0 mt-0.5 ${statusMeta.iconColor}`} />
          <div className="space-y-0.5">
            <div className="text-sm font-bold">{plan.statusLabel}</div>
            <p className="text-xs sm:text-sm opacity-90 leading-relaxed">{plan.statusAdvice}</p>
          </div>
        </div>
        {plan.status === 'behind' && (
          <button
            type="button"
            onClick={handleUseAutoPace}
            className="min-h-[40px] self-start sm:self-center rounded-xl bg-slate-900 dark:bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
          >
            Match Recommended Pace (
            {config.cadence === 'daily'
              ? `${plan.recommendedDailyLessons}/day`
              : `${plan.recommendedWeeklyLessons}/wk`}
            )
          </button>
        )}
      </div>

      {/* Main 2-Zone Split: Configuration (Left) + Actionable Suggested Lessons & Roadmap (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Zone: Exam Target & Cadence Settings */}
        <section className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Exam Target &amp; Goal Settings
              </h2>
            </div>
          </div>

          {/* Exam Title + Presets */}
          <div className="space-y-2.5">
            <label
              htmlFor="planner-exam-title"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Target Exam or Milestone Name
            </label>
            <input
              id="planner-exam-title"
              type="text"
              value={config.examTitle}
              onChange={(e) => onChangeConfig({ ...config, examTitle: e.target.value })}
              placeholder="e.g. JNTU End-Sem Python Exam"
              className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-sky-500 focus:outline-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {EXAM_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChangeConfig({ ...config, examTitle: preset })}
                  className={`min-h-[32px] rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                    config.examTitle === preset
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Target Exam Date + Quick Offsets */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <label
              htmlFor="planner-exam-date"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <Calendar className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>Target Exam Date</span>
            </label>
            <input
              id="planner-exam-date"
              type="date"
              value={config.targetExamDate}
              min={todayStr}
              onChange={(e) => {
                if (e.target.value) {
                  onChangeConfig({ ...config, targetExamDate: e.target.value });
                }
              }}
              className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 tabular-nums focus:border-sky-500 focus:outline-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {[7, 14, 21, 30, 45].map((days) => {
                const target = addDaysToDateStr(todayStr, days);
                const active = config.targetExamDate === target;
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => onChangeConfig({ ...config, targetExamDate: target })}
                    className={`min-h-[32px] rounded-lg border px-2.5 py-1 text-xs font-medium tabular-nums transition-colors whitespace-nowrap ${
                      active
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    In {days}d
                  </button>
                );
              })}
            </div>
          </div>

          {/* Syllabus Scope Selector */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Syllabus Scope for This Exam
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SCOPE_OPTIONS.map((opt) => {
                const active = config.scopePreset === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChangeConfig({ ...config, scopePreset: opt.id })}
                    className={`min-h-[44px] rounded-xl border p-2.5 text-left transition-colors ${
                      active
                        ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {opt.label}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{opt.hint}</div>
                  </button>
                );
              })}
            </div>

            {config.scopePreset === 'custom' && (
              <div className="pt-2 space-y-2">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select modules included in your exam syllabus ({config.customModuleIds.length}{' '}
                  selected):
                </div>
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800">
                  {COURSE_CURRICULUM.map((mod) => {
                    const checked = config.customModuleIds.includes(mod.id);
                    const modDone = mod.lessons.filter((l) => completedSet.has(l.id)).length;
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => handleToggleCustomModule(mod.id)}
                        className="w-full min-h-[40px] flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`h-4 w-4 rounded flex items-center justify-center border shrink-0 ${
                              checked
                                ? 'bg-sky-600 border-sky-600 text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {checked && <Check className="h-3 w-3" />}
                          </span>
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                            {String(mod.id).padStart(2, '0')}. {mod.title}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                          {modDone}/{mod.lessons.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Study Days, Revision Buffer & Goal Pace Stepper */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Study Days / Week
                </div>
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                  {([5, 6, 7] as const).map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => onChangeConfig({ ...config, studyDaysPerWeek: days })}
                      className={`flex-1 min-h-[34px] rounded-lg text-xs font-semibold tabular-nums transition-colors ${
                        config.studyDaysPerWeek === days
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Revision Buffer
                </div>
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                  {[0, 2, 4].map((buf) => (
                    <button
                      key={buf}
                      type="button"
                      onClick={() => onChangeConfig({ ...config, revisionBufferDays: buf })}
                      className={`flex-1 min-h-[34px] rounded-lg text-xs font-semibold tabular-nums transition-colors ${
                        config.revisionBufferDays === buf
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {buf}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Goal Pace Stepper */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {config.cadence === 'daily'
                    ? 'Lessons per Study Day'
                    : 'Lessons per Study Week'}
                </span>
                {plan.isUsingCustomTarget && (
                  <button
                    type="button"
                    onClick={handleUseAutoPace}
                    className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    Use Recommended (
                    {config.cadence === 'daily'
                      ? plan.recommendedDailyLessons
                      : plan.recommendedWeeklyLessons}
                    )
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2">
                <button
                  type="button"
                  aria-label="Decrease lesson goal"
                  disabled={plan.activeTargetCount <= 1}
                  onClick={() => handleStepGoal(-1)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <div className="text-center">
                  <div className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {plan.activeTargetCount} {plan.activeTargetCount === 1 ? 'lesson' : 'lessons'} /{' '}
                    {config.cadence === 'daily' ? 'day' : 'week'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                    Recommended:{' '}
                    {config.cadence === 'daily'
                      ? `${plan.recommendedDailyLessons}/day`
                      : `${plan.recommendedWeeklyLessons}/week`}
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Increase lesson goal"
                  disabled={plan.activeTargetCount >= plan.remainingLessons.length}
                  onClick={() => handleStepGoal(1)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Right Zone: Suggested Lessons + Upcoming Roadmap */}
        <div className="lg:col-span-7 space-y-6">
          {/* Actionable Suggested Lessons Card */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-xs font-medium text-sky-600 dark:text-sky-400">
                  {config.examTitle} ·{' '}
                  {config.cadence === 'daily' ? "Today's Focus Queue" : "This Week's Focus Queue"}
                </div>
                <h2 className="mt-0.5 text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                  {config.cadence === 'daily'
                    ? 'Suggested Lessons for Today'
                    : 'Suggested Lessons for This Week'}
                </h2>
              </div>

              {plan.suggestedLessons.length > 0 && (
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300 tabular-nums">
                  {plan.suggestedLessons.length}{' '}
                  {plan.suggestedLessons.length === 1 ? 'lesson' : 'lessons'} · ~
                  {plan.estimatedMinutesPerPeriod} min
                </div>
              )}
            </div>

            {plan.remainingLessons.length === 0 ? (
              <div className="py-6 text-center space-y-4">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    All Syllabus Lessons in Scope Completed
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Reinforce your memory with Active Recall Flashcards or practice 2-Mark and 10-Mark University Exam Questions.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigate('exam_prep')}
                    className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition-colors"
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>Open University Exam Prep</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('quizzes')}
                    className="min-h-[42px] inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Target className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    <span>Practice Quizzes &amp; Flashcards</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {plan.suggestedLessons.map((item, idx) => (
                  <div
                    key={item.lesson.id}
                    className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono font-semibold text-sky-600 dark:text-sky-400 tabular-nums">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          Module {String(item.moduleId).padStart(2, '0')}: {item.moduleTitle}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{item.lesson.durationMinutes} min</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.lesson.difficulty}</span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                        {item.lesson.title}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {item.reason} — {item.lesson.introduction}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onCompleteLesson(item.lesson.id)}
                        className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                      >
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Mark Done</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenLesson(item.lesson.id)}
                        className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition-colors whitespace-nowrap"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Start Lesson</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Multi-Day / Multi-Week Study Roadmap */}
          {plan.scheduleBuckets.length > 0 && (
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    {config.cadence === 'daily'
                      ? 'Upcoming Day-by-Day Roadmap'
                      : 'Upcoming Week-by-Week Roadmap'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click any scheduled lesson to open it directly in the Course Viewer
                  </p>
                </div>

                {plan.scheduleBuckets.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setExpandedBuckets((prev) => !prev)}
                    className="min-h-[36px] text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline whitespace-nowrap shrink-0"
                  >
                    {expandedBuckets
                      ? 'Show Less'
                      : `Show All (${plan.scheduleBuckets.length})`}
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleBuckets.map((bucket) => (
                  <div key={bucket.id} className="py-4 first:pt-1 last:pb-1 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                        <span>{bucket.label}</span>
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                          · {bucket.dateRangeLabel}
                        </span>
                      </div>

                      <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {bucket.isRevision
                          ? `Mock tests & 2M/10M viva review · ~${bucket.totalMinutes} min`
                          : `${bucket.items.length} ${
                              bucket.items.length === 1 ? 'lesson' : 'lessons'
                            } · ~${bucket.totalMinutes} min`}
                      </span>
                    </div>

                    {bucket.isRevision ? (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 dark:bg-slate-950/70 px-3.5 py-2.5">
                        <span className="text-xs text-slate-600 dark:text-slate-300">
                          Dedicated buffer before exam day for past-paper 10M outlines &amp; Flashcards.
                        </span>
                        <button
                          type="button"
                          onClick={() => onNavigate('exam_prep')}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline whitespace-nowrap"
                        >
                          <span>Go to Exam Prep</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {bucket.items.map((item) => (
                          <button
                            key={item.lesson.id}
                            type="button"
                            onClick={() => onOpenLesson(item.lesson.id)}
                            className="min-h-[36px] inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 px-3 py-1.5 text-left text-xs text-slate-800 dark:text-slate-200 hover:border-sky-500/70 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                          >
                            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                              M{String(item.moduleId).padStart(2, '0')}
                            </span>
                            <span className="font-medium">{item.lesson.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
