import {
  createContext, useContext, useState,
  useEffect, useCallback, useMemo,
} from 'react';

/**
 * AuthContext — Complete identity management with:
 *   • localStorage session persistence (survives page refresh)
 *   • Role-based identity: 'student' | 'teacher' | 'admin'
 *   • DEV_MODE: enables instant role-switching without a backend
 *   • Rich local placeholder datasets for students, teachers, courses,
 *     enrollments and timetable so the UI has real data to work against
 *   • Production path: real POST /api/auth/login when backend is ready
 *
 * DB tables: students | teachers | admins | courses | enrollments | timetable
 */

// ── Dev Mode ─────────────────────────────────────────────────────────────────
// Set to false before deploying to production.
export const DEV_MODE = false;

const DEV_TOKEN = 'dev_token_local_testing_only';

// ─────────────────────────────────────────────────────────────────────────────
// PLACEHOLDER DATA — mirrors the DB schema exactly.
// Use these arrays anywhere in the app via useAuth() when DEV_MODE is true.
// ─────────────────────────────────────────────────────────────────────────────

export const PLACEHOLDER_STUDENTS = [
  {
    student_id:  1,
    full_name:   'Alex Johnson',
    email:       'alex.johnson@uni.edu',
    roll_number: '2021-CS-042',
    section:     'A',
    semester:    5,
    department:  'Computer Science',
    avatar_initials: 'AJ',
    created_at:  '2021-09-01T08:00:00Z',
  },
  {
    student_id:  2,
    full_name:   'Sara Khan',
    email:       'sara.khan@uni.edu',
    roll_number: '2021-CS-017',
    section:     'A',
    semester:    5,
    department:  'Computer Science',
    avatar_initials: 'SK',
    created_at:  '2021-09-01T08:05:00Z',
  },
  {
    student_id:  3,
    full_name:   'Bilal Raza',
    email:       'bilal.raza@uni.edu',
    roll_number: '2021-CS-089',
    section:     'B',
    semester:    5,
    department:  'Computer Science',
    avatar_initials: 'BR',
    created_at:  '2021-09-02T09:00:00Z',
  },
  {
    student_id:  4,
    full_name:   'Aisha Siddiqui',
    email:       'aisha.siddiqui@uni.edu',
    roll_number: '2022-CS-011',
    section:     'A',
    semester:    3,
    department:  'Software Engineering',
    avatar_initials: 'AS',
    created_at:  '2022-09-01T08:00:00Z',
  },
  {
    student_id:  5,
    full_name:   'Hamza Tariq',
    email:       'hamza.tariq@uni.edu',
    roll_number: '2022-CS-055',
    section:     'B',
    semester:    3,
    department:  'Software Engineering',
    avatar_initials: 'HT',
    created_at:  '2022-09-01T08:10:00Z',
  },
  {
    student_id:  6,
    full_name:   'Nida Fatima',
    email:       'nida.fatima@uni.edu',
    roll_number: '2023-CS-003',
    section:     'A',
    semester:    1,
    department:  'Information Technology',
    avatar_initials: 'NF',
    created_at:  '2023-09-01T08:00:00Z',
  },
];

export const PLACEHOLDER_TEACHERS = [
  {
    teacher_id:  1,
    full_name:   'Dr. Sarah Ahmed',
    email:       'sarah.ahmed@uni.edu',
    department:  'Computer Science',
    avatar_initials: 'SA',
    created_at:  '2019-01-15T09:00:00Z',
  },
  {
    teacher_id:  2,
    full_name:   'Prof. Usman Malik',
    email:       'usman.malik@uni.edu',
    department:  'Computer Science',
    avatar_initials: 'UM',
    created_at:  '2018-08-01T09:00:00Z',
  },
  {
    teacher_id:  3,
    full_name:   'Dr. Zara Hussain',
    email:       'zara.hussain@uni.edu',
    department:  'Software Engineering',
    avatar_initials: 'ZH',
    created_at:  '2020-03-10T09:00:00Z',
  },
  {
    teacher_id:  4,
    full_name:   'Mr. Kamran Ali',
    email:       'kamran.ali@uni.edu',
    department:  'Information Technology',
    avatar_initials: 'KA',
    created_at:  '2021-07-01T09:00:00Z',
  },
];

