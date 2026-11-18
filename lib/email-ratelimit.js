import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import * as Sentry from '@sentry/nextjs';

const EMAIL_LIMIT = 3;
const EMAIL_WINDOW = '1 h';
const MAX_EMAIL_LENGTH = 254;
const FAIL_OPEN = true;

const limiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(EMAIL_LIMIT, EMAIL_WINDOW),
  prefix: 'roam:email-limit',
});

export function normalizeEmail(email) {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase().slice(0, MAX_EMAIL_LENGTH);
}

/**
 * Callers must validate the email format first.
 * @param {unknown} email
 * @returns {Promise<{ allowed: boolean, retryAfterSeconds: number, degraded: boolean }>}
 */
export async function checkEmailLimit(email) {
  const key = normalizeEmail(email);
  if (!key) {
    return { allowed: false, retryAfterSeconds: 0, degraded: false };
  }

  try {
    const { success, reset } = await limiter.limit(key);
    return {
      allowed: success,
      retryAfterSeconds: success
        ? 0
        : Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
      degraded: false,
    };
  } catch (error) {
    Sentry.captureException(error);
    return { allowed: FAIL_OPEN, retryAfterSeconds: 0, degraded: true };
  }
}