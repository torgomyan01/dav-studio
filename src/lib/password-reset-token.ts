import { createHash, randomBytes } from 'crypto';

const TTL_MS = 60 * 60 * 1000; // 1 ժամ

export function hashPasswordResetToken(plainToken: string): string {
  return createHash('sha256').update(plainToken, 'utf8').digest('hex');
}

export function generatePasswordResetPlainToken(): string {
  return randomBytes(32).toString('hex');
}

export function passwordResetExpiresAt(): Date {
  return new Date(Date.now() + TTL_MS);
}