export const PLACEHOLDER_COURSES = [
  { course_id: 1, course_name: 'Data Structures & Algorithms', credit_hours: 3, teacher_id: 1 },
  { course_id: 2, course_name: 'Operating Systems',            credit_hours: 3, teacher_id: 2 },
  { course_id: 3, course_name: 'Database Systems',             credit_hours: 3, teacher_id: 1 },
  { course_id: 4, course_name: 'Computer Networks',            credit_hours: 3, teacher_id: 3 },
  { course_id: 5, course_name: 'Software Engineering',         credit_hours: 3, teacher_id: 3 },
  { course_id: 6, course_name: 'Web Technologies',             credit_hours: 2, teacher_id: 4 },
  { course_id: 7, course_name: 'Artificial Intelligence',      credit_hours: 3, teacher_id: 2 },
];

export const PLACEHOLDER_ENROLLMENTS = [
  // student 1 (Alex) — semester 5, section A
  { enrollment_id: 1,  student_id: 1, course_id: 1 },
  { enrollment_id: 2,  student_id: 1, course_id: 2 },
  { enrollment_id: 3,  student_id: 1, course_id: 3 },
  { enrollment_id: 4,  student_id: 1, course_id: 4 },
  // student 2 (Sara) — semester 5, section A
  { enrollment_id: 5,  student_id: 2, course_id: 1 },
  { enrollment_id: 6,  student_id: 2, course_id: 2 },
  { enrollment_id: 7,  student_id: 2, course_id: 3 },
  { enrollment_id: 8,  student_id: 2, course_id: 5 },
  // student 3 (Bilal) — semester 5, section B
  { enrollment_id: 9,  student_id: 3, course_id: 1 },
  { enrollment_id: 10, student_id: 3, course_id: 4 },
  { enrollment_id: 11, student_id: 3, course_id: 7 },
  // student 4 (Aisha) — semester 3, section A
  { enrollment_id: 12, student_id: 4, course_id: 5 },
  { enrollment_id: 13, student_id: 4, course_id: 6 },
  // student 5 (Hamza) — semester 3, section B
  { enrollment_id: 14, student_id: 5, course_id: 5 },
  { enrollment_id: 15, student_id: 5, course_id: 6 },
  { enrollment_id: 16, student_id: 5, course_id: 7 },
  // student 6 (Nida) — semester 1, section A
  { enrollment_id: 17, student_id: 6, course_id: 6 },
];

export const PLACEHOLDER_TIMETABLE = [
  {
    slot_id:       1,
    course_id:     1,
    day_of_week:   'Mon',
    start_time:    '08:00',
    end_time:      '09:30',
    room_location: 'CS Lab 1',
    latitude:      33.738045,
    longitude:     72.814522,
  },
  {
    slot_id:       2,
    course_id:     1,
    day_of_week:   'Wed',
    start_time:    '08:00',
    end_time:      '09:30',
    room_location: 'CS Lab 1',
    latitude:      33.738045,
    longitude:     72.814522,
  },
  {
    slot_id:       3,
    course_id:     2,
    day_of_week:   'Tue',
    start_time:    '10:00',
    end_time:      '11:30',
    room_location: 'Room 204',
    latitude:      33.738120,
    longitude:     72.814780,
  },
  {
    slot_id:       4,
    course_id:     2,
    day_of_week:   'Thu',
    start_time:    '10:00',
    end_time:      '11:30',
    room_location: 'Room 204',
    latitude:      33.738120,
    longitude:     72.814780,
  },
  {
    slot_id:       5,
    course_id:     3,
    day_of_week:   'Mon',
    start_time:    '12:00',
    end_time:      '13:30',
    room_location: 'CS Lab 2',
    latitude:      33.737980,
    longitude:     72.814300,
  },
  {
    slot_id:       6,
    course_id:     3,
    day_of_week:   'Wed',
    start_time:    '12:00',
    end_time:      '13:30',
    room_location: 'CS Lab 2',
    latitude:      33.737980,
    longitude:     72.814300,
  },
  {
    slot_id:       7,
    course_id:     4,
    day_of_week:   'Tue',
    start_time:    '14:00',
    end_time:      '15:30',
    room_location: 'Room 301',
    latitude:      33.738200,
    longitude:     72.815010,
  },
  {
    slot_id:       8,
    course_id:     5,
    day_of_week:   'Mon',
    start_time:    '09:30',
    end_time:      '11:00',
    room_location: 'Seminar Hall',
    latitude:      33.738350,
    longitude:     72.815200,
  },
  {
    slot_id:       9,
    course_id:     6,
    day_of_week:   'Fri',
    start_time:    '08:00',
    end_time:      '10:00',
    room_location: 'IT Lab',
    latitude:      33.737850,
    longitude:     72.814100,
  },
  {
    slot_id:       10,
    course_id:     7,
    day_of_week:   'Thu',
    start_time:    '14:00',
    end_time:      '15:30',
    room_location: 'CS Lab 3',
    latitude:      33.738060,
    longitude:     72.814600,
  },
];

