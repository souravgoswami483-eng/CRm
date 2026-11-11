/**
 * Vortex Creative CRM - Input Validation Utilities
 * Enforces strict data integrity across client modals, forms, and server API routes.
 */

export function isValidEmail(email: string | undefined | null): boolean {
  if (!email || typeof email !== 'string') return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

/**
 * Validates phone / WhatsApp numbers.
 * Must contain 7 to 15 digits and only valid phone characters (+, -, spaces, parentheses).
 * Rejects non-phone alphabetic strings like "aafiahfifboioif".
 */
export function isValidPhone(phone: string | undefined | null): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const trimmed = phone.trim();
  // Must only contain digits, +, -, spaces, parentheses
  if (!/^[\d\s+\-()]{7,25}$/.test(trimmed)) return false;
  // Must contain between 7 and 15 actual digits
  const digitsOnly = trimmed.replace(/\D/g, '');
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
}

/**
 * Validates Indian GSTIN format:
 * 2 digits (State code), 5 letters (PAN), 4 digits, 1 letter, 1 entity code, 'Z', 1 checksum.
 * Example: 29AABCT1334M1Z8
 * If empty or undefined, returns true (since GSTIN is optional).
 */
export function isValidGSTIN(gstin: string | undefined | null): boolean {
  if (!gstin || typeof gstin !== 'string' || gstin.trim() === '') return true; // Optional field
  const trimmed = gstin.trim().toUpperCase();
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(trimmed);
}

export function isValidUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string' || url.trim() === '') return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isValidNumber(val: any, min: number = 0, max?: number): boolean {
  const n = Number(val);
  if (isNaN(n) || !isFinite(n) || n < min) return false;
  if (max !== undefined && n > max) return false;
  return true;
}

export function isValidName(name: string | undefined | null, minLength: number = 2): boolean {
  if (!name || typeof name !== 'string') return false;
  return name.trim().length >= minLength;
}

export function isValidDate(dateStr: string | undefined | null): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}
