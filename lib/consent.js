// lib/consent.js
const CONSENT_COOKIE = "roam-consent";

export function parseConsent(raw) {
  if (raw === "accepted") return "accepted";
  if (raw === "declined") return "declined";
  return null;
}

export function hasConsentDecision(value) {
  return value !== null;
}

export { CONSENT_COOKIE };