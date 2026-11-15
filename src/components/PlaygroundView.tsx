import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Eraser,
  History,
  Play,
  RotateCcw,
  Share2,
  Sparkles,
  Terminal,
  Undo2,
  Wand2,
  X,
} from 'lucide-react';
import playgroundBannerImg from '../assets/images/banner_coding_playground_1793538389252.jpg';
import { executePythonCode, PLAYGROUND_EXAMPLES, type PythonExecutionResult } from '../services/pyodideRunner';
import { formatPythonCode } from '../utils/pythonFormatter';
import { buildSharePlaygroundUrl, copyTextToClipboard } from '../utils/shareCode';
import { PythonCodeEditor } from './PythonCodeEditor';

const CODE_HISTORY_STORAGE_KEY = 'python_master_playground_history_v1';
const MAX_HISTORY_VERSIONS = 5;

type HistoryReason =
  | 'Edit'
  | 'Ran Code'
  | 'Before Run'
  | 'Before Format'
  | 'Before Clear'
  | 'Before Reset'
  | 'Before Switch'
  | 'Before Revert';

interface CodeHistoryVersion {
  id: string;
  code: string;
  fileName: string;
  timestamp: string;
  reason: HistoryReason;
  lineCount: number;
}

export const PRACTICE_CHALLENGES = [
  {
    id: 'ch-palindrome',
    title: 'Challenge 1: Palindrome Checker',
    prompt: 'Check if `word = "racecar"` is a palindrome and print `True` or `False`.',
    starter: 'word = "racecar"\n# Print True if word reads same backward, else False\nprint(word == word[::-1])\n',
    stdin: '',
    expected: 'True',
  },
  {
    id: 'ch-factorial',
    title: 'Challenge 2: Compute 7 Factorial',
    prompt: 'Compute and print `7!` (factorial of 7 = 5040) using a loop or recursion.',
    starter: 'n = 7\nfact = 1\nfor i in range(1, n + 1):\n    fact *= i\nprint(fact)\n',
    stdin: '',
    expected: '5040',
  },
  {
    id: 'ch-second-max',
    title: 'Challenge 3: Second Highest Score',
    prompt: 'Given `marks = [72, 95, 88, 95, 91]`, print the unique second-highest mark (`91`).',
    starter: 'marks = [72, 95, 88, 95, 91]\nunique_sorted = sorted(set(marks), reverse=True)\nprint(unique_sorted[1])\n',
    stdin: '',
    expected: '91',
  },
];

