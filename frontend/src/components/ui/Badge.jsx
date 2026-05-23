/**
 * Badge — Status chip atom.
 *
 * Maps to:
 *   attendance.status  ENUM('Present', 'Absent')
 *   Computed:          'Active' | 'Upcoming' | 'Finished' (session status)
 *   UX:                'Warning' | 'Valid' | 'Invalid' | 'New'
 *
 * @param {string}  label    — display text
 * @param {string}  variant  — key into VARIANTS map (defaults to 'default')
 * @param {boolean} dot      — show leading status dot (default true)
 * @param {boolean} pulse    — animate the dot (for Active sessions)
 * @param {string}  className
 */

const VARIANTS = {
  // Attendance statuses
  Present:  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  Absent:   { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500'     },

  // Session statuses
  Active:   { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500'    },
  Upcoming: { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-400'   },
  Finished: { bg: 'bg-slate-100',  text: 'text-slate-500',   border: 'border-slate-200',   dot: 'bg-slate-400'   },

  // Location validity
  Valid:    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  Invalid:  { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500'     },

  // UX helpers
  Warning:  { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  dot: 'bg-orange-500'  },
  New:      { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200',  dot: 'bg-indigo-500'  },

  // Role badges
  student:  { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500'    },
  teacher:  { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  dot: 'bg-violet-500'  },
  admin:    { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    dot: 'bg-rose-500'    },

  // Fallback
  default:  { bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-200',   dot: 'bg-slate-400'   },
};

export default function Badge({
  label,
  variant  = 'default',
  dot      = true,
  pulse    = false,
  className = '',
}) {
  const v = VARIANTS[variant] ?? VARIANTS.default;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-0.5
        rounded-full
        text-xs font-medium
        border
        ${v.bg} ${v.text} ${v.border}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`
            w-1.5 h-1.5 rounded-full shrink-0
            ${v.dot}
            ${pulse ? 'animate-pulse-dot' : ''}
          `}
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  );
}
