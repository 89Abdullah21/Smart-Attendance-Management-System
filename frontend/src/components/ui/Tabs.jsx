/**
 * Tabs — Accessible horizontal tab switcher.
 *
 * @param {Array<{ id: string, label: string }>} tabs
 * @param {string}   activeTab
 * @param {Function} onChange  (tabId: string) => void
 */
export default function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex border-b border-slate-200" role="tablist">
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          id={`tab-${id}`}
          role="tab"
          aria-selected={activeTab === id}
          aria-controls={`tabpanel-${id}`}
          onClick={() => onChange(id)}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${
            activeTab === id
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
