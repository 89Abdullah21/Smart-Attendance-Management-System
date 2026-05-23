import { InboxIcon } from 'lucide-react';

/**
 * EmptyState — Illustrated empty list placeholder.
 *
 * @param {string}    title    — Primary message
 * @param {string}    message  — Supporting description
 * @param {ReactNode} action   — Optional CTA button
 * @param {ReactNode} icon     — Custom icon override
 */
export default function EmptyState({ title = 'Nothing here yet', message, action, icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        {icon ?? <InboxIcon className="w-7 h-7" />}
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      {message && <p className="text-sm text-slate-500 max-w-xs">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
