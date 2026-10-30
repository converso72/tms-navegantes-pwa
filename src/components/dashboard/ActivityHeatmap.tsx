import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import type { ReviewLog } from '../../types/schema';
import { getLocalDateKey } from '../../db/srs-engine';

interface ActivityHeatmapProps {
  reviewLogs: ReviewLog[];
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ reviewLogs }) => {
  // Generar los últimos 28 días (4 semanas) para visualización móvil limpia
  const daysGrid = useMemo(() => {
    const countsByDate = new Map<string, number>();
    reviewLogs.forEach((log) => {
      countsByDate.set(log.dateKey, (countsByDate.get(log.dateKey) || 0) + 1);
    });

    const days: { dateKey: string; dayNum: number; label: string; count: number }[] = [];
    const today = new Date();

    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = getLocalDateKey(d);
      const shortDay = d.toLocaleDateString('es-ES', { weekday: 'narrow', day: 'numeric', month: 'short' });
      days.push({
        dateKey,
        dayNum: d.getDate(),
        label: shortDay,
        count: countsByDate.get(dateKey) || 0,
      });
    }

    return days;
  }, [reviewLogs]);

  const getCellStyle = (count: number) => {
    if (count === 0) {
      return 'bg-[#EFECE6] dark:bg-[#26221E] text-[#9E958B] border-[#E2DDD5] dark:border-[#332E2A]';
    }
    if (count <= 2) {
      return 'bg-[#8C5A3C]/25 dark:bg-[#D4A373]/25 text-[#2C2825] dark:text-[#F3EFEA] border-[#8C5A3C]/40';
    }
    if (count <= 5) {
      return 'bg-[#8C5A3C]/60 dark:bg-[#D4A373]/60 text-white dark:text-[#141210] border-[#8C5A3C] font-semibold';
    }
    return 'bg-[#8C5A3C] dark:bg-[#D4A373] text-white dark:text-[#141210] border-[#74482E] font-bold shadow-sm';
  };

  return (
    <div className="rounded-3xl p-5 bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E5DEC9] dark:border-[#332E2A] shadow-sm space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#8C5A3C] dark:text-[#D4A373]" />
          <div>
            <h3 className="text-sm font-serif font-bold uppercase tracking-wider text-[#2C2825] dark:text-[#F3EFEA]">
              Mapa de Calor (Últimos 28 días)
            </h3>
            <p className="text-xs text-[#7D746B] dark:text-[#A39A90]">
              Constancia semanal y mensual de repaso
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-[#7D746B] dark:text-[#A39A90]">
          {reviewLogs.length} repasos totales
        </span>
      </div>

      {/* Cuadrícula de 7 columnas x 4 semanas */}
      <div className="grid grid-cols-7 gap-2 pt-1">
        {daysGrid.map((day) => (
          <div
            key={day.dateKey}
            title={`${day.dateKey}: ${day.count} versículos repasados`}
            className={`aspect-square rounded-xl border flex flex-col items-center justify-center text-xs transition ${getCellStyle(
              day.count
            )}`}
          >
            <span className="text-[11px]">{day.dayNum}</span>
            {day.count > 0 && (
              <span className="text-[9px] font-mono opacity-90">{day.count}v</span>
            )}
          </div>
        ))}
      </div>

      {/* Leyenda del mapa de calor */}
      <div className="flex items-center justify-between text-[11px] text-[#7D746B] dark:text-[#9E958B] pt-1">
        <span>Menos actividad</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#EFECE6] dark:bg-[#26221E] border border-[#E2DDD5] dark:border-[#332E2A]" />
          <span className="w-3 h-3 rounded bg-[#8C5A3C]/25 dark:bg-[#D4A373]/25" />
          <span className="w-3 h-3 rounded bg-[#8C5A3C]/60 dark:bg-[#D4A373]/60" />
          <span className="w-3 h-3 rounded bg-[#8C5A3C] dark:bg-[#D4A373]" />
        </div>
        <span>Meta superada</span>
      </div>
    </div>
  );
};
