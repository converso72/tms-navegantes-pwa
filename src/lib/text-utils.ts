/**
 * Utilidades de procesamiento lingüístico en español para las 4 fases de memorización:
 * 1. Tokenización preservando signos de puntuación españoles (¿, ¡, ;, :, comas).
 * 2. Codificación de Primera Letra ("P. t. a. D. a. m...").
 * 3. Comparación insensible a tildes/mayúsculas para el modo Dictado por Inicial.
 */

export interface VerseToken {
  index: number;
  raw: string;          // Ej. "¿No" o "Dios,"
  prefixPunct: string;  // Ej. "¿"
  cleanWord: string;    // Ej. "No" o "Dios"
  suffixPunct: string;  // Ej. ","
  firstLetter: string;  // Ej. "N" o "D"
  normalizedInitial: string; // Inicial sin tilde en minúscula para comparar teclado (ej. "e" para "Él")
}

/**
 * Normaliza un carácter eliminando diacríticos (tildes) y pasándolo a minúscula
 * para que teclear 'e' coincida con 'Él' o 'ése'.
 */
export function normalizeChar(char: string): string {
  return char
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Divide un versículo en tokens estructurados separando signos de puntuación
 * iniciales y finales de la palabra núcleo.
 */
export function tokenizeVerse(text: string): VerseToken[] {
  const rawWords = text.trim().split(/\s+/);

  return rawWords.map((raw, index) => {
    const match = raw.match(/^([¿¡"«'(\[]*)([a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9]+)([?!.,;:"»')\]]*)$/);

    if (!match) {
      const firstChar = raw.charAt(0) || '';
      return {
        index,
        raw,
        prefixPunct: '',
        cleanWord: raw,
        suffixPunct: '',
        firstLetter: firstChar,
        normalizedInitial: normalizeChar(firstChar),
      };
    }

    const [, prefixPunct, cleanWord, suffixPunct] = match;
    const firstLetter = cleanWord.charAt(0);

    return {
      index,
      raw,
      prefixPunct,
      cleanWord,
      suffixPunct,
      firstLetter,
      normalizedInitial: normalizeChar(firstLetter),
    };
  });
}

/**
 * Convierte un token a su representación "Primera Letra" estilo Los Navegantes.
 * Ejemplo: "Porque" -> "P.", "Dios," -> "D.,", "¿No" -> "¿N."
 */
export function formatFirstLetterToken(token: VerseToken): string {
  return `${token.prefixPunct}${token.firstLetter}.${token.suffixPunct}`;
}
