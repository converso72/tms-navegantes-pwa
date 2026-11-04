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
 * Devuelve el lunes de la semana actual en formato 'YYYY-MM-DD'
 */
export function getStartOfWeekDateKey(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0 (Dom) a 6 (Sáb)
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return getLocalDateKey(d);
}

/**
 * Calcula de forma exacta la racha actual y el récord histórico de días consecutivos
 * a partir de las fechas reales ('YYYY-MM-DD') en las que hubo al menos un repaso.
 */
export function computeStreaksFromDateKeys(dateKeys: string[]): {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
} {
  const uniqueDates = Array.from(new Set(dateKeys.filter(Boolean))).sort();
  if (uniqueDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };
  }

  const dateSet = new Set(uniqueDates);
  const todayKey = getLocalDateKey(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterday);

  // Calcular racha activa hoy (o vigente desde ayer si hoy aún no se ha repasado)
  let currentStreak = 0;
  let cursorDate: Date | null = null;

  if (dateSet.has(todayKey)) {
    cursorDate = new Date();
  } else if (dateSet.has(yesterdayKey)) {
    cursorDate = yesterday;
  }

  if (cursorDate) {
    const d = new Date(cursorDate);
    while (dateSet.has(getLocalDateKey(d))) {
      currentStreak += 1;
      d.setDate(d.getDate() - 1);
    }
  }

  // Calcular récord histórico (longestStreak)
  let longestStreak = 0;
  let running = 0;
  let prevTimestamp: number | null = null;

  for (const key of uniqueDates) {
    const [y, m, d] = key.split('-').map(Number);
    const currentTs = Date.UTC(y, m - 1, d);
    if (prevTimestamp !== null && currentTs - prevTimestamp === 86400000) {
      running += 1;
    } else {
      running = 1;
    }
    if (running > longestStreak) {
      longestStreak = running;
    }
    prevTimestamp = currentTs;
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    lastActiveDate: uniqueDates[uniqueDates.length - 1],
  };
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
