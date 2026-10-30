/**
 * Motor Offline de Búsqueda Bíblica por Cita (RVR1960, NVI, NBLA)
 * Soporta abreviaturas españolas ("Rom 1:21", "1 Jn 4:8", "Sal 23:1-3", "Fil 4:6-7", etc.)
 * y devuelve la cita canónica ("Romanos 1:21") junto con el texto exacto de la traducción elegida.
 */

export type BibleTranslationId = 'RVR1960' | 'NVI' | 'NBLA';

export interface BibleBookMeta {
  usfm: string;
  canonicalName: string;
  aliases: string[];
}

export const BIBLE_BOOKS: BibleBookMeta[] = [
  { usfm: 'GEN', canonicalName: 'Génesis', aliases: ['gen', 'gn', 'genesis'] },
  { usfm: 'EXO', canonicalName: 'Éxodo', aliases: ['exo', 'ex', 'exodo'] },
  { usfm: 'LEV', canonicalName: 'Levítico', aliases: ['lev', 'lv', 'levitico'] },
  { usfm: 'NUM', canonicalName: 'Números', aliases: ['num', 'nm', 'numeros'] },
  { usfm: 'DEU', canonicalName: 'Deuteronomio', aliases: ['deu', 'dt', 'deut', 'deuteronomio'] },
  { usfm: 'JOS', canonicalName: 'Josué', aliases: ['jos', 'josue'] },
  { usfm: 'JDG', canonicalName: 'Jueces', aliases: ['jue', 'jc', 'jueces', 'jdg'] },
  { usfm: 'RUT', canonicalName: 'Rut', aliases: ['rut', 'rt'] },
  { usfm: '1SA', canonicalName: '1 Samuel', aliases: ['1sam', '1sa', '1s', '1samuel', '1 samuel', '1 sam', '1 sa'] },
  { usfm: '2SA', canonicalName: '2 Samuel', aliases: ['2sam', '2sa', '2s', '2samuel', '2 samuel', '2 sam', '2 sa'] },
  { usfm: '1KI', canonicalName: '1 Reyes', aliases: ['1rey', '1re', '1r', '1reyes', '1 reyes', '1 rey', '1 re', '1ki'] },
  { usfm: '2KI', canonicalName: '2 Reyes', aliases: ['2rey', '2re', '2r', '2reyes', '2 reyes', '2 rey', '2 re', '2ki'] },
  { usfm: '1CH', canonicalName: '1 Crónicas', aliases: ['1cro', '1cr', '1cronicas', '1 cronicas', '1 cro', '1 cr', '1ch'] },
  { usfm: '2CH', canonicalName: '2 Crónicas', aliases: ['2cro', '2cr', '2cronicas', '2 cronicas', '2 cro', '2 cr', '2ch'] },
  { usfm: 'EZR', canonicalName: 'Esdras', aliases: ['esd', 'ezr', 'esdras'] },
  { usfm: 'NEH', canonicalName: 'Nehemías', aliases: ['neh', 'ne', 'nehemias'] },
  { usfm: 'EST', canonicalName: 'Ester', aliases: ['est', 'et', 'ester'] },
  { usfm: 'JOB', canonicalName: 'Job', aliases: ['job', 'jb'] },
  { usfm: 'PSA', canonicalName: 'Salmos', aliases: ['sal', 'sl', 'salmo', 'salmos', 'ps', 'psa'] },
  { usfm: 'PRO', canonicalName: 'Proverbios', aliases: ['pro', 'prov', 'pr', 'prv', 'proverbios'] },
  { usfm: 'ECC', canonicalName: 'Eclesiastés', aliases: ['ecl', 'ec', 'qo', 'eclesiastes', 'ecc'] },
  { usfm: 'SNG', canonicalName: 'Cantares', aliases: ['cnt', 'cant', 'ct', 'cantares', 'cantar', 'sng'] },
  { usfm: 'ISA', canonicalName: 'Isaías', aliases: ['isa', 'is', 'isaias'] },
  { usfm: 'JER', canonicalName: 'Jeremías', aliases: ['jer', 'jr', 'jeremias'] },
  { usfm: 'LAM', canonicalName: 'Lamentaciones', aliases: ['lam', 'lm', 'lamentaciones'] },
  { usfm: 'EZK', canonicalName: 'Ezequiel', aliases: ['eze', 'ez', 'ezeq', 'ezequiel', 'ezk'] },
  { usfm: 'DAN', canonicalName: 'Daniel', aliases: ['dan', 'dn', 'daniel'] },
  { usfm: 'HOS', canonicalName: 'Oseas', aliases: ['ose', 'os', 'oseas', 'hos'] },
  { usfm: 'JOL', canonicalName: 'Joel', aliases: ['joe', 'jl', 'joel', 'jol'] },
  { usfm: 'AMO', canonicalName: 'Amós', aliases: ['amo', 'am', 'amos'] },
  { usfm: 'OBA', canonicalName: 'Abdías', aliases: ['abd', 'ab', 'abdias', 'oba'] },
  { usfm: 'JON', canonicalName: 'Jonás', aliases: ['jon', 'jnh', 'jonas'] },
  { usfm: 'MIC', canonicalName: 'Miqueas', aliases: ['miq', 'mi', 'miqueas', 'mic'] },
  { usfm: 'NAM', canonicalName: 'Nahúm', aliases: ['nah', 'na', 'nahum', 'nam'] },
  { usfm: 'HAB', canonicalName: 'Habacuc', aliases: ['hab', 'hb', 'habacuc'] },
  { usfm: 'ZEP', canonicalName: 'Sofonías', aliases: ['sof', 'so', 'sofonias', 'zep'] },
  { usfm: 'HAG', canonicalName: 'Hageo', aliases: ['hag', 'hg', 'hageo'] },
  { usfm: 'ZEC', canonicalName: 'Zacarías', aliases: ['zac', 'zc', 'zacarias', 'zec'] },
  { usfm: 'MAL', canonicalName: 'Malaquías', aliases: ['mal', 'ml', 'malaquias'] },
  { usfm: 'MAT', canonicalName: 'Mateo', aliases: ['mat', 'mt', 'mateo'] },
  { usfm: 'MRK', canonicalName: 'Marcos', aliases: ['mar', 'mc', 'mr', 'mrk', 'marcos'] },
  { usfm: 'LUK', canonicalName: 'Lucas', aliases: ['luc', 'lc', 'lk', 'luk', 'lucas'] },
  { usfm: 'JHN', canonicalName: 'Juan', aliases: ['jua', 'jn', 'jhn', 'juan'] },
  { usfm: 'ACT', canonicalName: 'Hechos', aliases: ['hec', 'hch', 'hechos', 'act'] },
  { usfm: 'ROM', canonicalName: 'Romanos', aliases: ['rom', 'ro', 'rm', 'romanos'] },
  { usfm: '1CO', canonicalName: '1 Corintios', aliases: ['1cor', '1co', '1c', '1corintios', '1 corintios', '1 cor', '1 co'] },
  { usfm: '2CO', canonicalName: '2 Corintios', aliases: ['2cor', '2co', '2c', '2corintios', '2 corintios', '2 cor', '2 co'] },
  { usfm: 'GAL', canonicalName: 'Gálatas', aliases: ['gal', 'ga', 'gl', 'galatas'] },
  { usfm: 'EPH', canonicalName: 'Efesios', aliases: ['efe', 'ef', 'eph', 'efesios'] },
  { usfm: 'PHP', canonicalName: 'Filipenses', aliases: ['fil', 'flp', 'fp', 'php', 'filipenses'] },
  { usfm: 'COL', canonicalName: 'Colosenses', aliases: ['col', 'cl', 'colosenses'] },
  { usfm: '1TH', canonicalName: '1 Tesalonicenses', aliases: ['1tes', '1ts', '1th', '1tesalonicenses', '1 tesalonicenses', '1 tes', '1 ts'] },
  { usfm: '2TH', canonicalName: '2 Tesalonicenses', aliases: ['2tes', '2ts', '2th', '2tesalonicenses', '2 tesalonicenses', '2 tes', '2 ts'] },
  { usfm: '1TI', canonicalName: '1 Timoteo', aliases: ['1tim', '1ti', '1tm', '1timoteo', '1 timoteo', '1 tim', '1 ti'] },
  { usfm: '2TI', canonicalName: '2 Timoteo', aliases: ['2tim', '2ti', '2tm', '2timoteo', '2 timoteo', '2 tim', '2 ti'] },
  { usfm: 'TIT', canonicalName: 'Tito', aliases: ['tit', 'ti', 'tt', 'tito'] },
  { usfm: 'PHM', canonicalName: 'Filemón', aliases: ['flm', 'filem', 'fmn', 'phm', 'filemon'] },
  { usfm: 'HEB', canonicalName: 'Hebreos', aliases: ['heb', 'he', 'hb', 'hebreos'] },
  { usfm: 'JAS', canonicalName: 'Santiago', aliases: ['stg', 'sant', 'st', 'santiago', 'jas'] },
  { usfm: '1PE', canonicalName: '1 Pedro', aliases: ['1ped', '1pe', '1p', '1pedro', '1 pedro', '1 ped', '1 pe'] },
  { usfm: '2PE', canonicalName: '2 Pedro', aliases: ['2ped', '2pe', '2p', '2pedro', '2 pedro', '2 ped', '2 pe'] },
  { usfm: '1JN', canonicalName: '1 Juan', aliases: ['1jua', '1jn', '1j', '1juan', '1 juan', '1 jn'] },
  { usfm: '2JN', canonicalName: '2 Juan', aliases: ['2jua', '2jn', '2j', '2juan', '2 juan', '2 jn'] },
  { usfm: '3JN', canonicalName: '3 Juan', aliases: ['3jua', '3jn', '3j', '3juan', '3 juan', '3 jn'] },
  { usfm: 'JUD', canonicalName: 'Judas', aliases: ['jud', 'jd', 'judas'] },
  { usfm: 'REV', canonicalName: 'Apocalipsis', aliases: ['apo', 'ap', 'apoc', 'rev', 'apocalipsis'] },
];

