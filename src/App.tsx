import React, { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  BookOpen,
  LayoutDashboard,
  Library,
  SlidersHorizontal,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import {
  db,
  deleteCustomDeckGroup,
  ensureDatabaseSeeded,
  recordCardReview,
} from './db/dexie-db';
import { getLocalDateKey } from './db/srs-engine';
import type { Card, Progress, SeriesId, SRSRating, StudyMode } from './types/schema';
import { MemoryCard } from './components/study/MemoryCard';
import { StreakCounter } from './components/dashboard/StreakCounter';
import { MasteryFunnel } from './components/dashboard/MasteryFunnel';
import { ActivityHeatmap } from './components/dashboard/ActivityHeatmap';
import { SeriesExplorer } from './components/dashboard/SeriesExplorer';
import { SettingsPanel } from './components/dashboard/SettingsModal';
import { ImportGroupModal } from './components/dashboard/ImportGroupModal';
import { APP_VERSION } from './version';

type NavTab = 'study' | 'dashboard' | 'series' | 'settings';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('study');
  const [selectedCardId, setSelectedCardId] = useState<string>('A-1');
  const [lastFeedbackToast, setLastFeedbackToast] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // Sembrar base de datos IndexedDB al iniciar
  useEffect(() => {
    ensureDatabaseSeeded();
  }, []);

  // Consultas reactivas en tiempo real desde IndexedDB con Dexie
  const decks = useLiveQuery(() => db.decks.orderBy('order').toArray(), []) ?? [];
  const cards = useLiveQuery(() => db.cards.orderBy('globalOrder').toArray(), []) ?? [];
  const progressList = useLiveQuery(() => db.progress.toArray(), []) ?? [];
  const reviewLogs = useLiveQuery(() => db.reviewLogs.toArray(), []) ?? [];
  const settings = useLiveQuery(() => db.settings.get('default'), []);

  // Sincronizar modo oscuro con la clase 'dark' en <html>
  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings?.theme]);

  const progressMap = useMemo(() => {
    const map = new Map<string, Progress>();
    progressList.forEach((p) => map.set(p.cardId, p));
    return map;
  }, [progressList]);

  const todayKey = getLocalDateKey();

  const todayReviewedCount = useMemo(() => {
    return reviewLogs.filter((log) => log.dateKey === todayKey).length;
  }, [reviewLogs, todayKey]);

  const dueCards = useMemo(() => {
    return cards.filter((c) => {
      const p = progressMap.get(c.id);
      if (!p) return true;
      return p.dueDate <= todayKey;
    });
  }, [cards, progressMap, todayKey]);

  const currentCard: Card | undefined = useMemo(() => {
    return cards.find((c) => c.id === selectedCardId) || cards[0];
  }, [cards, selectedCardId]);

  const currentDeck = useMemo(() => {
    if (!currentCard) return undefined;
    return decks.find((d) => d.id === currentCard.deckId);
  }, [decks, currentCard]);

  // Navegar al siguiente o anterior versículo
  const navigateCard = (direction: 'prev' | 'next') => {
    if (!currentCard || cards.length === 0) return;
    const currentIndex = cards.findIndex((c) => c.id === currentCard.id);
    const nextIndex =
      direction === 'next'
        ? (currentIndex + 1) % cards.length
        : (currentIndex - 1 + cards.length) % cards.length;
    setSelectedCardId(cards[nextIndex].id);
  };

  // Calificar tarjeta con SRS y avanzar automáticamente al siguiente versículo pendiente
  const handleRateCard = async (
    cardId: string,
    rating: SRSRating,
    mode: StudyMode,
    durationMs: number
  ) => {
    await recordCardReview(cardId, rating, mode, durationMs);

    const ratingLabels: Record<SRSRating, string> = {
      again: 'Programado para mañana (1d)',
      hard: 'Repaso en 3 días',
      good: '¡Bien hecho! Repaso en 7+ días',
      easy: '¡Dominado! Repaso en 14+ días',
    };

    setLastFeedbackToast(`${cardId}: ${ratingLabels[rating]}`);
    setTimeout(() => setLastFeedbackToast(null), 2600);

    // Pasar al siguiente versículo
    navigateCard('next');
  };

  const handleUpdateSettings = async (partial: Partial<NonNullable<typeof settings>>) => {
    if (!settings) return;
    await db.settings.put({ ...settings, ...partial });
  };

  const handleResetAllProgress = async () => {
    const today = getLocalDateKey();
    const resetItems: Progress[] = cards.map((card) => ({
      cardId: card.id,
      stage: 'new',
      intervalDays: 0,
      easeFactor: 2.5,
      repetitions: 0,
      lapses: 0,
      dueDate: today,
      lastReviewedAt: null,
      completedModes: [],
    }));
    await db.transaction('rw', db.progress, db.reviewLogs, db.settings, async () => {
      await db.progress.bulkPut(resetItems);
      await db.reviewLogs.clear();
      if (settings) {
        await db.settings.put({
          ...settings,
          currentStreak: 0,
          lastActiveDate: null,
        });
      }
    });
  };

  const handleDeleteCustomDeck = async (deckId: SeriesId) => {
    await deleteCustomDeckGroup(deckId);
    setSelectedCardId('A-1');
    setLastFeedbackToast(`Grupo ${deckId} eliminado`);
    setTimeout(() => setLastFeedbackToast(null), 2400);
  };

  if (!currentCard || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] dark:bg-[#141210] text-[#8C5A3C]">
        <p className="font-serif text-lg animate-pulse">
          Cargando Las Series de Los Navegantes (RVR1960)...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] dark:bg-[#141210] text-[#2C2825] dark:text-[#F3EFEA] pb-24">
      {/* Cabecera Superior Editorial Mobile-First con margen seguro para Status Bar Android/iOS */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#FAF8F5]/95 dark:bg-[#141210]/95 border-b border-[#E5DEC9] dark:border-[#2C2723] px-4 pt-9 pb-3">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <h1 className="text-lg font-serif font-bold tracking-tight whitespace-nowrap">
              Los Navegantes • RVR1960
            </h1>
            <span className="text-[10px] font-mono font-semibold text-[#8C5A3C] dark:text-[#D4A373] bg-[#EFECE6] dark:bg-[#26221E] px-1.5 py-0.5 rounded-md">
              v{APP_VERSION}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Botón rápido para Cargar Grupo de Versículos */}
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              title="Cargar nuevo grupo de versículos"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#8C5A3C] text-white text-xs font-semibold shadow-sm hover:bg-[#74482E] transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cargar</span>
            </button>

            {/* Píldora de progreso diario visible en todo momento */}
            <div className="px-2.5 py-1 rounded-full bg-[#EFECE6] dark:bg-[#26221E] border border-[#E2DDD5] dark:border-[#36302B] text-xs font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8C5A3C] dark:bg-[#D4A373]" />
              <span>
                {todayReviewedCount}/{settings.dailyGoalCards}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                handleUpdateSettings({
                  theme: settings.theme === 'dark' ? 'light' : 'dark',
                })
              }
              aria-label="Cambiar tema claro u oscuro"
              className="p-2 rounded-full bg-[#EFECE6] dark:bg-[#26221E] text-[#6E675F] dark:text-[#D4A373] hover:opacity-80 transition"
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Notificación flotante tras evaluar tarjeta o importar grupo */}
      {lastFeedbackToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-[#2C2825] dark:bg-[#F3EFEA] text-[#FAF8F5] dark:text-[#141210] text-xs font-medium shadow-lg flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-700" />
          <span>{lastFeedbackToast}</span>
        </div>
      )}

      {/* Modal para Cargar Grupos de Versículos */}
      {isImportModalOpen && (
        <ImportGroupModal
          onClose={() => setIsImportModalOpen(false)}
          onImported={(deckId, count) => {
            setIsImportModalOpen(false);
            setSelectedCardId(`${deckId}-1`);
            setActiveTab('study');
            setLastFeedbackToast(`¡Grupo ${deckId} cargado (${count} versículos)!`);
            setTimeout(() => setLastFeedbackToast(null), 3200);
          }}
        />
      )}

      {/* Contenido Principal */}
      <main className="flex-1 w-full max-w-md mx-auto pt-3 px-3">
        {activeTab === 'study' && (
          <div className="space-y-3">
            {/* Barra de navegación rápida entre todos los Grupos y Series */}
            <div className="flex items-center justify-between px-2 gap-1">
              <button
                type="button"
                onClick={() => navigateCard('prev')}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#6E675F] dark:text-[#A39A90] hover:text-[#2C2825] px-2 py-1 rounded-lg shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
                Ant.
              </button>

              <div className="flex items-center gap-1 overflow-x-auto py-1 no-scrollbar">
                {decks.map((deck) => {
                  const isCurrentSeries = currentCard.deckId === deck.id;
                  return (
                    <button
                      key={deck.id}
                      type="button"
                      onClick={() => setSelectedCardId(`${deck.id}-1`)}
                      className={`px-2.5 h-7 rounded-full text-xs font-serif font-bold transition shrink-0 ${
                        isCurrentSeries
                          ? 'bg-[#8C5A3C] text-white shadow-sm'
                          : 'bg-[#EFECE6] dark:bg-[#26221E] text-[#6E675F] dark:text-[#A39A90]'
                      }`}
                      title={`Ir a ${deck.title}`}
                    >
                      {deck.id}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => navigateCard('next')}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#6E675F] dark:text-[#A39A90] hover:text-[#2C2825] px-2 py-1 rounded-lg shrink-0"
              >
                Sig.
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Tarjeta Interactiva Multi-Fase (Flashcard 3D, Primera Letra, Huecos, Dictado) */}
            <MemoryCard
              card={currentCard}
              seriesTitle={currentDeck ? `${currentDeck.code}: ${currentDeck.title}` : undefined}
              onRateCard={handleRateCard}
            />
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-4 py-1">
            <StreakCounter
              currentStreak={settings.currentStreak}
              longestStreak={settings.longestStreak}
              todayReviewedCount={todayReviewedCount}
              dailyGoal={settings.dailyGoalCards}
              dueCardsCount={dueCards.length}
              onStartDailySession={() => {
                if (dueCards.length > 0) {
                  setSelectedCardId(dueCards[0].id);
                }
                setActiveTab('study');
              }}
            />

            <MasteryFunnel progressList={progressList} />

            <ActivityHeatmap reviewLogs={reviewLogs} />
          </div>
        )}

        {activeTab === 'series' && (
          <div className="py-1">
            <SeriesExplorer
              decks={decks}
              cards={cards}
              progressMap={progressMap}
              onSelectCardToStudy={(card) => {
                setSelectedCardId(card.id);
                setActiveTab('study');
              }}
              onStartDeckSession={(deckId) => {
                setSelectedCardId(`${deckId}-1`);
                setActiveTab('study');
              }}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onDeleteCustomDeck={handleDeleteCustomDeck}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="py-1">
            <SettingsPanel
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onResetAllProgress={handleResetAllProgress}
            />
          </div>
        )}
      </main>

      {/* Barra de Navegación Inferior Mobile-First */}
      <nav
        aria-label="Navegación principal"
        className="fixed bottom-0 inset-x-0 z-30 bg-[#FAF8F5]/95 dark:bg-[#181614]/95 backdrop-blur-md border-t border-[#E5DEC9] dark:border-[#2C2723]"
      >
        <div className="max-w-md mx-auto grid grid-cols-4 py-2 px-3">
          {[
            { id: 'study', label: 'Memorizar', icon: BookOpen },
            { id: 'series', label: 'Grupos', icon: Library },
            { id: 'dashboard', label: 'Progreso', icon: LayoutDashboard },
            { id: 'settings', label: 'Ajustes', icon: SlidersHorizontal },
          ].map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id as NavTab)}
                className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
                  active
                    ? 'text-[#8C5A3C] dark:text-[#D4A373] font-semibold'
                    : 'text-[#7D746B] dark:text-[#8E857B]'
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[11px]">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
export default App;
