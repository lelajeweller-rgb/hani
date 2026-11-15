import React, { useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Code2,
  Download,
  FileDown,
  MessageSquarePlus,
  Send,
  Sparkles,
  ThumbsUp,
} from 'lucide-react';
import { COURSE_CURRICULUM, TOTAL_LESSONS_COUNT } from '../data/curriculum';
import { SUPPORTED_LANGUAGES } from '../data/translations';
import certificateCrestImg from '../assets/images/certificate_crest_emblem_1793538388923.jpg';
import { generateStudySummaryPdf } from '../utils/studySummaryPdf';
import type { ForumPost, LanguageCode, StudentProfile } from '../types';

interface TutorMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

interface AITutorViewProps {
  language: LanguageCode;
  initialPrompt?: string;
  initialCodeContext?: string;
  onOpenInPlayground: (code: string) => void;
}

const TUTOR_MODES = [
  { id: 'explain', label: 'Explain Concept Simply' },
  { id: 'hint', label: 'Give Hint Only' },
  { id: 'debug', label: 'Fix Error & Explain' },
  { id: 'line_by_line', label: 'Explain Line by Line' },
  { id: 'practice', label: 'Generate Practice' },
  { id: 'exam_prep', label: 'University Exam Answer' },
];

function renderFormattedMessage(text: string, onOpenCode: (code: string) => void) {
  const parts = text.split(/```(?:python)?\n?([\s\S]*?)```/g);
  return parts.map((segment, idx) => {
    if (idx % 2 === 1) {
      const cleanCode = segment.trim();
      return (
        <div key={idx} className="my-3 rounded-xl bg-slate-950 overflow-hidden border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 px-3.5 py-2 text-xs text-slate-400">
            <span className="font-mono">Python 3</span>
            <button
              type="button"
              onClick={() => onOpenCode(cleanCode)}
              className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 font-medium"
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Test in Playground</span>
            </button>
          </div>
          <pre className="overflow-x-auto p-3.5 font-mono text-xs sm:text-sm text-slate-100">
            <code>{cleanCode}</code>
          </pre>
        </div>
      );
    }
    return (
      <div key={idx} className="whitespace-pre-wrap leading-relaxed">
        {segment}
      </div>
    );
  });
}

