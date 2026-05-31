/**
 * teacherService.js — Teacher-facing API calls.
 *
 * DB tables:
 *   courses     → teacher's assigned courses
 *   enrollments → roster of students per course
 *   attendance  → aggregate stats + per-student records
 *   timetable   → schedule slots for the teacher's courses
 */
import api from './api';

/** GET /api/teacher/courses → Course[] for the logged-in teacher */
export const getCourses = () =>
  api.get('/teacher/courses').then((r) => r.data);

/**
 * getRoster — fetch enrolled students with today's (or a given date's) attendance status.
 * GET /api/teacher/roster/:courseId?date=YYYY-MM-DD
 * Returns: RosterRow[] { student_id, full_name, roll_number, section,
 *                        status, marked_at, latitude_marked, longitude_marked,
 *                        is_location_valid }
 */
export const getRoster = (courseId, date) =>
  api.get(`/teacher/roster/${courseId}`, { params: { date } }).then((r) => r.data);

/**
 * getKpiStats — aggregate KPIs for a teacher's course over a date range.
 * GET /api/teacher/kpi/:courseId?from=&to=
 * Returns: { present, absent, total, rate, trend: ChartPoint[] }
 */
export const getKpiStats = (courseId, from, to) =>
  api.get(`/teacher/kpi/${courseId}`, { params: { from, to } }).then((r) => r.data);

/**
 * exportReport — fetch report data for charts and exports.
 * GET /api/teacher/report/:courseId?type=daily|weekly|monthly&from=&to=
 */
export const exportReport = (courseId, type, from, to) =>
  api.get(`/teacher/report/${courseId}`, {
    params: { type, from, to },
    responseType: 'json',
  }).then((r) => r.data);

/**
 * updateAttendanceRecord — teacher override for a specific attendance row.
 * PATCH /api/teacher/attendance/:attendanceId
 */
export const updateAttendanceRecord = (attendanceId, payload) =>
  api.patch(`/teacher/attendance/${attendanceId}`, payload).then((r) => r.data);

/**
 * getAuditLog — fetch change history for a student's attendance in a course.
 * GET /api/teacher/audit/:studentId/:courseId
 */
export const getAuditLog = (studentId, courseId) =>
  api.get(`/teacher/audit/${studentId}/${courseId}`).then((r) => r.data);
