import React, { useState } from 'react';
import {
  ChevronRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  FolderPlus,
} from 'lucide-react';
import type { Card, Deck, Progress, SeriesId } from '../../types/schema';

interface SeriesExplorerProps {
  decks: Deck[];
  cards: Card[];
  progressMap: Map<string, Progress>;
  onSelectCardToStudy: (card: Card) => void;
  onStartDeckSession: (deckId: SeriesId) => void;
  onOpenImportModal: () => void;
  onDeleteCustomDeck: (deckId: SeriesId) => void;
}

export const SeriesExplorer: React.FC<SeriesExplorerProps> = ({
  decks,
  cards,
  progressMap,
  onSelectCardToStudy,
  onStartDeckSession,
  onOpenImportModal,
  onDeleteCustomDeck,
}) => {
  const [expandedSeries, setExpandedSeries] = useState<SeriesId | null>('A');

  return (
    <div className="space-y-3">
      {/* Banner superior para Cargar Nuevos Grupos de Versículos */}
      <div className="rounded-3xl p-4 bg-[#F4F0E8] dark:bg-[#221F1C] border border-[#E5DEC9] dark:border-[#332E2A] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#8C5A3C]/15 text-[#8C5A3C] dark:text-[#D4A373] flex items-center justify-center shrink-0">
            <FolderPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-serif font-bold text-[#2C2825] dark:text-[#F3EFEA]">
              Grupos y Series de Versículos
            </h2>
            <p className="text-xs text-[#6E675F] dark:text-[#9E958B]">
              {decks.length} grupos activos ({cards.length} versículos en total)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenImportModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold bg-[#8C5A3C] hover:bg-[#74482E] text-white shadow-sm transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Cargar Grupo
        </button>
      </div>

      {decks.map((deck) => {
        const deckCards = cards
          .filter((c) => c.deckId === deck.id)
          .sort((a, b) => a.seriesOrder - b.seriesOrder);

        const learnedCount = deckCards.filter((c) => {
          const p = progressMap.get(c.id);
          return p && p.stage !== 'new';
        }).length;

        const isOpen = expandedSeries === deck.id;

        return (
          <div
            key={deck.id}
            className="rounded-3xl bg-[#FAF8F5] dark:bg-[#1C1917] border border-[#E5DEC9] dark:border-[#332E2A] overflow-hidden shadow-sm transition"
          >
            {/* Cabecera del Mazo / Serie */}
            <div
              onClick={() => setExpandedSeries(isOpen ? null : deck.id)}
              className="p-5 cursor-pointer flex items-center justify-between gap-3 hover:bg-[#F4F0E8]/60 dark:hover:bg-[#24201D] transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    style={{ backgroundColor: deck.accentColor }}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-white"
                  >
                    {deck.code}
                  </span>
                  {deck.isCustom && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EFECE6] dark:bg-[#2C2723] text-[#8C5A3C] dark:text-[#D4A373]">
                      Personalizado
                    </span>
                  )}
                  <span className="text-xs font-mono text-[#7D746B] dark:text-[#A39A90]">
                    {learnedCount}/{deckCards.length} iniciados
                  </span>
                </div>
                <h3 className="text-lg font-serif font-bold text-[#2C2825] dark:text-[#F3EFEA]">
                  {deck.title}
                </h3>
                <p className="text-xs text-[#6E675F] dark:text-[#A39A90] line-clamp-2">
                  {deck.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {deck.isCustom && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCustomDeck(deck.id);
                    }}
                    title="Eliminar este grupo personalizado"
                    className="p-2 rounded-xl text-[#8A8178] hover:text-red-700 hover:bg-red-900/10 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartDeckSession(deck.id);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#EFECE6] dark:bg-[#2C2723] text-[#8C5A3C] dark:text-[#D4A373] hover:bg-[#E2DDD5] transition"
                >
                  Practicar
                </button>
                <ChevronRight
                  className={`w-5 h-5 text-[#8A8178] transition-transform ${
                    isOpen ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </div>

            {/* Lista desplegable de los versículos del grupo */}
            {isOpen && (
              <div className="border-t border-[#EDE8DF] dark:border-[#2C2723] divide-y divide-[#EDE8DF] dark:divide-[#26221E] bg-[#F6F3EC]/50 dark:bg-[#161412]">
                {deckCards.map((card) => {
                  const prog = progressMap.get(card.id);
                  const stage = prog?.stage || 'new';

                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => onSelectCardToStudy(card)}
                      className="w-full text-left px-5 py-3.5 flex items-start justify-between gap-3 hover:bg-[#EFECE6]/70 dark:hover:bg-[#221F1C] transition"
                    >
                      <div className="space-y-1 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-[#8C5A3C] dark:text-[#D4A373]">
                            {card.id}
                          </span>
                          <span className="text-xs font-semibold text-[#5A534C] dark:text-[#B8AFA6]">
                            {card.topic}
                          </span>
                          <span className="text-xs font-serif font-bold text-[#2C2825] dark:text-[#F3EFEA]">
                            — {card.reference}
                          </span>
                        </div>
                        <p className="text-xs font-serif text-[#6E675F] dark:text-[#9E958B] line-clamp-2 italic">
                          “{card.text}”
                        </p>
                      </div>

                      <div className="shrink-0 pt-1">
                        {stage === 'mastered' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 dark:text-emerald-400 bg-emerald-900/10 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            {prog?.intervalDays}d
                          </span>
                        )}
                        {(stage === 'learning' || stage === 'reviewing') && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8C5A3C] dark:text-[#D4A373] bg-[#8C5A3C]/10 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            {prog?.intervalDays}d
                          </span>
                        )}
                        {stage === 'new' && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#8A8178] bg-[#EFECE6] dark:bg-[#26221E] px-2 py-0.5 rounded-full">
                            <Sparkles className="w-3 h-3" />
                            Nuevo
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