const formatPyFileName = (rawTitle: string) => {
  const slug = rawTitle
    .toLowerCase()
    .replace(/^challenge\s*\d+:\s*/i, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${slug || 'main'}.py`;
};

interface PlaygroundViewProps {
  initialCode?: string;
  initialStdin?: string;
  initialFileName?: string;
  initialChallengeId?: string | null;
  challengeSelectionKey?: number;
  solvedChallenges: string[];
  onSolveChallenge: (id: string) => void;
  onAskTutorWithCode: (code: string, errorMsg?: string) => void;
}

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({
  initialCode,
  initialStdin,
  initialFileName,
  initialChallengeId,
  challengeSelectionKey,
  solvedChallenges,
  onSolveChallenge,
  onAskTutorWithCode,
}) => {
  const defaultExample = PLAYGROUND_EXAMPLES[0];
  const initialChallenge = initialChallengeId
    ? PRACTICE_CHALLENGES.find((c) => c.id === initialChallengeId)
    : undefined;

  const [code, setCode] = useState<string>(
    initialChallenge ? initialChallenge.starter : initialCode || defaultExample.code
  );
  const [baselineCode, setBaselineCode] = useState<string>(
    initialChallenge ? initialChallenge.starter : initialCode || defaultExample.code
  );
  const [fileName, setFileName] = useState<string>(
    initialChallenge
      ? formatPyFileName(initialChallenge.title)
      : initialFileName || 'main.py'
  );
  const [stdin, setStdin] = useState<string>(
    initialChallenge ? initialChallenge.stdin : (initialStdin ?? defaultExample.stdin)
  );
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<PythonExecutionResult | null>(null);
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(
    initialChallenge ? initialChallenge.id : null
  );
  const [challengePassed, setChallengePassed] = useState<boolean | null>(null);
  const [bannerImgOk, setBannerImgOk] = useState(true);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copiedKind, setCopiedKind] = useState<'link' | 'code' | null>(null);

  const [historyVersions, setHistoryVersions] = useState<CodeHistoryVersion[]>(() => {
    try {
      const saved = localStorage.getItem(CODE_HISTORY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CodeHistoryVersion[];
        return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY_VERSIONS) : [];
      }
    } catch {
      // Ignore storage errors
    }
    return [];
  });

  const initialResolvedCode = initialChallenge
    ? initialChallenge.starter
    : initialCode || defaultExample.code;
  const lastCommittedCodeRef = useRef<string>(initialResolvedCode);
  const lastCommittedReasonRef = useRef<HistoryReason>('Edit');

  useEffect(() => {
    try {
      localStorage.setItem(CODE_HISTORY_STORAGE_KEY, JSON.stringify(historyVersions));
    } catch {
      // Ignore storage errors
    }
  }, [historyVersions]);

  const formatTimeLabel = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const pushSnapshot = (snapshotCode: string, reason: HistoryReason, snapshotFileName = fileName) => {
    if (!snapshotCode.trim()) return;
    setHistoryVersions((prev) => {
      if (prev.length > 0 && prev[0].code === snapshotCode) {
        return prev;
      }
      const nextEntry: CodeHistoryVersion = {
        id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        code: snapshotCode,
        fileName: snapshotFileName,
        timestamp: formatTimeLabel(),
        reason,
        lineCount: snapshotCode.split('\n').length,
      };
      return [nextEntry, ...prev].slice(0, MAX_HISTORY_VERSIONS);
    });
  };

  // Debounced auto-snapshot after typing pauses so edits can always be undone
  useEffect(() => {
    if (code === lastCommittedCodeRef.current) return;
    const timer = window.setTimeout(() => {
      if (lastCommittedCodeRef.current !== code) {
        pushSnapshot(lastCommittedCodeRef.current, lastCommittedReasonRef.current);
        lastCommittedCodeRef.current = code;
        lastCommittedReasonRef.current = 'Edit';
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [code]);

  useEffect(() => {
    if (!statusNotice) return;
    const timer = window.setTimeout(() => setStatusNotice(null), 2400);
    return () => window.clearTimeout(timer);
  }, [statusNotice]);

  useEffect(() => {
    if (initialChallengeId) {
      const found = PRACTICE_CHALLENGES.find((c) => c.id === initialChallengeId);
      if (found) {
        if (code !== found.starter) {
          pushSnapshot(code, 'Before Switch');
        }
        setActiveChallengeId(found.id);
        setCode(found.starter);
        lastCommittedCodeRef.current = found.starter;
        lastCommittedReasonRef.current = 'Edit';
        setBaselineCode(found.starter);
        setFileName(formatPyFileName(found.title));
        setStdin(found.stdin);
        setChallengePassed(null);
        setResult(null);
      }
    }
  }, [initialChallengeId, challengeSelectionKey]);

  useEffect(() => {
    if (initialCode && !initialChallengeId) {
      if (code !== initialCode) {
        pushSnapshot(code, 'Before Switch');
      }
      setCode(initialCode);
      lastCommittedCodeRef.current = initialCode;
      lastCommittedReasonRef.current = 'Edit';
      setBaselineCode(initialCode);
      setFileName(initialFileName || 'main.py');
      setStdin(initialStdin || '');
      setActiveChallengeId(null);
      setChallengePassed(null);
    }
  }, [initialCode, initialStdin, initialFileName, initialChallengeId]);

  const toSlugPyName = formatPyFileName;

  const handleDownloadPy = () => {
    const rawName = fileName.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') || 'main.py';
    const normalizedName = rawName.toLowerCase().endsWith('.py') ? rawName : `${rawName}.py`;
    setFileName(normalizedName);

    const blob = new Blob([code], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = normalizedName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShareCode = async () => {
    if (!code.trim()) return;
    const generatedUrl = buildSharePlaygroundUrl({ code, stdin, fileName });
    setShareUrl(generatedUrl);
    setShowHistory(false);
    setShowSharePanel(true);

    const copied = await copyTextToClipboard(generatedUrl);
    if (copied) {
      setCopiedKind('link');
      setStatusNotice('Shareable link copied to clipboard');
      window.setTimeout(() => setCopiedKind((k) => (k === 'link' ? null : k)), 2400);
    } else {
      setCopiedKind(null);
      setStatusNotice('Shareable URL ready below');
    }
  };

  const handleCopyShareField = async (kind: 'link' | 'code') => {
    const text = kind === 'link' ? shareUrl : code;
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedKind(kind);
      setStatusNotice(kind === 'link' ? 'Shareable link copied!' : 'Python code copied!');
      window.setTimeout(() => setCopiedKind((k) => (k === kind ? null : k)), 2400);
    }
  };

  const handleFormatCode = () => {
    if (!code.trim()) return;
    const { formatted, changed } = formatPythonCode(code);
    if (changed) {
      pushSnapshot(code, 'Before Format');
      setCode(formatted);
      lastCommittedCodeRef.current = formatted;
      lastCommittedReasonRef.current = 'Edit';
      setStatusNotice('Formatted to 4-space PEP 8');
    } else {
      setStatusNotice('Code already formatted');
    }
  };

  const handleClearCode = () => {
    if (!code) return;
    pushSnapshot(code, 'Before Clear');
    setCode('');
    lastCommittedCodeRef.current = '';
    lastCommittedReasonRef.current = 'Edit';
    setStatusNotice('Editor cleared (saved to History)');
  };

  const handleResetCode = () => {
    if (code !== baselineCode) {
      pushSnapshot(code, 'Before Reset');
    }
    setCode(baselineCode);
    lastCommittedCodeRef.current = baselineCode;
    lastCommittedReasonRef.current = 'Edit';
    setResult(null);
    setStatusNotice('Reset to starter template');
  };

  const canUndo =
    code !== lastCommittedCodeRef.current ||
    historyVersions.some((v) => v.code !== code);

  const handleUndo = () => {
    // If there are uncommitted edits since last snapshot, revert to lastCommitted first
    if (code !== lastCommittedCodeRef.current && lastCommittedCodeRef.current !== '') {
      const targetCode = lastCommittedCodeRef.current;
      setCode(targetCode);
      setStatusNotice('Undid recent edits');
      return;
    }

    const idx = historyVersions.findIndex((v) => v.code !== code);
    if (idx === -1) return;
    const target = historyVersions[idx];
    setCode(target.code);
    lastCommittedCodeRef.current = target.code;
    lastCommittedReasonRef.current = 'Edit';
    setHistoryVersions((prev) => prev.filter((_, i) => i !== idx));
    setStatusNotice(`Reverted to ${target.reason} (${target.timestamp})`);
  };

  const handleRevertVersion = (version: CodeHistoryVersion) => {
    if (code !== version.code && code.trim()) {
      pushSnapshot(code, 'Before Revert');
    }
    setCode(version.code);
    lastCommittedCodeRef.current = version.code;
    lastCommittedReasonRef.current = 'Edit';
    setShowHistory(false);
    setStatusNotice(`Restored snapshot from ${version.timestamp}`);
  };

  const handleRun = async () => {
    if (code !== lastCommittedCodeRef.current) {
      pushSnapshot(lastCommittedCodeRef.current, 'Before Run');
      lastCommittedCodeRef.current = code;
    }
    lastCommittedReasonRef.current = 'Ran Code';

    setRunning(true);
    setChallengePassed(null);
    const execRes = await executePythonCode(code, stdin);
    setResult(execRes);
    if (activeChallengeId) {
      const ch = PRACTICE_CHALLENGES.find((c) => c.id === activeChallengeId);
      if (ch && !execRes.stderr && execRes.stdout.trim() === ch.expected) {
        setChallengePassed(true);
        onSolveChallenge(ch.id);
      } else if (ch) {
        setChallengePassed(false);
      }
    }
    setRunning(false);
  };

  const handleSelectExample = (exId: string) => {
    const found = PLAYGROUND_EXAMPLES.find((e) => e.id === exId);
    if (!found) return;
    if (code !== found.code) {
      pushSnapshot(code, 'Before Switch');
    }
    setCode(found.code);
    lastCommittedCodeRef.current = found.code;
    lastCommittedReasonRef.current = 'Edit';
    setBaselineCode(found.code);
    setFileName(toSlugPyName(found.title));
    setStdin(found.stdin);
    setActiveChallengeId(null);
    setChallengePassed(null);
    setResult(null);
  };

  const handleSelectChallenge = (chId: string) => {
    const found = PRACTICE_CHALLENGES.find((c) => c.id === chId);
    if (!found) return;
    if (code !== found.starter) {
      pushSnapshot(code, 'Before Switch');
    }
    setActiveChallengeId(found.id);
    setCode(found.starter);
    lastCommittedCodeRef.current = found.starter;
    lastCommittedReasonRef.current = 'Edit';
    setBaselineCode(found.starter);
    setFileName(toSlugPyName(found.title));
    setStdin(found.stdin);
    setChallengePassed(null);
    setResult(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter -> Run Code
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!running) {
        handleRun();
      }
      return;
    }

    // Ctrl+S or Cmd+S -> Download .py file
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      handleDownloadPy();
      return;
    }

    // Shift+Alt+F -> Format Python code
    if (e.shiftKey && e.altKey && (e.key === 'f' || e.key === 'F')) {
      e.preventDefault();
      handleFormatCode();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const updated = code.substring(0, start) + '    ' + code.substring(end);
      setCode(updated);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      });
    }
  };

  // Also support global Ctrl+Enter / Ctrl+S / Shift+Alt+F while in the playground view
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // If student hits Ctrl+Enter anywhere while in the playground view
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        // Don't trigger if user is typing in a non-playground input elsewhere
        if (activeTag === 'textarea' || activeTag === 'body' || activeTag === 'input') {
          e.preventDefault();
          if (!running) {
            handleRun();
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        // Prevent default browser Save Page dialog and download current Python code
        e.preventDefault();
        handleDownloadPy();
      } else if (e.shiftKey && e.altKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        handleFormatCode();
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [code, fileName, stdin, running, activeChallengeId]);

  const activeChallenge = PRACTICE_CHALLENGES.find((c) => c.id === activeChallengeId);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white">
        {bannerImgOk ? (
          <img
            src={playgroundBannerImg}
            alt="Algorithmic Python data structure execution architecture"
            referrerPolicy="no-referrer"
            onError={() => setBannerImgOk(false)}
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
        ) : null}
        <div className="relative bg-gradient-to-r from-slate-950/95 via-slate-900/85 to-slate-900/70 p-6 sm:p-8">
          <p className="text-xs font-medium text-sky-300">
            Browser-Safe Python 3.12 WebAssembly Sandbox · Zero Server Execution Risk
          </p>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Interactive Python Coding Playground
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Write, test, and debug standard Python 3 programs including OOP, SQLite3, file I/O, and NumPy directly in your browser.
          </p>
        </div>
      </div>

      {/* Templates & Practice Challenges Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Example Programs
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {PLAYGROUND_EXAMPLES.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => handleSelectExample(ex.id)}
                className="min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                {ex.title}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Practice Challenges · Auto-Graded
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {PRACTICE_CHALLENGES.map((ch) => {
              const isDone = solvedChallenges.includes(ch.id);
              const isSelected = activeChallengeId === ch.id;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleSelectChallenge(ch.id)}
                  className={`min-h-[40px] inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-sky-600 text-white'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {isDone && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />}
                  <span>{ch.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeChallenge && (
        <div className="rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/70 dark:bg-sky-950/30 p-4 text-sm text-slate-800 dark:text-slate-200">
          <span className="font-semibold text-sky-700 dark:text-sky-300">{activeChallenge.title}: </span>
          <span>{activeChallenge.prompt}</span>
          <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
            Expected Output: <code className="font-mono">{activeChallenge.expected}</code>
          </span>
        </div>
      )}

      {/* Two-Zone Sandbox Layout: Code Editor (Left) & Output + Stdin (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Zone: Code Editor */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Terminal className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                aria-label="Python script filename"
                title="Edit filename before downloading .py file"
                className="w-36 sm:w-44 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1 font-mono text-xs font-medium text-slate-800 dark:text-slate-200 focus:border-sky-500 focus:outline-none"
              />
              <span aria-hidden="true">·</span>
              <span className="whitespace-nowrap">Python 3.12</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!canUndo}
                onClick={handleUndo}
                title="Undo to previous saved code version"
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-45 transition-colors whitespace-nowrap shrink-0"
              >
                <Undo2 className="h-3.5 w-3.5" />
                <span>Undo</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSharePanel(false);
                  setShowHistory((prev) => !prev);
                }}
                aria-expanded={showHistory}
                title="View last 5 saved versions of your code"
                className={`min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  showHistory
                    ? 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-950/50 dark:text-sky-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <History className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                <span>History ({historyVersions.length}/5)</span>
              </button>
              <button
                type="button"
                disabled={!code.trim()}
                onClick={handleFormatCode}
                title="Fix indentation and PEP 8 spacing (Shift+Alt+F)"
                aria-keyshortcuts="Alt+Shift+f"
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Wand2 className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                <span>Format Code</span>
              </button>
              <button
                type="button"
                disabled={!code.trim()}
                onClick={handleShareCode}
                aria-expanded={showSharePanel}
                title="Generate shareable URL and copy to clipboard for collaboration"
                className={`min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 ${
                  showSharePanel
                    ? 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-950/50 dark:text-sky-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Share2 className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                <span>Share Code</span>
              </button>
              <button
                type="button"
                disabled={!code.trim()}
                onClick={handleDownloadPy}
                title="Download current code as .py file (Ctrl+S / ⌘S)"
                aria-keyshortcuts="Control+s"
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download .py</span>
                <span className="hidden sm:inline font-mono text-[10px] text-slate-400 dark:text-slate-500">
                  Ctrl+S
                </span>
              </button>
              <button
                type="button"
                onClick={handleClearCode}
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                <Eraser className="h-3.5 w-3.5" />
                <span>Clear</span>
              </button>
              <button
                type="button"
                onClick={handleResetCode}
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
              <button
                type="button"
                disabled={running}
                onClick={handleRun}
                title="Execute code in Python 3.12 sandbox (Ctrl+Enter / ⌘+Enter)"
                aria-keyshortcuts="Control+Enter"
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{running ? 'Running Python...' : 'Run Code'}</span>
                <span className="hidden sm:inline font-mono text-[10px] text-sky-200 opacity-90">
                  Ctrl+↵
                </span>
              </button>
            </div>
          </div>

          {/* Collapsible Share Collaboration Panel */}
          {showSharePanel && (
            <div className="border-b border-slate-200 dark:border-slate-800 bg-sky-50/70 dark:bg-sky-950/30 px-4 py-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                  <Share2 className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span>Collaborate · Shareable Playground Link</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSharePanel(false)}
                  aria-label="Close share panel"
                  className="p-1 rounded-md text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                Anyone with this link opens your exact code, filename (<code className="font-mono">{fileName}</code>), and stdin directly in the Coding Playground.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label="Shareable Python playground URL"
                  className="flex-1 min-w-0 min-h-[38px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 font-mono text-xs text-slate-700 dark:text-slate-200 focus:border-sky-500 focus:outline-none"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyShareField('link')}
                    className="min-h-[38px] inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 transition-colors whitespace-nowrap"
                  >
                    {copiedKind === 'link' ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Copied Link</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyShareField('code')}
                    className="min-h-[38px] inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                  >
                    {copiedKind === 'code' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Copied Code</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Collapsible Code History Panel (Last 5 Versions) */}
          {showHistory && (
            <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/95 px-4 py-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  Code History · Last {MAX_HISTORY_VERSIONS} Saved Versions
                </div>
                <div className="flex items-center gap-2">
                  {historyVersions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setHistoryVersions([])}
                      className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    >
                      Clear History
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowHistory(false)}
                    aria-label="Close code history"
                    className="p-1 rounded-md text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {historyVersions.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                  No previous versions recorded yet. Edit your code, run, format, or clear to automatically save snapshots here.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {historyVersions.map((ver, idx) => {
                    const previewLine =
                      ver.code
                        .split('\n')
                        .find((line) => line.trim().length > 0)
                        ?.trim() || '(Empty)';
                    return (
                      <div
                        key={ver.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <Clock className="h-3 w-3 text-sky-600 dark:text-sky-400 shrink-0" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              v{historyVersions.length - idx} · {ver.reason}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{ver.timestamp}</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{ver.lineCount} lines</span>
                          </div>
                          <pre className="truncate font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            {previewLine}
                          </pre>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRevertVersion(ver)}
                          className="min-h-[36px] inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 dark:bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Revert</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <PythonCodeEditor
            value={code}
            onChange={setCode}
            onKeyDown={handleKeyDown}
            placeholder="# Write your Python 3 program here..."
            ariaLabel="Python code editor. Press Ctrl+Enter to run, Ctrl+S to download .py, Shift+Alt+F to format, Tab for indent."
          />

          {/* Quiet Keyboard Shortcuts & Status Footer Strip */}
          <div className="border-t border-slate-800 bg-slate-950/90 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <div className="flex flex-wrap items-center gap-3">
              <span>
                <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-200">
                  Ctrl+Enter
                </kbd>{' '}
                Run
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>
                <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-200">
                  Ctrl+S
                </kbd>{' '}
                Download .py
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>
                <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-200">
                  Shift+Alt+F
                </kbd>{' '}
                Format
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>
                <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-200">
                  Tab
                </kbd>{' '}
                Indent (4 spaces)
              </span>
            </div>
            {statusNotice ? (
              <span
                role="status"
                className="font-mono text-[11px] font-medium text-emerald-400"
              >
                {statusNotice}
              </span>
            ) : (
              <span className="font-mono text-slate-500 text-[10px] hidden sm:inline">
                UTF-8 · Python 3.12
              </span>
            )}
          </div>
        </div>

        {/* Right Zone: Stdin + Output Console + Friendly Error Tutor */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Stdin Input Box */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Standard Input (stdin for input())
              </span>
              <span>One value per line</span>
            </div>
            <textarea
              rows={3}
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter values read by input(), one per line..."
              className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 font-mono text-xs text-slate-800 dark:text-slate-200 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Output Console */}
          <div className="flex-1 flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Execution Output</span>
              {result && (
                <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                  {result.engine} · {result.executionTimeMs} ms
                </span>
              )}
            </div>

            <div className="mt-3 flex-1 min-h-[180px] rounded-xl bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100 overflow-x-auto">
              {!result && !running && (
                <p className="text-slate-500">
                  Click &quot;Run Code&quot; to execute your Python script in the browser.
                </p>
              )}
              {running && (
                <p className="text-sky-400">
                  Initializing Python 3.12 runtime and executing script...
                </p>
              )}
              {result && (
                <>
                  {result.stdout ? (
                    <pre className="whitespace-pre-wrap text-emerald-300">{result.stdout}</pre>
                  ) : !result.stderr ? (
                    <p className="text-slate-400">(Program finished with no printed output)</p>
                  ) : null}
                  {result.stderr && (
                    <pre className="mt-2 whitespace-pre-wrap text-rose-400">{result.stderr}</pre>
                  )}
                </>
              )}
            </div>

            {challengePassed === true && (
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Challenge Passed! Progress saved to your Student Profile.</span>
              </div>
            )}
            {challengePassed === false && (
              <div className="mt-3 text-xs font-medium text-amber-600 dark:text-amber-400">
                Output did not match expected value yet—check logic or ask AI Tutor for a hint!
              </div>
            )}

            {/* Friendly Error Explanation */}
            {result?.friendlyError && (
              <div className="mt-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 p-3.5 text-xs text-rose-900 dark:text-rose-200 space-y-2">
                <div className="font-semibold">Error Explanation for Beginners</div>
                <p>{result.friendlyError}</p>
                <button
                  type="button"
                  onClick={() => onAskTutorWithCode(code, result.stderr)}
                  className="min-h-[38px] inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Explain & Fix with AI Python Tutor</span>
                </button>
              </div>
            )}

            {!result?.friendlyError && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => onAskTutorWithCode(code)}
                  className="min-h-[38px] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Ask AI Tutor to Explain Line by Line</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