// ── Mock user profiles ────────────────────────────────────────────────────────
// Shaped to match the API response from POST /api/auth/login.
// The 'id' field normalises student_id / teacher_id / admin_id.
const DEV_USERS = {
  student: {
    id:          PLACEHOLDER_STUDENTS[0].student_id,
    full_name:   PLACEHOLDER_STUDENTS[0].full_name,
    email:       PLACEHOLDER_STUDENTS[0].email,
    role:        'student',
    roll_number: PLACEHOLDER_STUDENTS[0].roll_number,
    section:     PLACEHOLDER_STUDENTS[0].section,
    semester:    PLACEHOLDER_STUDENTS[0].semester,
    department:  PLACEHOLDER_STUDENTS[0].department,
    avatar_initials: PLACEHOLDER_STUDENTS[0].avatar_initials,
  },
  teacher: {
    id:          PLACEHOLDER_TEACHERS[0].teacher_id,
    full_name:   PLACEHOLDER_TEACHERS[0].full_name,
    email:       PLACEHOLDER_TEACHERS[0].email,
    role:        'teacher',
    department:  PLACEHOLDER_TEACHERS[0].department,
    avatar_initials: PLACEHOLDER_TEACHERS[0].avatar_initials,
  },
  admin: {
    id:          1,
    full_name:   'System Admin',
    email:       'admin@uni.edu',
    role:        'admin',
    avatar_initials: 'SA',
  },
};

