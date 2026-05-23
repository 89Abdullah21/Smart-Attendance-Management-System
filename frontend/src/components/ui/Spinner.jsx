import { Loader2 } from 'lucide-react';

/** Spinner — Centered loading indicator for async states. */
export default function Spinner({ size = 'md', label = 'Loading…' }) {
  const SIZES = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-400">
      <Loader2 className={`animate-spin ${SIZES[size]}`} />
      <span className="text-sm">{label}</span>
    </div>
  );
}
