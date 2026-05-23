import { useState } from 'react';
import { Download, Mail, BarChart2 } from 'lucide-react';
import PageWrapper from '../../components/layout/PageWrapper';
import AttendanceChart from '../../components/data-display/AttendanceChart';
import FilterBar from '../../components/forms/FilterBar';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import { useFetch } from '../../hooks/useFetch';
import { todayISO } from '../../utils/dateHelpers';

/**
 * Reports — /teacher/reports
 *
 * Local state:
 *   reportType       'daily' | 'weekly' | 'monthly'
 *   selectedCourse   number | null
 *   dateRange        { from, to }
 *   exportModalOpen  boolean
 *
 * DB: attendance GROUP BY class_date, course_id; joined with courses, students
 */
export default function Reports() {
  const [reportType, setReportType]     = useState('weekly');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [dateRange, setDateRange]       = useState({ from: '', to: todayISO() });
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const { data: courses } = useFetch('/teacher/courses');

  const reportUrl = selectedCourse
    ? `/teacher/report/${selectedCourse}?type=${reportType}&from=${dateRange.from}&to=${dateRange.to}&format=json`
    : null;
  const { data: reportData, isLoading } = useFetch(reportUrl);

  const REPORT_TYPES = ['daily', 'weekly', 'monthly'];

  return (
    <PageWrapper
      title="Attendance Reports"
      actions={
        <Button
          id="reports-export-btn"
          variant="primary"
          size="sm"
          onClick={() => setExportModalOpen(true)}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Export
        </Button>
      }
    >
      <div className="space-y-5">

        {/* ── Report Type Tabs ──────────────────────────────────── */}
        <div className="flex gap-2">
          {REPORT_TYPES.map((t) => (
            <button
              key={t}
              id={`report-type-${t}`}
              onClick={() => setReportType(t)}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors capitalize ${
                reportType === t
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Filters ──────────────────────────────────────────── */}
        <FilterBar
          courses={courses ?? []}
          selectedCourse={selectedCourse}
          onCourseChange={setSelectedCourse}
          dateFrom={dateRange.from}
          dateTo={dateRange.to}
          onDateChange={setDateRange}
        />

        {/* ── Charts ───────────────────────────────────────────── */}
        {!selectedCourse ? (
          <EmptyState
            icon={<BarChart2 className="w-7 h-7" />}
            title="Select a course"
            message="Choose a course from the filter above to generate the attendance report."
          />
        ) : isLoading ? (
          <Spinner label="Generating report…" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <AttendanceChart
              type="line"
              data={reportData?.trend ?? []}
              title="Attendance Trend"
            />
            <AttendanceChart
              type="bar"
              data={reportData?.distribution ?? []}
              title="Present / Absent Distribution"
            />
          </div>
        )}

        {/* ── Report History ────────────────────────────────────── */}
        {reportData?.history?.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Report History</h2>
            <ul className="divide-y divide-slate-100 text-sm">
              {reportData.history.map((r, i) => (
                <li key={i} className="flex items-center justify-between py-2.5 text-slate-600">
                  <span>{r.label}</span>
                  <span className="text-xs text-slate-400">{r.generated_at}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Export Modal ─────────────────────────────────────────── */}
      <Modal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Export Report"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setExportModalOpen(false)}>Cancel</Button>
            <Button id="export-pdf-btn"  size="sm" variant="primary">Download PDF</Button>
            <Button id="export-csv-btn"  size="sm" variant="secondary" leftIcon={<Download className="w-4 h-4" />}>Download CSV</Button>
            <Button id="export-email-btn" size="sm" variant="ghost" leftIcon={<Mail className="w-4 h-4" />}>Email Report</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Export the current <strong>{reportType}</strong> report as PDF, CSV, or send via email.
        </p>
      </Modal>
    </PageWrapper>
  );
}
