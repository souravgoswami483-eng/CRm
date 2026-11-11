import crypto from 'crypto';

export const SESSION_COOKIE_NAME = 'vortex_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'vortex_jwt_secret_indiranagar_bengaluru_2026_crm_secure_hash';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface SessionPayload {
  userId: string;
  role: 'ADMIN' | 'CLIENT';
  clientId?: string;
  name: string;
  email: string;
  mustChangePassword?: boolean;
  exp: number;
}

// Web Crypto HMAC key cache
let cryptoKey: CryptoKey | null = null;
async function getCryptoKey(): Promise<CryptoKey> {
  if (cryptoKey) return cryptoKey;
  const enc = new TextEncoder();
  cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  return cryptoKey;
}

/**
 * Sign a session payload into a compact token: base64url(payload).base64url(signature)
 */
export async function signSessionToken(payload: Omit<SessionPayload, 'exp'> & { exp?: number }): Promise<string> {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: payload.exp || Date.now() + SESSION_DURATION_MS,
  };
  const dataStr = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const enc = new TextEncoder();
  const key = await getCryptoKey();
  const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(dataStr));
  const sigStr = Buffer.from(sigBuffer).toString('base64url');
  return `${dataStr}.${sigStr}`;
}

/**
 * Verify session token. Returns payload if valid & unexpired, or null if invalid.
 */
export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [dataStr, sigStr] = parts;
  try {
    const enc = new TextEncoder();
    const key = await getCryptoKey();
    const sigBuffer = Buffer.from(sigStr, 'base64url');
    const isValid = await crypto.subtle.verify('HMAC', key, sigBuffer, enc.encode(dataStr));
    if (!isValid) return null;

    const payload: SessionPayload = JSON.parse(Buffer.from(dataStr, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Password Hashing with PBKDF2 (SHA-256, 100,000 iterations, 16-byte salt)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
  return `pbkdf2:${salt}:${hash}`;
}

/**
 * Timing-safe password verification
 */
export function verifyPassword(password: string, storedHash: string | undefined): boolean {
  if (!storedHash || !password) return false;
  const parts = storedHash.split(':');
  if (parts.length !== 3 || parts[0] !== 'pbkdf2') return false;
  const [, salt, originalHash] = parts;
  try {
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
    const a = Buffer.from(hash, 'hex');
    const b = Buffer.from(originalHash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Generate a cryptographically strong, human-readable one-time temporary password.
 * Example: Vtx-8392-Wk7z
 */
export function generateOneTimePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const num = Math.floor(1000 + Math.random() * 9000);
  let randomTail = '';
  const randBytes = crypto.randomBytes(4);
  for (let i = 0; i < 4; i++) {
    randomTail += chars[randBytes[i] % chars.length];
  }
  return `Vtx-${num}-${randomTail}`;
}

/**
 * In-memory Login Rate Limiting & Lockout
 * Max 5 attempts within 15 minutes. 15 minute lockout on 5 consecutive failures.
 */
interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lockoutUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 mins
const LOCKOUT_MS = 15 * 60 * 1000; // 15 mins

export function checkRateLimit(identifier: string): { allowed: boolean; remainingLockoutSeconds?: number } {
  const key = identifier.toLowerCase().trim();
  const record = rateLimitStore.get(key);
  if (!record) return { allowed: true };

  const now = Date.now();
  if (record.lockoutUntil && record.lockoutUntil > now) {
    const remainingSeconds = Math.ceil((record.lockoutUntil - now) / 1000);
    return { allowed: false, remainingLockoutSeconds: remainingSeconds };
  }

  // Clear if lockout expired or window expired
  if (now - record.firstAttemptAt > WINDOW_MS && (!record.lockoutUntil || record.lockoutUntil <= now)) {
    rateLimitStore.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedLogin(identifier: string): { locked: boolean; remainingLockoutSeconds?: number } {
  const key = identifier.toLowerCase().trim();
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    record = { attempts: 1, firstAttemptAt: now };
  } else {
    record.attempts += 1;
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockoutUntil = now + LOCKOUT_MS;
    rateLimitStore.set(key, record);
    return { locked: true, remainingLockoutSeconds: Math.ceil(LOCKOUT_MS / 1000) };
  }

  rateLimitStore.set(key, record);
  return { locked: false };
}

export function resetLoginAttempts(identifier: string): void {
  const key = identifier.toLowerCase().trim();
  rateLimitStore.delete(key);
}

/**
 * Extract session token from cookie header or NextRequest
 */
export function extractTokenFromHeader(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map((c) => c.trim());
  for (const c of cookies) {
    if (c.startsWith(`${SESSION_COOKIE_NAME}=`)) {
      return c.substring(SESSION_COOKIE_NAME.length + 1);
    }
  }
  return null;
}

/**
 * Get authenticated user session directly from API request headers
 */
export async function getSessionFromRequest(request: Request): Promise<SessionPayload | null> {
  const cookieHeader = request.headers.get('cookie');
  const token = extractTokenFromHeader(cookieHeader);
  if (!token) return null;
  return await verifySessionToken(token);
}

/**
 * Signed expiring file access URL generator
 */
export async function generateSignedFileToken(fileId: string, clientId: string, expSeconds: number = 3600): Promise<string> {
  const exp = Date.now() + expSeconds * 1000;
  const payload = { fileId, clientId, exp };
  const dataStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const enc = new TextEncoder();
  const key = await getCryptoKey();
  const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(dataStr));
  const sigStr = Buffer.from(sigBuffer).toString('base64url');
  return `${dataStr}.${sigStr}`;
}

export async function verifySignedFileToken(token: string, expectedFileId: string): Promise<{ valid: boolean; clientId?: string }> {
  if (!token) return { valid: false };
  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false };
  const [dataStr, sigStr] = parts;
  try {
    const enc = new TextEncoder();
    const key = await getCryptoKey();
    const sigBuffer = Buffer.from(sigStr, 'base64url');
    const isValid = await crypto.subtle.verify('HMAC', key, sigBuffer, enc.encode(dataStr));
    if (!isValid) return { valid: false };

    const payload = JSON.parse(Buffer.from(dataStr, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) return { valid: false };
    if (payload.fileId !== expectedFileId) return { valid: false };
    return { valid: true, clientId: payload.clientId };
  } catch {
    return { valid: false };
  }
}
