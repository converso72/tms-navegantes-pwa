import Dexie, { type Table } from 'dexie';
import type {
  Card,
  Deck,
  Progress,
  ReviewLog,
  SRSRating,
  StudyMode,
  UserSettings,
} from '../types/schema';
import tmsDataset from '../data/tms-navegantes.json';
import { calculateNextProgress, getLocalDateKey } from './srs-engine';

export class NavegantesDatabase extends Dexie {
  decks!: Table<Deck, string>;
  cards!: Table<Card, string>;
  progress!: Table<Progress, string>;
  reviewLogs!: Table<ReviewLog, number>;
  settings!: Table<UserSettings, string>;

  constructor() {
    super('NavegantesTMSDatabase');

    this.version(1).stores({
      decks: 'id, order',
      cards: 'id, deckId, seriesOrder, globalOrder, topic',
      progress: 'cardId, stage, dueDate, intervalDays',
      reviewLogs: '++id, cardId, deckId, dateKey, reviewedAt, studyMode',
      settings: 'id',
    });
  }
}

export const db = new NavegantesDatabase();

/**
 * Inicializa la base de datos local IndexedDB con los 60 versículos de Los Navegantes (RVR1960)
 * si es la primera vez que se abre la PWA. Funciona 100% Offline.
 */
export async function ensureDatabaseSeeded(): Promise<void> {
  const existingCardsCount = await db.cards.count();
  const todayKey = getLocalDateKey();

  if (existingCardsCount === 0) {
    const decks = tmsDataset.decks as Deck[];
    const cards = tmsDataset.cards as Card[];

    const initialProgress: Progress[] = cards.map((card) => ({
      cardId: card.id,
      stage: 'new',
      intervalDays: 0,
      easeFactor: 2.5,
      repetitions: 0,
      lapses: 0,
      dueDate: todayKey,
      lastReviewedAt: null,
      completedModes: [],
      favorite: false,
    }));

    await db.transaction('rw', db.decks, db.cards, db.progress, db.settings, async () => {
      await db.decks.bulkPut(decks);
      await db.cards.bulkPut(cards);
      await db.progress.bulkPut(initialProgress);
      await db.settings.put({
        id: 'default',
        dailyGoalCards: 5,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        theme: 'light',
        notificationsEnabled: false,
        reminderTime: '08:00',
        strictCitationRule: true,
      });
    });
  }
}

/**
 * Registra una evaluación SRS completa en IndexedDB:
 * 1. Actualiza el progreso e intervalo de la tarjeta (`progress`)
 * 2. Añade una entrada histórica (`reviewLogs`) para el Heatmap
 * 3. Calcula y actualiza la racha de días consecutivos (`settings`)
 */
export async function recordCardReview(
  cardId: string,
  rating: SRSRating,
  studyMode: StudyMode,
  durationMs: number
): Promise<void> {
  const todayKey = getLocalDateKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterday);

  await db.transaction('rw', db.cards, db.progress, db.reviewLogs, db.settings, async () => {
    const card = await db.cards.get(cardId);
    if (!card) return;

    const currentProgress =
      (await db.progress.get(cardId)) || {
        cardId,
        stage: 'new',
        intervalDays: 0,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
        dueDate: todayKey,
        lastReviewedAt: null,
        completedModes: [],
      };

    const { updatedProgress, previousInterval, newInterval } = calculateNextProgress(
      currentProgress,
      rating,
      studyMode
    );

    await db.progress.put(updatedProgress);

    await db.reviewLogs.add({
      cardId,
      deckId: card.deckId,
      rating,
      studyMode,
      previousInterval,
      newInterval,
      durationMs,
      reviewedAt: new Date().toISOString(),
      dateKey: todayKey,
    });

    // Actualizar racha diaria
    const settings = (await db.settings.get('default')) || {
      id: 'default' as const,
      dailyGoalCards: 5,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      theme: 'light' as const,
      notificationsEnabled: false,
      reminderTime: '08:00',
      strictCitationRule: true,
    };

    let currentStreak = settings.currentStreak;
    if (settings.lastActiveDate !== todayKey) {
      if (settings.lastActiveDate === yesterdayKey) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
    }

    const longestStreak = Math.max(settings.longestStreak, currentStreak);

    await db.settings.put({
      ...settings,
      currentStreak,
      longestStreak,
      lastActiveDate: todayKey,
    });
  });
}
