export type LanguageCode = 'en' | 'te' | 'hi' | 'ta' | 'kn' | 'ml' | 'mr';

export type AppView =
  | 'dashboard'
  | 'course'
  | 'daily'
  | 'videos'
  | 'playground'
  | 'quizzes'
  | 'assignments'
  | 'projects'
  | 'interview'
  | 'exam_prep'
  | 'planner'
  | 'offline_downloads'
  | 'certificates'
  | 'progress'
  | 'tutor'
  | 'community';

export type StudyCadence = 'daily' | 'weekly';

export type StudyScopePreset = 'all' | 'university_core' | 'interview_sprint' | 'custom';

export interface StudyPlannerConfig {
  examTitle: string;
  targetExamDate: string;
  cadence: StudyCadence;
  scopePreset: StudyScopePreset;
  customModuleIds: number[];
  studyDaysPerWeek: 5 | 6 | 7;
  revisionBufferDays: number;
  customDailyGoal: number | null;
  customWeeklyGoal: number | null;
}

export interface MiniTestQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonContent {
  id: string;
  moduleId: number;
  title: string;
  durationMinutes: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  introduction: string;
  localizedKeyTakeaway: Record<LanguageCode, string>;
  simpleExplanation: string;
  realLifeExample: string;
  syntax: string;
  workingCode: string;
  expectedOutput: string;
  stepByStep: string[];
  commonMistakes: Array<{ wrong: string; right: string; reason: string }>;
  practiceQuestions: string[];
  miniTest: MiniTestQuestion[];
}

export interface CourseModule {
  id: number;
  title: string;
  subtitle: string;
  unitTag: string;
  lessons: LessonContent[];
}

export type QuizCategory = 'mcq' | 'true_false' | 'find_output' | 'debugging' | 'coding_challenge';

export interface QuizQuestion {
  id: string;
  category: QuizCategory;
  moduleRef: string;
  question: string;
  codeSnippet?: string;
  options?: string[];
  correctIndex?: number;
  starterCode?: string;
  expectedStdout?: string;
  correctAnswerText: string;
  explanation: string;
}

export type FlashcardCategory =
  | 'Terminology'
  | 'Syntax'
  | 'Data Structures'
  | 'OOP & Exceptions'
  | 'Stdlib & Files';

export interface FlashcardItem {
  id: string;
  moduleRef: string;
  category: FlashcardCategory;
  term: string;
  frontHint: string;
  syntaxPrompt?: string;
  answer: string;
  codeExample: string;
  examTip: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  requiredConcepts: string[];
  instructions: string[];
  sourceCode: string;
  sampleInput: string;
  expectedOutput: string;
  finalTest: MiniTestQuestion;
}

export interface VideoLesson {
  id: string;
  title: string;
  moduleRef: string;
  duration: string;
  summary: string;
  codeLines: string[];
  steps: Array<{
    lineNumber: number;
    narration: string;
    variablesState: Record<string, string>;
    consoleOutput: string;
  }>;
}

export interface AssignmentItem {
  id: string;
  unit: string;
  title: string;
  problemStatement: string;
  sampleInput: string;
  expectedOutput: string;
  starterCode: string;
  hint: string;
}

export interface StudentProfile {
  name: string;
  email: string;
  university: string;
  semester: string;
  preferredLanguage: LanguageCode;
  completedLessons: string[];
  offlineLessonIds: string[];
  solvedChallenges: string[];
  submittedAssignments: string[];
  completedProjects: string[];
  quizScores: Record<string, number>;
  streakDays: number;
  lastActiveDate: string;
  dailyCompletedDates: string[];
}

export interface ForumReply {
  id: string;
  authorName: string;
  university: string;
  content: string;
  createdAt: string;
}

export interface ForumPost {
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
