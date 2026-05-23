import { createContext, useContext, useState, useCallback, useRef } from 'react';

/**
 * NotificationContext — App-wide toast notification queue.
 *
 * A single <Toast /> component mounted once in App.jsx drains this queue.
 * Any component can push to it with the useNotification() hook.
 *
 * Toast types:
 *   'success' | 'error' | 'info' | 'warning'
 *
 * Usage example:
 *   const { push, dismiss, clearAll } = useNotification();
 *
 *   // Fire and forget (auto-dismissed after 4 s)
 *   push('success', 'Attendance marked!');
 *
 *   // Custom duration (6 s)
 *   push('error', 'Session expired. Please log in again.', 6000);
 *
 *   // Persistent — keep on screen until user dismisses it
 *   const id = push('warning', 'GPS accuracy is low.', 0);
 *   // later…
 *   dismiss(id);
 *
 *   // Wipe the board
 *   clearAll();
 */

const NotificationContext = createContext(null);

/** Browser-native UUIDs — no external dependency. */
const uid = () => crypto.randomUUID();

// ── Toast type registry ───────────────────────────────────────────────────────
/**
 * Metadata for each toast type.
 * Consumed by <Toast /> to render the correct icon, colour, and label.
 *
 * @type {Record<string, { label: string; colorVar: string; icon: string }>}
 */
export const TOAST_TYPES = {
  success: { label: 'Success', colorVar: '--color-success', icon: '✓' },
  error:   { label: 'Error',   colorVar: '--color-error',   icon: '✕' },
  info:    { label: 'Info',    colorVar: '--color-info',     icon: 'ℹ' },
  warning: { label: 'Warning', colorVar: '--color-warning',  icon: '⚠' },
};

/** Default auto-dismiss duration in milliseconds. */
const DEFAULT_DURATION_MS = 4000;

/** Maximum number of toasts visible simultaneously. */
const MAX_VISIBLE_TOASTS = 5;

// ── Provider ──────────────────────────────────────────────────────────────────
export function NotificationProvider({ children }) {
  /**
   * Toast shape:
   * {
   *   id:       string   — unique key
   *   type:     string   — one of TOAST_TYPES keys
   *   message:  string   — body text
   *   exiting:  boolean  — true while the out-animation is playing
   *   title:    string?  — optional bold title line
   * }
   */
  const [toasts, setToasts] = useState([]);

  /** Map of toast id → setTimeout handle (for cancellation on early dismiss). */
  const timers = useRef({});

  // ── dismiss ─────────────────────────────────────────────────────────────────
  /**
   * Marks the toast as exiting (triggers CSS out-animation),
   * then removes it from state after the animation completes.
   *
   * @param {string} id
   */
  const dismiss = useCallback((id) => {
    // 1. Flag as exiting → CSS plays the slide-out / fade-out animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );

    // 2. Remove from DOM after the animation completes (keep in sync with CSS)
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 220);

    // 3. Cancel the auto-dismiss timer if it still exists
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  // ── push ────────────────────────────────────────────────────────────────────
  /**
   * Adds a new toast to the queue.
   *
   * @param {'success'|'error'|'info'|'warning'} type
   * @param {string}  message   — body text
   * @param {number}  [duration=4000] — ms before auto-dismiss; 0 = persistent
   * @param {string}  [title]   — optional bold heading
   * @returns {string} id — pass to dismiss(id) for early removal
   */
  const push = useCallback((type, message, duration = DEFAULT_DURATION_MS, title) => {
    const id = uid();

    setToasts((prev) => {
      // Enforce the maximum visible cap by dropping the oldest entry
      const capped = prev.length >= MAX_VISIBLE_TOASTS ? prev.slice(1) : prev;
      return [...capped, { id, type, message, title, exiting: false }];
    });

    if (duration > 0) {
      timers.current[id] = setTimeout(() => dismiss(id), duration);
    }

    return id;
  }, [dismiss]);

  // ── clearAll ────────────────────────────────────────────────────────────────
  /** Immediately removes every toast and cancels all pending timers. */
  const clearAll = useCallback(() => {
    Object.values(timers.current).forEach(clearTimeout);
    timers.current = {};
    setToasts([]);
  }, []);

  // ── Convenience wrappers ────────────────────────────────────────────────────
  /** push('success', message, duration?, title?) */
  const success = useCallback(
    (message, duration, title) => push('success', message, duration, title),
    [push]
  );

  /** push('error', message, duration?, title?) */
  const error = useCallback(
    (message, duration, title) => push('error', message, duration, title),
    [push]
  );

  /** push('info', message, duration?, title?) */
  const info = useCallback(
    (message, duration, title) => push('info', message, duration, title),
    [push]
  );

  /** push('warning', message, duration?, title?) */
  const warning = useCallback(
    (message, duration, title) => push('warning', message, duration, title),
    [push]
  );

  const value = {
    /** Current toast queue array (read by <Toast />). */
    toasts,

    /** Push a toast onto the queue. Returns its id. */
    push,

    /** Dismiss a specific toast by id (triggers out-animation). */
    dismiss,

    /** Remove all toasts immediately. */
    clearAll,

    // ── Typed convenience helpers ──────────────────────────────────────────
    success,
    error,
    info,
    warning,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
/** Throws a clear error if called outside <NotificationProvider>. */
export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotification must be used inside <NotificationProvider>');
  }
  return ctx;
}

export default NotificationContext;
