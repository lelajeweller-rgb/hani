import { COURSE_CURRICULUM } from '../data/curriculum';
import type { LessonContent } from '../types';

export const OFFLINE_LESSONS_DATA_KEY = 'python_master_offline_lessons_v1';

const lessonSizeCache = new Map<string, number>();

export function estimateLessonBytes(lesson: LessonContent): number {
  const cached = lessonSizeCache.get(lesson.id);
  if (cached !== undefined) return cached;
  const serialized = JSON.stringify(lesson);
  const bytes = new TextEncoder().encode(serialized).length;
  lessonSizeCache.set(lesson.id, bytes);
  return bytes;
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export function readOfflineLessonsMap(): Record<string, LessonContent> {
  try {
    const raw = localStorage.getItem(OFFLINE_LESSONS_DATA_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, LessonContent>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function writeOfflineLessonsMap(map: Record<string, LessonContent>): void {
  try {
    localStorage.setItem(OFFLINE_LESSONS_DATA_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

export function syncOfflineCacheWithIds(offlineIds: string[]): void {
  if (offlineIds.length === 0) return;
  const map = readOfflineLessonsMap();
  const idSet = new Set(offlineIds);
  let changed = false;

  for (const mod of COURSE_CURRICULUM) {
    for (const lesson of mod.lessons) {
      if (idSet.has(lesson.id) && !map[lesson.id]) {
        map[lesson.id] = lesson;
        changed = true;
      }
    }
  }

  if (changed) {
    writeOfflineLessonsMap(map);
  }
}

export function saveLessonsToOfflineCache(
  lessons: LessonContent[],
  currentOfflineIds: string[]
): string[] {
  const map = readOfflineLessonsMap();
  const nextIdSet = new Set(currentOfflineIds);

  for (const lesson of lessons) {
    map[lesson.id] = lesson;
    nextIdSet.add(lesson.id);
  }

  writeOfflineLessonsMap(map);
  return Array.from(nextIdSet);
}

export function removeLessonsFromOfflineCache(
  lessonIds: string[],
  currentOfflineIds: string[]
): string[] {
  const removeSet = new Set(lessonIds);
  const map = readOfflineLessonsMap();

  for (const id of lessonIds) {
    delete map[id];
  }

  writeOfflineLessonsMap(map);
  return currentOfflineIds.filter((id) => !removeSet.has(id));
}

export function clearAllOfflineCache(): string[] {
  try {
    localStorage.removeItem(OFFLINE_LESSONS_DATA_KEY);
  } catch {
    // Ignore storage error
  }
  return [];
}
