import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, CheckCircle2, Code2, FolderKanban, Search, X } from 'lucide-react';
import { ASSIGNMENTS_LIST, DAILY_CHALLENGE, PROJECTS_LIST, QUIZ_BANK } from '../data/assessments';
import { COURSE_CURRICULUM } from '../data/curriculum';
import { PRACTICE_CHALLENGES } from './PlaygroundView';

export type SearchItemCategory = 'lesson' | 'problem' | 'project';

export type SearchSelectionTarget =
  | { kind: 'lesson'; lessonId: string }
  | { kind: 'playground_challenge'; challengeId: string }
  | { kind: 'daily_challenge' }
  | { kind: 'assignment'; assignmentId: string }
  | { kind: 'quiz_coding'; questionId: string }
  | { kind: 'project'; projectId: string };

interface SearchIndexEntry {
  uid: string;
  category: SearchItemCategory;
  title: string;
  subtitle: string;
  searchKeywords: string;
  target: SearchSelectionTarget;
}

const QUIZ_CHALLENGE_TITLES: Record<string, string> = {
  'q-code-1': 'Sum of Squares of Even Numbers (1 to 10)',
  'q-code-2': 'Reverse Word Order in Sentence',
};

interface GlobalSearchBarProps {
  completedLessons: string[];
  solvedChallenges: string[];
  submittedAssignments: string[];
  completedProjects: string[];
  onSelectResult: (target: SearchSelectionTarget) => void;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  completedLessons,
  solvedChallenges,
  submittedAssignments,
  completedProjects,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [filterCat, setFilterCat] = useState<'all' | SearchItemCategory>('all');
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const searchIndex = useMemo<SearchIndexEntry[]>(() => {
    const entries: SearchIndexEntry[] = [];

    // 1. All 91 Curriculum Lessons across 15 Modules
    for (const mod of COURSE_CURRICULUM) {
      const modPrefix = `Module ${String(mod.id).padStart(2, '0')}: ${mod.title}`;
      for (const lesson of mod.lessons) {
        entries.push({
          uid: `lesson-${lesson.id}`,
          category: 'lesson',
          title: lesson.title,
          subtitle: `Lesson · ${modPrefix} · ${lesson.durationMinutes} min`,
          searchKeywords: `${lesson.title} ${mod.title}`.toLowerCase(),
          target: { kind: 'lesson', lessonId: lesson.id },
        });
      }
    }

    // 2. Coding Problems: Playground Challenges, Daily Challenge, Lab Assignments, Quiz Coding Challenges
    for (const ch of PRACTICE_CHALLENGES) {
      entries.push({
        uid: `problem-pg-${ch.id}`,
        category: 'problem',
        title: ch.title,
        subtitle: 'Coding Problem · Playground Challenge',
        searchKeywords: `${ch.title} ${ch.prompt}`.toLowerCase(),
        target: { kind: 'playground_challenge', challengeId: ch.id },
      });
    }

    entries.push({
      uid: 'problem-daily',
      category: 'problem',
      title: DAILY_CHALLENGE.title,
      subtitle: 'Coding Problem · Daily Coding Practice',
      searchKeywords: `${DAILY_CHALLENGE.title} ${DAILY_CHALLENGE.description}`.toLowerCase(),
      target: { kind: 'daily_challenge' },
    });

    for (const asgn of ASSIGNMENTS_LIST) {
      entries.push({
        uid: `problem-asgn-${asgn.id}`,
        category: 'problem',
        title: asgn.title,
        subtitle: `Coding Problem · Lab Assignment · ${asgn.unit}`,
        searchKeywords: `${asgn.title} ${asgn.unit} ${asgn.problemStatement}`.toLowerCase(),
        target: { kind: 'assignment', assignmentId: asgn.id },
      });
    }

    for (const q of QUIZ_BANK) {
      if (q.category === 'coding_challenge') {
        const displayTitle = QUIZ_CHALLENGE_TITLES[q.id] || q.question;
        entries.push({
          uid: `problem-quiz-${q.id}`,
          category: 'problem',
          title: displayTitle,
          subtitle: `Coding Problem · Quiz Challenge · ${q.moduleRef}`,
          searchKeywords: `${displayTitle} ${q.question} ${q.moduleRef}`.toLowerCase(),
          target: { kind: 'quiz_coding', questionId: q.id },
        });
      }
    }

    // 3. All 8 Mini Projects
    for (const proj of PROJECTS_LIST) {
      entries.push({
        uid: `project-${proj.id}`,
        category: 'project',
        title: proj.title,
        subtitle: `Project · ${proj.difficulty} · ${proj.requiredConcepts.slice(0, 2).join(' / ')}`,
        searchKeywords: `${proj.title} ${proj.requiredConcepts.join(' ')}`.toLowerCase(),
        target: { kind: 'project', projectId: proj.id },
      });
    }

    return entries;
  }, []);

