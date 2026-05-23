import { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Input — Controlled form input with label, optional icon, and inline error message.
 *
 * @param {string}    label
 * @param {string}    id       — must be unique for accessibility
 * @param {string}    error    — field-level validation message
 * @param {ReactNode} leftIcon
 * @param {string}    hint     — helper text below input
 */
const Input = forwardRef(function Input(
  { label, id, error, leftIcon, hint, className = '', ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          id={id}
          ref={ref}
          className={`
            w-full rounded-lg border px-3 py-2 text-sm text-slate-900
            placeholder:text-slate-400
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            transition-colors
            ${leftIcon ? 'pl-9' : ''}
            ${error
              ? 'border-red-400 bg-red-50 focus:ring-red-400'
              : 'border-slate-300 bg-white hover:border-slate-400'}
            ${className}
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...props}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
});

export default Input;
