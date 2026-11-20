import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

const CHANGE_EVENT = 'roam-cooldown-change';
const memory = new Map();

function storageKey(name) {
  return `roam:cooldown:${name}`;
}

function readEndsAt(name) {
  try {
    return Number(window.localStorage.getItem(storageKey(name))) || 0;
  } catch {
    return memory.get(name) || 0;
  }
}

function writeEndsAt(name, endsAt) {
  try {
    window.localStorage.setItem(storageKey(name), String(endsAt));
  } catch {
    memory.set(name, endsAt);
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

function secondsUntil(endsAt) {
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
}

export function useCooldown(name, seconds = 60) {
  const endsAt = useSyncExternalStore(subscribe, () => readEndsAt(name), () => 0);
  const [, setTick] = useState(0);
  const secondsLeft = secondsUntil(endsAt);
  const active = secondsLeft > 0;

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [active]);

  const start = useCallback(() => {
    writeEndsAt(name, Date.now() + seconds * 1000);
  }, [name, seconds]);

  return { secondsLeft, start };
}

export function cooldownMessage(secondsLeft) {
  const unit = secondsLeft === 1 ? 'second' : 'seconds';
  return `Please wait ${secondsLeft} ${unit} before requesting another email.`;
}