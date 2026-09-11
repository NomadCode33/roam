// lib/logger.js
import { randomUUID } from 'crypto';

const SENSITIVE_KEYS = ['password', 'token', 'authorization', 'cookie', 'jwt', 'secret'];

function redact(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    clean[key] = SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))
      ? '[REDACTED]'
      : val;
  }
  return clean;
}

export function createRequestId() {
  return randomUUID();
}

export function logRequest({ requestId, method, path, status, durationMs, error, meta }) {
  const entry = {
    level: error ? 'error' : 'info',
    requestId,
    method,
    path,
    status,
    durationMs,
    timestamp: new Date().toISOString(),
    ...(meta ? { meta: redact(meta) } : {}),
    ...(error ? { errorMessage: error.message, stack: error.stack } : {}),
  };
  console.log(JSON.stringify(entry));
}