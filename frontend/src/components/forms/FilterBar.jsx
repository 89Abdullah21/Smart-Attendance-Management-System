import { Search, Filter } from 'lucide-react';

/**
 * FilterBar — Course, date range, and section filter controls for teacher views.
 *
 * @param {Course[]}  courses      — options for course dropdown
 * @param {string}    selectedCourse
 * @param {Function}  onCourseChange
 * @param {string}    dateFrom
 * @param {string}    dateTo
 * @param {Function}  onDateChange   ({ from, to }) => void
 * @param {string}    searchQuery
 * @param {Function}  onSearchChange
 */
export default function FilterBar({
  courses = [], selectedCourse, onCourseChange,
  dateFrom, dateTo, onDateChange,
  searchQuery, onSearchChange,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
      {/* Search */}
      {onSearchChange !== undefined && (
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            id="filterbar-search"
            type="text"
            placeholder="Search student…"
            value={searchQuery ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}

      {/* Course selector */}
      {courses.length > 0 && (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            id="filterbar-course"
            value={selectedCourse ?? ''}
            onChange={(e) => onCourseChange(e.target.value || null)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.course_id} value={c.course_id}>{c.course_name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Date range */}
      {onDateChange && (
        <div className="flex items-center gap-2 text-sm">
          <input
            id="filterbar-date-from"
            type="date"
            value={dateFrom ?? ''}
            onChange={(e) => onDateChange({ from: e.target.value, to: dateTo })}
            className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-slate-400">–</span>
          <input
            id="filterbar-date-to"
            type="date"
            value={dateTo ?? ''}
            onChange={(e) => onDateChange({ from: dateFrom, to: e.target.value })}
            className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}
    </div>
  );
}
