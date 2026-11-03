import { Ejemplar } from '../types';

/**
 * Calculates a dog's age accurately from birth date string (YYYY-MM-DD or ISO).
 * Handles leap years, month boundaries, and avoids timezone shift errors.
 */
export interface DogAgeResult {
  years: number;
  months: number;
  days: number;
  text: string;
  shortText: string;
}

export function calculateDogAge(birthDateStr?: string): DogAgeResult {
  if (!birthDateStr || typeof birthDateStr !== 'string' || !birthDateStr.trim()) {
    return { years: 0, months: 0, days: 0, text: 'Edad desconocida', shortText: 'S/D' };
  }

  // Parse YYYY-MM-DD manually to prevent UTC vs local timezone day-offset bugs
  const parts = birthDateStr.split('T')[0].split('-');
  if (parts.length < 3) {
    const fallbackDate = new Date(birthDateStr);
    if (isNaN(fallbackDate.getTime())) {
      return { years: 0, months: 0, days: 0, text: 'Edad desconocida', shortText: 'S/D' };
    }
    parts[0] = String(fallbackDate.getFullYear());
    parts[1] = String(fallbackDate.getMonth() + 1);
    parts[2] = String(fallbackDate.getDate());
  }

  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10) - 1; // 0-indexed
  const birthDay = parseInt(parts[2], 10);

  if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) {
    return { years: 0, months: 0, days: 0, text: 'Edad desconocida', shortText: 'S/D' };
  }

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  let years = currentYear - birthYear;
  let months = currentMonth - birthMonth;
  let days = currentDay - birthDay;

  if (days < 0) {
    months -= 1;
    // Days in previous month
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  // Boundary check: future dates
  if (years < 0) {
    return { years: 0, months: 0, days: 0, text: 'Por nacer', shortText: '0m' };
  }

  if (years === 0) {
    if (months === 0) {
      const weeks = Math.max(1, Math.floor(days / 7));
      return {
        years: 0,
        months: 0,
        days,
        text: days < 7 ? `${days} ${days === 1 ? 'día' : 'días'}` : `${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`,
        shortText: days < 7 ? `${days}d` : `${weeks}sem`,
      };
    }
    return {
      years: 0,
      months,
      days,
      text: `${months} ${months === 1 ? 'mes' : 'meses'}`,
      shortText: `${months}m`,
    };
  }

  const yearsStr = `${years} ${years === 1 ? 'año' : 'años'}`;
  const text = months > 0 ? `${yearsStr}, ${months}m` : yearsStr;
  const shortText = months > 0 ? `${years}a ${months}m` : `${years}a`;

  return { years, months, days, text, shortText };
}

/**
 * Sanitizes objects before saving to Cloud Firestore.
 * Removes all undefined properties recursively so Firestore setDoc does not throw
 * "Function setDoc() called with invalid data. Unsupported field value: undefined".
 */
export function cleanForFirestore<T extends Record<string, any>>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => (typeof item === 'object' && item !== null ? cleanForFirestore(item) : item)) as unknown as T;
  }

  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) continue;
    if (val !== null && typeof val === 'object') {
      cleaned[key] = cleanForFirestore(val);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned as T;
}

/**
 * Normalizes a string for robust name / POA matching
 */
