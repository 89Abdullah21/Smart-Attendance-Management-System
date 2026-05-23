/**
 * dateHelpers.js — Pure date/time utilities.
 *
 * DB relevance:
 *   timetable.day_of_week  ENUM('Mon','Tue','Wed','Thu','Fri')
 *   timetable.start_time   TIME  e.g. "09:00:00"
 *   timetable.end_time     TIME  e.g. "10:30:00"
 *   attendance.class_date  DATE  e.g. "2025-05-19"
 */

const DAY_MAP = { 0: null, 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: null };

/** Returns the timetable ENUM string for today, e.g. 'Mon'. Null on weekends. */
export function todayDayCode() {
  return DAY_MAP[new Date().getDay()];
}

/** Parses "HH:MM:SS" time string into a comparable Date object set to today. */
function parseTimeToday(timeStr) {
  const [h, m, s = 0] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, s, 0);
  return d;
}

/**
 * isSlotActive — true if today matches slot day AND current time is within window.
 * @param {{ day_of_week: string, start_time: string, end_time: string }} slot
 */
export function isSlotActive(slot) {
  if (todayDayCode() !== slot.day_of_week) return false;
  const now   = new Date();
  const start = parseTimeToday(slot.start_time);
  const end   = parseTimeToday(slot.end_time);
  return now >= start && now <= end;
}

/**
 * isSlotUpcoming — today matches AND class hasn't started yet.
 */
export function isSlotUpcoming(slot) {
  if (todayDayCode() !== slot.day_of_week) return false;
  return new Date() < parseTimeToday(slot.start_time);
}

/**
 * isSlotFinished — today matches AND class has ended.
 */
export function isSlotFinished(slot) {
  if (todayDayCode() !== slot.day_of_week) return false;
  return new Date() > parseTimeToday(slot.end_time);
}

/** Format a Date (or ISO string) → "Mon, 19 May 2025" */
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

/** Format a timestamp → "09:15 AM" */
export function formatTime(dateOrString) {
  return new Date(dateOrString).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });
}

/** Format a TIME string "HH:MM:SS" → "09:00 AM" */
export function formatSlotTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0);
  return formatTime(d);
}

/** Returns today's date as a YYYY-MM-DD string (matches attendance.class_date format). */
export function todayISO() {
  return new Date().toISOString().split('T')[0];
}
