import { CalendarDays } from 'lucide-react';

/**
 * DateRangePicker — Calendar date picker for selecting a from/to date range.
 * Wraps native <input type="date"> in a styled component.
 *
 * @param {{ from: string, to: string }} range  — YYYY-MM-DD strings
 * @param {Function} onChange  ({ from, to }) => void
 */
export default function DateRangePicker({ range = {}, onChange }) {
  return (
    <div className="inline-flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
      <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
      <input
        id="date-range-from"
        type="date"
        value={range.from ?? ''}
        onChange={(e) => onChange({ ...range, from: e.target.value })}
        className="text-sm border-none focus:outline-none text-slate-700"
        aria-label="Start date"
      />
      <span className="text-slate-300">—</span>
      <input
        id="date-range-to"
        type="date"
        value={range.to ?? ''}
        onChange={(e) => onChange({ ...range, to: e.target.value })}
        className="text-sm border-none focus:outline-none text-slate-700"
        aria-label="End date"
        min={range.from}
      />
    </div>
  );
}
