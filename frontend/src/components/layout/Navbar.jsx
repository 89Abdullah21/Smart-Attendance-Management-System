import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap, Bell, LogOut, ChevronDown,
  User, Zap, Settings,
} from 'lucide-react';
import { useAuth, DEV_MODE } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import Badge from '../ui/Badge';

/* ── Avatar initials component ──────────────────────────────────────────── */
function Avatar({ initials, role }) {
  const colors = {
    student: 'bg-blue-100 text-blue-700 ring-blue-200',
    teacher: 'bg-violet-100 text-violet-700 ring-violet-200',
    admin:   'bg-rose-100 text-rose-700 ring-rose-200',
  };
  return (
    <div className={`
      w-8 h-8 rounded-full flex items-center justify-center
      text-xs font-bold ring-2 shrink-0
      ${colors[role] ?? 'bg-slate-100 text-slate-600 ring-slate-200'}
    `}>
      {initials ?? <User className="w-4 h-4" />}
    </div>
  );
}

/* ── Dev Role Switcher ───────────────────────────────────────────────────── */
function DevRoleSwitcher() {
  const { user, devSwitchRole } = useAuth();
  const { push } = useNotification();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const ROLES = [
    { key: 'student', label: 'Student View', color: 'text-blue-600' },
    { key: 'teacher', label: 'Teacher View', color: 'text-violet-600' },
    { key: 'admin',   label: 'Admin View',   color: 'text-rose-600'  },
  ];

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const switchTo = (role) => {
    devSwitchRole(role);
    push('info', `Switched to ${role} view for testing`, 2500);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        id="dev-role-switcher-btn"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors"
        title="DEV: Switch role"
      >
        <Zap className="w-3.5 h-3.5 text-amber-600" />
        <span className="dev-badge">DEV</span>
        <span className="text-xs font-semibold text-amber-700 capitalize hidden sm:block">
          {user?.role ?? 'Role'}
        </span>
        <ChevronDown className={`w-3 h-3 text-amber-600 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
          <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            Switch role
          </p>
          {ROLES.map(({ key, label, color }) => (
            <button
              key={key}
              id={`dev-switch-${key}`}
              onClick={() => switchTo(key)}
              className={`
                w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-slate-50 transition-colors
                ${user?.role === key ? 'font-semibold' : 'font-medium'}
                ${color}
              `}
            >
              {user?.role === key && (
                <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
              )}
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Notification bell ───────────────────────────────────────────────────── */
function NotificationBell() {
  const { push } = useNotification();
  return (
    <button
      id="navbar-notifications-btn"
      aria-label="View notifications"
      onClick={() => push('info', 'No new notifications at this time.')}
      className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
    >
      <Bell className="w-5 h-5" />
      {/* Unread indicator dot */}
      <span
        aria-hidden="true"
        className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"
      />
    </button>
  );
}

/* ── User dropdown ───────────────────────────────────────────────────────── */
function UserMenu() {
  const { user, logout } = useAuth();
  const { push } = useNotification();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    push('success', 'Logged out successfully.');
    navigate('/login');
    setOpen(false);
  };

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        id="navbar-user-menu-btn"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Avatar initials={user.avatar_initials} role={user.role} />
        <div className="hidden sm:flex flex-col items-start min-w-0">
          <span className="text-sm font-semibold text-slate-800 truncate max-w-[120px] leading-tight">
            {user.full_name}
          </span>
          <span className="text-[11px] text-slate-400 capitalize leading-tight">{user.role}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 hidden sm:block transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800 truncate">{user.full_name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
            <Badge label={user.role} variant={user.role} className="mt-1.5" />
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              id="navbar-settings-btn"
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Settings className="w-4 h-4" />
              Account Settings
            </button>
            <hr className="my-1 border-slate-100" />
            <button
              id="navbar-logout-btn"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Navbar ──────────────────────────────────────────────────────────────── */
/**
 * Navbar — Sticky top navigation bar.
 * Contains: brand logo, DEV role switcher (if DEV_MODE), notification bell, user menu.
 */
export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full h-[3.75rem] bg-white border-b border-slate-200 shadow-sm">
      <div className="h-full max-w-full px-4 sm:px-6 flex items-center justify-between gap-4">

        {/* ── Brand ──────────────────────────────────────────────── */}
        <Link
          to="/"
          id="navbar-brand-link"
          className="flex items-center gap-2.5 text-indigo-600 font-bold text-lg tracking-tight shrink-0 hover:text-indigo-700 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="hidden sm:block">SmartAttend</span>
        </Link>

        {/* ── Right cluster ───────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          {/* DEV role switcher — only rendered when DEV_MODE is true */}
          {DEV_MODE && <DevRoleSwitcher />}

          <NotificationBell />

          {/* Thin separator */}
          <div className="w-px h-5 bg-slate-200 mx-1" aria-hidden="true" />

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
