import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Layers,
  RotateCcw,
  RotateCw,
  Shuffle,
} from 'lucide-react';
import { FLASHCARDS_DECK } from '../data/assessments';
import type { FlashcardCategory, FlashcardItem } from '../types';

const FLASHCARD_STORAGE_KEY = 'python_master_flashcards_v1';

const FLASHCARD_FILTERS: Array<{ id: 'all' | FlashcardCategory; label: string }> = [
  { id: 'all', label: 'All Cards' },
  { id: 'Terminology', label: 'Terminology' },
  { id: 'Syntax', label: 'Syntax' },
  { id: 'Data Structures', label: 'Data Structures' },
  { id: 'OOP & Exceptions', label: 'OOP & Exceptions' },
  { id: 'Stdlib & Files', label: 'Stdlib & Files' },
];

interface FlashcardsDeckProps {
  onMasteryChange: (masteryPct: number) => void;
}

export const FlashcardsDeck: React.FC<FlashcardsDeckProps> = ({ onMasteryChange }) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | FlashcardCategory>('all');
  const [deckOrder, setDeckOrder] = useState<string[]>(() => FLASHCARDS_DECK.map((c) => c.id));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [masteredIds, setMasteredIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FLASHCARD_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { mastered?: string[]; review?: string[] };
        return Array.isArray(parsed.mastered) ? parsed.mastered : [];
      }
    } catch {
      // Ignore storage errors
    }
    return [];
  });

  const [reviewIds, setReviewIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FLASHCARD_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { mastered?: string[]; review?: string[] };
        return Array.isArray(parsed.review) ? parsed.review : [];
      }
    } catch {
      // Ignore storage errors
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        FLASHCARD_STORAGE_KEY,
        JSON.stringify({ mastered: masteredIds, review: reviewIds })
      );
    } catch {
      // Ignore storage errors
    }
  }, [masteredIds, reviewIds]);

  const cardById = useMemo(() => {
    const map = new Map<string, FlashcardItem>();
    for (const item of FLASHCARDS_DECK) {
      map.set(item.id, item);
    }
    return map;
  }, []);

  const activeDeck = useMemo(() => {
    const ordered = deckOrder
      .map((id) => cardById.get(id))
      .filter((item): item is FlashcardItem => Boolean(item));
    if (categoryFilter === 'all') return ordered;
    return ordered.filter((card) => card.category === categoryFilter);
  }, [deckOrder, cardById, categoryFilter]);

  const safeIndex = Math.min(currentIndex, Math.max(activeDeck.length - 1, 0));
  const currentCard = activeDeck[safeIndex];

  const handleGoPrev = useCallback(() => {
    if (activeDeck.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + activeDeck.length) % activeDeck.length);
  }, [activeDeck.length]);

  const handleGoNext = useCallback(() => {
    if (activeDeck.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % activeDeck.length);
  }, [activeDeck.length]);

  // Keyboard navigation when practicing flashcards
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleGoNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleGoPrev();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleGoNext, handleGoPrev]);

  const handleSelectCategory = (cat: 'all' | FlashcardCategory) => {
    setCategoryFilter(cat);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleShuffle = () => {
    const nextOrder = [...deckOrder];
    for (let i = nextOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nextOrder[i], nextOrder[j]] = [nextOrder[j], nextOrder[i]];
    }
    setDeckOrder(nextOrder);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleMarkMastered = () => {
    if (!currentCard) return;
    const nextMastered = masteredIds.includes(currentCard.id)
      ? masteredIds
      : [...masteredIds, currentCard.id];
    const nextReview = reviewIds.filter((id) => id !== currentCard.id);
    setMasteredIds(nextMastered);
    setReviewIds(nextReview);

    const pct = Math.round((nextMastered.length / FLASHCARDS_DECK.length) * 100);
    onMasteryChange(pct);
    handleGoNext();
  };

  const handleMarkReviewAgain = () => {
    if (!currentCard) return;
    const nextReview = reviewIds.includes(currentCard.id)
      ? reviewIds
      : [...reviewIds, currentCard.id];
    const nextMastered = masteredIds.filter((id) => id !== currentCard.id);
    setReviewIds(nextReview);
    setMasteredIds(nextMastered);

    const pct = Math.round((nextMastered.length / FLASHCARDS_DECK.length) * 100);
    onMasteryChange(pct);
    handleGoNext();
  };

  const handleResetProgress = () => {
    setMasteredIds([]);
    setReviewIds([]);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const masteredPct = Math.round((masteredIds.length / FLASHCARDS_DECK.length) * 100);
  const isCurrentMastered = currentCard ? masteredIds.includes(currentCard.id) : false;
  const isCurrentReview = currentCard ? reviewIds.includes(currentCard.id) : false;

  return (
    <div className="space-y-5">
      {/* Sub-Header Controls & Deck Progress */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Layers className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>Terminology & Syntax Active Recall</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                Mastered {masteredIds.length} / {FLASHCARDS_DECK.length} ({masteredPct}%)
              </span>
              {reviewIds.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-600 dark:text-amber-400 tabular-nums">
                    Review Queue: {reviewIds.length}
                  </span>
                </>
              )}
            </div>
            {/* Progress Track */}
            <div className="h-1.5 w-full sm:w-80 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${masteredPct}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleShuffle}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Shuffle className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>Shuffle Deck</span>
            </button>

            {(masteredIds.length > 0 || reviewIds.length > 0) && (
              <button
                type="button"
                onClick={handleResetProgress}
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Deck</span>
              </button>
            )}
          </div>
        </div>

        {/* Topic Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {FLASHCARD_FILTERS.map((f) => {
            const active = categoryFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => handleSelectCategory(f.id)}
                className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-slate-900 dark:bg-sky-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive 3D Flip Flashcard */}
      {currentCard ? (
        <div className="[perspective:1200px]">
          <div
            role="button"
            tabIndex={0}
            aria-pressed={isFlipped}
            aria-label={
              isFlipped
                ? `Answer side for ${currentCard.term}. Press Space or click to flip back to prompt.`
                : `Prompt side for ${currentCard.term}. Press Space or click to flip to answer.`
            }
            onClick={() => setIsFlipped((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsFlipped((prev) => !prev);
              }
            }}
            className={`grid cursor-pointer transition-transform duration-500 [transform-style:preserve-3d] focus:outline-none ${
              isFlipped ? '[transform:rotateY(180deg)]' : ''
            }`}
          >
            {/* FRONT SIDE: Terminology / Syntax Prompt */}
            <div
              className={`col-start-1 row-start-1 min-h-[320px] sm:min-h-[340px] flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm [backface-visibility:hidden] ${
                isFlipped ? 'pointer-events-none' : 'pointer-events-auto'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sky-600 dark:text-sky-400">PROMPT</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentCard.moduleRef}</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentCard.category}</span>
                </div>
                <div className="flex items-center gap-2 tabular-nums">
                  {isCurrentMastered && (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mastered
                    </span>
                  )}
                  {!isCurrentMastered && isCurrentReview && (
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      Needs Review
                    </span>
                  )}
                  <span>
                    Card {safeIndex + 1} / {activeDeck.length}
                  </span>
                </div>
              </div>

              <div className="my-6 space-y-4">
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {currentCard.term}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                  {currentCard.frontHint}
                </p>

                {currentCard.syntaxPrompt && (
                  <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-xs sm:text-sm text-sky-300">
                    <code>{currentCard.syntaxPrompt}</code>
                  </pre>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>Tap card or press Space to reveal answer</span>
                </span>
                <span className="hidden sm:inline font-mono text-[11px] text-slate-400 dark:text-slate-500">
                  ← Prev · Space Flip · → Next
                </span>
              </div>
            </div>

            {/* BACK SIDE: Answer + Working Python 3.12 Example + Exam Tip */}
            <div
              className={`col-start-1 row-start-1 min-h-[320px] sm:min-h-[340px] flex flex-col justify-between rounded-2xl border border-sky-300 dark:border-sky-800 bg-sky-50/40 dark:bg-slate-900 p-6 sm:p-8 shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)] ${
                isFlipped ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    ANSWER &amp; SYNTAX
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{currentCard.term}</span>
                </div>
                <span className="tabular-nums">
                  Card {safeIndex + 1} / {activeDeck.length}
                </span>
              </div>

              <div className="my-5 space-y-4">
                <p className="text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-relaxed">
                  {currentCard.answer}
                </p>

                <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-xs sm:text-sm text-emerald-300">
                  <code>{currentCard.codeExample}</code>
                </pre>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 px-4 py-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    B.Tech Exam Tip:{' '}
                  </span>
                  <span>{currentCard.examTip}</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800 pt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>Tap card or press Space to view prompt again</span>
                </span>
                <span className="hidden sm:inline font-mono text-[11px] text-slate-400 dark:text-slate-500">
                  Rate recall below to track mastery
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Card Navigation & Self-Assessment Bar */}
      {currentCard && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGoPrev}
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFlipped((prev) => !prev)}
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/80 dark:bg-sky-950/40 px-4 py-2 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-950/70 transition-colors"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>{isFlipped ? 'Show Prompt' : 'Flip Card'}</span>
            </button>

            <button
              type="button"
              onClick={handleGoNext}
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMarkReviewAgain}
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 px-4 py-2 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/60 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Review Again</span>
            </button>

            <button
              type="button"
              onClick={handleMarkMastered}
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Got It</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
