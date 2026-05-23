import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

/* ── Per-type config ─────────────────────────────────────────────────────── */
const CONFIG = {
  success: {
    Icon:       CheckCircle2,
    iconClass:  'text-emerald-500',
    bar:        'bg-emerald-500',
    bg:         'bg-white',
    border:     'border-l-4 border-emerald-500',
    label:      'Success',
  },
  error: {
    Icon:       XCircle,
    iconClass:  'text-red-500',
    bar:        'bg-red-500',
    bg:         'bg-white',
    border:     'border-l-4 border-red-500',
    label:      'Error',
  },
  warning: {
    Icon:       AlertTriangle,
    iconClass:  'text-amber-500',
    bar:        'bg-amber-500',
    bg:         'bg-white',
    border:     'border-l-4 border-amber-500',
    label:      'Warning',
  },
  info: {
    Icon:       Info,
    iconClass:  'text-blue-500',
    bar:        'bg-blue-500',
    bg:         'bg-white',
    border:     'border-l-4 border-blue-500',
    label:      'Info',
  },
};

/* ── Single toast item ──────────────────────────────────────────────────── */
function ToastItem({ id, type, message, exiting }) {
  const { dismiss } = useNotification();
  const cfg = CONFIG[type] ?? CONFIG.info;
  const { Icon } = cfg;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`
        flex items-start gap-3 w-80 rounded-xl shadow-lg
        border border-slate-200
        ${cfg.border} ${cfg.bg}
        px-4 py-3.5
        ${exiting ? 'animate-toast-out' : 'animate-toast-in'}
      `}
    >
      {/* Icon */}
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${cfg.iconClass}`} aria-hidden="true" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
          {cfg.label}
        </p>
        <p className="text-sm text-slate-800 leading-snug">{message}</p>
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => dismiss(id)}
        aria-label="Dismiss notification"
        className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/**
 * Toast — Global toast stack portal.
 * Mount ONCE in App.jsx (outside the Router so it always renders).
 *
 * Renders all toasts from NotificationContext in the bottom-right corner.
 */
export default function Toast() {
  const { toasts } = useNotification();

  if (!toasts.length) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem {...t} />
        </div>
      ))}
    </div>
  );
}
