import { COURSE_CURRICULUM } from '../data/curriculum';
import type {
  CourseModule,
  LessonContent,
  StudyPlannerConfig,
  StudyScopePreset,
} from '../types';

export const STUDY_PLANNER_STORAGE_KEY = 'python_master_study_planner_v1';

export interface PlannedLessonItem {
  lesson: LessonContent;
  moduleId: number;
  moduleTitle: string;
  unitTag: string;
  reason: string;
}

export interface ScheduleBucket {
  id: string;
  label: string;
  dateRangeLabel: string;
  isRevision: boolean;
  items: PlannedLessonItem[];
  totalMinutes: number;
}

export type PlannerReadinessStatus =
  | 'completed'
  | 'exam_passed'
  | 'on_track'
  | 'tight'
  | 'behind';

export interface StudyPlanSummary {
  todayStr: string;
  calendarDaysLeft: number;
  effectiveStudyDaysLeft: number;
  studyWeeksLeft: number;
  scopedModules: CourseModule[];
  totalScopedLessons: number;
  completedInScopeCount: number;
  scopeProgressPct: number;
  remainingLessons: PlannedLessonItem[];
  recommendedDailyLessons: number;
  recommendedWeeklyLessons: number;
  activeTargetCount: number;
  isUsingCustomTarget: boolean;
  estimatedMinutesPerPeriod: number;
  projectedFinishDate: string | null;
  projectedStudyDaysNeeded: number;
  status: PlannerReadinessStatus;
  statusLabel: string;
  statusAdvice: string;
  suggestedLessons: PlannedLessonItem[];
  scheduleBuckets: ScheduleBucket[];
}

