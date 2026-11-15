import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'academy_store.json');

interface ForumReply {
  id: string;
  authorName: string;
  university: string;
  content: string;
  createdAt: string;
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  codeSnippet?: string;
  moduleTag: string;
  languageTag: string;
  authorName: string;
  university: string;
  upvotes: number;
  createdAt: string;
  replies: ForumReply[];
}

interface StudentRecord {
  email: string;
  name: string;
  university: string;
  semester: string;
  preferredLanguage: string;
  completedLessons: string[];
  solvedChallenges: string[];
  submittedAssignments: string[];
  completedProjects: string[];
  quizScores: Record<string, number>;
  streakDays: number;
  lastActiveDate: string;
  updatedAt: string;
}

interface StoreSchema {
  students: Record<string, StudentRecord>;
  posts: ForumPost[];
}

const INITIAL_POSTS: ForumPost[] = [
  {
    id: 'post-101',
    title: 'Difference between list.append() and list.extend() in Viva?',
    content: 'In our lab internal viva today, the external examiner asked what happens in memory when we append a list vs extend a list. Can someone share a simple example?',
    codeSnippet: 'nums = [1, 2]\nnums.append([3, 4])  # [1, 2, [3, 4]]\n\nvals = [1, 2]\nvals.extend([3, 4])  # [1, 2, 3, 4]',
    moduleTag: 'Module 5: Data Structures',
    languageTag: 'English',
    authorName: 'Karthik Reddy',
    university: 'JNTU Hyderabad · Sem 1',
    upvotes: 18,
    createdAt: '2 hours ago',
    replies: [
      {
        id: 'rep-1',
        authorName: 'Ananya Sharma',
        university: 'VTU Belagavi · Sem 1',
        content: 'append(x) adds x as a single element at the end (O(1) amortized), so appending a list creates a nested list. extend(iterable) iterates over each element and appends them individually (O(k) where k is iterable length).',
        createdAt: '1 hour ago',
      },
    ],
  },
  {
    id: 'post-102',
    title: 'Why does range(1, 10) stop at 9 instead of 10?',
    content: 'I keep making off-by-one mistakes in pattern printing programs for B.Tech Unit 2 assignments. Is there an easy trick to remember Python slicing and range bounds?',
    codeSnippet: 'for i in range(1, 6):\n    print("*" * i)',
    moduleTag: 'Module 4: Loops',
    languageTag: 'Hindi / English',
    authorName: 'Rohan Deshmukh',
    university: 'SPPU Pune · Sem 1',
    upvotes: 14,
    createdAt: '5 hours ago',
    replies: [
      {
        id: 'rep-2',
        authorName: 'Sneha Nair',
        university: 'KTU Kerala · Sem 1',
        content: 'Think of range(start, stop) as half-open interval [start, stop). The length is always stop - start! So range(1, 6) gives 6 - 1 = 5 iterations (1, 2, 3, 4, 5).',
        createdAt: '3 hours ago',
      },
    ],
  },
  {
    id: 'post-103',
    title: 'Recursion base case doubt in factorial program (Telugu/English)',
    content: 'Recursion lo base case rayakapothe RecursionError enduku vastundi? How many stack frames does Python allow by default?',
    codeSnippet: 'import sys\nprint(sys.getrecursionlimit()) # Usually 1000',
    moduleTag: 'Module 6: Functions',
    languageTag: 'Telugu',
    authorName: 'Sai Teja',
    university: 'Andhra University · Sem 2',
    upvotes: 11,
    createdAt: '1 day ago',
    replies: [
      {
        id: 'rep-3',
        authorName: 'Divya Krishnan',
        university: 'Anna University · Sem 1',
        content: 'Without a base case (if n <= 1: return 1), every function call pushes a new frame onto the call stack until it hits Python default limit (1000 frames), raising RecursionError: maximum recursion depth exceeded.',
        createdAt: '20 hours ago',
      },
    ],
  },
];

function loadStore(): StoreSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial: StoreSchema = { students: {}, posts: INITIAL_POSTS };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as StoreSchema;
  } catch {
    return { students: {}, posts: INITIAL_POSTS };
  }
}

function saveStore(store: StoreSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist store:', err);
  }
}

function getGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json({ limit: '1mb' }));

  // Health endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // Student Profile & Progress Sync Endpoints
  app.post('/api/student/sync', (req: Request, res: Response) => {
    const body = req.body as Partial<StudentRecord>;
    const email = (body.email || '').trim().toLowerCase();
    if (!email || email.length > 120) {
      res.status(400).json({ error: 'Valid student email is required for cloud sync.' });
      return;
    }
    const store = loadStore();
    const existing = store.students[email];
    const merged: StudentRecord = {
      email,
      name: (body.name || existing?.name || 'B.Tech Student').slice(0, 80),
      university: (body.university || existing?.university || 'JNTU').slice(0, 100),
      semester: (body.semester || existing?.semester || 'Semester 1').slice(0, 40),
      preferredLanguage: (body.preferredLanguage || existing?.preferredLanguage || 'en').slice(0, 20),
      completedLessons: Array.from(new Set([...(existing?.completedLessons || []), ...(body.completedLessons || [])])),
      solvedChallenges: Array.from(new Set([...(existing?.solvedChallenges || []), ...(body.solvedChallenges || [])])),
      submittedAssignments: Array.from(new Set([...(existing?.submittedAssignments || []), ...(body.submittedAssignments || [])])),
      completedProjects: Array.from(new Set([...(existing?.completedProjects || []), ...(body.completedProjects || [])])),
      quizScores: { ...(existing?.quizScores || {}), ...(body.quizScores || {}) },
      streakDays: Math.max(existing?.streakDays || 1, body.streakDays || 1),
      lastActiveDate: body.lastActiveDate || existing?.lastActiveDate || new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString(),
    };
    store.students[email] = merged;
    saveStore(store);
    res.json({ student: merged });
  });

  app.get('/api/student/:email', (req: Request, res: Response) => {
    const email = (req.params.email || '').trim().toLowerCase();
    const store = loadStore();
    const student = store.students[email];
    if (!student) {
      res.status(404).json({ error: 'Student profile not found.' });
      return;
    }
    res.json({ student });
  });

  // Community Discussion Forum Endpoints
  app.get('/api/forum/posts', (_req: Request, res: Response) => {
    const store = loadStore();
    res.json({ posts: store.posts });
  });

  app.post('/api/forum/posts', (req: Request, res: Response) => {
    const { title, content, codeSnippet, moduleTag, languageTag, authorName, university } = req.body as Record<string, string>;
    if (!title?.trim() || !content?.trim()) {
      res.status(400).json({ error: 'Title and question description are required.' });
      return;
    }
    const store = loadStore();
    const newPost: ForumPost = {
      id: `post-${Date.now()}`,
      title: title.trim().slice(0, 140),
      content: content.trim().slice(0, 1500),
      codeSnippet: codeSnippet ? codeSnippet.slice(0, 1200) : undefined,
      moduleTag: (moduleTag || 'General Python').slice(0, 60),
      languageTag: (languageTag || 'English').slice(0, 30),
      authorName: (authorName || 'CSE Student').trim().slice(0, 60),
      university: (university || 'B.Tech 1st Year').trim().slice(0, 80),
      upvotes: 1,
      createdAt: 'Just now',
      replies: [],
    };
    store.posts.unshift(newPost);
    saveStore(store);
    res.status(201).json({ post: newPost });
  });

  app.post('/api/forum/posts/:id/reply', (req: Request, res: Response) => {
    const { id } = req.params;
    const { authorName, university, content } = req.body as Record<string, string>;
    if (!content?.trim()) {
      res.status(400).json({ error: 'Reply content cannot be empty.' });
      return;
    }
    const store = loadStore();
    const post = store.posts.find((p) => p.id === id);
    if (!post) {
      res.status(404).json({ error: 'Discussion post not found.' });
      return;
    }
    const reply: ForumReply = {
      id: `rep-${Date.now()}`,
      authorName: (authorName || 'CSE Peer').trim().slice(0, 60),
      university: (university || 'B.Tech CSE').trim().slice(0, 80),
      content: content.trim().slice(0, 1000),
      createdAt: 'Just now',
    };
    post.replies.push(reply);
    saveStore(store);
    res.json({ post });
  });

  app.post('/api/forum/posts/:id/upvote', (req: Request, res: Response) => {
    const { id } = req.params;
    const store = loadStore();
    const post = store.posts.find((p) => p.id === id);
    if (!post) {
      res.status(404).json({ error: 'Discussion post not found.' });
      return;
    }
    post.upvotes += 1;
    saveStore(store);
    res.json({ post });
  });

  // AI Python Tutor Endpoint (Server-Side Gemini API)
  app.post('/api/tutor/chat', async (req: Request, res: Response) => {
    try {
      const { message, language = 'English', mode = 'explain', codeContext = '', history = [] } = req.body as {
        message?: string;
        language?: string;
        mode?: string;
        codeContext?: string;
        history?: Array<{ role: 'user' | 'model'; text: string }>;
      };

      if (!message?.trim()) {
        res.status(400).json({ error: 'Please enter a Python question or paste code.' });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({
          error: 'GEMINI_API_KEY is not configured. Please check the Settings > Secrets panel in AI Studio.',
        });
        return;
      }

      const modeInstructions: Record<string, string> = {
        explain: 'Explain the Python concept clearly with a relatable Indian B.Tech engineering analogy, syntax box, and a short Python 3.12 example.',
        debug: 'Analyze the student code and error message. Explain WHY the error occurred, give a clear hint first, and then show the corrected Python 3 code.',
        hint: 'IMPORTANT: Give step-by-step logical hints and guiding questions WITHOUT immediately revealing the full final solution code, so the student learns to solve it independently.',
        line_by_line: 'Walk through the Python code line by line, explaining variable states, control flow, and exact output at each step.',
        practice: 'Generate 3 progressive Python practice problems (Easy, Medium, University Exam level) on this topic with expected sample input/output.',
        exam_prep: 'Format the answer like a high-scoring Indian B.Tech 1st Year University Examination response: Definition, Syntax, Flowchart/Algorithm steps, Working Python Program, and Sample Output.',
      };

      const systemInstruction = [
        'You are Professor PyMaster, a warm, rigorous, and encouraging Python Programming Tutor for 1st-Year B.Tech Computer Science & Engineering students in India.',
        `Respond in ${language} (keep Python keywords, code blocks, and standard technical terms accurate in English/Python 3.12 syntax, while writing explanations in ${language}).`,
        modeInstructions[mode] || modeInstructions.explain,
        'Always verify against modern stable Python 3 (Python 3.10–3.13) official documentation.',
        'Keep responses well-structured using clean headings, bullet points, and ```python fenced code blocks.',
      ].join('\n');

      const conversationTranscript = history
        .slice(-6)
        .map((h) => `${h.role === 'user' ? 'Student' : 'Tutor'}: ${h.text}`)
        .join('\n\n');

      const fullPrompt = [
        conversationTranscript ? `Previous conversation:\n${conversationTranscript}\n` : '',
        codeContext ? `Student's Current Playground Code:\n\`\`\`python\n${codeContext}\n\`\`\`\n` : '',
        `Student Question (${language}): ${message.trim()}`,
      ]
        .filter(Boolean)
        .join('\n');

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: fullPrompt,
        config: {
          systemInstruction,
        },
      });

      const replyText = response.text || 'I could not generate an explanation right now. Please try asking again.';
      res.json({ reply: replyText });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('AI Tutor Error:', msg);
      res.status(500).json({
        error: `AI Tutor request failed: ${msg}`,
      });
    }
  });

  // Mount static dist in production or bind port immediately while Vite warms up in dev
  const distPath = path.join(__dirname, 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (isProd) {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`PYTHON MASTER server listening on http://0.0.0.0:${PORT}`);
    });
  } else {
    let viteMiddleware: express.RequestHandler | null = null;
    const viteReady = (async () => {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          port: PORT,
          allowedHosts: true,
          hmr: process.env.DISABLE_HMR === 'true' ? false : true,
          ws: { server: httpServer },
        },
        appType: 'spa',
      });
      viteMiddleware = vite.middlewares;
    })();

    app.use(async (req: Request, res: Response, next: express.NextFunction) => {
      try {
        if (!viteMiddleware) {
          await viteReady;
        }
        if (viteMiddleware) {
          viteMiddleware(req, res, next);
        } else {
          next();
        }
      } catch (err) {
        next(err);
      }
    });

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`PYTHON MASTER server listening on http://0.0.0.0:${PORT}`);
    });

    await viteReady;
  }
}

startServer().catch((err) => {
  console.error('Failed to start PYTHON MASTER server:', err);
  process.exit(1);
});
