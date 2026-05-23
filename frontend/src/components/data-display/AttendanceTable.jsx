import Badge from '../ui/Badge';
import { formatDate, formatTime } from '../../utils/dateHelpers';

/**
 * AttendanceTable — Sortable/filterable table of attendance records.
 * Consumes attendance rows joined with courses and timetable.
 *
 * @param {Array} rows — AttendanceRecord[]
 *   { attendance_id, class_date, course_name, status, marked_at, is_location_valid }
 */
export default function AttendanceTable({ rows = [] }) {
  if (!rows.length) return (
    <p className="text-center text-sm text-slate-400 py-8">No attendance records found.</p>
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm" aria-label="Attendance records">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-left">
            {['Date', 'Course', 'Status', 'Marked At', 'Location'].map((h) => (
              <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.attendance_id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{formatDate(row.class_date)}</td>
              <td className="px-4 py-3 font-medium text-slate-900">{row.course_name}</td>
              <td className="px-4 py-3">
                <Badge label={row.status} variant={row.status} />
              </td>
              <td className="px-4 py-3 text-slate-500">{row.marked_at ? formatTime(row.marked_at) : '—'}</td>
              <td className="px-4 py-3">
                <Badge
                  label={row.is_location_valid ? 'Valid' : 'Invalid'}
                  variant={row.is_location_valid ? 'Valid' : 'Invalid'}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
