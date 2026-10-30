/**
 * Definición de Esquemas TypeScript para el Sistema de Memorización Bíblica
 * "Los Navegantes" (Topical Memory System - TMS) + Algoritmo SRS.
 */

export type SeriesId = 'A' | 'B' | 'C' | 'D' | 'E';

/**
 * Los 4 modos progresivos de entrenamiento para cada tarjeta
 */
export type StudyMode =
  | 'flashcard'    // 1. Lectura / Flashcard Clásica 3D (Cita + Texto + Cita)
  | 'first-letter' // 2. Método de Primera Letra (P. t. a. D. a. m...) con revelado puntual
  | 'cloze'        // 3. Completar Huecos (Cloze Deletion interactivo)
  | 'dictation';   // 4. Recuerdo Activo Escrito / Dictado por inicial con autocompletado

/**
 * Calificaciones del sistema de Repetición Espaciada (SRS)
 * - again: Otra vez (1 día)
 * - hard: Difícil (3 días)
 * - good: Bien (7 días)
 * - easy: Fácil (14 días o multiplicador progresivo)
 */
export type SRSRating = 'again' | 'hard' | 'good' | 'easy';

/**
 * Estado del embudo de aprendizaje para el Dashboard
 */
export type MasteryStage =
  | 'new'        // Nuevos (sin repasar aún)
  | 'learning'   // En Aprendizaje (intervalo < 7 días)
  | 'reviewing'  // Repaso Frecuente (intervalo entre 7 y 21 días)
  | 'mastered';  // Dominados (intervalo > 21 días y racha sólida)

/**
 * Representa un mazo o Serie del Topical Memory System (A, B, C, D, E)
 */
export interface Deck {
  id: SeriesId;
  code: string;          // Ej. "Serie A"
  title: string;         // Ej. "Vivir la nueva vida"
  subtitle: string;      // Descripción pastoral/editorial de la serie
  accentColor: string;   // Token o clase de color tierra/editorial
  topics: string[];      // Los 6 subtemas de la serie (2 versículos por subtema)
  order: number;         // 1 a 5
  totalCards: number;    // 12 por serie
}

/**
 * Representa un versículo individual del sistema Los Navegantes.
 * Regla TMS estricta: Al recitar, se pronuncia Cita -> Texto -> Cita.
 */
export interface Card {
  id: string;            // Ej. "A-1", "A-2" ... "E-12"
  deckId: SeriesId;      // 'A' | 'B' | 'C' | 'D' | 'E'
  seriesOrder: number;   // 1 al 12 dentro de su serie
  globalOrder: number;   // 1 al 60 en todo el TMS
  topic: string;         // Ej. "Cristo el Centro"
  reference: string;     // Ej. "2 Corintios 5:17"
  translation: 'RVR1960';
  text: string;          // Texto limpio del versículo en Reina-Valera 1960
  keywords: string[];    // Palabras teológicas clave sugeridas para el modo Cloze Deletion
}

/**
 * Estado de progreso y parámetros SRS (basado en SM-2 / FSRS adaptado) por cada tarjeta
 */
export interface Progress {
  cardId: string;               // Clave primaria vinculada a Card.id
  stage: MasteryStage;          // Embudo: 'new' | 'learning' | 'reviewing' | 'mastered'
  intervalDays: number;         // Intervalo actual en días (0, 1, 3, 7, 14, 30...)
  easeFactor: number;           // Factor de facilidad (por defecto 2.5, mínimo 1.3)
  repetitions: number;          // Número de repasos exitosos consecutivos
  lapses: number;               // Veces que el usuario pulsó "Otra vez" (olvido)
  dueDate: string;              // Fecha ISO (YYYY-MM-DD) del próximo repaso programado
  lastReviewedAt: string | null;// Timestamp ISO del último repaso
  completedModes: StudyMode[];  // Modos dominados en la sesión actual
  favorite?: boolean;           // Marcador opcional del usuario
}

/**
 * Registro histórico inmutable de cada sesión de repaso (para el Heatmap y analíticas)
 */
export interface ReviewLog {
  id?: number;                  // Auto-incrementado en IndexedDB (Dexie)
  cardId: string;               // Versículo repasado
  deckId: SeriesId;             // Serie a la que pertenece
  rating: SRSRating;            // 'again' | 'hard' | 'good' | 'easy'
  studyMode: StudyMode;         // En qué modo se practicó ('flashcard' | 'first-letter' | 'cloze' | 'dictation')
  previousInterval: number;     // Intervalo antes del repaso (días)
  newInterval: number;          // Nuevo intervalo asignado (días)
  durationMs: number;           // Tiempo invertido en la tarjeta en milisegundos
  reviewedAt: string;           // Timestamp ISO completo
  dateKey: string;              // Clave rápida 'YYYY-MM-DD' para indexar el calendario de calor
}

/**
 * Preferencias de usuario, racha diaria y recordatorios locales
 */
export interface UserSettings {
  id: 'default';
  dailyGoalCards: number;       // Meta diaria (ej. 5 versículos al día)
  currentStreak: number;        // Días consecutivos alcanzando actividad
  longestStreak: number;        // Récord histórico de racha
  lastActiveDate: string | null;// 'YYYY-MM-DD' del último día con repaso
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  reminderTime: string;         // Formato "HH:mm" (ej. "08:00")
  strictCitationRule: boolean;  // Exigir cita al principio y al final en dictado
}