export const AITutorView: React.FC<AITutorViewProps> = ({
  language,
  initialPrompt,
  initialCodeContext,
  onOpenInPlayground,
}) => {
  const defaultLangName =
    SUPPORTED_LANGUAGES.find((l) => l.code === language)?.label || 'English';
  const [tutorLanguage, setTutorLanguage] = useState<string>(defaultLangName);
  const [mode, setMode] = useState<string>(initialCodeContext ? 'debug' : 'explain');
  const [input, setInput] = useState<string>(initialPrompt || '');
  const [codeContext, setCodeContext] = useState<string>(initialCodeContext || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [messages, setMessages] = useState<TutorMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Namaste! I am Professor PyMaster, your B.Tech Python Tutor. Ask me any Python concept, paste an error message, request hints without spoilers, or ask for a 10-mark university exam answer in English, Telugu, Hindi, Tamil, Kannada, Malayalam, or Marathi!',
    },
  ]);

  useEffect(() => {
    const found = SUPPORTED_LANGUAGES.find((l) => l.code === language);
    if (found) setTutorLanguage(found.label);
  }, [language]);

  useEffect(() => {
    if (initialPrompt) setInput(initialPrompt);
    if (initialCodeContext) {
      setCodeContext(initialCodeContext);
      setMode('debug');
    }
  }, [initialPrompt, initialCodeContext]);

  const sendQuestion = async (overridePrompt?: string) => {
    const q = (overridePrompt ?? input).trim();
    if (!q || loading) return;

    const userMsg: TutorMessage = { id: `u-${Date.now()}`, role: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setErrorMsg(null);

    try {
      const resp = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: q,
          language: tutorLanguage,
          mode,
          codeContext,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      const data = (await resp.json()) as { reply?: string; error?: string };
      if (!resp.ok || data.error) {
        throw new Error(data.error || 'Unable to reach AI Python Tutor.');
      }
      setMessages((prev) => [
        ...prev,
        { id: `m-${Date.now()}`, role: 'model', text: data.reply || '' },
      ]);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to connect to AI Tutor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Multilingual AI Python Mentor · Concept Clarity · Debugging · Exam Readiness
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            AI Python Tutor
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Tutor Language:
          </label>
          <select
            value={tutorLanguage}
            onChange={(e) => setTutorLanguage(e.target.value)}
            className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.label}>
                {l.label} ({l.nativeLabel})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {TUTOR_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`min-h-[40px] rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              mode === m.id
                ? 'bg-sky-600 text-white'
                : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Quick Starter Prompts */}
      <div className="flex flex-wrap gap-2">
        {[
          'Explain Python list slicing with examples in Telugu / English',
          'Difference between list and tuple for a 5-mark B.Tech exam',
          'Give me a hint to check Armstrong number without revealing code',
          'Explain Recursion base case in simple Hindi',
        ].map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => sendQuestion(q)}
            className="min-h-[36px] rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:border-sky-500 transition-colors text-left"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Attached Code Context */}
      {codeContext && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Attached Playground Code Context
            </span>
            <button
              type="button"
              onClick={() => setCodeContext('')}
              className="text-rose-600 dark:text-rose-400 hover:underline"
            >
              Remove Code Context
            </button>
          </div>
          <pre className="max-h-32 overflow-y-auto rounded-xl bg-slate-950 p-3 font-mono text-xs text-slate-200">
            {codeContext}
          </pre>
        </div>
      )}

      {/* Conversation Container */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 space-y-4">
        <div className="max-h-[460px] overflow-y-auto space-y-4 pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] sm:max-w-[82%] rounded-2xl px-4 py-3.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800'
                }`}
              >
                {msg.role === 'model'
                  ? renderFormattedMessage(msg.text, onOpenInPlayground)
                  : msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-sky-600 dark:text-sky-400 font-medium">
              <Sparkles className="h-4 w-4" />
              <span>Professor PyMaster is preparing your {tutorLanguage} explanation...</span>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-xs text-rose-800 dark:text-rose-200">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Input Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendQuestion();
          }}
          className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-100 dark:border-slate-800"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask any Python doubt or paste error in ${tutorLanguage}...`}
            className="flex-1 min-h-[46px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-sky-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Send className="h-4 w-4" />
            <span>Ask Tutor</span>
          </button>
        </form>
      </div>
    </div>
  );
};

interface CommunityForumProps {
  student: StudentProfile;
  onOpenInPlayground: (code: string) => void;
}

const LOCAL_FORUM_CACHE_KEY = 'pymaster_forum_cache_v1';