type CompactBibleData = Record<string, Record<string, Record<string, string>>>;

const bibleCache: Partial<Record<BibleTranslationId, CompactBibleData>> = {};

function stripAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\./g, '')
    .trim();
}

/**
 * Carga en memoria la traducción bíblica solicitada desde los archivos locales `/bibles/*.json`
 */
export async function loadBibleTranslation(
  translation: BibleTranslationId
): Promise<CompactBibleData> {
  if (bibleCache[translation]) {
    return bibleCache[translation]!;
  }

  const fileMap: Record<BibleTranslationId, string> = {
    RVR1960: '/bibles/rvr1960.json',
    NVI: '/bibles/nvi.json',
    NBLA: '/bibles/nbla.json',
  };

  const response = await fetch(fileMap[translation]);
  if (!response.ok) {
    throw new Error(`No se pudo cargar la Biblia ${translation}`);
  }

  const data = (await response.json()) as CompactBibleData;
  bibleCache[translation] = data;
  return data;
}

/**
 * Encuentra el libro bíblico correspondiente a cualquier nombre o abreviatura en español
 * Ejemplo: "Rom" -> Romanos, "1 Jn" -> 1 Juan, "Fil" -> Filipenses
 */
export function resolveBibleBook(rawBookQuery: string): BibleBookMeta | null {
  const clean = stripAccents(rawBookQuery).replace(/\s+/g, ' ');
  const noSpace = clean.replace(/\s+/g, '');

  // 1. Coincidencia exacta por alias o nombre canónico
  for (const book of BIBLE_BOOKS) {
    if (stripAccents(book.canonicalName) === clean) return book;
    if (book.aliases.includes(clean) || book.aliases.includes(noSpace)) return book;
  }

  // 2. Coincidencia por prefijo (ej. "roman" -> Romanos, "apocal" -> Apocalipsis)
  if (clean.length >= 2) {
    for (const book of BIBLE_BOOKS) {
      const canonicalNorm = stripAccents(book.canonicalName);
      if (canonicalNorm.startsWith(clean) || canonicalNorm.replace(/\s+/g, '').startsWith(noSpace)) {
        return book;
      }
    }
  }

  return null;
}

