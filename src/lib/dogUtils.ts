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
    .trim();
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
      if (dogName === normName) return true;
      if (normName.length >= 6 && dogName.includes(normName)) return true;
      if (dogName.length >= 6 && normName.includes(dogName)) return true;
    }
    return false;
  });
}
