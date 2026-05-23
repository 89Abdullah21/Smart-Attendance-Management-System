import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Zap, UserRound, BookOpen, Shield } from 'lucide-react';
import LoginForm from '../components/forms/LoginForm';
import { useAuth, DEV_MODE } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Button from '../components/ui/Button';

/* ── DEV quick-access panel ─────────────────────────────────────────────── */
function DevQuickAccess() {
  const { devSwitchRole, defaultRoute } = useAuth();
  const { push } = useNotification();
  const navigate = useNavigate();

  const ROLES = [
    { key: 'student', label: 'Student',  icon: UserRound,  color: 'text-blue-700',   bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200'   },
    { key: 'teacher', label: 'Teacher',  icon: BookOpen,   color: 'text-violet-700', bg: 'bg-violet-50 hover:bg-violet-100 border-violet-200' },
    { key: 'admin',   label: 'Admin',    icon: Shield,     color: 'text-rose-700',   bg: 'bg-rose-50 hover:bg-rose-100 border-rose-200'   },
  ];

  const handleQuickLogin = (role) => {
    devSwitchRole(role);
    push('success', `Logged in as ${role} (DEV mode)`, 2500);
    // Navigate after state settles
    setTimeout(() => {
      const routes = { student: '/student/dashboard', teacher: '/teacher/dashboard', admin: '/admin' };
      navigate(routes[role]);
    }, 50);
  };

  return (
    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
      <div className="flex items-center gap-1.5 mb-3">
        <Zap className="w-3.5 h-3.5 text-amber-600" />
        <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Dev Mode — Quick Access</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {ROLES.map(({ key, label, icon: Icon, color, bg }) => (
          <button
            key={key}
            id={`dev-quick-login-${key}`}
            onClick={() => handleQuickLogin(key)}
            className={`
              flex flex-col items-center gap-1.5 px-3 py-3
              rounded-xl border text-center
              transition-all duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
              ${bg}
            `}
          >
            <Icon className={`w-5 h-5 ${color}`} />
            <span className={`text-xs font-semibold ${color}`}>{label}</span>
          </button>
        ))}
      </div>
      <p className="text-[10px] text-amber-600 text-center mt-2.5">
        No credentials required · Set <code className="font-mono">DEV_MODE = false</code> before deploy
      </p>
    </div>
  );
}

/* ── Login page ─────────────────────────────────────────────────────────── */
/**
 * Login — /login
 * Public page with login form + DEV quick-access panel.
 */
export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* ── Brand header ────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200 mb-4">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Sign in to SmartAttend
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Smart attendance for modern universities
          </p>
        </div>

        {/* ── Card ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-100 p-8">
          <LoginForm />

          <div className="flex items-center gap-3 my-5">
            <hr className="flex-1 border-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or</span>
            <hr className="flex-1 border-slate-200" />
          </div>

          <p className="text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link
              to="/register"
              id="login-register-link"
              className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline transition-colors"
            >
              Register here
            </Link>
          </p>

          {/* DEV quick-access — only shown in dev mode */}
          {DEV_MODE && <DevQuickAccess />}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} SmartAttend · University Attendance System
        </p>
      </div>
    </div>
  );
}
