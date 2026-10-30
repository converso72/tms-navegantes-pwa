import React from 'react';
import { Flame, Trophy, CheckCircle2, Target } from 'lucide-react';
import { motion } from 'framer-motion';

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  todayReviewedCount: number;
  dailyGoal: number;
  dueCardsCount: number;
  onStartDailySession: () => void;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({
  currentStreak,
  longestStreak,
  todayReviewedCount,
  dailyGoal,
  dueCardsCount,
  onStartDailySession,
}) => {
  const percentage = Math.min(100, Math.round((todayReviewedCount / Math.max(1, dailyGoal)) * 100));
  const goalCompleted = todayReviewedCount >= dailyGoal;

  return (
    <div className="rounded-3xl p-5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E5DEC9] dark:border-[#332E2A] shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
              currentStreak > 0
                ? 'bg-[#8C5A3C]/15 border-[#8C5A3C]/40 text-[#8C5A3C] dark:text-[#D4A373]'
                : 'bg-[#EFECE6] dark:bg-[#26221E] border-[#E2DDD5] dark:border-[#3A342F] text-[#8A8178]'
            }`}
          >
            <Flame className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-serif font-bold text-[#2C2825] dark:text-[#F3EFEA]">
                {currentStreak} {currentStreak === 1 ? 'día' : 'días'}
              </span>
              <span className="text-xs uppercase tracking-wider font-semibold text-[#8C5A3C] dark:text-[#D4A373]">
                en racha
              </span>
            </div>
            <p className="text-xs text-[#7D746B] dark:text-[#A39A90] flex items-center gap-1 mt-0.5">
              <Trophy className="w-3.5 h-3.5 text-[#8C5A3C] dark:text-[#D4A373]" />
              Récord personal: {longestStreak} días consecutivos
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[#EFECE6] dark:bg-[#2A2622] text-[#6E675F] dark:text-[#A39A90]">
            <Target className="w-3.5 h-3.5 text-[#8C5A3C] dark:text-[#D4A373]" />
            Meta: {dailyGoal}/día
          </span>
        </div>
      </div>

      {/* Barra de progreso diaria */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[#5A534C] dark:text-[#C5BDB3]">
            Progreso de meditación hoy
          </span>
          <span className="font-mono font-semibold text-[#8C5A3C] dark:text-[#D4A373]">
            {todayReviewedCount} / {dailyGoal} versículos ({percentage}%)
          </span>
        </div>

        <div className="w-full h-2.5 rounded-full bg-[#EAE3D5] dark:bg-[#2A2622] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              goalCompleted
                ? 'bg-emerald-700 dark:bg-emerald-500'
                : 'bg-[#8C5A3C] dark:bg-[#D4A373]'
            }`}
          />
        </div>
      </div>

      {/* CTA principal para iniciar la sesión programada */}
      <div className="pt-1 flex items-center justify-between gap-3">
        <div className="text-xs text-[#6E675F] dark:text-[#A39A90]">
          {goalCompleted ? (
            <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              ¡Meta diaria cumplida! ({dueCardsCount} pendientes para hoy)
            </span>
          ) : (
            <span>Tienes {dueCardsCount} versículos listos para repasar hoy</span>
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
  );
};
