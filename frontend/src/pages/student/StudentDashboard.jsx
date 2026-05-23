import { LayoutDashboard, BookOpen, AlertTriangle, CheckCircle2 } from 'lucide-react';
import PageWrapper from '../../components/layout/PageWrapper';
import StatCard from '../../components/data-display/StatCard';
import AttendanceTable from '../../components/data-display/AttendanceTable';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../context/AuthContext';
import { summarizeAttendance } from '../../utils/attendanceCalc';

/**
 * StudentDashboard — /student/dashboard
 * Fully optimized to display local mock seeds when backend servers are offline.
 */
export default function StudentDashboard() {
  const { user, getMySlots, getMyCourses, DEV_MODE } = useAuth();

  // Try loading live production data from API endpoints
  const { data: summary,   isLoading: sumLoading }  = useFetch('/student/attendance/summary');
  const { data: history,   isLoading: histLoading } = useFetch('/student/attendance');
  const { data: today,     isLoading: todayLoading } = useFetch('/student/timetable/today');

  // ── LOCAL DEV SEED ACCELERATOR ─────────────────────────────────────────────
  // If we are in DEV_MODE and the API endpoints are still loading or offline, 
  // we pull structural arrays instantly from our Context Layer.
  const useLocalSeeds = DEV_MODE && (!summary || !today);

  const localCourses = getMyCourses();
  const localTodaySlots = getMySlots();
  
  // Create mock historical entries matching what AttendanceTable expects
  const localHistory = [
    { attendance_id: 1, course_name: "Database Management Systems", class_date: "2026-05-19", status: "Present", room_location: "Lab 3" },
    { attendance_id: 2, course_name: "Software Engineering", class_date: "2026-05-18", status: "Present", room_location: "Room 102" },
    { attendance_id: 3, course_name: "Web Development", class_date: "2026-05-15", status: "Absent", room_location: "Auditorium A" },
  ];

  // Mock computed calculations matching your utils metrics
  const localSummaryRows = localCourses.map((c, index) => ({
    course_id: c.course_id,
    course_name: c.course_name,
    present: index === 0 ? 3 : 8,
    total: index === 0 ? 5 : 10,
    percent: index === 0 ? 60 : 80,
    atRisk: index === 0 // Mark the first course below 75% for visualization testing
  }));

  // ── FINAL DATA RESOLVER ────────────────────────────────────────────────────
  const displaySummaryRows  = useLocalSeeds ? localSummaryRows : (summary ? summarizeAttendance(summary) : []);
  const warnings           = displaySummaryRows.filter((r) => r.atRisk);
  const displayRecentHistory = useLocalSeeds ? localHistory : (history?.slice(0, 10) ?? []);
  const displayTodayClasses  = useLocalSeeds ? localTodaySlots : (today ?? []);
  
  // Only trigger structural spinner if dev mode is off and files are loading
  const isLoading = !DEV_MODE && (sumLoading || histLoading || todayLoading);

  return (
    <PageWrapper title="My Dashboard">
      {isLoading ? <Spinner label="Loading dashboard…" /> : (
        <div className="space-y-6">

          {/* ── KPI Cards ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Today's Classes"
              value={displayTodayClasses?.length ?? 0}
              icon={<LayoutDashboard className="w-5 h-5" />}
              color="indigo"
            />
            <StatCard
              label="Enrolled Courses"
              value={displaySummaryRows.length}
              icon={<BookOpen className="w-5 h-5" />}
              color="emerald"
            />
            <StatCard
              label="At-Risk Courses"
              value={warnings.length}
              icon={<AlertTriangle className="w-5 h-5" />}
              color={warnings.length > 0 ? 'red' : 'emerald'}
              trendLabel={warnings.length > 0 ? 'Below 75% threshold' : 'All courses healthy'}
              trend={warnings.length > 0 ? 'down' : 'flat'}
            />
          </div>

          {/* ── Warnings ──────────────────────────────────────────── */}
          {warnings.length > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl shadow-sm animate-pulse-slow">
              <p className="text-sm font-semibold text-rose-800 mb-2 flex items-center gap-1.5">
                <AlertTriangle size={16} /> Attendance Shortage Alert
              </p>
              <ul className="space-y-1">
                {warnings.map((w) => (
                  <li key={w.course_id} className="text-sm text-rose-700">
                    You are at risk in <span className="font-bold">{w.course_name}</span> with only <span className="font-bold">{w.percent}%</span> attendance. Attend upcoming classes to remain eligible for examinations.
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Recent Attendance ────────────────────────────────── */}
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              Recent Attendance Log
            </h2>
            {displayRecentHistory.length > 0
              ? <AttendanceTable rows={displayRecentHistory} />
              : <EmptyState title="No attendance records yet" message="Mark your first class to see records here." />
            }
          </div>

        </div>
      )}
    </PageWrapper>
  );
}