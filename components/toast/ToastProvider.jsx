'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import '@/css/toast.css';
import { usePathname } from 'next/navigation';

const ToastContext = createContext(null);

// null = stays until dismissed (errors). Numbers are milliseconds.
const DEFAULT_DURATION = { error: null, success: 8000, info: 8000 };
const MAX_VISIBLE = 3;

function ToastItem({ toast, onDismiss }) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || toast.duration === null) return;
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [paused, toast.id, toast.duration, onDismiss]);

  return (
    <div
      className={'toast toast-' + toast.type}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <p className="toast-msg">{toast.message}</p>
      <button
        type="button"
        className="toast-close"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
      >
        &times;
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  // Clear toasts when the page changes. This is the documented "reset state
  // when a value changes" pattern: it runs during render, not in an effect.
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setToasts([]);
  }

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const clear = useCallback(() => setToasts([]), []);

  const show = useCallback((message, { type = 'info', duration } = {}) => {
    const id = nextId.current++;
    const toast = {
      id,
      message,
      type,
      duration: duration === undefined ? DEFAULT_DURATION[type] : duration,
    };
    setToasts((current) => {
      if (current.some((t) => t.message === message && t.type === type)) {
        return current;
      }
      return [...current, toast].slice(-MAX_VISIBLE);
    });
    return id;
  }, []);

  const api = useMemo(
    () => ({
      show,
      dismiss,
      clear,
      error: (message, options) => show(message, { ...options, type: 'error' }),
      success: (message, options) => show(message, { ...options, type: 'success' }),
      info: (message, options) => show(message, { ...options, type: 'info' }),
    }),
    [show, dismiss, clear]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region">
        <div role="alert" aria-atomic="false">
          {toasts
            .filter((t) => t.type === 'error')
            .map((t) => (
              <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
            ))}
        </div>
        <div role="status" aria-atomic="false">
          {toasts
            .filter((t) => t.type !== 'error')
            .map((t) => (
              <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
            ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return ctx;
}