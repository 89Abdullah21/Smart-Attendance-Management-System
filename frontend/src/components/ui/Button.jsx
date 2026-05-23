import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

/* ── Variant map ─────────────────────────────────────────────────────────── */
const VARIANTS = {
  primary: [
    'bg-indigo-600 text-white',
    'hover:bg-indigo-700 active:bg-indigo-800',
    'focus-visible:ring-indigo-400',
    'shadow-sm hover:shadow-md',
    'border border-indigo-600',
  ],
  secondary: [
    'bg-white text-slate-700',
    'hover:bg-slate-50 active:bg-slate-100',
    'focus-visible:ring-slate-300',
    'shadow-sm',
    'border border-slate-300 hover:border-slate-400',
  ],
  danger: [
    'bg-red-600 text-white',
    'hover:bg-red-700 active:bg-red-800',
    'focus-visible:ring-red-400',
    'shadow-sm hover:shadow-md',
    'border border-red-600',
  ],
  ghost: [
    'bg-transparent text-slate-600',
    'hover:bg-slate-100 active:bg-slate-200',
    'focus-visible:ring-slate-300',
    'border border-transparent',
  ],
  success: [
    'bg-emerald-600 text-white',
    'hover:bg-emerald-700 active:bg-emerald-800',
    'focus-visible:ring-emerald-400',
    'shadow-sm hover:shadow-md',
    'border border-emerald-600',
  ],
  indigo_outline: [
    'bg-transparent text-indigo-600',
    'hover:bg-indigo-50 active:bg-indigo-100',
    'focus-visible:ring-indigo-400',
    'border border-indigo-300 hover:border-indigo-400',
  ],
};

/* ── Size map ────────────────────────────────────────────────────────────── */
const SIZES = {
  xs: 'px-2.5 py-1.5  text-xs  gap-1.5 rounded-md',
  sm: 'px-3.5 py-2    text-sm  gap-2   rounded-lg',
  md: 'px-4.5 py-2.5  text-sm  gap-2   rounded-xl',
  lg: 'px-5   py-3    text-base gap-2.5 rounded-xl',
  xl: 'px-6   py-3.5  text-base gap-3   rounded-2xl',
};

const BASE = [
  'inline-flex items-center justify-center',
  'font-medium',
  'transition-all duration-150',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  'select-none',
].join(' ');

/**
 * Button — Design system button atom.
 *
 * @param {'primary'|'secondary'|'danger'|'ghost'|'success'|'indigo_outline'} variant
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} size
 * @param {boolean}  loading    — shows spinner, disables click
 * @param {boolean}  fullWidth  — stretches to container width
 * @param {ReactNode} leftIcon  — icon before label (pass the element, e.g. <Plus />)
 * @param {ReactNode} rightIcon — icon after label
 */
const Button = forwardRef(function Button(
  {
    children,
    variant    = 'primary',
    size       = 'md',
    loading    = false,
    fullWidth  = false,
    leftIcon,
    rightIcon,
    className  = '',
    type       = 'button',
    ...props
  },
  ref
) {
  const variantClasses = (VARIANTS[variant] ?? VARIANTS.primary).join(' ');
  const sizeClasses    = SIZES[size] ?? SIZES.md;

  return (
    <button
      ref={ref}
      type={type}
      disabled={loading || props.disabled}
      className={`
        ${BASE}
        ${variantClasses}
        ${sizeClasses}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Left slot: spinner when loading, else icon */}
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
      ) : leftIcon ? (
        <span className="shrink-0 flex items-center" aria-hidden="true">{leftIcon}</span>
      ) : null}

      {/* Label */}
      {children && <span className="truncate">{children}</span>}

      {/* Right icon (never shown during loading) */}
      {!loading && rightIcon && (
        <span className="shrink-0 flex items-center" aria-hidden="true">{rightIcon}</span>
      )}
    </button>
  );
});

export default Button;
