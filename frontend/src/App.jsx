import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// ── Providers ──────────────────────────────────────────────────────────────
import { AuthProvider, useAuth }         from './context/AuthContext';
import { AttendanceProvider }            from './context/AttendanceContext';
import { NotificationProvider }          from './context/NotificationContext';

// ── Layout ─────────────────────────────────────────────────────────────────
import Navbar      from './components/layout/Navbar';
import Sidebar     from './components/layout/Sidebar';
import Toast       from './components/ui/Toast';
import Spinner     from './components/ui/Spinner';

// ── Public pages ───────────────────────────────────────────────────────────
import Login    from './pages/Login';
import Register from './pages/Register';

// ── Student pages ──────────────────────────────────────────────────────────
import StudentDashboard  from './pages/student/StudentDashboard';
import StudentTimetable  from './pages/student/StudentTimetable';
import AttendanceMarking from './pages/student/AttendanceMarking';

// ── Teacher pages ──────────────────────────────────────────────────────────
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherRoster    from './pages/teacher/TeacherRoster';
import Reports          from './pages/teacher/Reports';
import TeacherSessions  from './pages/teacher/TeacherSessions';
import ReportsExportStudio from './pages/teacher/ReportsExportStudio';

// ── Admin pages ────────────────────────────────────────────────────────────
import AdminPanel from './pages/admin/AdminPanel';

// ── Shared pages ───────────────────────────────────────────────────────────
import AccountSettings from './pages/AccountSettings';

// ── Route Guards ───────────────────────────────────────────────────────────

/** Redirect to /login if not authenticated. */
function RequireAuth({ allowedRoles }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <Spinner label="Authenticating…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

/** Redirect authenticated users away from login/register. */
function RedirectIfAuth() {
  const { isAuthenticated, isLoading, defaultRoute } = useAuth();
  if (isLoading) return <Spinner label="Loading…" />;
  if (isAuthenticated) return <Navigate to={defaultRoute} replace />;
  return <Outlet />;
}

/** Shell layout: Navbar + Sidebar + content area. */
function AppShell() {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-body">
        <Sidebar />
        <Outlet />
      </div>
    </div>
  );
}

// ── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AttendanceProvider>

            {/* Global toast stack */}
            <Toast />

            <Routes>
              {/* ── Root redirect ──────────────────────────────── */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* ── Public routes (redirect if already logged in) ─ */}
              <Route element={<RedirectIfAuth />}>
                <Route path="/login"    element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* ── Protected shell (Navbar + Sidebar) ──────────── */}
              <Route element={<RequireAuth />}>
                <Route element={<AppShell />}>

                  {/* Student routes */}
                  <Route element={<RequireAuth allowedRoles={['student']} />}>
                    <Route path="/student/dashboard"      element={<StudentDashboard />} />
                    <Route path="/student/timetable"      element={<StudentTimetable />} />
                    <Route path="/student/mark/:slotId"   element={<AttendanceMarking />} />
                  </Route>

                  {/* Teacher routes */}
                  <Route element={<RequireAuth allowedRoles={['teacher']} />}>
                    <Route path="/teacher/dashboard"            element={<TeacherDashboard />} />
                    <Route path="/teacher/roster/:courseId"     element={<TeacherRoster />} />
                    <Route path="/teacher/reports"              element={<Reports />} />
                    <Route path="/teacher/sessions"             element={<TeacherSessions />} />
                    <Route path="/teacher/reports/export"       element={<ReportsExportStudio />} />
                  </Route>

                  {/* Admin routes */}
                  <Route element={<RequireAuth allowedRoles={['admin']} />}>
                    <Route path="/admin" element={<AdminPanel />} />
                  </Route>

                  {/* Shared/Common routes */}
                  <Route path="/settings" element={<AccountSettings />} />

                </Route>
              </Route>

              {/* ── 404 fallback ───────────────────────────────── */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>

          </AttendanceProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
