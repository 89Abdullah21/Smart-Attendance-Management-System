import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, CheckSquare,
  Users, BarChart2, Settings, Shield,
  ChevronLeft, ChevronRight, LogOut,
  GraduationCap, Radio, FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import Badge from '../ui/Badge';

/* ── Per-role navigation items ───────────────────────────────────────────── */
const NAV = {
  student: [
    {
      to:    '/student/dashboard',
      label: 'Dashboard',
      icon:  LayoutDashboard,
      id:    'sidebar-nav-dashboard',
    },
    {
      to:    '/student/timetable',
      label: 'My Timetable',
      icon:  CalendarDays,
      id:    'sidebar-nav-timetable',
    },
  ],
  teacher: [
    {
      to:    '/teacher/dashboard',
      label: 'Dashboard',
      icon:  LayoutDashboard,
      id:    'sidebar-nav-dashboard',
    },
    {
      to:    '/teacher/sessions',
      label: 'Live Sessions',
      icon:  Radio,
      id:    'sidebar-nav-sessions',
    },
    {
      to:    '/teacher/roster/1',
      label: 'Class Roster',
      icon:  Users,
      id:    'sidebar-nav-roster',
    },
    {
      to:    '/teacher/reports',
      label: 'Reports',
      icon:  BarChart2,
      id:    'sidebar-nav-reports',
    },
    {
      to:    '/teacher/reports/export',
      label: 'Export Studio',
      icon:  FileText,
      id:    'sidebar-nav-export-studio',
    },
  ],
  admin: [
    {
      to:    '/admin',
      label: 'Admin Panel',
      icon:  Shield,
      id:    'sidebar-nav-admin',
    },
    {
      to:    '/admin',
      label: 'Settings',
      icon:  Settings,
      id:    'sidebar-nav-settings',
    },
  ],
};

/* ── Role-specific accent colours ────────────────────────────────────────── */
const ROLE_ACCENT = {
  student: { bg: 'bg-blue-50',   text: 'text-blue-700',   active: 'bg-blue-50 text-blue-700',   icon: 'text-blue-600',   ring: 'ring-blue-200',   indicator: 'bg-blue-500'   },
  teacher: { bg: 'bg-violet-50', text: 'text-violet-700', active: 'bg-violet-50 text-violet-700', icon: 'text-violet-600', ring: 'ring-violet-200', indicator: 'bg-violet-500' },
  admin:   { bg: 'bg-rose-50',   text: 'text-rose-700',   active: 'bg-rose-50 text-rose-700',     icon: 'text-rose-600',   ring: 'ring-rose-200',   indicator: 'bg-rose-500'   },
};