export function getTodayDateString(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map((n) => Number(n));
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

export function addDaysToDateStr(dateStr: string, daysToAdd: number): string {
  const dt = parseLocalDate(dateStr);
  dt.setDate(dt.getDate() + daysToAdd);
  return getTodayDateString(dt);
}

export function diffCalendarDays(fromDateStr: string, toDateStr: string): number {
  const from = parseLocalDate(fromDateStr);
  const to = parseLocalDate(toDateStr);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((to.getTime() - from.getTime()) / msPerDay);
}

export function formatShortDate(dateStr: string): string {
  const dt = parseLocalDate(dateStr);
  return dt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatFullDate(dateStr: string): string {
  const dt = parseLocalDate(dateStr);
  return dt.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function createDefaultStudyPlannerConfig(todayStr: string = getTodayDateString()): StudyPlannerConfig {
  return {
    examTitle: 'End-Semester Python Exam',
    targetExamDate: addDaysToDateStr(todayStr, 30),
    cadence: 'daily',
    scopePreset: 'all',
    customModuleIds: [1, 2, 3, 4, 5],
    studyDaysPerWeek: 6,
    revisionBufferDays: 2,
    customDailyGoal: null,
    customWeeklyGoal: null,
  };
}

export function loadStudyPlannerConfig(): StudyPlannerConfig {
  const defaults = createDefaultStudyPlannerConfig();
  try {
    const raw = localStorage.getItem(STUDY_PLANNER_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<StudyPlannerConfig>;
    return {
      ...defaults,
      ...parsed,
      customModuleIds:
        Array.isArray(parsed.customModuleIds) && parsed.customModuleIds.length > 0
          ? parsed.customModuleIds
          : defaults.customModuleIds,
      studyDaysPerWeek:
        parsed.studyDaysPerWeek === 5 || parsed.studyDaysPerWeek === 6 || parsed.studyDaysPerWeek === 7
          ? parsed.studyDaysPerWeek
          : defaults.studyDaysPerWeek,
      revisionBufferDays:
        typeof parsed.revisionBufferDays === 'number' && parsed.revisionBufferDays >= 0
          ? Math.min(7, parsed.revisionBufferDays)
          : defaults.revisionBufferDays,
    };
  } catch {
    return defaults;
  }
}

export function saveStudyPlannerConfig(config: StudyPlannerConfig): void {
  try {
    localStorage.setItem(STUDY_PLANNER_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage quota errors
  }
}

export function resolveScopedModules(
  preset: StudyScopePreset,
  customModuleIds: number[]
): CourseModule[] {
  switch (preset) {
    case 'university_core':
      return COURSE_CURRICULUM.filter((m) => m.id >= 1 && m.id <= 11);
    case 'interview_sprint':
      return COURSE_CURRICULUM.filter((m) => m.id >= 12);
    case 'custom': {
      const selected = COURSE_CURRICULUM.filter((m) => customModuleIds.includes(m.id));
      return selected.length > 0 ? selected : [COURSE_CURRICULUM[0]];
    }
    case 'all':
    default:
      return COURSE_CURRICULUM;
  }
}

function describeLessonPriority(module: CourseModule, indexInRemaining: number): string {
  if (indexInRemaining === 0) {
    return `Immediate next step · ${module.unitTag}`;
  }
  if (module.id <= 4) {
    return `Core syntax foundation · ${module.unitTag}`;
  }
  if (module.id <= 11) {
    return `University exam syllabus · ${module.unitTag}`;
  }
  return `Applied & placement readiness · ${module.unitTag}`;
}

export function buildStudyPlan(
  config: StudyPlannerConfig,
  completedLessonIds: string[],
  todayStr: string = getTodayDateString()
): StudyPlanSummary {
  const completedSet = new Set(completedLessonIds);
  const scopedModules = resolveScopedModules(config.scopePreset, config.customModuleIds);
  const allScopedEntries: Array<{ module: CourseModule; lesson: LessonContent }> = [];

  for (const mod of scopedModules) {
    for (const lesson of mod.lessons) {
      allScopedEntries.push({ module: mod, lesson });
    }
  }

  const totalScopedLessons = allScopedEntries.length;
  const completedInScopeCount = allScopedEntries.filter((entry) =>
    completedSet.has(entry.lesson.id)
  ).length;
  const scopeProgressPct =
    totalScopedLessons > 0 ? Math.round((completedInScopeCount / totalScopedLessons) * 100) : 0;

  const remainingLessons: PlannedLessonItem[] = allScopedEntries
    .filter((entry) => !completedSet.has(entry.lesson.id))
    .map((entry, idx) => ({
      lesson: entry.lesson,
      moduleId: entry.module.id,
      moduleTitle: entry.module.title,
      unitTag: entry.module.unitTag,
      reason: describeLessonPriority(entry.module, idx),
    }));

  const calendarDaysLeft = diffCalendarDays(todayStr, config.targetExamDate);
  const effectiveBuffer =
    calendarDaysLeft > 2 ? Math.min(config.revisionBufferDays, calendarDaysLeft - 1) : 0;
  const studyWindowCalendarDays = Math.max(0, calendarDaysLeft - effectiveBuffer);

  const effectiveStudyDaysLeft =
    calendarDaysLeft <= 0
      ? 0
      : Math.max(1, Math.round((studyWindowCalendarDays * config.studyDaysPerWeek) / 7));

  const studyWeeksLeft =
    calendarDaysLeft <= 0
      ? 0
      : Math.max(1, Math.ceil(Math.max(studyWindowCalendarDays, 1) / 7));

  const remainingCount = remainingLessons.length;

  const recommendedDailyLessons =
    remainingCount === 0
      ? 0
      : effectiveStudyDaysLeft <= 0
      ? remainingCount
      : Math.ceil(remainingCount / effectiveStudyDaysLeft);

  const recommendedWeeklyLessons =
    remainingCount === 0
      ? 0
      : studyWeeksLeft <= 0
      ? remainingCount
      : Math.min(remainingCount, Math.ceil(remainingCount / studyWeeksLeft));

  const customTarget =
    config.cadence === 'daily' ? config.customDailyGoal : config.customWeeklyGoal;
  const recommendedTarget =
    config.cadence === 'daily' ? recommendedDailyLessons : recommendedWeeklyLessons;

  const activeTargetCount =
    remainingCount === 0
      ? 0
      : customTarget !== null && customTarget > 0
      ? Math.min(remainingCount, customTarget)
      : recommendedTarget;

  const isUsingCustomTarget = customTarget !== null && customTarget > 0;

  const suggestedLessons = remainingLessons.slice(0, activeTargetCount);
  const estimatedMinutesPerPeriod = suggestedLessons.reduce(
    (sum, item) => sum + item.lesson.durationMinutes,
    0
  );

  // Calculate projected finish date based on activeTargetCount
  const dailyEquivalentPace =
    activeTargetCount <= 0
      ? 0
      : config.cadence === 'daily'
      ? (activeTargetCount * config.studyDaysPerWeek) / 7
      : activeTargetCount / 7;

  const projectedStudyDaysNeeded =
    remainingCount === 0
      ? 0
      : dailyEquivalentPace > 0
      ? Math.ceil(remainingCount / dailyEquivalentPace)
      : 0;

  const projectedFinishDate =
    remainingCount === 0
      ? todayStr
      : projectedStudyDaysNeeded > 0
      ? addDaysToDateStr(todayStr, Math.max(0, projectedStudyDaysNeeded - 1))
      : null;

  let status: PlannerReadinessStatus = 'on_track';
  let statusLabel = 'On Track for Target Date';
  let statusAdvice = `Complete ${activeTargetCount} ${
    activeTargetCount === 1 ? 'lesson' : 'lessons'
  } ${config.cadence === 'daily' ? 'today' : 'this week'} to preserve ${effectiveBuffer} revision ${
    effectiveBuffer === 1 ? 'day' : 'days'
  } before your exam.`;

  if (remainingCount === 0) {
    status = 'completed';
    statusLabel = 'All Target Lessons Completed';
    statusAdvice =
      'You have finished every lesson in this exam scope. Use Quizzes, Flashcards, and Exam Prep 2M/10M notes for final revision.';
  } else if (calendarDaysLeft < 0) {
    status = 'exam_passed';
    statusLabel = 'Target Exam Date Passed';
    statusAdvice =
      'Update your target exam date to generate a fresh countdown and lesson schedule.';
  } else if (calendarDaysLeft === 0) {
    status = 'tight';
    statusLabel = 'Exam Day Today';
    statusAdvice =
      'Focus on high-priority syntax summaries and common mistake checks before your exam.';
  } else if (
    projectedFinishDate &&
    diffCalendarDays(config.targetExamDate, projectedFinishDate) > 0
  ) {
    status = 'behind';
    statusLabel = 'Behind Pace for Exam Date';
    statusAdvice = `At ${activeTargetCount} ${
      config.cadence === 'daily' ? 'lessons/day' : 'lessons/week'
    }, you finish on ${formatShortDate(projectedFinishDate)} (after ${formatShortDate(
      config.targetExamDate
    )}). Aim for ${recommendedTarget} ${
      config.cadence === 'daily' ? 'lessons/day' : 'lessons/week'
    } or narrow your module scope.`;
  } else if (
    (projectedFinishDate &&
      effectiveBuffer > 0 &&
      diffCalendarDays(
        addDaysToDateStr(config.targetExamDate, -effectiveBuffer),
        projectedFinishDate
      ) > 0) ||
    recommendedDailyLessons >= 6
  ) {
    status = 'tight';
    statusLabel = recommendedDailyLessons >= 6 ? 'Intensive Sprint Required' : 'Tight Schedule';
    statusAdvice =
      recommendedDailyLessons >= 6
        ? `Finishing ${remainingCount} lessons before ${formatShortDate(
            config.targetExamDate
          )} requires ~${recommendedDailyLessons} lessons/day. Consider focusing on specific modules.`
        : `You finish before exam day, though your ${effectiveBuffer}-day revision buffer is tight. Completing 1 extra lesson early restores full buffer.`;
  }

  // Build upcoming schedule buckets
  const scheduleBuckets: ScheduleBucket[] = [];
  if (remainingCount > 0 && activeTargetCount > 0) {
    if (config.cadence === 'daily') {
      const studyIndices: number[] = [];
      const maxHorizon = Math.max(14, Math.min(45, Math.max(calendarDaysLeft, 14)));
      const skipEveryNth = config.studyDaysPerWeek === 7 ? 999 : config.studyDaysPerWeek === 6 ? 7 : 6;

      for (let dayOffset = 0; dayOffset < maxHorizon; dayOffset++) {
        if (calendarDaysLeft > 0 && dayOffset >= calendarDaysLeft - effectiveBuffer) break;
        const cyclePos = (dayOffset % 7) + 1;
        if (config.studyDaysPerWeek === 5 && (cyclePos === 6 || cyclePos === 7)) continue;
        if (config.studyDaysPerWeek === 6 && cyclePos === skipEveryNth) continue;
        studyIndices.push(dayOffset);
      }

      if (studyIndices.length === 0) {
        studyIndices.push(0);
      }

      let cursor = 0;
      for (let i = 0; i < studyIndices.length && cursor < remainingLessons.length && scheduleBuckets.length < 10; i++) {
        const dayOffset = studyIndices[i];
        const dateStr = addDaysToDateStr(todayStr, dayOffset);
        const items = remainingLessons.slice(cursor, cursor + activeTargetCount);
        cursor += items.length;
        const totalMinutes = items.reduce((s, it) => s + it.lesson.durationMinutes, 0);
        scheduleBuckets.push({
          id: `day-${dayOffset}`,
          label: dayOffset === 0 ? 'Today' : dayOffset === 1 ? 'Tomorrow' : `Study Day ${i + 1}`,
          dateRangeLabel: formatShortDate(dateStr),
          isRevision: false,
          items,
          totalMinutes,
        });
      }

      if (effectiveBuffer > 0 && calendarDaysLeft > 1) {
        const revStart = addDaysToDateStr(todayStr, Math.max(1, calendarDaysLeft - effectiveBuffer));
        const revEnd = addDaysToDateStr(todayStr, Math.max(1, calendarDaysLeft - 1));
        scheduleBuckets.push({
          id: 'revision-buffer',
          label: 'Final Revision Buffer',
          dateRangeLabel: revStart === revEnd ? formatShortDate(revStart) : `${formatShortDate(revStart)} – ${formatShortDate(revEnd)}`,
          isRevision: true,
          items: [],
          totalMinutes: 45 * effectiveBuffer,
        });
      }
    } else {
      const totalWeeksToShow = Math.min(8, Math.max(1, studyWeeksLeft || 4));
      let cursor = 0;
      for (let w = 0; w < totalWeeksToShow && cursor < remainingLessons.length; w++) {
        const startOffset = w * 7;
        const endOffset = calendarDaysLeft > 0
          ? Math.min(startOffset + 6, Math.max(startOffset, calendarDaysLeft - 1))
          : startOffset + 6;
        const items = remainingLessons.slice(cursor, cursor + activeTargetCount);
        cursor += items.length;
        const totalMinutes = items.reduce((s, it) => s + it.lesson.durationMinutes, 0);
        scheduleBuckets.push({
          id: `week-${w + 1}`,
          label: w === 0 ? 'Week 1 (Current Week)' : `Week ${w + 1}`,
          dateRangeLabel: `${formatShortDate(addDaysToDateStr(todayStr, startOffset))} – ${formatShortDate(
            addDaysToDateStr(todayStr, endOffset)
          )}`,
          isRevision: false,
          items,
          totalMinutes,
        });
      }
    }
  }

  return {
    todayStr,
    calendarDaysLeft,
    effectiveStudyDaysLeft,
    studyWeeksLeft,
    scopedModules,
    totalScopedLessons,
    completedInScopeCount,
    scopeProgressPct,
    remainingLessons,
    recommendedDailyLessons,
    recommendedWeeklyLessons,
    activeTargetCount,
    isUsingCustomTarget,
    estimatedMinutesPerPeriod,
    projectedFinishDate,
    projectedStudyDaysNeeded,
    status,
    statusLabel,
    statusAdvice,
    suggestedLessons,
    scheduleBuckets,
  };
}
