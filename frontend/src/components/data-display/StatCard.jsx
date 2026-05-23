import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * StatCard — KPI summary card.
 *
 * @param {string}    label
 * @param {string|number} value
 * @param {ReactNode} icon
 * @param {'up'|'down'|'flat'} trend
 * @param {string}    trendLabel  — e.g. "+3% from last week"
 * @param {string}    color       — tailwind color key: 'indigo'|'emerald'|'red'|'amber'
 */
export default function StatCard({ label, value, icon, trend, trendLabel, color = 'indigo' }) {
  const BG    = { indigo: 'bg-indigo-50',  emerald: 'bg-emerald-50', red: 'bg-red-50',  amber: 'bg-amber-50'  };
  const TEXT  = { indigo: 'text-indigo-600', emerald: 'text-emerald-600', red: 'text-red-600', amber: 'text-amber-600' };
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-slate-400';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
      {icon && (
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${BG[color]} ${TEXT[color]} shrink-0`}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900 truncate">{value ?? '—'}</p>
        {trendLabel && (
          <p className={`flex items-center gap-1 text-xs mt-1 ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            {trendLabel}
          </p>
        )}
      </div>
    </div>
  );
}
