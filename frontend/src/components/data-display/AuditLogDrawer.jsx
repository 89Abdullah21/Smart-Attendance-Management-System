import { X, History } from 'lucide-react';
import { formatDate, formatTime } from '../../utils/dateHelpers';

/**
 * AuditLogDrawer — Slide-in panel showing edit history for a student's attendance.
 *
 * @param {boolean}   open
 * @param {() => void} onClose
 * @param {string}    studentName
 * @param {Array}     log   — [{ changed_at, changed_by, old_status, new_status, note }]
 */
export default function AuditLogDrawer({ open, onClose, studentName, log = [] }) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <aside
        className={`fixed right-0 top-0 h-full w-80 bg-white shadow-2xl border-l border-slate-200 z-50
          transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        aria-label="Audit log"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800">
            <History className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold text-sm">Audit Log</span>
          </div>
          <button onClick={onClose} aria-label="Close audit log" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {studentName && (
          <p className="px-5 py-3 text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
            Showing changes for <span className="font-medium text-slate-700">{studentName}</span>
          </p>
        )}

        {/* Log entries */}
        <div className="overflow-y-auto h-full pb-20 divide-y divide-slate-100">
          {log.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10">No changes recorded.</p>
          ) : (
            log.map((entry, i) => (
              <div key={i} className="px-5 py-4 text-sm">
                <p className="text-xs text-slate-400 mb-1">{formatDate(entry.changed_at)} · {formatTime(entry.changed_at)}</p>
                <p className="text-slate-700">
                  <span className="font-medium">{entry.changed_by}</span> changed status:{' '}
                  <span className="text-red-500">{entry.old_status}</span> → <span className="text-emerald-600">{entry.new_status}</span>
                </p>
                {entry.note && <p className="text-slate-500 mt-1 italic">"{entry.note}"</p>}
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
