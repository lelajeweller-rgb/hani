import { jsPDF } from 'jspdf';
import { PRACTICE_CHALLENGES } from '../components/PlaygroundView';
import { ASSIGNMENTS_LIST, DAILY_CHALLENGE, PROJECTS_LIST, QUIZ_BANK } from '../data/assessments';
import { COURSE_CURRICULUM, TOTAL_LESSONS_COUNT } from '../data/curriculum';
import type { StudentProfile } from '../types';

const QUIZ_CATEGORY_LABELS: Record<string, string> = {
  mcq: 'Multiple Choice',
  true_false: 'True or False',
  find_output: 'Find the Output',
  debugging: 'Debugging',
  coding_challenge: 'Coding Challenges',
};

function toPdfText(raw: string): string {
  return raw
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00b7/g, '|')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2192/g, '->')
    .replace(/[^\x20-\x7E\n]/g, '')
    .trim();
}

export interface StudySummaryExportResult {
  fileName: string;
  completedLessonsCount: number;
  quizCategoriesCount: number;
  solvedItemsCount: number;
}

export function generateStudySummaryPdf(student: StudentProfile): StudySummaryExportResult {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2;
  const bottomLimit = pageHeight - 18;
  let y = 16;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > bottomLimit) {
      doc.addPage();
      y = 18;
    }
  };

  const drawSectionTitle = (title: string) => {
    ensureSpace(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(toPdfText(title), marginX, y);
    y += 2.5;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 5.5;
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const completedSet = new Set(student.completedLessons);
  const coursePct = Math.round((student.completedLessons.length / TOTAL_LESSONS_COUNT) * 100);
  const quizEntries = Object.entries(student.quizScores);
  const avgQuiz = quizEntries.length
    ? Math.round(quizEntries.reduce((sum, [, score]) => sum + score, 0) / quizEntries.length)
    : 0;
  const totalSolvedItems =
    student.solvedChallenges.length +
    student.submittedAssignments.length +
    student.completedProjects.length;

  const unlockedCertificates = [
    student.completedLessons.length >= 3 ? 'Python 3 Foundations Scholar (PM-FND-2026)' : null,
    student.completedLessons.length >= 10 && totalSolvedItems >= 1
      ? 'Python Data Structures & OOP Practitioner (PM-OOP-2026)'
      : null,
    student.completedLessons.length >= 25 && student.completedProjects.length >= 2
      ? 'PYTHON MASTER - B.Tech Honours Certificate (PM-BTECH-HONOURS)'
      : null,
  ].filter((c): c is string => c !== null);

  // Header Banner
  doc.setFillColor(2, 132, 199);
  doc.roundedRect(marginX, y, contentWidth, 24, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('PYTHON MASTER - B.Tech Learning Academy', marginX + 5, y + 9.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(224, 242, 254);
  doc.text('Student Study Summary & Progress Report', marginX + 5, y + 16.5);

  doc.setFontSize(9);
  doc.text(`Generated: ${todayStr}`, pageWidth - marginX - 5, y + 16.5, { align: 'right' });

  y += 31;

  // Student Metadata Block
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, y, contentWidth, 22, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(toPdfText(student.name || 'B.Tech Student'), marginX + 4, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(
    toPdfText(`${student.university} | ${student.semester}`),
    marginX + 4,
    y + 13.5
  );
  doc.text(
    toPdfText(
      `Streak: ${student.streakDays} Days (Last active ${student.lastActiveDate})${
        student.email ? ` | Email: ${student.email}` : ''
      }`
    ),
    marginX + 4,
    y + 19
  );

  y += 28;

  // 4-Box Summary Metrics
  const kpiGap = 3.5;
  const kpiW = (contentWidth - kpiGap * 3) / 4;
  const kpiData = [
    {
      label: 'Course Mastery',
      value: `${coursePct}%`,
      sub: `${student.completedLessons.length}/${TOTAL_LESSONS_COUNT} lessons`,
    },
    {
      label: 'Avg Quiz Score',
      value: `${avgQuiz}%`,
      sub: `${quizEntries.length} categories`,
    },
    {
      label: 'Problems Solved',
      value: `${totalSolvedItems}`,
      sub: 'Challenges & labs',
    },
    {
      label: 'Certificates',
      value: `${unlockedCertificates.length} / 3`,
      sub: 'Earned credentials',
    },
  ];

  kpiData.forEach((box, idx) => {
    const bx = marginX + idx * (kpiW + kpiGap);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(bx, y, kpiW, 19, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(box.label, bx + 3, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(box.value, bx + 3, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(box.sub, bx + 3, y + 16.5);
  });

  y += 26;

  // Section 1: Quiz Scores
  drawSectionTitle('1. Quiz Scores & Assessment Performance');
  if (quizEntries.length === 0) {
    ensureSpace(8);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text('No quiz categories attempted yet. Complete any quiz mode to record scores.', marginX, y);
    y += 8;
  } else {
    quizEntries.forEach(([catKey, score]) => {
      ensureSpace(7);
      const label = QUIZ_CATEGORY_LABELS[catKey] || catKey;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`- ${toPdfText(label)}`, marginX + 2, y);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(2, 132, 199);
      doc.text(`${score}% best score`, pageWidth - marginX - 2, y, { align: 'right' });
      y += 6;
    });
    y += 2;
  }

  // Section 2: Solved Challenges, Assignments & Projects
  drawSectionTitle('2. Solved Challenges, Lab Assignments & Mini Projects');
  const challengeTitleMap = new Map<string, string>();
  PRACTICE_CHALLENGES.forEach((c) => challengeTitleMap.set(c.id, `${c.title} (Playground)`));
  QUIZ_BANK.forEach((q) =>
    challengeTitleMap.set(q.id, `${q.moduleRef}: ${q.question.slice(0, 72)} (Quiz Challenge)`)
  );

  const assignmentTitleMap = new Map<string, string>();
  ASSIGNMENTS_LIST.forEach((a) => assignmentTitleMap.set(a.id, `${a.unit}: ${a.title}`));

  const projectTitleMap = new Map<string, string>();
  PROJECTS_LIST.forEach((p) => projectTitleMap.set(p.id, `${p.title} (${p.difficulty})`));

  const solvedLines: string[] = [
    ...student.solvedChallenges.map(
      (id) => `[Challenge] ${challengeTitleMap.get(id) || id}`
    ),
    ...student.submittedAssignments.map(
      (id) => `[Assignment] ${assignmentTitleMap.get(id) || id}`
    ),
    ...student.completedProjects.map(
      (id) => `[Mini Project] ${projectTitleMap.get(id) || id}`
    ),
    ...(student.dailyCompletedDates.length > 0
      ? [
          `[Daily Practice] ${DAILY_CHALLENGE.title} (${student.dailyCompletedDates.length} daily ${
            student.dailyCompletedDates.length === 1 ? 'session' : 'sessions'
          } completed)`,
        ]
      : []),
  ];

  if (solvedLines.length === 0) {
    ensureSpace(8);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'No coding challenges, lab assignments, or mini projects completed yet.',
      marginX,
      y
    );
    y += 8;
  } else {
    solvedLines.forEach((line) => {
      const wrapped = doc.splitTextToSize(`- ${toPdfText(line)}`, contentWidth - 4) as string[];
      ensureSpace(wrapped.length * 4.8 + 1.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text(wrapped, marginX + 2, y);
      y += wrapped.length * 4.8 + 1.5;
    });
    y += 2;
  }

  // Section 3: Earned Certificates (if any)
  if (unlockedCertificates.length > 0) {
    drawSectionTitle('3. Unlocked Academic Certificates');
    unlockedCertificates.forEach((certLabel) => {
      ensureSpace(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(5, 150, 105);
      doc.text(`- ${toPdfText(certLabel)}`, marginX + 2, y);
      y += 6;
    });
    y += 2;
  }

  // Section 4: Completed Lessons & Module Breakdown
  drawSectionTitle(
    `${unlockedCertificates.length > 0 ? '4' : '3'}. Module Progress & Completed Lessons`
  );

  COURSE_CURRICULUM.forEach((mod) => {
    const doneLessons = mod.lessons.filter((l) => completedSet.has(l.id));
    const pct = Math.round((doneLessons.length / mod.lessons.length) * 100);

    ensureSpace(doneLessons.length > 0 ? 12 : 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(
      toPdfText(`Module ${String(mod.id).padStart(2, '0')}: ${mod.title}`),
      marginX + 1,
      y
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(doneLessons.length === mod.lessons.length ? 5 : 71, doneLessons.length === mod.lessons.length ? 150 : 85, doneLessons.length === mod.lessons.length ? 105 : 105);
    doc.text(
      `${doneLessons.length} / ${mod.lessons.length} (${pct}%)`,
      pageWidth - marginX - 1,
      y,
      { align: 'right' }
    );
    y += 5;

    if (doneLessons.length > 0) {
      doneLessons.forEach((lesson) => {
        const line = `  [Done] ${lesson.title} (${lesson.difficulty}, ${lesson.durationMinutes} min)`;
        const wrapped = doc.splitTextToSize(toPdfText(line), contentWidth - 6) as string[];
        ensureSpace(wrapped.length * 4.5 + 1);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text(wrapped, marginX + 3, y);
        y += wrapped.length * 4.5 + 0.8;
      });
      y += 2;
    }
  });

  // Add page numbers across all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `PYTHON MASTER - Study Summary for ${toPdfText(student.name || 'Student')}`,
      marginX,
      pageHeight - 8
    );
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - marginX, pageHeight - 8, {
      align: 'right',
    });
  }

  const safeSlug = (student.name || 'student')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const fileName = `python_master_study_summary_${safeSlug || 'student'}_${todayStr}.pdf`;

  doc.save(fileName);

  return {
    fileName,
    completedLessonsCount: student.completedLessons.length,
    quizCategoriesCount: quizEntries.length,
    solvedItemsCount: totalSolvedItems,
  };
}
