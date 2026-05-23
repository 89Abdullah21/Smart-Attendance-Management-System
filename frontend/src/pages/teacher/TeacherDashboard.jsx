import { useState } from 'react';
import { Users, TrendingUp, CheckCircle2, XCircle, Download, Mail } from 'lucide-react';
import PageWrapper from '../../components/layout/PageWrapper';
import StatCard from '../../components/data-display/StatCard';
import AttendanceChart from '../../components/data-display/AttendanceChart';
import FilterBar from '../../components/forms/FilterBar';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../context/AuthContext';
import { todayISO } from '../../utils/dateHelpers';

/**
 * TeacherDashboard — /teacher/dashboard
 * Enhanced with automated Local Seed fallbacks for smooth offline development.
 */
export default function TeacherDashboard() {
  const { user, getMyCourses, DEV_MODE, PLACEHOLDER_ENROLLMENTS } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [dateRange, setDateRange] = useState({ from: '', to: todayISO() });

  // Try loading live structural courses from endpoints
  const { data: serverCourses, isLoading: coursesLoading } = useFetch('/teacher/courses');

  const kpiUrl = selectedCourse
    ? `/teacher/kpi/${selectedCourse}?from=${dateRange.from}&to=${dateRange.to}`
    : null;
  const { data: serverKpi, isLoading: kpiLoading } = useFetch(kpiUrl);

  // ── LOCAL DEV SEED ACCELERATOR ─────────────────────────────────────────────
  const useLocalSeeds = DEV_MODE && (!serverCourses || (selectedCourse && !serverKpi));

  const localCourses = getMyCourses();
  
  // Set default fallback selection to first course if none chosen yet to trigger KPI graphs
  if (useLocalSeeds && !selectedCourse && localCourses.length > 0) {
    setSelectedCourse(localCourses[0].course_id);
  }

  // Construct functional analytics payload mirroring actual backend records
  const targetCourseId = selectedCourse || (localCourses[0]?.course_id ?? 1);
  const registeredCount = PLACEHOLDER_ENROLLMENTS.filter(e => e.course_id === targetCourseId).length || 5;

  const localKpi = {
    present: registeredCount * 4,
    absent: Math.round(registeredCount * 0.8),
    total: (registeredCount * 4) + Math.round(registeredCount * 0.8),
    rate: 84,
    trend: 3.5,
    chartData: [
      { date: '05-12', Present: Math.round(registeredCount * 0.8), Absent: 1 },
      { date: '05-14', Present: Math.round(registeredCount * 0.9), Absent: 0 },
      { date: '05-16', Present: Math.round(registeredCount * 0.75), Absent: 2 },
      { date: '05-19', Present: Math.round(registeredCount * 0.85), Absent: 1 },
    ]
  };

  // ── FINAL DATA RESOLVER ────────────────────────────────────────────────────
  const courses   = useLocalSeeds ? localCourses : (serverCourses ?? []);
  const kpi       = useLocalSeeds ? localKpi : serverKpi;
  const isLoading = !DEV_MODE && (coursesLoading || kpiLoading);

  return (
    <PageWrapper
      title={`Welcome, ${user?.full_name?.split(' ')[0] ?? 'Teacher'}`}
      actions={
        <div className="flex gap-2">
          <Button id="teacher-export-btn" variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4" />}>Export</Button>
          <Button id="teacher-email-btn"  variant="secondary" size="sm" leftIcon={<Mail className="w-4 h-4" />}>Email Summary</Button>
        </div>
      }
    >
      <div className="space-y-6">

        {/* ── Filters ───────────────────────────────────────────── */}
        <FilterBar
          courses={courses ?? []}
          selectedCourse={selectedCourse}
          onCourseChange={setSelectedCourse}
          dateFrom={dateRange.from}
          dateTo={dateRange.to}
          onDateChange={setDateRange}
        />

        {isLoading ? <Spinner label="Loading stats…" /> : (
          <>
            {/* ── KPI Cards ───────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Present"         value={kpi?.present ?? '—'}                               icon={<CheckCircle2 className="w-5 h-5" />} color="emerald" />
              <StatCard label="Absent"          value={kpi?.absent  ?? '—'}                               icon={<XCircle className="w-5 h-5" />}      color="red"     />
              <StatCard label="Total Sessions"  value={kpi?.total   ?? '—'}                               icon={<Users className="w-5 h-5" />}         color="indigo"  />
              <StatCard label="Attendance Rate" value={kpi?.rate ? `${kpi.rate}%` : '—'}                icon={<TrendingUp className="w-5 h-5" />}    color="indigo"
                trend={kpi?.trend > 0 ? 'up' : kpi?.trend < 0 ? 'down' : 'flat'}
                trendLabel={kpi?.trend ? `${kpi.trend > 0 ? '+' : ''}${kpi.trend}% vs last period` : undefined}
              />
            </div>

            {/* ── Trend Chart ─────────────────────────────────────── */}
            {kpi?.chartData?.length > 0 && (
              <AttendanceChart
                type="line"
                data={kpi.chartData}
                title="Attendance Trend"
              />
            )}

            {/* ── Quick Course Links ──────────────────────────────── */}
            {courses?.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Your Courses</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {courses.map((c) => (
                    <a
                      key={c.course_id}
                      href={`/teacher/roster/${c.course_id}`}
                      id={`course-link-${c.course_id}`}
                      className="flex items-center justify-between px-4 py-3 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                    >
                      <span className="text-sm font-medium text-slate-800 group-hover:text-indigo-700">{c.course_name}</span>
                      <span className="text-xs text-slate-400">{c.credit_hours} cr →</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
}