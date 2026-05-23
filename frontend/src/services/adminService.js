/**
 * adminService.js — Admin panel API calls (optional scope).
 *
 * DB tables: courses, enrollments, teachers, students, timetable
 */
import api from './api';

// ── Courses ──────────────────────────────────────────────────────────────────
export const getAllCourses   = ()             => api.get('/admin/courses').then((r) => r.data);
export const createCourse   = (payload)      => api.post('/admin/courses', payload).then((r) => r.data);
export const updateCourse   = (id, payload)  => api.put(`/admin/courses/${id}`, payload).then((r) => r.data);
export const deleteCourse   = (id)           => api.delete(`/admin/courses/${id}`).then((r) => r.data);

// ── Enrollments ───────────────────────────────────────────────────────────────
export const getEnrollments   = (courseId)         => api.get(`/admin/enrollments/${courseId}`).then((r) => r.data);
export const enrolStudent     = (studentId, courseId) => api.post('/admin/enrollments', { student_id: studentId, course_id: courseId }).then((r) => r.data);
export const removeEnrollment = (enrollmentId)     => api.delete(`/admin/enrollments/${enrollmentId}`).then((r) => r.data);

// ── Timetable (Class Sessions) ─────────────────────────────────────────────
export const getTimetableSlots = ()            => api.get('/admin/timetable').then((r) => r.data);
export const createSlot        = (payload)     => api.post('/admin/timetable', payload).then((r) => r.data);
export const updateSlot        = (id, payload) => api.put(`/admin/timetable/${id}`, payload).then((r) => r.data);
export const deleteSlot        = (id)          => api.delete(`/admin/timetable/${id}`).then((r) => r.data);

// ── Users ─────────────────────────────────────────────────────────────────────
export const getAllTeachers = () => api.get('/admin/teachers').then((r) => r.data);
export const getAllStudents = () => api.get('/admin/students').then((r) => r.data);