/* ── Sidebar nav link ─────────────────────────────────────────────────────── */
function SidebarLink({ to, label, icon: Icon, id, accent, collapsed }) {
  return (
    <NavLink
      to={to}
      id={id}
      title={collapsed ? label : undefined}
      className={({ isActive }) => `
        group relative flex items-center gap-3
        px-3 py-2.5 rounded-xl
        text-sm font-medium
        transition-all duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400
        ${isActive
          ? `${accent.active} font-semibold shadow-sm`
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }
      `}
    >
      {({ isActive }) => (
        <>
          {/* Active indicator bar */}
          {isActive && (
            <span
              aria-hidden="true"
              className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full ${accent.indicator}`}
            />
          )}

          <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? accent.icon : 'text-slate-400 group-hover:text-slate-600'}`} />

          {!collapsed && (
            <span className="truncate">{label}</span>
          )}

          {/* Tooltip label when collapsed */}
          {collapsed && (
            <span className="
              absolute left-full ml-3 px-2 py-1
              bg-slate-900 text-white text-xs font-medium rounded-lg
              whitespace-nowrap shadow-lg
              opacity-0 pointer-events-none
              group-hover:opacity-100
              transition-opacity duration-150
              z-50
            ">
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
/**
 * Sidebar — Role-aware collapsible left navigation.
 *
 * • Reads user.role from AuthContext to determine which nav items to show.
 * • Accent colour changes with role (blue = student, violet = teacher, rose = admin).
 * • Collapse button shrinks sidebar to icon-only mode with hover tooltips.
 * • Shows student "Mark Attendance" CTA shortcut at bottom.
 * • Hidden on mobile (mobile nav is handled separately via bottom-sheet or menu).
 */
export default function Sidebar() {
  const { user, logout } = useAuth();
  const { push } = useNotification();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = NAV[user?.role] ?? [];
  const accent   = ROLE_ACCENT[user?.role] ?? ROLE_ACCENT.student;

  const handleLogout = () => {
    logout();
    push('success', 'Signed out successfully.');
    navigate('/login');
  };

  return (
    <aside
      aria-label="Sidebar navigation"
      className={`
        hidden md:flex flex-col
        h-full
        bg-white border-r border-slate-200
        sidebar-transition
        ${collapsed ? 'w-16' : 'w-56'}
        shrink-0
      `}
    >
      {/* ── Role identity strip ──────────────────────────────────── */}
      {!collapsed && user && (
        <div className={`mx-3 mt-4 mb-2 px-3 py-2.5 rounded-xl ${accent.bg} border border-current border-opacity-10`}>
          <div className="flex items-center gap-2">
            <GraduationCap className={`w-4 h-4 shrink-0 ${accent.icon}`} />
            <div className="min-w-0">
              <p className={`text-xs font-bold ${accent.text} truncate`}>{user.full_name}</p>
              <Badge label={user.role} variant={user.role} dot={false} className="mt-0.5 scale-90 origin-left" />
            </div>
          </div>
        </div>
      )}

      {/* Collapsed role dot */}
      {collapsed && user && (
        <div className="flex justify-center mt-4 mb-2">
          <div className={`w-2 h-2 rounded-full ${accent.indicator}`} aria-hidden="true" />
        </div>
      )}

      {/* ── Navigation items ─────────────────────────────────────── */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {/* Section label */}
        {!collapsed && (
          <p className="px-3 py-1 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {user?.role === 'admin' ? 'Administration' : 'Navigation'}
          </p>
        )}

        {navItems.map((item) => (
          <SidebarLink
            key={item.to + item.label}
            {...item}
            accent={accent}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* ── Mark Attendance shortcut (student only) ──────────────── */}
      {user?.role === 'student' && (
        <div className={`px-2 pb-3 pt-2 border-t border-slate-100 ${collapsed ? 'flex justify-center' : ''}`}>
          <NavLink
            to="/student/timetable"
            id="sidebar-mark-attendance-cta"
            title={collapsed ? 'Mark Attendance' : undefined}
            className={`
              flex items-center gap-2
              font-semibold text-sm text-white
              bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800
              rounded-xl transition-colors shadow-sm
              focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400
              ${collapsed ? 'w-10 h-10 justify-center p-0' : 'px-3 py-2.5 w-full'}
            `}
          >
            <CheckSquare className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">Mark Attendance</span>}
          </NavLink>
        </div>
      )}

      {/* ── Collapse toggle + logout ──────────────────────────────── */}
      <div className={`px-2 pb-4 pt-1 border-t border-slate-100 flex ${collapsed ? 'flex-col items-center gap-2' : 'items-center justify-between'}`}>
        {/* Logout button */}
        <button
          id="sidebar-logout-btn"
          onClick={handleLogout}
          title="Sign out"
          className={`
            flex items-center gap-2 rounded-lg text-sm font-medium
            text-slate-500 hover:text-red-600 hover:bg-red-50
            transition-colors
            focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400
            ${collapsed ? 'p-2' : 'px-3 py-2'}
          `}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        {/* Collapse toggle */}
        <button
          id="sidebar-collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="
            p-1.5 rounded-lg text-slate-400
            hover:bg-slate-100 hover:text-slate-600
            transition-colors
            focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400
          "
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4" />
            : <ChevronLeft  className="w-4 h-4" />
          }
        </button>
      </div>
    </aside>
  );
}
