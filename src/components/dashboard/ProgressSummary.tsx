import React, { useMemo } from 'react';
import {
  Flame,
  Trophy,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Target,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Card, Deck, Progress, ReviewLog } from '../../types/schema';
import {
  computeStreaksFromDateKeys,
  getLocalDateKey,
  getStartOfWeekDateKey,
} from '../../db/srs-engine';

interface ProgressSummaryProps {
  decks: Deck[];
  cards: Card[];
  progressList: Progress[];
  reviewLogs: ReviewLog[];
  activeDeck: Deck | undefined;
  dailyGoal: number;
  dueCardsCount: number;
  onStartDailySession: () => void;
  onSelectDeckToStudy: (deckId: string) => void;
}

export const ProgressSummary: React.FC<ProgressSummaryProps> = ({
  decks,
  cards,
  progressList,
  reviewLogs,
  activeDeck,
  dailyGoal,
  dueCardsCount,
  onStartDailySession,
  onSelectDeckToStudy,
}) => {
  const todayKey = getLocalDateKey();
  const startOfWeekKey = getStartOfWeekDateKey();

  // 3. Cálculo en vivo y verificado de Días en Racha a partir de los registros reales
  const streakStats = useMemo(() => {
    return computeStreaksFromDateKeys(reviewLogs.map((l) => l.dateKey));
  }, [reviewLogs]);

  // 2.c. Número de versículos repasados en el día de hoy
  const todayReviewedInfo = useMemo(() => {
    const todayLogs = reviewLogs.filter((l) => l.dateKey === todayKey);
    const uniqueCardsToday = new Set(todayLogs.map((l) => l.cardId));
    return {
      totalReviews: todayLogs.length,
      uniqueVerses: uniqueCardsToday.size,
    };
  }, [reviewLogs, todayKey]);

  // 2.b. Número de versículos repasados en esta semana (desde el lunes actual)
  const weekReviewedInfo = useMemo(() => {
    const weekLogs = reviewLogs.filter((l) => l.dateKey >= startOfWeekKey && l.dateKey <= todayKey);
    const uniqueCardsWeek = new Set(weekLogs.map((l) => l.cardId));
    return {
      totalReviews: weekLogs.length,
      uniqueVerses: uniqueCardsWeek.size,
      logs: weekLogs,
    };
  }, [reviewLogs, startOfWeekKey, todayKey]);

  // 2.a. Paquete memorizando actualmente y versículos memorizados de ese paquete esta semana
  const activePackageStats = useMemo(() => {
    // Determinar el paquete activo: si hubo repasos esta semana, priorizar el paquete más practicado o el actual seleccionado
    let targetDeck = activeDeck || decks[0];
    if (weekReviewedInfo.logs.length > 0 && !activeDeck) {
      const latestLogDeckId = weekReviewedInfo.logs[weekReviewedInfo.logs.length - 1].deckId;
      const found = decks.find((d) => d.id === latestLogDeckId);
      if (found) targetDeck = found;
    }

    if (!targetDeck) return null;

    const deckCards = cards
      .filter((c) => c.deckId === targetDeck.id)
      .sort((a, b) => a.seriesOrder - b.seriesOrder);

    const progressMap = new Map<string, Progress>();
    progressList.forEach((p) => progressMap.set(p.cardId, p));

    // Versículos de este paquete memorizados/practicados esta semana
    const weekDeckCardIds = new Set(
      weekReviewedInfo.logs
        .filter((l) => l.deckId === targetDeck.id)
        .map((l) => l.cardId)
    );

    const memorizedThisWeekCards = deckCards.filter((c) => weekDeckCardIds.has(c.id));

    // Total de versículos ya iniciados/memorizados en este paquete en general
    const totalLearnedInDeck = deckCards.filter((c) => {
      const p = progressMap.get(c.id);
      return p && p.stage !== 'new';
    }).length;

    return {
      deck: targetDeck,
      totalInDeck: deckCards.length,
      totalLearnedInDeck,
      memorizedThisWeekCount: memorizedThisWeekCards.length,
      memorizedThisWeekCards,
    };
  }, [activeDeck, decks, cards, progressList, weekReviewedInfo.logs]);

  const dailyPct = Math.min(
    100,
    Math.round((todayReviewedInfo.totalReviews / Math.max(1, dailyGoal)) * 100)
  );
  const goalCompleted = todayReviewedInfo.totalReviews >= dailyGoal;

  return (
    <div className="space-y-4">
      {/* 3. Tarjeta de Días en Racha (Revisada y calculada en tiempo real) */}
      <div className="rounded-3xl p-5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E5DEC9] dark:border-[#332E2A] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                streakStats.currentStreak > 0
                  ? 'bg-[#8C5A3C]/15 border-[#8C5A3C]/40 text-[#8C5A3C] dark:text-[#D4A373]'
                  : 'bg-[#EFECE6] dark:bg-[#26221E] border-[#E2DDD5] dark:border-[#3A342F] text-[#8A8178]'
              }`}
            >
              <Flame className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-serif font-bold text-[#2C2825] dark:text-[#F3EFEA]">
                  {streakStats.currentStreak}{' '}
                  {streakStats.currentStreak === 1 ? 'día' : 'días'}
                </span>
                <span className="text-xs uppercase tracking-wider font-semibold text-[#8C5A3C] dark:text-[#D4A373]">
                  en racha
                </span>
              </div>
              <p className="text-xs text-[#7D746B] dark:text-[#A39A90] flex items-center gap-1 mt-0.5">
                <Trophy className="w-3.5 h-3.5 text-[#8C5A3C] dark:text-[#D4A373]" />
                Récord: {streakStats.longestStreak}{' '}
                {streakStats.longestStreak === 1 ? 'día' : 'días'} consecutivos
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[#EFECE6] dark:bg-[#2A2622] text-[#6E675F] dark:text-[#A39A90]">
            <Target className="w-3.5 h-3.5 text-[#8C5A3C] dark:text-[#D4A373]" />
            Meta: {dailyGoal}/día
          </span>
        </div>

        {/* Barra de meta diaria */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#5A534C] dark:text-[#C5BDB3]">
              Meta de hoy
            </span>
            <span className="font-mono font-semibold text-[#8C5A3C] dark:text-[#D4A373]">
              {todayReviewedInfo.totalReviews} / {dailyGoal} ({dailyPct}%)
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-[#EAE3D5] dark:bg-[#2A2622] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dailyPct}%` }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                goalCompleted
                  ? 'bg-emerald-700 dark:bg-emerald-500'
                  : 'bg-[#8C5A3C] dark:bg-[#D4A373]'
              }`}
            />
          </div>
        </div>

        <div className="pt-1 flex items-center justify-between gap-3">
          <div className="text-xs text-[#6E675F] dark:text-[#A39A90]">
            {todayReviewedInfo.totalReviews > 0 ? (
              <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                ¡Racha activa hoy! ({dueCardsCount} pendientes)
              </span>
            ) : (
              <span>Repasa al menos 1 versículo hoy para sumar a tu racha</span>
            )}
          </div>

          <button
            type="button"
            onClick={onStartDailySession}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#8C5A3C] hover:bg-[#74482E] text-white shadow-sm transition active:scale-95 shrink-0"
          >
            Repasar ahora
          </button>
        </div>
      </div>

      {/* 2.b y 2.c. Contadores Claros: Repasados Hoy y Repasados Esta Semana */}
      <div className="grid grid-cols-2 gap-3">
        {/* 2.c. Versículos repasados HOY */}
        <div className="rounded-3xl p-4 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E5DEC9] dark:border-[#332E2A] shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C5A3C] dark:text-[#D4A373]">
              Repasados Hoy
            </span>
            <BookOpen className="w-4 h-4 text-[#8C5A3C] dark:text-[#D4A373]" />
          </div>
          <div>
            <p className="text-3xl font-serif font-bold text-[#2C2825] dark:text-[#F3EFEA]">
              {todayReviewedInfo.totalReviews}
            </p>
            <p className="text-[11px] text-[#7D746B] dark:text-[#A39A90] mt-0.5">
              {todayReviewedInfo.uniqueVerses}{' '}
              {todayReviewedInfo.uniqueVerses === 1
                ? 'versículo distinto'
                : 'versículos distintos'}
            </p>
          </div>
        </div>

        {/* 2.b. Versículos repasados ESTA SEMANA */}
        <div className="rounded-3xl p-4 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E5DEC9] dark:border-[#332E2A] shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C5A3C] dark:text-[#D4A373]">
              Esta Semana
            </span>
            <CalendarCheck className="w-4 h-4 text-[#8C5A3C] dark:text-[#D4A373]" />
          </div>
          <div>
            <p className="text-3xl font-serif font-bold text-[#2C2825] dark:text-[#F3EFEA]">
              {weekReviewedInfo.totalReviews}
            </p>
            <p className="text-[11px] text-[#7D746B] dark:text-[#A39A90] mt-0.5">
              {weekReviewedInfo.uniqueVerses}{' '}
              {weekReviewedInfo.uniqueVerses === 1
                ? 'versículo distinto'
                : 'versículos distintos'}
            </p>
          </div>
        </div>
      </div>

      {/* 2.a. Paquete Memorizando y Versículos Memorizados de ese Paquete Esta Semana */}
      {activePackageStats && (
        <div className="rounded-3xl p-5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E5DEC9] dark:border-[#332E2A] shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-2 border-b border-[#EDE8DF] dark:border-[#2C2723] pb-3.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C5A3C] dark:text-[#D4A373]">
                  Paquete Memorizando
                </span>
                <span
                  style={{ backgroundColor: activePackageStats.deck.accentColor }}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-white"
                >
                  {activePackageStats.deck.code}
                </span>
              </div>
              <h3 className="text-lg font-serif font-bold text-[#2C2825] dark:text-[#F3EFEA]">
                {activePackageStats.deck.title}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => onSelectDeckToStudy(activePackageStats.deck.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#EFECE6] dark:bg-[#2A2622] text-[#8C5A3C] dark:text-[#D4A373] hover:bg-[#E2DDD5] shrink-0"
            >
              <span>Continuar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Resumen numérico del paquete esta semana */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-[#F4F0E8] dark:bg-[#24201D] border border-[#E5DEC9]/70 dark:border-[#332E2A]">
              <span className="text-[11px] text-[#6E675F] dark:text-[#A39A90] block">
                Memorizados esta semana
              </span>
              <span className="text-xl font-serif font-bold text-[#8C5A3C] dark:text-[#D4A373]">
                {activePackageStats.memorizedThisWeekCount} / {activePackageStats.totalInDeck}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#F4F0E8] dark:bg-[#24201D] border border-[#E5DEC9]/70 dark:border-[#332E2A]">
              <span className="text-[11px] text-[#6E675F] dark:text-[#A39A90] block">
                Avance total del paquete
              </span>
              <span className="text-xl font-serif font-bold text-[#2C2825] dark:text-[#F3EFEA]">
                {activePackageStats.totalLearnedInDeck} / {activePackageStats.totalInDeck}
              </span>
            </div>
          </div>

          {/* Lista de versículos memorizados de este paquete esta semana */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-[#5A534C] dark:text-[#C5BDB3]">
              Versículos de «{activePackageStats.deck.title}» practicados esta semana:
            </h4>

            {activePackageStats.memorizedThisWeekCards.length === 0 ? (
              <div className="p-3.5 rounded-2xl bg-[#F4F0E8]/60 dark:bg-[#24201D]/60 border border-dashed border-[#D5CBB8] dark:border-[#36302B] text-xs text-[#7D746B] dark:text-[#9E958B] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8C5A3C] shrink-0" />
                <span>
                  Aún no has evaluado versículos de este paquete esta semana. Pulsa en uno de los
                  botones de evaluación (Otra vez, Difícil, Bien o Fácil) tras repasar para
                  registrarlo.
                </span>
              </div>
            ) : (
              <div className="divide-y divide-[#EDE8DF] dark:divide-[#2C2723] rounded-2xl border border-[#E5DEC9] dark:border-[#332E2A] overflow-hidden bg-white/60 dark:bg-[#161412]">
                {activePackageStats.memorizedThisWeekCards.map((c) => (
                  <div
                    key={c.id}
                    className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="truncate">
                      <span className="font-mono font-bold text-[#8C5A3C] dark:text-[#D4A373] mr-2">
                        {c.id}
                      </span>
                      <span className="font-serif font-bold text-[#2C2825] dark:text-[#F3EFEA]">
                        {c.reference}
                      </span>
                      <span className="text-[#7D746B] dark:text-[#9E958B] ml-1.5">
                        — {c.topic}
                      </span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