  const filteredResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const pool =
      filterCat === 'all' ? searchIndex : searchIndex.filter((item) => item.category === filterCat);

    if (!trimmed) {
      if (filterCat !== 'all') {
        return pool.slice(0, 8);
      }
      // Balanced quick preview across Lessons, Coding Problems, and Projects
      const quickLessons = pool.filter((e) => e.category === 'lesson').slice(0, 3);
      const quickProblems = pool.filter((e) => e.category === 'problem').slice(0, 3);
      const quickProjects = pool.filter((e) => e.category === 'project').slice(0, 2);
      return [...quickLessons, ...quickProblems, ...quickProjects];
    }

    const scored = pool
      .map((item) => {
        const lowerTitle = item.title.toLowerCase();
        if (lowerTitle === trimmed) return { item, score: 100 };
        if (lowerTitle.startsWith(trimmed)) return { item, score: 85 };
        if (lowerTitle.includes(trimmed)) return { item, score: 70 };
        if (item.searchKeywords.includes(trimmed)) return { item, score: 40 };
        return null;
      })
      .filter((entry): entry is { item: SearchIndexEntry; score: number } => entry !== null)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 12).map((s) => s.item);
  }, [query, filterCat, searchIndex]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, filterCat]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setMobileExpanded(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  // Global Ctrl+K / Cmd+K shortcut to focus search
  useEffect(() => {
    const handleGlobalKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (window.innerWidth < 640) {
          setMobileExpanded(true);
          setIsOpen(true);
          requestAnimationFrame(() => mobileInputRef.current?.focus());
        } else {
          setIsOpen(true);
          desktopInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const isEntryCompleted = (target: SearchSelectionTarget): boolean => {
    switch (target.kind) {
      case 'lesson':
        return completedLessons.includes(target.lessonId);
      case 'playground_challenge':
        return solvedChallenges.includes(target.challengeId);
      case 'quiz_coding':
        return solvedChallenges.includes(target.questionId);
      case 'assignment':
        return submittedAssignments.includes(target.assignmentId);
      case 'project':
        return completedProjects.includes(target.projectId);
      case 'daily_challenge':
        return false;
    }
  };

  const handleChoose = (entry: SearchIndexEntry) => {
    onSelectResult(entry.target);
    setIsOpen(false);
    setMobileExpanded(false);
    setQuery('');
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setMobileExpanded(false);
      event.currentTarget.blur();
      return;
    }
    if (!isOpen) {
      setIsOpen(true);
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (filteredResults.length > 0) {
        setActiveIndex((prev) => (prev + 1) % filteredResults.length);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (filteredResults.length > 0) {
        setActiveIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
      }
    } else if (event.key === 'Enter' && filteredResults[activeIndex]) {
      event.preventDefault();
      handleChoose(filteredResults[activeIndex]);
    }
  };

  const renderCategoryIcon = (category: SearchItemCategory) => {
    if (category === 'lesson') {
      return <BookOpen className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />;
    }
    if (category === 'problem') {
      return <Code2 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />;
    }
    return <FolderKanban className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
  };

  const renderResultsDropdown = () => (
    <div
      role="listbox"
      aria-label="Global search results"
      className="absolute left-0 right-0 sm:left-auto sm:right-0 sm:w-[420px] md:w-[460px] top-full mt-2 z-50 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden"
    >
      {/* Category Filter Buttons */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 px-3 py-2 bg-slate-50/80 dark:bg-slate-950/60">
        <div className="flex items-center gap-1 overflow-x-auto">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'lesson', label: 'Lessons' },
              { id: 'problem', label: 'Problems' },
              { id: 'project', label: 'Projects' },
            ] as const
          ).map((tab) => {
            const active = filterCat === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterCat(tab.id)}
                className={`min-h-[32px] rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <span className="hidden sm:inline text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
          {query.trim() ? `${filteredResults.length} found` : 'Suggested'}
        </span>
      </div>

      {/* Results List */}
      <div className="max-h-[65vh] sm:max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
        {filteredResults.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              No lessons, coding problems, or projects match &ldquo;{query.trim()}&rdquo;
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Try searching titles like &ldquo;For Loop&rdquo;, &ldquo;Palindrome&rdquo;, &ldquo;Fibonacci&rdquo;, or &ldquo;ATM Simulation&rdquo;.
            </p>
          </div>
        ) : (
          filteredResults.map((entry, idx) => {
            const isHighlighted = idx === activeIndex;
            const done = isEntryCompleted(entry.target);

            return (
              <button
                key={entry.uid}
                type="button"
                role="option"
                aria-selected={isHighlighted}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => handleChoose(entry)}
                className={`w-full min-h-[52px] flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                  isHighlighted
                    ? 'bg-sky-50/90 dark:bg-sky-950/40'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5">{renderCategoryIcon(entry.category)}</div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {entry.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {entry.subtitle}
                    </div>
                  </div>
                </div>
                {done && (
                  <CheckCircle2
                    aria-label="Completed"
                    className="h-4 w-4 text-emerald-500 shrink-0"
                  />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="relative flex justify-end sm:justify-start sm:w-56 md:w-64 lg:w-60 xl:w-72 shrink">
      {/* Compact Trigger Button on < 640px (Android Mobile Portrait) */}
      <button
        type="button"
        aria-label="Search lessons, coding problems, or projects"
        onClick={() => {
          setMobileExpanded(true);
          setIsOpen(true);
          requestAnimationFrame(() => mobileInputRef.current?.focus());
        }}
        className="sm:hidden min-h-[40px] inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Search className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
        <span className="whitespace-nowrap">Search</span>
      </button>

      {/* Mobile Expanded Full-Header Search Bar (< 640px) */}
      {mobileExpanded && (
        <div className="sm:hidden fixed inset-x-0 top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 shadow-sm">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                ref={mobileInputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleInputKeyDown}
                placeholder="Search lessons, problems, projects..."
                aria-label="Search lessons, coding problems, or projects"
                className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-9 pr-9 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search query"
                  onClick={() => {
                    setQuery('');
                    mobileInputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setMobileExpanded(false);
              }}
              className="min-h-[42px] px-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0"
            >
              Close
            </button>
          </div>
          {isOpen && <div className="relative">{renderResultsDropdown()}</div>}
        </div>
      )}

      {/* Desktop & Tablet Inline Header Search Input (sm: and up) */}
      <div className="hidden sm:block relative w-full">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
        <input
          ref={desktopInputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search lessons, problems, projects..."
          aria-label="Search lessons, coding problems, or projects"
          className="w-full min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-9 pr-14 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-sky-500 dark:focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-colors"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search query"
            onClick={() => {
              setQuery('');
              desktopInputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <span
            aria-hidden="true"
            className="pointer-events-none hidden md:inline absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-slate-400 dark:text-slate-500"
          >
            Ctrl K
          </span>
        )}
        {isOpen && !mobileExpanded && renderResultsDropdown()}
      </div>
    </div>
  );
};
