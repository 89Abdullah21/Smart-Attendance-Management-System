/**
 * studentService.js — Student-facing API calls.
 *
 * DB tables:
 *   enrollments → to scope data to enrolled courses only
 *   timetable   → for schedule retrieval
 *   attendance  → for history and percentage stats
 *   courses     → for course metadata
 */
import api from './api';

/**
 * getTimetable — fetch all timetable slots for a student's enrolled courses.
 * GET /api/student/timetable
 * Returns: TimetableSlot[] with course_name, teacher_name, room, lat/lng, times
 */
export const getTimetable = () =>
  api.get('/student/timetable').then((r) => r.data);

/**
 * getAttendanceHistory — fetch all attendance records for the logged-in student.
 * GET /api/student/attendance
 * Returns: AttendanceRecord[] sorted by class_date DESC
 */
export const getAttendanceHistory = () =>
  api.get('/student/attendance').then((r) => r.data);

/**
 * getAttendanceSummary — per-course aggregated stats (present, total, %).
 * GET /api/student/attendance/summary
 * Returns: { course_id, course_name, present, total, percent }[]
 */
export const getAttendanceSummary = () =>
  api.get('/student/attendance/summary').then((r) => r.data);

/**
 * getSlotDetails — single timetable slot with full metadata for AttendanceMarking.
 * GET /api/student/slot/:slotId
 */
export const getSlotDetails = (slotId) =>
  api.get(`/student/slot/${slotId}`).then((r) => r.data);
