import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  DownloadCloud,
  HardDrive,
  Search,
  Trash2,
  WifiOff,
  X,
} from 'lucide-react';
import { COURSE_CURRICULUM, TOTAL_LESSONS_COUNT } from '../data/curriculum';
import type { LessonContent } from '../types';
import { estimateLessonBytes, formatBytes } from '../utils/offlineCache';

type CacheFilterTab = 'all' | 'not_cached' | 'partial' | 'cached';

interface OfflineDownloadsViewProps {
  offlineLessonIds: string[];
  onSaveLessonsOffline: (lessons: LessonContent[]) => void;
  onRemoveLessonsOffline: (lessonIds: string[]) => void;
  onClearAllOffline: () => void;
  onOpenLesson: (lessonId: string) => void;
  onBackToCourse: () => void;
}

export const OfflineDownloadsView: React.FC<OfflineDownloadsViewProps> = ({
  offlineLessonIds,
  onSaveLessonsOffline,
  onRemoveLessonsOffline,
  onClearAllOffline,
  onOpenLesson,
  onBackToCourse,
}) => {
  const [filterTab, setFilterTab] = useState<CacheFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedModuleIds, setExpandedModuleIds] = useState<number[]>([1]);
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [storageQuotaInfo, setStorageQuotaInfo] = useState<{
    usageBytes: number;
    quotaBytes: number;
  } | null>(null);

  useEffect(() => {
    let active = true;
    if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
      navigator.storage
        .estimate()
        .then((est) => {
          if (!active) return;
          if (typeof est.usage === 'number' && typeof est.quota === 'number' && est.quota > 0) {
            setStorageQuotaInfo({ usageBytes: est.usage, quotaBytes: est.quota });
          }
        })
        .catch(() => {
          // Storage estimate unsupported
        });
    }
    return () => {
      active = false;
    };
  }, [offlineLessonIds.length]);

  const offlineSet = useMemo(() => new Set(offlineLessonIds), [offlineLessonIds]);
  const selectedSet = useMemo(() => new Set(selectedLessonIds), [selectedLessonIds]);

  const allLessons = useMemo(
    () => COURSE_CURRICULUM.flatMap((mod) => mod.lessons),
    []
  );

  const stats = useMemo(() => {
    let totalAllBytes = 0;
    let cachedBytes = 0;
    let cachedMinutes = 0;
    let fullModulesCount = 0;

    for (const mod of COURSE_CURRICULUM) {
      let modCached = 0;
      for (const lesson of mod.lessons) {
        const size = estimateLessonBytes(lesson);
        totalAllBytes += size;
        if (offlineSet.has(lesson.id)) {
          cachedBytes += size;
          cachedMinutes += lesson.durationMinutes;
          modCached += 1;
        }
      }
      if (modCached === mod.lessons.length) {
        fullModulesCount += 1;
      }
    }

    const cachedCount = allLessons.filter((l) => offlineSet.has(l.id)).length;
    const cachedPct = Math.round((cachedCount / TOTAL_LESSONS_COUNT) * 100);

    return {
      totalAllBytes,
      cachedBytes,
      cachedMinutes,
      fullModulesCount,
      cachedCount,
      cachedPct,
    };
  }, [allLessons, offlineSet]);

  const examCoreLessons = useMemo(
    () =>
      COURSE_CURRICULUM.filter((m) => m.id >= 1 && m.id <= 11).flatMap((m) => m.lessons),
    []
  );

  const examCoreUncachedCount = useMemo(
    () => examCoreLessons.filter((l) => !offlineSet.has(l.id)).length,
    [examCoreLessons, offlineSet]
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const visibleModules = useMemo(() => {
    return COURSE_CURRICULUM.filter((mod) => {
      const modCachedCount = mod.lessons.filter((l) => offlineSet.has(l.id)).length;
      if (filterTab === 'not_cached' && modCachedCount !== 0) return false;
      if (
        filterTab === 'partial' &&
        (modCachedCount === 0 || modCachedCount === mod.lessons.length)
      ) {
        return false;
      }
      if (filterTab === 'cached' && modCachedCount !== mod.lessons.length) return false;

      if (!normalizedQuery) return true;
      const matchesModule =
        mod.title.toLowerCase().includes(normalizedQuery) ||
        mod.unitTag.toLowerCase().includes(normalizedQuery);
      const matchesAnyLesson = mod.lessons.some((l) =>
        l.title.toLowerCase().includes(normalizedQuery)
      );
      return matchesModule || matchesAnyLesson;
    });
  }, [filterTab, normalizedQuery, offlineSet]);

  const selectedLessonsList = useMemo(
    () => allLessons.filter((l) => selectedSet.has(l.id)),
    [allLessons, selectedSet]
  );

  const selectedBytes = useMemo(
    () => selectedLessonsList.reduce((sum, l) => sum + estimateLessonBytes(l), 0),
    [selectedLessonsList]
  );

  const selectedUncached = useMemo(
    () => selectedLessonsList.filter((l) => !offlineSet.has(l.id)),
    [selectedLessonsList, offlineSet]
  );

  const selectedCachedIds = useMemo(
    () => selectedLessonsList.filter((l) => offlineSet.has(l.id)).map((l) => l.id),
    [selectedLessonsList, offlineSet]
  );

  const toggleExpandModule = (moduleId: number) => {
    setExpandedModuleIds((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const toggleSelectLesson = (lessonId: string) => {
    setSelectedLessonIds((prev) =>
      prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId]
    );
  };

  const handleSelectModuleLessons = (lessons: LessonContent[], onlyUncached: boolean) => {
    const targetIds = (
      onlyUncached ? lessons.filter((l) => !offlineSet.has(l.id)) : lessons
    ).map((l) => l.id);

    if (targetIds.length === 0) return;

    const allAlreadySelected = targetIds.every((id) => selectedSet.has(id));
    if (allAlreadySelected) {
      const removeSet = new Set(targetIds);
      setSelectedLessonIds((prev) => prev.filter((id) => !removeSet.has(id)));
    } else {
      setSelectedLessonIds((prev) => Array.from(new Set([...prev, ...targetIds])));
    }
  };

  const handleBulkSave = (lessons: LessonContent[], label: string) => {
    const toAdd = lessons.filter((l) => !offlineSet.has(l.id));
    if (toAdd.length === 0) return;
    const addedBytes = toAdd.reduce((sum, l) => sum + estimateLessonBytes(l), 0);
    onSaveLessonsOffline(toAdd);
    setConfirmClearAll(false);
    setStatusNotice(
      `Downloaded ${toAdd.length} ${toAdd.length === 1 ? 'lesson' : 'lessons'} (${formatBytes(
        addedBytes
      )}) for ${label}.`
    );
  };

  const handleBulkRemove = (lessonIds: string[], label: string) => {
    const toRemove = lessonIds.filter((id) => offlineSet.has(id));
    if (toRemove.length === 0) return;
    onRemoveLessonsOffline(toRemove);
    setStatusNotice(
      `Removed ${toRemove.length} ${toRemove.length === 1 ? 'lesson' : 'lessons'} from ${label}.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Top Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBackToCourse}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Python Curriculum</span>
          </button>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Local Lesson Cache · Zero-Internet Study · Batch Module &amp; Custom Lesson Packs
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 [text-wrap:balance]">
            Manage Offline Downloads
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={examCoreUncachedCount === 0}
            onClick={() => handleBulkSave(examCoreLessons, 'Exam Core (Modules 1–11)')}
            className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            <DownloadCloud className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <span>
              {examCoreUncachedCount === 0
                ? 'Exam Core Cached'
                : `Download Exam Core (${examCoreUncachedCount})`}
            </span>
          </button>

          <button
            type="button"
            disabled={stats.cachedCount === TOTAL_LESSONS_COUNT}
            onClick={() => handleBulkSave(allLessons, 'Full 15-Module Curriculum')}
            className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:bg-emerald-600 transition-colors whitespace-nowrap"
          >
            {stats.cachedCount === TOTAL_LESSONS_COUNT ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <DownloadCloud className="h-4 w-4" />
            )}
            <span>
              {stats.cachedCount === TOTAL_LESSONS_COUNT
                ? `All ${TOTAL_LESSONS_COUNT} Lessons Cached`
                : `Download All (${TOTAL_LESSONS_COUNT - stats.cachedCount})`}
            </span>
          </button>

          {stats.cachedCount > 0 && !confirmClearAll && (
            <button
              type="button"
              onClick={() => setConfirmClearAll(true)}
              className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors whitespace-nowrap"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear Cache</span>
            </button>
          )}
        </div>
      </div>

      {/* Inline Clear Confirmation */}
      {confirmClearAll && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-rose-900 dark:text-rose-100">
            Remove all <strong>{stats.cachedCount}</strong> offline lessons (
            <span className="tabular-nums">{formatBytes(stats.cachedBytes)}</span>) from local device cache?
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onClearAllOffline();
                setConfirmClearAll(false);
                setStatusNotice('Cleared all locally cached lessons.');
              }}
              className="min-h-[38px] rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition-colors"
            >
              Confirm Clear All
            </button>
            <button
              type="button"
              onClick={() => setConfirmClearAll(false)}
              className="min-h-[38px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action Status Feedback */}
      {statusNotice && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 px-4 py-3 flex items-center justify-between gap-3 text-xs sm:text-sm text-emerald-900 dark:text-emerald-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{statusNotice}</span>
          </div>
          <button
            type="button"
            aria-label="Dismiss status notice"
            onClick={() => setStatusNotice(null)}
            className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 4-Column Storage & Cache Summary Row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Lessons Cached</div>
          <div className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {stats.cachedCount} / {TOTAL_LESSONS_COUNT}
          </div>
          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {stats.cachedPct}% saved offline
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Full Modules Ready</div>
          <div className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {stats.fullModulesCount} / {COURSE_CURRICULUM.length}
          </div>
          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Complete unit bundles
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Lesson Cache Size</span>
            <HardDrive className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="mt-1 text-xl sm:text-2xl font-bold text-sky-600 dark:text-sky-400 tabular-nums">
            {formatBytes(stats.cachedBytes)}
          </div>
          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            Full pack: {formatBytes(stats.totalAllBytes)}
            {storageQuotaInfo
              ? ` · ${formatBytes(storageQuotaInfo.quotaBytes)} browser quota`
              : ''}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Offline Study Time</span>
            <WifiOff className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {stats.cachedMinutes >= 60
              ? `${(stats.cachedMinutes / 60).toFixed(1)} hrs`
              : `${stats.cachedMinutes} min`}
          </div>
          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {stats.cachedMinutes} min readable offline
          </div>
        </div>
      </section>

      {/* Filter Tabs + Search + Expand/Collapse Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 overflow-x-auto">
          {(
            [
              { id: 'all', label: 'All Modules (15)' },
              { id: 'not_cached', label: 'Not Cached' },
              { id: 'partial', label: 'Partial' },
              { id: 'cached', label: 'Fully Offline' },
            ] as const
          ).map((tab) => {
            const active = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`min-h-[36px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
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

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter modules or lessons..."
              className="w-full min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:border-sky-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear filter"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              setExpandedModuleIds((prev) =>
                prev.length === visibleModules.length ? [] : visibleModules.map((m) => m.id)
              )
            }
            className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            {expandedModuleIds.length === visibleModules.length && visibleModules.length > 0
              ? 'Collapse All'
              : 'Expand All'}
          </button>
        </div>
      </div>

      {/* Multi-Select Custom Batch Bar */}
      {selectedLessonsList.length > 0 && (
        <div className="rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/80 dark:bg-sky-950/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 tabular-nums">
            <strong>{selectedLessonsList.length}</strong>{' '}
            {selectedLessonsList.length === 1 ? 'lesson' : 'lessons'} selected (
            {formatBytes(selectedBytes)})
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedUncached.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  handleBulkSave(selectedUncached, 'selected lessons');
                  setSelectedLessonIds([]);
                }}
                className="min-h-[38px] inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 transition-colors"
              >
                <DownloadCloud className="h-3.5 w-3.5" />
                <span>Download Selected ({selectedUncached.length})</span>
              </button>
            )}
            {selectedCachedIds.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  handleBulkRemove(selectedCachedIds, 'selected lessons');
                  setSelectedLessonIds([]);
                }}
                className="min-h-[38px] inline-flex items-center gap-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove Selected ({selectedCachedIds.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedLessonIds([])}
              className="min-h-[38px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Module Download Cards */}
      {visibleModules.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-2">
          <DownloadCloud className="h-8 w-8 mx-auto text-slate-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            No Modules Match This Filter
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Reset the filter tab or clear your search query to browse all 15 modules.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleModules.map((mod) => {
            const cachedInMod = mod.lessons.filter((l) => offlineSet.has(l.id));
            const uncachedInMod = mod.lessons.filter((l) => !offlineSet.has(l.id));
            const modTotalBytes = mod.lessons.reduce(
              (sum, l) => sum + estimateLessonBytes(l),
              0
            );
            const modCachedBytes = cachedInMod.reduce(
              (sum, l) => sum + estimateLessonBytes(l),
              0
            );
            const modPct = Math.round((cachedInMod.length / mod.lessons.length) * 100);
            const isFullyCached = cachedInMod.length === mod.lessons.length;
            const isExpanded =
              expandedModuleIds.includes(mod.id) || normalizedQuery.length > 0;

            const shownLessons = normalizedQuery
              ? mod.lessons.filter(
                  (l) =>
                    l.title.toLowerCase().includes(normalizedQuery) ||
                    mod.title.toLowerCase().includes(normalizedQuery)
                )
              : mod.lessons;

            return (
              <section
                key={mod.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      <span>Module {String(mod.id).padStart(2, '0')}</span>
                      <span aria-hidden="true">·</span>
                      <span>{mod.unitTag}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {cachedInMod.length}/{mod.lessons.length} cached (
                        {formatBytes(modCachedBytes)} / {formatBytes(modTotalBytes)})
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          isFullyCached
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : cachedInMod.length > 0
                            ? 'text-sky-600 dark:text-sky-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {isFullyCached ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Fully Offline</span>
                          </>
                        ) : cachedInMod.length > 0 ? (
                          <>
                            <DownloadCloud className="h-3.5 w-3.5" />
                            <span>Partial ({modPct}%)</span>
                          </>
                        ) : (
                          <span>Not Cached</span>
                        )}
                      </span>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                      {mod.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      {mod.subtitle}
                    </p>
                  </div>

                  {/* Module Action Controls */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {!isFullyCached ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleBulkSave(
                            uncachedInMod,
                            `Module ${String(mod.id).padStart(2, '0')}`
                          )
                        }
                        className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition-colors whitespace-nowrap"
                      >
                        <DownloadCloud className="h-4 w-4" />
                        <span>
                          Download Module ({uncachedInMod.length} ·{' '}
                          {formatBytes(modTotalBytes - modCachedBytes)})
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleBulkRemove(
                            mod.lessons.map((l) => l.id),
                            `Module ${String(mod.id).padStart(2, '0')}`
                          )
                        }
                        className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 transition-colors whitespace-nowrap"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Remove Module</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleExpandModule(mod.id)}
                      className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                    >
                      <span>{isExpanded ? 'Hide Lessons' : 'Select Lessons'}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Module Cache Progress Bar */}
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full origin-left transition-transform duration-200 ${
                      isFullyCached ? 'bg-emerald-500' : 'bg-sky-600'
                    }`}
                    style={{ transform: `scaleX(${modPct / 100})` }}
                  />
                </div>

                {/* Expandable Per-Lesson Checklist for Custom Selection */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Check individual lessons to build a custom offline batch
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectModuleLessons(shownLessons, false)}
                        className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        {shownLessons.every((l) => selectedSet.has(l.id))
                          ? 'Unselect Module Lessons'
                          : 'Select All in Module'}
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {shownLessons.map((lesson, idx) => {
                        const isCached = offlineSet.has(lesson.id);
                        const isChecked = selectedSet.has(lesson.id);
                        const bytes = estimateLessonBytes(lesson);

                        return (
                          <div
                            key={lesson.id}
                            className="py-2.5 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={isChecked}
                                aria-label={`Select ${lesson.title}`}
                                onClick={() => toggleSelectLesson(lesson.id)}
                                className={`h-5 w-5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                                  isChecked
                                    ? 'bg-sky-600 border-sky-600 text-white'
                                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950'
                                }`}
                              >
                                {isChecked && <Check className="h-3.5 w-3.5" />}
                              </button>

                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                  {mod.id}.{idx + 1} {lesson.title}
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                                  <span>{lesson.difficulty}</span>
                                  <span aria-hidden="true">·</span>
                                  <span>{lesson.durationMinutes} min</span>
                                  <span aria-hidden="true">·</span>
                                  <span>{formatBytes(bytes)}</span>
                                  <span aria-hidden="true">·</span>
                                  <span
                                    className={
                                      isCached
                                        ? 'font-medium text-emerald-600 dark:text-emerald-400'
                                        : ''
                                    }
                                  >
                                    {isCached ? 'Cached locally' : 'Online only'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => onOpenLesson(lesson.id)}
                                className="min-h-[36px] inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                              >
                                <BookOpen className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Read</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  isCached
                                    ? onRemoveLessonsOffline([lesson.id])
                                    : onSaveLessonsOffline([lesson])
                                }
                                aria-label={
                                  isCached
                                    ? `Remove ${lesson.title} from offline cache`
                                    : `Download ${lesson.title} offline`
                                }
                                className={`min-h-[36px] inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                                  isCached
                                    ? 'border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200'
                                    : 'bg-slate-900 dark:bg-sky-600 text-white hover:opacity-90'
                                }`}
                              >
                                {isCached ? (
                                  <>
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Cached</span>
                                  </>
                                ) : (
                                  <>
                                    <DownloadCloud className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Save</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
