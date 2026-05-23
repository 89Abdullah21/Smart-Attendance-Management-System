/**
 * attendanceService.js — Attendance marking and session status API calls.
 *
 * DB tables:
 *   attendance  (INSERT + SELECT)
 *   timetable   (time-window validation done server-side)
 */
import api from './api';

/**
 * markAttendance — POST a new attendance record.
 * Unique constraint uq_attendance(student_id, slot_id, class_date) enforced by DB.
 *
 * @param {{ student_id, slot_id, course_id, latitude_marked, longitude_marked,
 *            is_location_valid, status }} payload
 */
export const markAttendance = (payload) =>
  api.post('/attendance/mark', payload).then((r) => r.data);

/**
 * getSessionStatus — check if a slot is currently within its active window.
 * GET /api/attendance/session-status/:slotId
 * Returns: { isActive: boolean, isWithinWindow: boolean, message: string }
 */
export const getSessionStatus = (slotId) =>
  api.get(`/attendance/session-status/${slotId}`).then((r) => r.data);

/**
 * hasAlreadyMarked — check if the student already submitted for this slot today.
 * GET /api/attendance/check/:slotId
 * Returns: { alreadyMarked: boolean, record?: AttendanceRecord }
 */
export const hasAlreadyMarked = (slotId) =>
  api.get(`/attendance/check/${slotId}`).then((r) => r.data);
