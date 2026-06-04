import { createHash, randomBytes } from 'node:crypto';

export function createSessionToken(): string {
  return randomBytes(24).toString('base64url');
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createSessionExpiry(days = 7): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