export function normalizeString(str?: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes text for search, removing diacritics, lowercase and collapsing multiple spaces
 */
export function normalizeSearchText(str?: string | null): string {
  return normalizeString(str || '');
}

/**
 * Robustly tests if a query matches an Ejemplar using full composite name + afijo combinations,
 * tokens, POA, tatuaje, and microchip.
 */
export function matchesCompositeDogSearch(dog: Ejemplar, query: string): boolean {
  const qNorm = normalizeString(query);
  if (!qNorm) return false;

  const dogName = normalizeString(dog.nombreCompleto);
  const dogAfijo = normalizeString(dog.afijo);
  const dogPoa = normalizeString(dog.numeroPOA);
  const dogTat = normalizeString(dog.tatuaje);
  const dogChip = normalizeString(dog.microchip);
  const dogColor = normalizeString(dog.color);
  const dogRaza = normalizeString(dog.raza);
  const dogPadre = normalizeString(dog.padreNombre);
  const dogMadre = normalizeString(dog.madreNombre);

  // Composite name variants (e.g., "Amunet de la Tirolesa", "Amunet Tirolesa", "de la Tirolesa Amunet")
  const composite1 = normalizeString(`${dogName} ${dogAfijo}`);
  const composite2 = normalizeString(`${dogAfijo} ${dogName}`);
  const composite3 = normalizeString(`${dogName} de ${dogAfijo}`);
  const composite4 = normalizeString(`${dogName} del ${dogAfijo}`);
  const composite5 = normalizeString(`${dogName} von ${dogAfijo}`);
  const composite6 = normalizeString(`${dogName} vom ${dogAfijo}`);

  // Direct substring matches
  if (
    composite1.includes(qNorm) ||
    composite2.includes(qNorm) ||
    composite3.includes(qNorm) ||
    composite4.includes(qNorm) ||
    composite5.includes(qNorm) ||
    composite6.includes(qNorm) ||
    dogName.includes(qNorm) ||
    dogAfijo.includes(qNorm) ||
    dogPoa.includes(qNorm) ||
    dogTat.includes(qNorm) ||
    dogChip.includes(qNorm) ||
    dogColor.includes(qNorm) ||
    dogRaza.includes(qNorm) ||
    dogPadre.includes(qNorm) ||
    dogMadre.includes(qNorm)
  ) {
    return true;
  }

  // Titles match
  if (dog.titulos?.some((t) => normalizeString(t).includes(qNorm))) {
    return true;
  }

  // Multi-word token match (e.g. user typed "tirolesa amunet" or "amunet poa")
  const tokens = qNorm.split(' ').filter((t) => t.length > 0);
  if (tokens.length > 1) {
    const fullHaystack = `${composite1} ${composite2} ${dogPoa} ${dogTat} ${dogChip} ${dogPadre} ${dogMadre}`;
    const allTokensMatch = tokens.every((token) => fullHaystack.includes(token));
    if (allTokensMatch) return true;
  }

  return false;
}

/**
 * Matches an ancestor name or POA against existing registered dogs in the criadero
 */
export function matchDogInList(
  name?: string,
  poa?: string,
  list: Ejemplar[] = []
): Ejemplar | undefined {
  const normName = normalizeString(name);
  const normPoa = normalizeString(poa);

  if (!normName && !normPoa) return undefined;

  return list.find((dog) => {
    if (normPoa && normalizeString(dog.numeroPOA) === normPoa) return true;
    if (normName) {
      const dogName = normalizeString(dog.nombreCompleto);
      const composite = normalizeString(`${dog.nombreCompleto} ${dog.afijo}`);
      if (dogName === normName || composite === normName) return true;
      if (normName.length >= 5 && (dogName.includes(normName) || composite.includes(normName))) return true;
      if (dogName.length >= 5 && (normName.includes(dogName) || normName.includes(composite))) return true;
    }
    return false;
  });
}

/**
 * Known color names to Hex mapping for puppy collars
 */
const COLOR_HEX_MAP: Record<string, string> = {
  'rojo': '#ef4444',
  'azul': '#2563eb',
  'verde': '#16a34a',
  'verde agua': '#2dd4bf',
  'verde claro': '#4ade80',
  'amarillo': '#eab308',
  'naranja': '#f97316',
  'rosa': '#ec4899',
  'rosado': '#ec4899',
  'violeta': '#a855f7',
  'morado': '#9333ea',
  'lila': '#c084fc',
  'celeste': '#38bdf8',
  'blanco': '#f8fafc',
  'negro': '#1e293b',
  'marron': '#78350f',
  'marron claro': '#a16207',
  'gris': '#64748b',
  'dorado': '#ca8a04',
  'turquesa': '#06b6d4',
};

const HEX_COLOR_NAME_MAP: Record<string, string> = {
  '#ef4444': 'Rojo',
  '#dc2626': 'Rojo',
  '#b91c1c': 'Rojo Oscuro',
  '#2563eb': 'Azul',
  '#1d4ed8': 'Azul Marino',
  '#3b82f6': 'Azul',
  '#16a34a': 'Verde',
  '#22c55e': 'Verde',
  '#15803d': 'Verde Oscuro',
  '#2dd4bf': 'Verde agua',
  '#14b8a6': 'Verde agua',
  '#4ade80': 'Verde claro',
  '#eab308': 'Amarillo',
  '#facc15': 'Amarillo',
  '#f59e0b': 'Amarillo Oro',
  '#f97316': 'Naranja',
  '#ea580c': 'Naranja',
  '#ec4899': 'Rosa',
  '#db2777': 'Rosa',
  '#f43f5e': 'Fucsia',
  '#a855f7': 'Violeta',
  '#9333ea': 'Púrpura',
  '#c084fc': 'Lila',
  '#38bdf8': 'Celeste',
  '#06b6d4': 'Turquesa',
  '#f8fafc': 'Blanco',
  '#ffffff': 'Blanco',
  '#1e293b': 'Negro',
  '#000000': 'Negro',
  '#78350f': 'Marrón',
  '#92400e': 'Marrón',
  '#64748b': 'Gris',
};

export function getCollarColorHex(colorCollar?: string, nombreColorCollar?: string): string {
  if (colorCollar && colorCollar.startsWith('#')) {
    return colorCollar;
  }
  const cleanName = (nombreColorCollar || colorCollar || '').trim().toLowerCase();
  if (cleanName && COLOR_HEX_MAP[cleanName]) {
    return COLOR_HEX_MAP[cleanName];
  }
  return colorCollar || '#2563eb';
}

export function getCollarColorName(colorCollar?: string, nombreColorCollar?: string): string {
  if (nombreColorCollar && nombreColorCollar.trim()) {
    return nombreColorCollar.trim();
  }
  if (!colorCollar || !colorCollar.trim()) {
    return 'Sin color';
  }
  const val = colorCollar.trim();
  if (val.startsWith('#')) {
    const lowerHex = val.toLowerCase();
    if (HEX_COLOR_NAME_MAP[lowerHex]) {
      return HEX_COLOR_NAME_MAP[lowerHex];
    }
    return `Collar ${val}`;
  }
  return val;
}

/**
 * Formatea cualquier fecha (YYYY-MM-DD, ISO 8601, Date o timestamp) al formato oficial DD/MM/AAAA.
 * Evita desfasajes horarios de zona (UTC vs Local) parseando directamente los componentes de fecha.
 */
export function formatDateDMY(dateInput?: string | Date | null, fallback = 'S/D'): string {
  if (!dateInput) return fallback;

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return fallback;

    // Si ya está en formato DD/MM/AAAA
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return trimmed;
    }

    // Formato estándar YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss...
    const datePart = trimmed.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      return `${day}/${month}/${year}`;
    }

    // Intento con objeto Date
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const d = String(parsed.getDate()).padStart(2, '0');
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const y = parsed.getFullYear();
      return `${d}/${m}/${y}`;
    }

    return trimmed;
  }

  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    const d = String(dateInput.getDate()).padStart(2, '0');
    const m = String(dateInput.getMonth() + 1).padStart(2, '0');
    const y = dateInput.getFullYear();
    return `${d}/${m}/${y}`;
  }

  return fallback;
}

export const formatDate = formatDateDMY;

