import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { History } from 'lucide-react';
import PageWrapper from '../../components/layout/PageWrapper';
import FilterBar from '../../components/forms/FilterBar';
import AuditLogDrawer from '../../components/data-display/AuditLogDrawer';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatTime, todayISO } from '../../utils/dateHelpers';

/**
 * TeacherRoster — /teacher/roster/:courseId
 *
 * Local state:
 *   classDate       string YYYY-MM-DD
 *   searchQuery     string
 *   sortConfig      { key, dir: 'asc'|'desc' }
 *   selectedRows    Set<number>
 *   auditDrawerOpen boolean
 *   auditTarget     RosterRow | null
 *
 * DB: enrollments JOIN students JOIN attendance
 *     WHERE course_id=? AND class_date=?
 */
export default function TeacherRoster() {
  const { courseId } = useParams();

  const [classDate, setClassDate]       = useState(todayISO());
  const [searchQuery, setSearchQuery]   = useState('');
  const [sortConfig, setSortConfig]     = useState({ key: 'full_name', dir: 'asc' });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [auditOpen, setAuditOpen]       = useState(false);
  const [auditTarget, setAuditTarget]   = useState(null);
  const [marking, setMarking]           = useState(false);

  const { token } = useAuth();
  const { push } = useNotification();

  const { data: roster, isLoading, refetch } = useFetch(
    `/teacher/roster/${courseId}?date=${classDate}`
  );
  const { data: auditLog } = useFetch(
    auditTarget ? `/teacher/audit/${auditTarget.student_id}/${courseId}` : null
  );

  // ── Filter + sort ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!roster) return [];
    const q = searchQuery.toLowerCase();
    return roster
      .filter((r) =>
        !q ||
        r.full_name.toLowerCase().includes(q) ||
        r.roll_number.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const { key, dir } = sortConfig;
        const v = String(a[key] ?? '').localeCompare(String(b[key] ?? ''));
        return dir === 'asc' ? v : -v;
      });
  }, [roster, searchQuery, sortConfig]);

  const toggleSort = (key) =>
    setSortConfig((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  const toggleRow = (id) =>
    setSelectedRows((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const openAudit = (row) => { setAuditTarget(row); setAuditOpen(true); };

  const handleMarkAbsent = async () => {
    if (selectedRows.size === 0 || marking) return;
    setMarking(true);
    try {
      const res = await fetch('/api/teacher/attendance/mark-manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          course_id: Number(courseId),
          student_ids: Array.from(selectedRows),
          status: 'Absent',
          class_date: classDate,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to mark absences.');
      }
      const body = await res.json().catch(() => ({}));
      push('success', body.message || `Marked ${selectedRows.size} students absent.`);
      setSelectedRows(new Set());
      refetch();
    } catch (err) {
      push('error', err.message || 'Failed to mark absences.');
    } finally {
      setMarking(false);
    }
  };

  const SortTh = ({ label, sortKey }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer select-none hover:text-indigo-600"
      onClick={() => toggleSort(sortKey)}
    >
      {label} {sortConfig.key === sortKey ? (sortConfig.dir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <PageWrapper title="Class Roster">
      <div className="space-y-4">

        {/* ── Date + Search Filters ──────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="roster-date-picker"
            type="date"
            value={classDate}
            onChange={(e) => setClassDate(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <FilterBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          {selectedRows.size > 0 && (
            <Button
              id="roster-bulk-absent-btn"
              variant="danger"
              size="sm"
              loading={marking}
              onClick={handleMarkAbsent}
            >
              Mark {selectedRows.size} Absent
            </Button>
          )}
        </div>

        {/* ── Table ─────────────────────────────────────────── */}
        {isLoading ? <Spinner label="Loading roster…" /> : !filtered.length ? (
          <EmptyState title="No students found" message="Try adjusting your search or date." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm" aria-label="Student roster">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300"
                      onChange={(e) =>
                        setSelectedRows(
                          e.target.checked
                            ? new Set(filtered.map((r) => r.student_id))
                            : new Set()
                        )
                      }
                    />
                  </th>
                  <SortTh label="Student"  sortKey="full_name"   />
                  <SortTh label="Roll No." sortKey="roll_number" />
                  <SortTh label="Section"  sortKey="section"     />
                  <SortTh label="Status"   sortKey="status"      />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Marked At</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row) => (
                  <tr key={row.student_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300"
                        checked={selectedRows.has(row.student_id)}
                        onChange={() => toggleRow(row.student_id)}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.full_name}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{row.roll_number}</td>
                    <td className="px-4 py-3 text-slate-500">{row.section}</td>
                    <td className="px-4 py-3">
                      <Badge label={row.status ?? '—'} variant={row.status ?? 'Finished'} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {row.marked_at ? formatTime(row.marked_at) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {row.status ? (
                        <Badge
                          label={row.is_location_valid ? 'Valid' : 'Invalid'}
                          variant={row.is_location_valid ? 'Valid' : 'Invalid'}
                        />
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        id={`roster-audit-btn-${row.student_id}`}
                        onClick={() => openAudit(row)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                        aria-label="View audit log"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Audit Log Drawer ────────────────────────────────── */}
      <AuditLogDrawer
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
        studentName={auditTarget?.full_name}
        log={auditLog ?? []}
      />
    </PageWrapper>
  );
}
