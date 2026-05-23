/**
 * PageWrapper — Consistent page-level container.
 *
 * Provides:
 *   • Scrollable content area (overflow-y-auto)
 *   • Max-width constraint with responsive horizontal padding
 *   • Optional sticky page header: <h1> title + actions slot
 *   • Optional breadcrumb slot
 *   • Consistent vertical spacing between header and content
 *
 * @param {string}    title       — Page heading rendered as <h1>
 * @param {ReactNode} actions     — Buttons/controls in top-right of header
 * @param {ReactNode} breadcrumb  — Breadcrumb trail (optional)
 * @param {ReactNode} children    — Page content
 * @param {string}    maxWidth    — Tailwind max-w class (default 'max-w-7xl')
 * @param {boolean}   noPadding   — Disable default content padding (for full-bleed layouts)
 */
export default function PageWrapper({
  title,
  actions,
  breadcrumb,
  children,
  maxWidth  = 'max-w-7xl',
  noPadding = false,
}) {
  const hasHeader = title || actions;

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50">
      <div className={`${maxWidth} mx-auto w-full ${noPadding ? '' : 'px-4 sm:px-6 py-6'}`}>

        {/* ── Breadcrumb ──────────────────────────────────────────── */}
        {breadcrumb && (
          <nav aria-label="Breadcrumb" className="mb-3 text-xs text-slate-500">
            {breadcrumb}
          </nav>
        )}

        {/* ── Page header ────────────────────────────────────────── */}
        {hasHeader && (
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            {title && (
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                {title}
              </h1>
            )}
            {actions && (
              <div className="flex items-center gap-3 flex-wrap">
                {actions}
              </div>
            )}
          </div>
        )}

        {/* ── Content ─────────────────────────────────────────────── */}
        {children}
      </div>
    </main>
  );
}
