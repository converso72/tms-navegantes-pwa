import type { MasteryStage, Progress, SRSRating, StudyMode } from '../types/schema';

/**
 * Devuelve la fecha en formato local 'YYYY-MM-DD'
 */
export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Suma N días a una fecha actual y devuelve 'YYYY-MM-DD'
 */
export function addDaysToDateKey(days: number, fromDate: Date = new Date()): string {
  const target = new Date(fromDate);
  target.setDate(target.getDate() + days);
  return getLocalDateKey(target);
}

/**
 * Clasifica la etapa del embudo de aprendizaje según el intervalo y repeticiones
 */
export function computeMasteryStage(intervalDays: number, repetitions: number): MasteryStage {
  if (repetitions === 0 && intervalDays === 0) return 'new';
  if (intervalDays < 7) return 'learning';
  if (intervalDays < 21) return 'reviewing';
  return 'mastered';
}

/**
 * Calcula el nuevo estado de Progreso tras evaluar un versículo con los 4 botones SRS:
 * - 'again' (Otra vez): 1 día
 * - 'hard'  (Difícil):  3 días (o incremento conservador)
 * - 'good'  (Bien):     7 días en primer salto sólido, luego multiplicado por easeFactor
 * - 'easy'  (Fácil):    14 días en primer salto, luego multiplicado por easeFactor * 1.3
 */
export function calculateNextProgress(
  current: Progress,
  rating: SRSRating,
  mode: StudyMode
): { updatedProgress: Progress; previousInterval: number; newInterval: number } {
  const now = new Date();
  const previousInterval = current.intervalDays;
  let newInterval = 1;
  let easeFactor = current.easeFactor || 2.5;
  let repetitions = current.repetitions;
  let lapses = current.lapses;

  switch (rating) {
    case 'again':
      newInterval = 1;
      repetitions = 0;
      lapses += 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      break;

    case 'hard':
      newInterval = previousInterval <= 1 ? 3 : Math.max(3, Math.round(previousInterval * 1.2));
      repetitions += 1;
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      break;

    case 'good':
      if (repetitions === 0 || previousInterval < 7) {
        newInterval = 7;
      } else {
        newInterval = Math.max(7, Math.round(previousInterval * easeFactor));
      }
      repetitions += 1;
      break;

    case 'easy':
      if (repetitions === 0 || previousInterval < 14) {
        newInterval = 14;
      } else {
        newInterval = Math.max(14, Math.round(previousInterval * easeFactor * 1.3));
      }
      repetitions += 1;
      easeFactor = Math.min(3.0, easeFactor + 0.15);
      break;
  }

  const stage = computeMasteryStage(newInterval, repetitions);
  const completedModes = Array.from(new Set([...(current.completedModes || []), mode]));

  const updatedProgress: Progress = {
    ...current,
    stage,
    intervalDays: newInterval,
    easeFactor: Number(easeFactor.toFixed(2)),
    repetitions,
    lapses,
    dueDate: addDaysToDateKey(newInterval, now),
    lastReviewedAt: now.toISOString(),
    completedModes,
  };

  return {
    updatedProgress,
    previousInterval,
    newInterval,
  };
}
