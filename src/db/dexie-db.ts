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

/**
 * Extrae automáticamente palabras clave significativas (>= 5 letras, sin stopwords comunes)
 * cuando el usuario importa versículos personalizados sin definir keywords.
 */
export function extractAutoKeywords(text: string): string[] {
  const stopwords = new Set([
    'porque', 'cuando', 'contra', 'desde', 'entre', 'hacia', 'hasta', 'para', 'segun', 'según',
    'sobre', 'tras', 'durante', 'mediante', 'todos', 'todas', 'alguno', 'alguna', 'otros',
    'otras', 'mismo', 'misma', 'aquel', 'aquella', 'estos', 'estas', 'vuestro', 'vuestra',
    'vuestros', 'vuestras', 'nuestro', 'nuestra', 'había', 'habia', 'están', 'estan', 'serán',
    'seran', 'tiene', 'tienen', 'como', 'sino', 'también', 'tambien', 'quien', 'cual', 'donde'
  ]);

  const words = text
    .replace(/[¿¡!?,.;:"«»()[\]]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 5 && !stopwords.has(w.toLowerCase()));

  return Array.from(new Set(words)).slice(0, 8);
}

export interface CustomVerseInput {
  topic?: string;
  reference: string;
  text: string;
  translation?: string;
  keywords?: string[];
}

/**
 * Crea o actualiza un grupo (Deck) personalizado de versículos en IndexedDB
 * e inicializa su estado SRS para que esté disponible de inmediato offline.
 */
export async function importCustomDeckGroup(params: {
  code: string;
  title: string;
  subtitle?: string;
  accentColor?: string;
  translation?: string;
  verses: CustomVerseInput[];
}): Promise<{ deckId: string; importedCount: number }> {
  const cleanCode = params.code.trim().toUpperCase().replace(/\s+/g, '-') || 'G';
  const deckId = cleanCode.replace(/[^A-Z0-9-]/g, '').slice(0, 10) || `G${Date.now().toString().slice(-3)}`;
  const todayKey = getLocalDateKey();

  const existingDecks = await db.decks.toArray();
  const existingCardsCount = await db.cards.count();
  const maxOrder = existingDecks.reduce((max, d) => Math.max(max, d.order), 0);

  const topics = Array.from(
    new Set(params.verses.map((v) => v.topic?.trim() || params.title.trim()))
  );

  const newDeck: Deck = {
    id: deckId,
    code: `Grupo ${deckId}`,
    title: params.title.trim(),
    subtitle:
      params.subtitle?.trim() ||
      `Colección personalizada de ${params.verses.length} versículos para memorización.`,
    accentColor: params.accentColor || '#7F5539',
    topics,
    order: maxOrder + 1,
    totalCards: params.verses.length,
    isCustom: true,
  };

  const newCards: Card[] = params.verses.map((v, idx) => {
    const orderNum = idx + 1;
    const cardId = `${deckId}-${orderNum}`;
    const cleanText = v.text.trim().replace(/^["“«]|["”»]$/g, '');
    return {
      id: cardId,
      deckId,
      seriesOrder: orderNum,
      globalOrder: existingCardsCount + orderNum,
      topic: v.topic?.trim() || params.title.trim(),
      reference: v.reference.trim(),
      translation: v.translation?.trim() || params.translation?.trim() || 'RVR1960',
      text: cleanText,
      keywords:
        v.keywords && v.keywords.length > 0 ? v.keywords : extractAutoKeywords(cleanText),
      isCustom: true,
    };
  });

  const newProgress: Progress[] = newCards.map((c) => ({
    cardId: c.id,
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

  await db.transaction('rw', db.decks, db.cards, db.progress, async () => {
    // Si ya existía un mazo con el mismo ID personalizado, reemplazamos sus tarjetas
    const oldCards = await db.cards.where('deckId').equals(deckId).primaryKeys();
    if (oldCards.length > 0) {
      await db.cards.bulkDelete(oldCards);
      await db.progress.bulkDelete(oldCards);
    }
    await db.decks.put(newDeck);
    await db.cards.bulkPut(newCards);
    await db.progress.bulkPut(newProgress);
  });

  return { deckId, importedCount: newCards.length };
}

/**
 * Elimina un grupo personalizado y sus versículos asociados
 */
export async function deleteCustomDeckGroup(deckId: string): Promise<void> {
  const deck = await db.decks.get(deckId);
  if (!deck || !deck.isCustom) return;

  await db.transaction('rw', db.decks, db.cards, db.progress, async () => {
    const cardIds = await db.cards.where('deckId').equals(deckId).primaryKeys();
    await db.cards.bulkDelete(cardIds);
    await db.progress.bulkDelete(cardIds);
    await db.decks.delete(deckId);
  });
}

/**
 * Añade uno o varios versículos nuevos a un grupo personalizado ya existente
 * sin perder el progreso de los versículos que ya estaban en ese grupo.
 */
export async function appendVersesToDeckGroup(
  deckId: string,
  verses: CustomVerseInput[]
): Promise<{ deckId: string; addedCount: number; firstNewCardId: string | null }> {
  const deck = await db.decks.get(deckId);
  if (!deck) throw new Error(`El grupo ${deckId} no existe`);

  const todayKey = getLocalDateKey();
  const existingDeckCards = await db.cards.where('deckId').equals(deckId).toArray();
  const maxSeriesOrder = existingDeckCards.reduce((m, c) => Math.max(m, c.seriesOrder), 0);
  const allCards = await db.cards.toArray();
  const maxGlobalOrder = allCards.reduce((m, c) => Math.max(m, c.globalOrder), 0);

  const newCards: Card[] = verses.map((v, idx) => {
    const seriesOrder = maxSeriesOrder + idx + 1;
    const cardId = `${deckId}-${seriesOrder}`;
    const cleanText = v.text.trim().replace(/^["“«]|["”»]$/g, '');
    return {
      id: cardId,
      deckId,
      seriesOrder,
      globalOrder: maxGlobalOrder + idx + 1,
      topic: v.topic?.trim() || deck.title,
      reference: v.reference.trim(),
      translation: v.translation?.trim() || 'RVR1960',
      text: cleanText,
      keywords:
        v.keywords && v.keywords.length > 0 ? v.keywords : extractAutoKeywords(cleanText),
      isCustom: true,
    };
  });

  const newProgress: Progress[] = newCards.map((c) => ({
    cardId: c.id,
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

  const updatedTopics = Array.from(
    new Set([...deck.topics, ...newCards.map((c) => c.topic)])
  );

  await db.transaction('rw', db.decks, db.cards, db.progress, async () => {
    await db.cards.bulkPut(newCards);
    await db.progress.bulkPut(newProgress);
    await db.decks.put({
      ...deck,
      topics: updatedTopics,
      totalCards: existingDeckCards.length + newCards.length,
    });
  });

  return {
    deckId,
    addedCount: newCards.length,
    firstNewCardId: newCards[0]?.id || null,
  };
}

/**
 * Elimina un versículo individual de un grupo personalizado
 */
export async function deleteSingleCustomCard(cardId: string): Promise<void> {
  const card = await db.cards.get(cardId);
  if (!card) return;
  const deck = await db.decks.get(card.deckId);
  if (!deck || !deck.isCustom) return;

  await db.transaction('rw', db.decks, db.cards, db.progress, async () => {
    await db.cards.delete(cardId);
    await db.progress.delete(cardId);
    const remaining = await db.cards.where('deckId').equals(deck.id).count();
    await db.decks.put({
      ...deck,
      totalCards: remaining,
    });
  });
}