// ── Context Setup ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [token, setToken]         = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Rehydrate persisted session on mount ─────────────────────────────────
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('sa_token');
      const storedUser  = localStorage.getItem('sa_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      localStorage.removeItem('sa_token');
      localStorage.removeItem('sa_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Persist whenever user/token change ───────────────────────────────────
  const _persist = useCallback((u, t) => {
    setUser(u);
    setToken(t);
    if (u && t) {
      localStorage.setItem('sa_user',  JSON.stringify(u));
      localStorage.setItem('sa_token', t);
    } else {
      localStorage.removeItem('sa_user');
      localStorage.removeItem('sa_token');
    }
  }, []);

  // ── login ─────────────────────────────────────────────────────────────────
  /**
   * In DEV_MODE:
   *   - Accepts any password; looks up the email in PLACEHOLDER_STUDENTS /
   *     PLACEHOLDER_TEACHERS and logs in as that specific person.
   *   - Falls back to the generic DEV_USERS[role] profile if not found.
   * In production:
   *   - Calls POST /api/auth/login → { user, token }
   */
  const login = useCallback(async (email, password, role) => {
    if (DEV_MODE) {
      let matchedUser = null;

      if (role === 'student') {
        const found = PLACEHOLDER_STUDENTS.find(
          (s) => s.email.toLowerCase() === email.toLowerCase()
        );
        if (found) {
          matchedUser = {
            id:          found.student_id,
            full_name:   found.full_name,
            email:       found.email,
            role:        'student',
            roll_number: found.roll_number,
            section:     found.section,
            semester:    found.semester,
            avatar_initials: found.avatar_initials,
          };
        }
      } else if (role === 'teacher') {
        const found = PLACEHOLDER_TEACHERS.find(
          (t) => t.email.toLowerCase() === email.toLowerCase()
        );
        if (found) {
          matchedUser = {
            id:          found.teacher_id,
            full_name:   found.full_name,
            email:       found.email,
            role:        'teacher',
            department:  found.department,
            avatar_initials: found.avatar_initials,
          };
        }
      }

      // Fall back to default DEV profile if no email match
      _persist(matchedUser ?? { ...DEV_USERS[role], email }, DEV_TOKEN);
      return;
    }

    // ── Production path ──────────────────────────────────────────────────
    const res = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password, role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Login failed');
    }
    const { user: u, token: t } = await res.json();
    _persist(u, t);
  }, [_persist]);

  // ── register ──────────────────────────────────────────────────────────────
  /**
   * In DEV_MODE:
   *   - Merges formData on top of the role's default DEV profile.
   *   - Does NOT permanently modify PLACEHOLDER_STUDENTS / PLACEHOLDER_TEACHERS;
   *     only the in-session user object changes.
   */
  const register = useCallback(async (formData, role) => {
    if (DEV_MODE) {
      const base = DEV_USERS[role] ?? DEV_USERS.student;
      _persist({ ...base, ...formData, role }, DEV_TOKEN);
      return;
    }
    const res = await fetch('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...formData, role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Registration failed');
    }
    const { user: u, token: t } = await res.json();
    _persist(u, t);
  }, [_persist]);

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => _persist(null, null), [_persist]);

  // ── updateSettings ────────────────────────────────────────────────────────
  const updateSettings = useCallback(async (updatedData) => {
    if (DEV_MODE) {
      const newUser = { ...user, ...updatedData };
      _persist(newUser, token);
      return newUser;
    }
    const res = await fetch('/api/auth/settings', {
      method:  'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body:    JSON.stringify(updatedData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update settings');
    }
    const { user: updatedUser } = await res.json();
    _persist(updatedUser, token);
    return updatedUser;
  }, [user, token, _persist]);

  // ── DEV ONLY: instant role switch ─────────────────────────────────────────
  /** Immediately swap the active session to another role without credentials. */
  const devSwitchRole = useCallback((role) => {
    if (!DEV_MODE) return;
    _persist(DEV_USERS[role], DEV_TOKEN);
  }, [_persist]);

  // ── Derived helpers ───────────────────────────────────────────────────────
  const isAuthenticated = !!user && !!token;
  const isStudent       = user?.role === 'student';
  const isTeacher       = user?.role === 'teacher';
  const isAdmin         = user?.role === 'admin';

  /** Returns the correct post-login route for the current role. */
  const defaultRoute = useMemo(() => {
    if (isTeacher) return '/teacher/dashboard';
    if (isAdmin)   return '/admin';
    return '/student/dashboard';
  }, [isTeacher, isAdmin]);

  /**
   * DEV helper: returns all timetable slots for the current user.
   *   - student: slots for their enrolled course_ids
   *   - teacher: slots for courses they teach (by teacher_id)
   */
  const getMySlots = useCallback(() => {
    if (!user || !DEV_MODE) return [];
    if (isStudent) {
      const myCourseIds = PLACEHOLDER_ENROLLMENTS
        .filter((e) => e.student_id === user.id)
        .map((e) => e.course_id);
      return PLACEHOLDER_TIMETABLE.filter((s) => myCourseIds.includes(s.course_id));
    }
    if (isTeacher) {
      const myCourseIds = PLACEHOLDER_COURSES
        .filter((c) => c.teacher_id === user.id)
        .map((c) => c.course_id);
      return PLACEHOLDER_TIMETABLE.filter((s) => myCourseIds.includes(s.course_id));
    }
    return PLACEHOLDER_TIMETABLE; // admin sees all
  }, [user, isStudent, isTeacher]);

  /**
   * DEV helper: returns courses for the current user.
   */
  const getMyCourses = useCallback(() => {
    if (!user || !DEV_MODE) return [];
    if (isStudent) {
      const myCourseIds = PLACEHOLDER_ENROLLMENTS
        .filter((e) => e.student_id === user.id)
        .map((e) => e.course_id);
      return PLACEHOLDER_COURSES.filter((c) => myCourseIds.includes(c.course_id));
    }
    if (isTeacher) {
      return PLACEHOLDER_COURSES.filter((c) => c.teacher_id === user.id);
    }
    return PLACEHOLDER_COURSES; // admin sees all
  }, [user, isStudent, isTeacher]);

  const value = {
    // ── Identity ─────────────────────────────────────────────
    user,
    token,
    isAuthenticated,
    isLoading,
    isStudent,
    isTeacher,
    isAdmin,
    defaultRoute,
    DEV_MODE,

    // ── Actions ───────────────────────────────────────────────
    login,
    register,
    logout,
    updateSettings,
    devSwitchRole,   // DEV_MODE only

    // ── Placeholder data (available in DEV_MODE) ─────────────
    PLACEHOLDER_STUDENTS,
    PLACEHOLDER_TEACHERS,
    PLACEHOLDER_COURSES,
    PLACEHOLDER_ENROLLMENTS,
    PLACEHOLDER_TIMETABLE,

    // ── Scoped data helpers ───────────────────────────────────
    getMySlots,
    getMyCourses,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/** Convenience hook — throws if used outside AuthProvider */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;
