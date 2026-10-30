import React from 'react';
import { Sparkles, BookOpen, Repeat, Award } from 'lucide-react';
import type { Progress } from '../../types/schema';

interface MasteryFunnelProps {
  progressList: Progress[];
}

export const MasteryFunnel: React.FC<MasteryFunnelProps> = ({ progressList }) => {
  const total = Math.max(1, progressList.length);

  const counts = {
    new: progressList.filter((p) => p.stage === 'new').length,
    learning: progressList.filter((p) => p.stage === 'learning').length,
    reviewing: progressList.filter((p) => p.stage === 'reviewing').length,
    mastered: progressList.filter((p) => p.stage === 'mastered').length,
  };

  const stages = [
    {
      key: 'new',
      label: 'Nuevos',
      desc: 'Aún sin iniciar',
      count: counts.new,
      icon: Sparkles,
      barColor: 'bg-[#C8BFA8] dark:bg-[#4A433C]',
      badgeColor: 'text-[#6E675F] dark:text-[#A39A90]',
    },
    {
      key: 'learning',
      label: 'En Aprendizaje',
      desc: 'Intervalo < 7 días',
      count: counts.learning,
      icon: BookOpen,
      barColor: 'bg-amber-700/80 dark:bg-amber-500/80',
      badgeColor: 'text-amber-900 dark:text-amber-300',
    },
    {
      key: 'reviewing',
      label: 'Repaso Frecuente',
      desc: 'Intervalo 7–20 días',
      count: counts.reviewing,
      icon: Repeat,
      barColor: 'bg-[#8C5A3C] dark:bg-[#D4A373]',
      badgeColor: 'text-[#8C5A3C] dark:text-[#D4A373]',
    },
    {
      key: 'mastered',
      label: 'Dominados',
      desc: 'Intervalo +21 días',
      count: counts.mastered,
      icon: Award,
      barColor: 'bg-emerald-700 dark:bg-emerald-500',
      badgeColor: 'text-emerald-800 dark:text-emerald-300',
    },
  ];

  return (
    <div className="rounded-3xl p-5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E5DEC9] dark:border-[#332E2A] shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-serif font-bold uppercase tracking-wider text-[#2C2825] dark:text-[#F3EFEA]">
            Embudo de Dominio TMS
          </h3>
          <p className="text-xs text-[#7D746B] dark:text-[#A39A90]">
            Estado actual de tus {progressList.length} versículos cargados
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[#EFECE6] dark:bg-[#2A2622] text-[#8C5A3C] dark:text-[#D4A373] font-semibold">
          {counts.mastered + counts.reviewing}/{progressList.length} retenidos
        </span>
      </div>

      {/* Barra segmentada multicapa */}
      <div className="w-full h-3 rounded-full bg-[#EAE3D5] dark:bg-[#26221E] overflow-hidden flex">
        {stages.map((s) => {
          const widthPct = (s.count / total) * 100;
          if (widthPct === 0) return null;
          return (
            <div
              key={s.key}
              style={{ width: `${widthPct}%` }}
              className={`h-full transition-all duration-500 ${s.barColor}`}
              title={`${s.label}: ${s.count}`}
            />
          );
        })}
      </div>

      {/* Tarjetas de las 4 fases del embudo */}
      <div className="grid grid-cols-2 gap-2.5">
        {stages.map(({ key, label, desc, count, icon: Icon, badgeColor }) => (
          <div
            key={key}
            className="p-3 rounded-2xl bg-[#F4F0E8]/80 dark:bg-[#24201D] border border-[#E5DEC9]/70 dark:border-[#332E2A] flex items-start justify-between"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${badgeColor}`} />
                <span className="text-xs font-semibold text-[#2C2825] dark:text-[#F3EFEA]">
                  {label}
                </span>
              </div>
              <p className="text-[11px] text-[#7D746B] dark:text-[#9E958B]">{desc}</p>
            </div>
            <span className={`text-lg font-serif font-bold ${badgeColor}`}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