export const CommunityForumView: React.FC<CommunityForumProps> = ({
  student,
  onOpenInPlayground,
}) => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [showComposer, setShowComposer] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newModTag, setNewModTag] = useState('Module 1: Introduction to Python');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const res = await fetch('/api/forum/posts');
        if (res.ok) {
          const data = (await res.json()) as { posts: ForumPost[] };
          setPosts(data.posts);
          localStorage.setItem(LOCAL_FORUM_CACHE_KEY, JSON.stringify(data.posts));
          return;
        }
      } catch {
        // Offline fallback
      }
      const cached = localStorage.getItem(LOCAL_FORUM_CACHE_KEY);
      if (cached) {
        try {
          setPosts(JSON.parse(cached) as ForumPost[]);
        } catch {
          setPosts([]);
        }
      }
    };
    loadPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    const payload = {
      title: newTitle,
      content: newContent,
      codeSnippet: newCode,
      moduleTag: newModTag,
      languageTag: SUPPORTED_LANGUAGES.find((l) => l.code === student.preferredLanguage)?.label || 'English',
      authorName: student.name,
      university: `${student.university.split(' ')[0]} · ${student.semester}`,
    };

    try {
      const res = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const { post } = (await res.json()) as { post: ForumPost };
        const updated = [post, ...posts];
        setPosts(updated);
        localStorage.setItem(LOCAL_FORUM_CACHE_KEY, JSON.stringify(updated));
      }
    } catch {
      const offlinePost: ForumPost = {
        id: `local-${Date.now()}`,
        ...payload,
        upvotes: 1,
        createdAt: 'Just now (Offline)',
        replies: [],
      };
      const updated = [offlinePost, ...posts];
      setPosts(updated);
      localStorage.setItem(LOCAL_FORUM_CACHE_KEY, JSON.stringify(updated));
    }

    setNewTitle('');
    setNewContent('');
    setNewCode('');
    setShowComposer(false);
  };

  const handleUpvote = async (postId: string) => {
    try {
      const res = await fetch(`/api/forum/posts/${postId}/upvote`, { method: 'POST' });
      if (res.ok) {
        const { post } = (await res.json()) as { post: ForumPost };
        setPosts((prev) => prev.map((p) => (p.id === postId ? post : p)));
        return;
      }
    } catch {
      // Offline optimistic update
    }
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, upvotes: p.upvotes + 1 } : p))
    );
  };

  const handleAddReply = async (postId: string) => {
    const text = (replyDrafts[postId] || '').trim();
    if (!text) return;
    const payload = {
      authorName: student.name,
      university: `${student.university.split(' ')[0]} · ${student.semester}`,
      content: text,
    };

    try {
      const res = await fetch(`/api/forum/posts/${postId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const { post } = (await res.json()) as { post: ForumPost };
        setPosts((prev) => prev.map((p) => (p.id === postId ? post : p)));
        setReplyDrafts((prev) => ({ ...prev, [postId]: '' }));
        return;
      }
    } catch {
      // Offline fallback reply
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              replies: [
                ...p.replies,
                { id: `r-${Date.now()}`, ...payload, createdAt: 'Just now' },
              ],
            }
          : p
      )
    );
    setReplyDrafts((prev) => ({ ...prev, [postId]: '' }));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Peer Doubt Solving · Lab Viva Tips · Code Sharing Across Indian Campuses
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            B.Tech Student Community Forum
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setShowComposer((s) => !s)}
          className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-sky-700 transition-colors"
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span>{showComposer ? 'Close Form' : 'Ask a Python Doubt'}</span>
        </button>
      </div>

      {showComposer && (
        <form
          onSubmit={handleCreatePost}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4"
        >
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Post a New Question to the Community
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Question title (e.g. Doubt in nested loop star pattern)"
              className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm"
            />
            <select
              value={newModTag}
              onChange={(e) => setNewModTag(e.target.value)}
              className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm"
            >
              {COURSE_CURRICULUM.map((m) => (
                <option key={m.id} value={`Module ${m.id}: ${m.title}`}>
                  Module {m.id}: {m.title}
                </option>
              ))}
            </select>
          </div>
          <textarea
            rows={3}
            required
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Describe what you tried and what output/error you got..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3.5 text-sm"
          />
          <textarea
            rows={3}
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="Optional: Paste your Python code snippet..."
            className="w-full rounded-xl bg-slate-950 p-3.5 font-mono text-xs text-slate-100"
          />
          <button
            type="submit"
            className="min-h-[44px] rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-sky-700"
          >
            Publish Discussion Post
          </button>
        </form>
      )}

      {/* Discussions List */}
      <div className="space-y-5">
        {posts.map((post) => (
          <article
            key={post.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{post.authorName}</span>
                <span aria-hidden="true">·</span>
                <span>{post.university}</span>
                <span aria-hidden="true">·</span>
                <span>{post.moduleTag}</span>
                <span aria-hidden="true">·</span>
                <span>{post.languageTag}</span>
              </div>
              <span>{post.createdAt}</span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{post.title}</h2>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{post.content}</p>

            {post.codeSnippet && (
              <div className="rounded-xl bg-slate-950 overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 px-3.5 py-2 text-xs text-slate-400">
                  <span className="font-mono">Python Snippet</span>
                  <button
                    type="button"
                    onClick={() => onOpenInPlayground(post.codeSnippet!)}
                    className="text-sky-400 hover:text-sky-300 font-medium"
                  >
                    Run in Playground
                  </button>
                </div>
                <pre className="overflow-x-auto p-3.5 font-mono text-xs text-slate-100">
                  <code>{post.codeSnippet}</code>
                </pre>
              </div>
            )}

            <div className="flex items-center gap-4 pt-1">
              <button
                type="button"
                onClick={() => handleUpvote(post.id)}
                className="min-h-[38px] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 tabular-nums"
              >
                <ThumbsUp className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                <span>Helpful ({post.upvotes})</span>
              </button>
              <span className="text-xs text-slate-500 tabular-nums">
                {post.replies.length} Peer {post.replies.length === 1 ? 'Reply' : 'Replies'}
              </span>
            </div>

            {/* Replies */}
            {post.replies.length > 0 && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                {post.replies.map((rep) => (
                  <div key={rep.id} className="rounded-xl bg-slate-50 dark:bg-slate-950/70 p-3.5 text-xs sm:text-sm space-y-1">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      <strong className="text-slate-800 dark:text-slate-200">{rep.authorName}</strong> · {rep.university} · {rep.createdAt}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{rep.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Reply Input */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={replyDrafts[post.id] || ''}
                onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                placeholder="Write a helpful reply or explanation..."
                className="flex-1 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs sm:text-sm"
              />
              <button
                type="button"
                onClick={() => handleAddReply(post.id)}
                className="min-h-[40px] rounded-xl bg-slate-900 dark:bg-sky-600 px-4 py-2 text-xs font-semibold text-white"
              >
                Reply
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

interface CertificatesAndProgressProps {
  mode: 'certificates' | 'progress';
  student: StudentProfile;
  onEditProfile: () => void;
}

export const CertificatesAndProgressView: React.FC<CertificatesAndProgressProps> = ({
  mode,
  student,
  onEditProfile,
}) => {
  const [crestOk, setCrestOk] = useState(true);
  const [pdfNotice, setPdfNotice] = useState<string | null>(null);

  const coursePct = Math.round((student.completedLessons.length / TOTAL_LESSONS_COUNT) * 100);
  const totalProblems =
    student.solvedChallenges.length +
    student.submittedAssignments.length +
    student.completedProjects.length;
  const quizVals = Object.values(student.quizScores);
  const avgQuiz = quizVals.length
    ? Math.round(quizVals.reduce((a, b) => a + b, 0) / quizVals.length)
    : 0;

  const certificates = [
    {
      id: 'cert-foundation',
      title: 'Python 3 Foundations Scholar',
      requirement: 'Complete at least 3 lessons across Modules 1–4',
      unlocked: student.completedLessons.length >= 3,
      code: 'PM-FND-2026',
    },
    {
      id: 'cert-dsa-oop',
      title: 'Python Data Structures & OOP Practitioner',
      requirement: 'Complete 10+ lessons and solve at least 1 coding challenge or assignment',
      unlocked: student.completedLessons.length >= 10 && totalProblems >= 1,
      code: 'PM-OOP-2026',
    },
    {
      id: 'cert-master',
      title: 'PYTHON MASTER – B.Tech Honours Certificate',
      requirement: 'Complete 25+ lessons & 2 practical mini-projects',
      unlocked: student.completedLessons.length >= 25 && student.completedProjects.length >= 2,
      code: 'PM-BTECH-HONOURS',
    },
  ];

  const earnedCount = certificates.filter((c) => c.unlocked).length;

  const downloadCertificateSvg = (certTitle: string, certCode: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700">
      <rect width="1000" height="700" fill="#f8fafc"/>
      <rect x="32" y="32" width="936" height="636" rx="16" fill="#ffffff" stroke="#0284c7" stroke-width="4"/>
      <rect x="48" y="48" width="904" height="604" rx="10" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
      <text x="500" y="130" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="700" fill="#0284c7" letter-spacing="3">PYTHON MASTER – B.TECH LEARNING ACADEMY</text>
      <text x="500" y="195" text-anchor="middle" font-family="serif" font-size="42" font-weight="700" fill="#0f172a">Certificate of Achievement</text>
      <text x="500" y="255" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#64748b">This certifies that</text>
      <text x="500" y="320" text-anchor="middle" font-family="serif" font-size="38" font-weight="700" fill="#0f172a">${student.name}</text>
      <text x="500" y="365" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#475569">${student.university} · ${student.semester}</text>
      <text x="500" y="435" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="700" fill="#0284c7">${certTitle}</text>
      <text x="500" y="480" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#475569">Demonstrating verified proficiency in Python 3.12 Programming &amp; Engineering Problem Solving</text>
      <text x="220" y="590" text-anchor="middle" font-family="monospace" font-size="14" fill="#334155">Credential ID: ${certCode}</text>
      <text x="780" y="590" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#334155">Issued: ${new Date().toISOString().slice(0, 10)}</text>
    </svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${certCode}_${student.name.replace(/\s+/g, '_')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (mode === 'certificates') {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Academic Milestones · Verifiable SVG Credentials · Portfolio Ready
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Student Certificates ({earnedCount} / {certificates.length} Earned)
          </h1>
        </div>

        {/* Visual Certificate Preview Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="h-32 w-32 shrink-0 overflow-hidden rounded-full border border-amber-300/60 bg-amber-50 dark:bg-slate-800 flex items-center justify-center">
              {crestOk ? (
                <img
                  src={certificateCrestImg}
                  alt="PYTHON MASTER Academy Official Seal"
                  referrerPolicy="no-referrer"
                  onError={() => setCrestOk(false)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Award className="h-12 w-12 text-amber-500" />
              )}
            </div>
            <div className="space-y-2 text-center md:text-left">
              <div className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                PYTHON MASTER – B.Tech Learning Academy
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Candidate: {student.name}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {student.university} · {student.semester} · {student.completedLessons.length} Lessons Completed
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500">{cert.code}</span>
                  <span
                    className={
                      cert.unlocked
                        ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400'
                    }
                  >
                    {cert.unlocked ? 'Unlocked' : 'In Progress'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {cert.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Requirement: {cert.requirement}
                </p>
              </div>

              <button
                type="button"
                disabled={!cert.unlocked}
                onClick={() => downloadCertificateSvg(cert.title, cert.code)}
                className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>{cert.unlocked ? 'Download Certificate' : 'Complete Lessons to Unlock'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handleDownloadStudySummaryPdf = () => {
    const result = generateStudySummaryPdf(student);
    setPdfNotice(
      `Downloaded ${result.fileName} (${result.completedLessonsCount} lessons · ${result.quizCategoriesCount} quiz scores · ${result.solvedItemsCount} solved items).`
    );
  };

  // Student Learning Progress Dashboard
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Student Learning Record · Auto-Saved Locally & Cloud Synced
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {student.name}&apos;s Learning Progress
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {student.university} · {student.semester}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadStudySummaryPdf}
            className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition-colors whitespace-nowrap"
          >
            <FileDown className="h-4 w-4" />
            <span>Generate Study Summary PDF</span>
          </button>

          <button
            type="button"
            onClick={onEditProfile}
            className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            Edit Student Profile &amp; Sync
          </button>
        </div>
      </div>

      {pdfNotice && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 px-4 py-3 flex items-center justify-between gap-3 text-xs sm:text-sm text-emerald-900 dark:text-emerald-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{pdfNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setPdfNotice(null)}
            className="text-xs font-semibold underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 6 Required Student Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Course Completion', value: `${coursePct}%`, sub: `${student.completedLessons.length} of ${TOTAL_LESSONS_COUNT} lessons` },
          { label: 'Total Lessons Completed', value: `${student.completedLessons.length}`, sub: 'Across 15 Python modules' },
          { label: 'Coding Problems Solved', value: `${totalProblems}`, sub: 'Playground, Lab & Projects' },
          { label: 'Average Quiz Score', value: `${avgQuiz}%`, sub: `${quizVals.length} categories attempted` },
          { label: 'Learning Streak', value: `${student.streakDays} Days`, sub: `Last active ${student.lastActiveDate}` },
          { label: 'Certificates Earned', value: `${earnedCount} / ${certificates.length}`, sub: 'Academic credentials' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-1"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {stat.value}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Module-by-Module Progress Breakdown */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Module-Wise Mastery Breakdown
        </h2>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {COURSE_CURRICULUM.map((m) => {
            const done = m.lessons.filter((l) => student.completedLessons.includes(l.id)).length;
            const pct = Math.round((done / m.lessons.length) * 100);
            return (
              <div key={m.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    Module {String(m.id).padStart(2, '0')}: {m.title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {done} / {m.lessons.length} lessons completed
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24 sm:w-36 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-sky-600 origin-left transition-transform duration-200"
                      style={{ transform: `scaleX(${pct / 100})` }}
                    />
                  </div>
                  <span className="w-10 text-right font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                    {pct}%
                  </span>
                  {pct === 100 && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
