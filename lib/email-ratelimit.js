import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import * as Sentry from '@sentry/nextjs';

const EMAIL_LIMIT = 3;
const EMAIL_WINDOW = '1 h';
const MAX_EMAIL_LENGTH = 254;
const FAIL_OPEN = true;
const GMAIL_DOMAINS = new Set(['gmail.com', 'googlemail.com']);

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
 * Key used for counting only. The account email is never changed.
 * Strips +tags for every domain, and dots for Gmail addresses.
 * @param {unknown} email
 * @returns {string}
 */
export function limiterKey(email) {
  const normalized = normalizeEmail(email);
  const at = normalized.lastIndexOf('@');
  if (at < 1 || at === normalized.length - 1) return normalized;

  let local = normalized.slice(0, at);
  let domain = normalized.slice(at + 1);

  const plus = local.indexOf('+');
  if (plus > 0) local = local.slice(0, plus);

  if (GMAIL_DOMAINS.has(domain)) {
    local = local.replaceAll('.', '');
    domain = 'gmail.com';
  }

  if (!local) return normalized;
  return `${local}@${domain}`;
}

/**
 * Callers must validate the email format first.
 * @param {unknown} email
 * @returns {Promise<{ allowed: boolean, retryAfterSeconds: number, degraded: boolean }>}
 */
export async function checkEmailLimit(email) {
  const key = limiterKey(email);
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