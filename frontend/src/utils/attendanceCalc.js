/**
 * attendanceCalc.js — Attendance percentage calculations and warning logic.
 *
 * DB relevance:
 *   attendance.status  ENUM('Present','Absent')
 *   attendance.student_id, course_id
 */

/** Warning threshold — students below this % receive a warning badge. */
export const WARNING_THRESHOLD = 75;

/**
 * calcAttendancePercent — computes attendance % for a single course.
 * @param {number} presentCount  — COUNT(status = 'Present')
 * @param {number} totalClasses  — COUNT(*) for the course
 * @returns {number} percentage 0–100, rounded to 1 decimal
 */
export function calcAttendancePercent(presentCount, totalClasses) {
  if (!totalClasses || totalClasses === 0) return 0;
  return Math.round((presentCount / totalClasses) * 1000) / 10;
}

/**
 * isAtRisk — true if attendance % is below WARNING_THRESHOLD.
 * @param {number} percent
 */
export function isAtRisk(percent) {
  return percent < WARNING_THRESHOLD;
}

/**
 * calcClassesNeeded — how many consecutive classes must be attended
 * to bring percentage above the threshold.
 * @param {number} present
 * @param {number} total
 * @returns {number} extra classes needed (0 if already safe)
 */
export function calcClassesNeeded(present, total) {
  if (!isAtRisk(calcAttendancePercent(present, total))) return 0;
  let extra = 0;
  while (calcAttendancePercent(present + extra, total + extra) < WARNING_THRESHOLD) {
    extra++;
    if (extra > 500) break; // safety cap
  }
  return extra;
}

/**
 * summarizeAttendance — given a flat array of attendance records for one student,
 * returns per-course summaries.
 *
 * @param {Array<{ course_id, course_name, status }>} records
 * @returns {Array<{ course_id, course_name, present, total, percent, atRisk }>}
 */
export function summarizeAttendance(records) {
  const map = {};
  records.forEach(({ course_id, course_name, status }) => {
    if (!map[course_id]) {
      map[course_id] = { course_id, course_name, present: 0, total: 0 };
    }
    map[course_id].total += 1;
    if (status === 'Present') map[course_id].present += 1;
  });
  return Object.values(map).map((row) => ({
    ...row,
    percent: calcAttendancePercent(row.present, row.total),
    atRisk:  isAtRisk(calcAttendancePercent(row.present, row.total)),
  }));
}
