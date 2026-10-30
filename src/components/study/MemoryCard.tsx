import React, { useState, useMemo, useEffect } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  PanInfo,
} from 'framer-motion';
import {
  BookOpen,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  Keyboard,
  Puzzle,
  Layers,
  CheckCircle2,
  CornerDownLeft,
} from 'lucide-react';
import type { Card, StudyMode, SRSRating } from '../../types/schema';
import { tokenizeVerse, formatFirstLetterToken, normalizeChar } from '../../lib/text-utils';

interface MemoryCardProps {
  card: Card;
  seriesTitle?: string;
  initialMode?: StudyMode;
  onRateCard: (cardId: string, rating: SRSRating, mode: StudyMode, durationMs: number) => void;
}

const SWIPE_THRESHOLD = 105;

export const MemoryCard: React.FC<MemoryCardProps> = ({
  card,
  seriesTitle = 'Los Navegantes • TMS',
  initialMode = 'flashcard',
  onRateCard,
}) => {
  const [mode, setMode] = useState<StudyMode>(initialMode);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [clozeSolvedIndices, setClozeSolvedIndices] = useState<Set<number>>(new Set());
  const [dictationCursor, setDictationCursor] = useState<number>(0);
  const [dictationError, setDictationError] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Tokens del versículo
  const tokens = useMemo(() => tokenizeVerse(card.text), [card.text]);

  // Selección determinista/semántica de huecos para el modo Cloze Deletion
  const clozeTargetIndices = useMemo(() => {
    const keywordSet = new Set(card.keywords.map((k) => k.toLowerCase()));
    const indices = new Set<number>();
    tokens.forEach((t) => {
      if (keywordSet.has(t.cleanWord.toLowerCase()) || t.cleanWord.length >= 6) {
        indices.add(t.index);
      }
    });
    return indices;
  }, [card.keywords, tokens]);

  // Reiniciar estados internos al cambiar de versículo o modo
  useEffect(() => {
    setIsFlipped(false);
    setRevealedIndices(new Set());
    setClozeSolvedIndices(new Set());
    setDictationCursor(0);
    setDictationError(false);
    setStartTime(Date.now());
  }, [card.id, mode]);

  // Valores físicos Framer Motion para el gesto Swipe Horizontal
  const x = useMotionValue(0);
  const rotateZ = useTransform(x, [-220, 0, 220], [-9, 0, 9]);
  const cardOpacity = useTransform(x, [-260, -140, 0, 140, 260], [0.6, 0.95, 1, 0.95, 0.6]);

  // Indicadores visuales flotantes al arrastrar a izquierda ("Otra vez") o derecha ("Bien")
  const rightBadgeOpacity = useTransform(x, [25, SWIPE_THRESHOLD], [0, 1]);
  const leftBadgeOpacity = useTransform(x, [-SWIPE_THRESHOLD, -25], [1, 0]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const elapsed = Date.now() - startTime;
    if (info.offset.x > SWIPE_THRESHOLD) {
      onRateCard(card.id, 'good', mode, elapsed);
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onRateCard(card.id, 'again', mode, elapsed);
    }
  };

  // Revelar o esconder una palabra puntual en el modo Primera Letra
  const toggleWordReveal = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setRevealedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const revealNextUnrevealedWord = () => {
    const nextToken = tokens.find((t) => !revealedIndices.has(t.index));
    if (nextToken) {
      setRevealedIndices((prev) => new Set(prev).add(nextToken.index));
    }
  };

  // Manejador de teclado para el Modo 4 (Dictado por primera letra)
  const handleDictationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (dictationCursor >= tokens.length) return;
    const key = e.key;
    if (key.length !== 1) return; // Ignorar teclas de control
    e.preventDefault();

    const expectedInitial = tokens[dictationCursor].normalizedInitial;
    const pressedNormalized = normalizeChar(key);

    if (pressedNormalized === expectedInitial) {
      setDictationError(false);
      setDictationCursor((prev) => prev + 1);
    } else {
      setDictationError(true);
    }
  };

  const handleRateButton = (rating: SRSRating) => {
    const elapsed = Date.now() - startTime;
    onRateCard(card.id, rating, mode, elapsed);
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4 select-none px-2">
      {/* Selector de las 4 Fases de Memorización */}
      <div
        role="tablist"
        aria-label="Modos de memorización"
        className="grid grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-[#EFECE6] dark:bg-[#23201D] border border-[#E2DDD5] dark:border-[#332E2A]"
      >
        {[
          { id: 'flashcard', label: 'Tarjeta 3D', icon: Layers },
          { id: 'first-letter', label: 'Iniciales', icon: Sparkles },
          { id: 'cloze', label: 'Huecos', icon: Puzzle },
          { id: 'dictation', label: 'Dictado', icon: Keyboard },
        ].map(({ id, label, icon: Icon }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => setMode(id as StudyMode)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-medium transition-all ${
                active
                  ? 'bg-[#FAF8F5] dark:bg-[#181614] text-[#8C5A3C] dark:text-[#D4A373] shadow-sm border border-[#E2DDD5]/70 dark:border-[#3A342F]'
                  : 'text-[#6E675F] dark:text-[#9E958B] hover:text-[#2C2825] dark:hover:text-[#EAE4DC]'
              }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenedor con Perspectiva 3D y Gestos Swipe */}
      <div className="relative w-full min-h-[410px] [perspective:1200px]">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.65}
          onDragEnd={handleDragEnd}
          style={{ x, rotateZ, opacity: cardOpacity }}
          className="relative w-full min-h-[410px] cursor-grab active:cursor-grabbing"
        >
          {/* Badges flotantes de Swipe */}
          <motion.div
            style={{ opacity: rightBadgeOpacity }}
            className="pointer-events-none absolute top-5 left-5 z-30 px-3.5 py-1.5 rounded-full bg-emerald-700/90 text-white text-xs font-semibold tracking-wider uppercase shadow-md"
          >
            Bien • +7 días
          </motion.div>
          <motion.div
            style={{ opacity: leftBadgeOpacity }}
            className="pointer-events-none absolute top-5 right-5 z-30 px-3.5 py-1.5 rounded-full bg-amber-800/90 text-white text-xs font-semibold tracking-wider uppercase shadow-md"
          >
            Repasar • 1 día
          </motion.div>

          {/* MODO 1: FLASHCARD CLÁSICA 3D (Tap to Flip) */}
          {mode === 'flashcard' && (
            <motion.div
              onClick={() => setIsFlipped((prev) => !prev)}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
              className="relative w-full min-h-[410px] [transform-style:preserve-3d] rounded-3xl shadow-[0_12px_32px_-8px_rgba(44,40,37,0.10)] border border-[#E5DEC9] dark:border-[#332E2A] bg-[#FAF8F5] dark:bg-[#1C1917]"
            >
              {/* FRENTE DE LA TARJETA (Tema + Cita) */}
              <div className="absolute inset-0 [backface-visibility:hidden] p-7 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-[#EDE8DF] dark:border-[#2C2723] pb-3.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C5A3C] dark:text-[#D4A373]">
                    {card.id} • {seriesTitle}
                  </span>
                  <span className="text-[11px] font-mono text-[#8A8178] bg-[#F1ECE2] dark:bg-[#272320] px-2.5 py-0.5 rounded-full">
                    {card.translation}
                  </span>
                </div>

                <div className="my-auto text-center space-y-4 py-8">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#7D746B] dark:text-[#A39A90]">
                    Tema del Versículo
                  </p>
                  <h2 className="text-2xl font-serif font-medium text-[#2C2825] dark:text-[#F3EFEA] tracking-tight">
                    {card.topic}
                  </h2>
                  <div className="w-12 h-[1.5px] bg-[#8C5A3C]/40 mx-auto my-3" />
                  <p className="text-3xl font-serif font-semibold text-[#8C5A3C] dark:text-[#D4A373]">
                    {card.reference}
                  </p>
                </div>

                <div className="text-center pt-3 border-t border-[#EDE8DF] dark:border-[#2C2723]">
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#8A8178] dark:text-[#9E958B]">
                    <BookOpen className="w-3.5 h-3.5" />
                    Toca la tarjeta para voltear (3D) o desliza para evaluar
                  </span>
                </div>
              </div>

              {/* REVERSO DE LA TARJETA (Regla Los Navegantes: Cita + Versículo + Cita) */}
              <div
                style={{ transform: 'rotateY(180deg)' }}
                className="absolute inset-0 [backface-visibility:hidden] p-7 flex flex-col justify-between bg-[#FAF8F5] dark:bg-[#1C1917] rounded-3xl"
              >
                <div className="flex items-center justify-between border-b border-[#EDE8DF] dark:border-[#2C2723] pb-3">
                  <span className="text-xs font-medium text-[#6E675F] dark:text-[#A39A90]">
                    {card.topic}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-[#8C5A3C] dark:text-[#D4A373] font-semibold">
                    Regla TMS: Cita • Texto • Cita
                  </span>
                </div>

                <div className="my-auto py-4 space-y-4 text-center">
                  {/* Cita al principio obligatoria */}
                  <p className="text-sm font-serif font-bold tracking-wide uppercase text-[#8C5A3C] dark:text-[#D4A373]">
                    « {card.reference} »
                  </p>

                  {/* Cuerpo del versículo en Serif clásica editorial */}
                  <blockquote className="font-serif text-[21px] leading-[1.65] text-[#26221E] dark:text-[#F2ECE4] px-1">
                    “{card.text}”
                  </blockquote>

                  {/* Cita al final obligatoria */}
                  <p className="text-sm font-serif font-bold tracking-wide uppercase text-[#8C5A3C] dark:text-[#D4A373]">
                    « {card.reference} »
                  </p>
                </div>

                <div className="text-center pt-3 border-t border-[#EDE8DF] dark:border-[#2C2723] flex items-center justify-between text-xs text-[#8A8178]">
                  <span>Toca para volver al frente</span>
                  <span>Desliza ← / →</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* MODO 2: MÉTODO DE PRIMERA LETRA (First-Letter Prompt) */}
          {mode === 'first-letter' && (
            <div className="w-full min-h-[410px] p-6 rounded-3xl shadow-[0_12px_32px_-8px_rgba(44,40,37,0.10)] border border-[#E5DEC9] dark:border-[#332E2A] bg-[#FAF8F5] dark:bg-[#1C1917] flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#EDE8DF] dark:border-[#2C2723] pb-3">
                <div>
                  <span className="text-[11px] uppercase tracking-widest text-[#8C5A3C] dark:text-[#D4A373] font-semibold block">
                    {card.topic}
                  </span>
                  <h3 className="text-lg font-serif font-bold text-[#2C2825] dark:text-[#F3EFEA]">
                    {card.reference}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={revealNextUnrevealedWord}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#EFECE6] dark:bg-[#2A2622] text-[#8C5A3C] dark:text-[#D4A373] hover:bg-[#E5DEC9] transition"
                    title="Revelar siguiente palabra si te atascas"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Pista
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRevealedIndices(
                        revealedIndices.size === tokens.length
                          ? new Set()
                          : new Set(tokens.map((t) => t.index))
                      )
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[#EFECE6] dark:bg-[#2A2622] text-[#6E675F] dark:text-[#A39A90]"
                    title="Alternar todas las palabras"
                  >
                    {revealedIndices.size === tokens.length ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Cuerpo interactivo de iniciales */}
              <div className="my-auto py-5 space-y-4">
                <p className="text-xs font-serif font-bold uppercase tracking-wider text-[#8C5A3C] dark:text-[#D4A373]">
                  1. Cita inicial: {card.reference}
                </p>

                <div className="flex flex-wrap gap-2 items-baseline leading-relaxed">
                  {tokens.map((token) => {
                    const isRevealed = revealedIndices.has(token.index);
                    return (
                      <motion.button
                        key={token.index}
                        type="button"
                        layout
                        onClick={(e) => toggleWordReveal(token.index, e)}
                        className={`font-serif text-lg px-2 py-0.5 rounded-lg transition-colors border ${
                          isRevealed
                            ? 'bg-[#8C5A3C]/10 dark:bg-[#D4A373]/15 border-[#8C5A3C]/30 text-[#26221E] dark:text-[#F3EFEA] font-medium'
                            : 'bg-[#F3EFEA] dark:bg-[#26221E] border-[#E2DDD5] dark:border-[#36302B] text-[#8C5A3C] dark:text-[#D4A373] font-semibold tracking-wider hover:border-[#8C5A3C]'
                        }`}
                      >
                        {isRevealed ? token.raw : formatFirstLetterToken(token)}
                      </motion.button>
                    );
                  })}
                </div>

                <p className="text-xs font-serif font-bold uppercase tracking-wider text-[#8C5A3C] dark:text-[#D4A373]">
                  2. Cita final: {card.reference}
                </p>
              </div>

              <div className="pt-3 border-t border-[#EDE8DF] dark:border-[#2C2723] flex items-center justify-between text-xs text-[#8A8178]">
                <span>Toca cualquier inicial para revelar esa palabra puntual</span>
                <span>
                  {revealedIndices.size}/{tokens.length} reveladas
                </span>
              </div>
            </div>
          )}

          {/* MODO 3: COMPLETAR HUECOS (Cloze Deletion) */}
          {mode === 'cloze' && (
            <div className="w-full min-h-[410px] p-6 rounded-3xl shadow-[0_12px_32px_-8px_rgba(44,40,37,0.10)] border border-[#E5DEC9] dark:border-[#332E2A] bg-[#FAF8F5] dark:bg-[#1C1917] flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#EDE8DF] dark:border-[#2C2723] pb-3">
                <div>
                  <span className="text-[11px] uppercase tracking-widest text-[#8C5A3C] dark:text-[#D4A373] font-semibold block">
                    {card.topic}
                  </span>
                  <h3 className="text-lg font-serif font-bold text-[#2C2825] dark:text-[#F3EFEA]">
                    {card.reference}
                  </h3>
                </div>
                <span className="text-xs text-[#6E675F] dark:text-[#A39A90]">
                  Toca los huecos tras recordarlos
                </span>
              </div>

              <div className="my-auto py-4 font-serif text-[19px] leading-[1.85] text-[#26221E] dark:text-[#F2ECE4]">
                {tokens.map((token) => {
                  const isTarget = clozeTargetIndices.has(token.index);
                  const isSolved = clozeSolvedIndices.has(token.index);

                  if (!isTarget) {
                    return <span key={token.index}>{token.raw} </span>;
                  }

                  return (
                    <button
                      key={token.index}
                      type="button"
                      onClick={() =>
                        setClozeSolvedIndices((prev) => new Set(prev).add(token.index))
                      }
                      className={`inline-block mx-1 px-2.5 py-0.5 rounded-lg font-serif text-[18px] transition-all align-baseline ${
                        isSolved
                          ? 'bg-emerald-900/10 dark:bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 font-semibold border border-emerald-700/30'
                          : 'bg-[#E9E2D6] dark:bg-[#2D2824] text-transparent border-b-2 border-[#8C5A3C] select-none min-w-[68px]'
                      }`}
                    >
                      {isSolved ? token.raw : token.cleanWord}
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-[#EDE8DF] dark:border-[#2C2723] flex items-center justify-between text-xs text-[#8A8178]">
                <span>Cita final: {card.reference}</span>
                <span>
                  {clozeSolvedIndices.size}/{clozeTargetIndices.size} palabras clave
                </span>
              </div>
            </div>
          )}

          {/* MODO 4: RECUERDO ACTIVO ESCRITO / DICTADO POR INICIAL */}
          {mode === 'dictation' && (
            <div className="w-full min-h-[410px] p-6 rounded-3xl shadow-[0_12px_32px_-8px_rgba(44,40,37,0.10)] border border-[#E5DEC9] dark:border-[#332E2A] bg-[#FAF8F5] dark:bg-[#1C1917] flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#EDE8DF] dark:border-[#2C2723] pb-3">
                <div>
                  <span className="text-[11px] uppercase tracking-widest text-[#8C5A3C] dark:text-[#D4A373] font-semibold block">
                    {card.topic} • {card.reference}
                  </span>
                  <h3 className="text-sm font-medium text-[#6E675F] dark:text-[#A39A90]">
                    Teclea la primera letra de cada palabra
                  </h3>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[#EFECE6] dark:bg-[#2A2622] text-[#8C5A3C] dark:text-[#D4A373]">
                  {dictationCursor}/{tokens.length}
                </span>
              </div>

              <div className="my-auto py-4 space-y-4">
                <div className="min-h-[150px] p-4 rounded-2xl bg-[#F4F0E8] dark:bg-[#141210] border border-[#E5DEC9] dark:border-[#2C2723] font-serif text-lg leading-relaxed flex flex-wrap gap-1.5 content-start">
                  {tokens.map((token) => {
                    if (token.index < dictationCursor) {
                      return (
                        <motion.span
                          key={token.index}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-[#26221E] dark:text-[#F2ECE4]"
                        >
                          {token.raw}
                        </motion.span>
                      );
                    }
                    if (token.index === dictationCursor) {
                      return (
                        <span
                          key={token.index}
                          className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-sm border ${
                            dictationError
                              ? 'bg-red-600/15 border-red-600 text-red-700 dark:text-red-400 animate-pulse'
                              : 'bg-[#8C5A3C]/15 border-[#8C5A3C] text-[#8C5A3C] dark:text-[#D4A373]'
                          }`}
                        >
                          {dictationError ? `${token.firstLetter}...` : '_'}
                        </span>
                      );
                    }
                    return (
                      <span
                        key={token.index}
                        className="text-[#C7BTM3] dark:text-[#3A342F] select-none"
                      >
                        •••
                      </span>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">
                  {dictationCursor < tokens.length ? (
                    <div className="relative">
                      <input
                        type="text"
                         value=""
                        onChange={() => {}}
                        onKeyDown={handleDictationKeyDown}
                        placeholder="Toca aquí y escribe la inicial de cada palabra..."
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#23201D] border border-[#D5CBB8] dark:border-[#3E3832] text-sm text-[#2C2825] dark:text-[#F3EFEA] focus:outline-none focus:ring-2 focus:ring-[#8C5A3C]"
                      />
                      <CornerDownLeft className="w-4 h-4 text-[#8A8178] absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-800/10 border border-emerald-700/30 text-emerald-800 dark:text-emerald-300 text-sm font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      ¡Versículo completado con precisión! « {card.reference} »
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-2 border-t border-[#EDE8DF] dark:border-[#2C2723] flex items-center justify-between text-xs text-[#8A8178]">
                <span>Si fallas una inicial, se ilumina como pista</span>
                <button
                  type="button"
                  onClick={() => {
                    setDictationCursor(0);
                    setDictationError(false);
                  }}
                  className="text-[#8C5A3C] dark:text-[#D4A373] font-medium hover:underline"
                >
                  Reiniciar dictado
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Botonera de Evaluación SRS (Algoritmo de Repetición Espaciada) */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        {[
          { rating: 'again' as SRSRating, label: 'Otra vez', interval: '1 día', tone: 'border-amber-800/30 text-amber-900 dark:text-amber-300 bg-amber-900/5' },
          { rating: 'hard' as SRSRating, label: 'Difícil', interval: '3 días', tone: 'border-stone-400/30 text-stone-700 dark:text-stone-300 bg-stone-500/5' },
          { rating: 'good' as SRSRating, label: 'Bien', interval: '7 días', tone: 'border-[#8C5A3C]/40 text-[#8C5A3C] dark:text-[#D4A373] bg-[#8C5A3C]/10' },
          { rating: 'easy' as SRSRating, label: 'Fácil', interval: '14 días', tone: 'border-emerald-800/30 text-emerald-900 dark:text-emerald-300 bg-emerald-900/5' },
        ].map(({ rating, label, interval, tone }) => (
          <button
            key={rating}
            type="button"
            onClick={() => handleRateButton(rating)}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border transition active:scale-95 ${tone}`}
          >
            <span className="text-xs font-semibold">{label}</span>
            <span className="text-[10px] opacity-80 font-mono mt-0.5">{interval}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