export interface VerseLookupResult {
  canonicalReference: string; // Ej. "Romanos 1:21" o "Filipenses 4:6-7"
  bookName: string;           // Ej. "Romanos"
  text: string;               // Texto completo del versículo o rango
  translation: BibleTranslationId;
}

/**
 * Busca una cita bíblica escrita de forma abreviada o completa:
 * Ejemplos válidos:
 * - "Rom 1:21" -> "Romanos 1:21"
 * - "Rom 1: 21" -> "Romanos 1:21"
 * - "1 Jn 5:11-12" -> "1 Juan 5:11-12"
 * - "Sal 119:9, 11" -> "Salmos 119:9, 11"
 */
export async function lookupVerseByReference(
  rawReference: string,
  translation: BibleTranslationId = 'RVR1960'
): Promise<VerseLookupResult | null> {
  const trimmed = rawReference.trim().replace(/\s+/g, ' ');
  if (!trimmed) return null;

  // Separar libro y capítulo:versículo(s)
  // Soporta "Rom 1:21", "1 Cor 13:4-7", "Sal 119:9, 11", "Rom 1.21"
  const match = trimmed.match(
    /^((?:[1-3]\s*)?[A-Za-záéíóúüñÁÉÍÓÚÜÑ.]+)\s+(\d+)\s*[:.]\s*(\d+(?:\s*[-–—,]\s*\d+)*)$/
  );

  if (!match) return null;

  const [, rawBook, chapterStr, versesPart] = match;
  const bookMeta = resolveBibleBook(rawBook);
  if (!bookMeta) return null;

  const bibleData = await loadBibleTranslation(translation);
  const bookObj = bibleData[bookMeta.usfm];
  if (!bookObj) return null;

  const chapterObj = bookObj[String(Number(chapterStr))];
  if (!chapterObj) return null;

  // Procesar rangos ("6-7") o listas ("9, 11")
  const collectedVerses: string[] = [];
  const normalizedVersesLabelParts: string[] = [];

  const commaSegments = versesPart.split(',').map((s) => s.trim()).filter(Boolean);

  for (const segment of commaSegments) {
    const rangeMatch = segment.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
    if (rangeMatch) {
      const startV = Number(rangeMatch[1]);
      const endV = Number(rangeMatch[2]);
      if (endV < startV || endV - startV > 30) return null;

      for (let v = startV; v <= endV; v++) {
        const vText = chapterObj[String(v)];
        if (vText) collectedVerses.push(vText);
      }
      normalizedVersesLabelParts.push(`${startV}-${endV}`);
    } else {
      const singleV = Number(segment);
      const vText = chapterObj[String(singleV)];
      if (vText) collectedVerses.push(vText);
      normalizedVersesLabelParts.push(`${singleV}`);
    }
  }

  if (collectedVerses.length === 0) return null;

  const cleanNormalizedVerses = normalizedVersesLabelParts.join(', ');
  const canonicalReference = `${bookMeta.canonicalName} ${Number(chapterStr)}:${cleanNormalizedVerses}`;

  return {
    canonicalReference,
    bookName: bookMeta.canonicalName,
    text: collectedVerses.join(' '),
    translation,
  };
}
