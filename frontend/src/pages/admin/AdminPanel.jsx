import { useState, useMemo, useEffect } from 'react';
import { Shield, BookOpen, Calendar, Users, GraduationCap, Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, MapPin, Key } from 'lucide-react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useFetch } from '../../hooks/useFetch';

/**
 * AdminPanel — /admin
 * 
 * Production-grade administration console. Allows managing courses,
 * scheduling timetable slots, assigning room coordinates, registering faculty,
 * and managing student enrollments (linking students, teachers, and courses).
 */
export default function AdminPanel() {
  const { 
    PLACEHOLDER_STUDENTS, 
    PLACEHOLDER_TEACHERS, 
    PLACEHOLDER_COURSES, 
    PLACEHOLDER_TIMETABLE, 
    PLACEHOLDER_ENROLLMENTS,
    DEV_MODE,
    token
  } = useAuth();
  
  const { push } = useNotification();

  // Tab State
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'timetable' | 'teachers' | 'students' | 'enrollments'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Dynamic Mutables (Local states mirroring database)
  const [coursesList, setCoursesList] = useState([]);
  const [timetableList, setTimetableList] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [enrollmentsList, setEnrollmentsList] = useState([]);

  // Fetch real-time data from backend in production mode
  const { data: serverCourses, refetch: refetchCourses } = useFetch(!DEV_MODE ? '/admin/courses' : null);
  const { data: serverTimetable, refetch: refetchTimetable } = useFetch(!DEV_MODE ? '/admin/timetable' : null);
  const { data: serverTeachers, refetch: refetchTeachers } = useFetch(!DEV_MODE ? '/admin/teachers' : null);
  const { data: serverStudents, refetch: refetchStudents } = useFetch(!DEV_MODE ? '/admin/students' : null);
  const { data: serverEnrollments, refetch: refetchEnrollments } = useFetch(!DEV_MODE ? '/admin/enrollments' : null);

  // Sync dev placeholders or fetched server data into local states
  useEffect(() => {
    if (DEV_MODE) {
      const richEnrollments = PLACEHOLDER_ENROLLMENTS.map((e, idx) => {
        const s = PLACEHOLDER_STUDENTS.find(item => item.student_id === e.student_id);
        const c = PLACEHOLDER_COURSES.find(item => item.course_id === e.course_id);
        return {
          enrollment_id: e.enrollment_id || (idx + 1),
          student_id: e.student_id,
          student_name: s?.full_name || 'Unknown Student',
          roll_number: s?.roll_number || 'N/A',
          course_id: e.course_id,
          course_name: c?.course_name || 'Unknown Course'
        };
      });
      setCoursesList(PLACEHOLDER_COURSES);
      setTimetableList(PLACEHOLDER_TIMETABLE);
      setTeachersList(PLACEHOLDER_TEACHERS);
      setStudentsList(PLACEHOLDER_STUDENTS);
      setEnrollmentsList(richEnrollments);
    }
  }, [DEV_MODE, PLACEHOLDER_COURSES, PLACEHOLDER_TIMETABLE, PLACEHOLDER_TEACHERS, PLACEHOLDER_STUDENTS, PLACEHOLDER_ENROLLMENTS]);

  useEffect(() => {
    if (!DEV_MODE) {
      if (serverCourses) setCoursesList(serverCourses);
      if (serverTimetable) setTimetableList(serverTimetable);
      if (serverTeachers) setTeachersList(serverTeachers);
      if (serverStudents) setStudentsList(serverStudents);
      if (serverEnrollments) setEnrollmentsList(serverEnrollments);
    }
  }, [DEV_MODE, serverCourses, serverTimetable, serverTeachers, serverStudents, serverEnrollments]);

  // Form Creation states
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ course_name: '', credit_hours: 3, teacher_id: 1 });

  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({ 
    course_id: 1, 
    day_of_week: 'Mon', 
    start_time: '08:00', 
    end_time: '09:30', 
    room_location: '', 
    latitude: 33.738045, 
    longitude: 72.814522 
  });

  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [newEnrollment, setNewEnrollment] = useState({ student_id: '', course_id: '' });

  // Initialize dropdown selectors once lists load
  useEffect(() => {
    if (teachersList.length > 0) {
      setNewCourse(prev => ({ ...prev, teacher_id: teachersList[0].teacher_id }));
    }
  }, [teachersList]);

  useEffect(() => {
    if (coursesList.length > 0) {
      setNewSlot(prev => ({ ...prev, course_id: coursesList[0].course_id }));
    }
  }, [coursesList]);

  useEffect(() => {
    if (studentsList.length > 0 && coursesList.length > 0) {
      setNewEnrollment({
        student_id: studentsList[0].student_id,
        course_id: coursesList[0].course_id
      });
    }
  }, [studentsList, coursesList]);

  // Filters search queries
  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase();
    switch (activeTab) {
      case 'courses':
        return coursesList.filter(c => c.course_name.toLowerCase().includes(q));
      case 'timetable':
        return timetableList.filter(s => {
          const c = coursesList.find(item => item.course_id === s.course_id);
          return c?.course_name.toLowerCase().includes(q) || s.room_location.toLowerCase().includes(q);
        });
      case 'teachers':
        return teachersList.filter(t => t.full_name.toLowerCase().includes(q) || t.department.toLowerCase().includes(q));
      case 'students':
        return studentsList.filter(s => s.full_name.toLowerCase().includes(q) || s.roll_number.toLowerCase().includes(q));
      case 'enrollments':
        return enrollmentsList.filter(e => 
          e.student_name.toLowerCase().includes(q) || 
          e.course_name.toLowerCase().includes(q) || 
          e.roll_number.toLowerCase().includes(q)
        );
      default:
        return [];
    }
  }, [activeTab, searchQuery, coursesList, timetableList, teachersList, studentsList, enrollmentsList]);

  // Actions
  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!newCourse.course_name.trim()) {
      push('warning', 'Please enter a valid course name.');
      return;
    }

    if (DEV_MODE) {
      const created = {
        course_id: coursesList.length + 1,
        ...newCourse,
        teacher_id: Number(newCourse.teacher_id)
      };
      setCoursesList(prev => [...prev, created]);
      push('success', `Course '${newCourse.course_name}' created successfully!`);
      setNewCourse({ course_name: '', credit_hours: 3, teacher_id: teachersList[0]?.teacher_id || 1 });
      setCourseModalOpen(false);
      return;
    }

    // Production Mode - POST /api/admin/courses
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCourse)
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || 'Failed to create course');
      }
      const data = await res.json();
      push('success', data.message || `Course '${newCourse.course_name}' created successfully!`);
      refetchCourses();
      setNewCourse({ course_name: '', credit_hours: 3, teacher_id: teachersList[0]?.teacher_id || 1 });
      setCourseModalOpen(false);
    } catch (err) {
      push('error', err.message);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!newSlot.room_location.trim()) {
      push('warning', 'Please enter a valid room location.');
      return;
    }

    if (DEV_MODE) {
      const created = {
        slot_id: timetableList.length + 1,
        ...newSlot,
        course_id: Number(newSlot.course_id),
        latitude: Number(newSlot.latitude),
        longitude: Number(newSlot.longitude)
      };
      setTimetableList(prev => [...prev, created]);
      push('success', `Timetable slot registered for room ${newSlot.room_location}!`);
      setSlotModalOpen(false);
      return;
    }

    // Production Mode - POST /api/admin/timetable
    try {
      const res = await fetch('/api/admin/timetable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSlot)
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || 'Failed to schedule timetable slot.');
      }
      const data = await res.json();
      push('success', data.message || `Timetable slot registered for room ${newSlot.room_location}!`);
      refetchTimetable();
      setSlotModalOpen(false);
    } catch (err) {
      push('error', err.message);
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!newEnrollment.student_id || !newEnrollment.course_id) {
      push('warning', 'Please select both student and course.');
      return;
    }

    if (DEV_MODE) {
      const student = studentsList.find(s => s.student_id === Number(newEnrollment.student_id));
      const course = coursesList.find(c => c.course_id === Number(newEnrollment.course_id));
      
      const created = {
        enrollment_id: enrollmentsList.length + 1,
        student_id: Number(newEnrollment.student_id),
        student_name: student?.full_name || 'Unknown Student',
        roll_number: student?.roll_number || 'N/A',
        course_id: Number(newEnrollment.course_id),
        course_name: course?.course_name || 'Unknown Course'
      };
      setEnrollmentsList(prev => [created, ...prev]);
      push('success', 'Student enrolled successfully!');
      setEnrollModalOpen(false);
      return;
    }

    // Production Mode - POST /api/admin/enrollments
    try {
      const res = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          student_id: Number(newEnrollment.student_id),
          course_id: Number(newEnrollment.course_id)
        })
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || 'Failed to enroll student.');
      }
      const data = await res.json();
      push('success', data.message || 'Student enrolled in course successfully!');
      refetchEnrollments();
      setEnrollModalOpen(false);
    } catch (err) {
      push('error', err.message);
    }
  };

  const handleDeleteItem = async (id, type) => {
    if (type === 'course') {
      if (DEV_MODE) {
        setCoursesList(prev => prev.filter(c => c.course_id !== id));
        push('error', 'Course removed safely.');
        return;
      }
      try {
        const res = await fetch(`/api/admin/courses/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.message || 'Failed to delete course.');
        }
        push('success', 'Course removed safely.');
        refetchCourses();
      } catch (err) {
        push('error', err.message);
      }
    } else if (type === 'slot') {
      if (DEV_MODE) {
        setTimetableList(prev => prev.filter(s => s.slot_id !== id));
        push('error', 'Scheduled timetable slot deleted.');
        return;
      }
      try {
        const res = await fetch(`/api/admin/timetable/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.message || 'Failed to delete timetable slot.');
        }
        push('success', 'Scheduled timetable slot deleted.');
        refetchTimetable();
      } catch (err) {
        push('error', err.message);
      }
    } else if (type === 'enrollment') {
      if (DEV_MODE) {
        setEnrollmentsList(prev => prev.filter(e => e.enrollment_id !== id));
        push('error', 'Student unenrolled safely.');
        return;
      }
      try {
        const res = await fetch(`/api/admin/enrollments/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.message || 'Failed to unenroll student.');
        }
        push('success', 'Student unenrolled safely.');
        refetchEnrollments();
      } catch (err) {
        push('error', err.message);
      }
    }
  };

  return (
    <PageWrapper
      title="Admin Control Center"
      actions={
        <div className="flex gap-2">
          {activeTab === 'courses' && (
            <Button 
              onClick={() => setCourseModalOpen(true)} 
              variant="primary" 
              size="sm" 
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Add Course
            </Button>
          )}
          {activeTab === 'timetable' && (
            <Button 
              onClick={() => setSlotModalOpen(true)} 
              variant="primary" 
              size="sm" 
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Schedule Slot
            </Button>
          )}
          {activeTab === 'enrollments' && (
            <Button 
              onClick={() => setEnrollModalOpen(true)} 
              variant="primary" 
              size="sm" 
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Enroll Student
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">

        {/* ── Top Level Stats ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-lg"><BookOpen className="w-5 h-5" /></div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Courses</span>
              <p className="text-xl font-extrabold text-slate-800">{coursesList.length}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><Calendar className="w-5 h-5" /></div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Scheduled Slots</span>
              <p className="text-xl font-extrabold text-slate-800">{timetableList.length}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-violet-50 text-violet-600 rounded-lg"><Users className="w-5 h-5" /></div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Faculty Members</span>
              <p className="text-xl font-extrabold text-slate-800">{teachersList.length}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><GraduationCap className="w-5 h-5" /></div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Students</span>
              <p className="text-xl font-extrabold text-slate-800">{studentsList.length}</p>
            </div>
          </div>
        </div>

        {/* ── Sub Navigation Tabs & Search ───────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'courses', label: 'Courses', icon: BookOpen },
              { id: 'timetable', label: 'Timetable slots', icon: Calendar },
              { id: 'teachers', label: 'Faculty registry', icon: Users },
              { id: 'students', label: 'Student roster', icon: GraduationCap },
              { id: 'enrollments', label: 'Enrollments', icon: CheckCircle2 }
            ].map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => { setActiveTab(t.id); setSearchQuery(''); }}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all duration-150 ${activeTab === t.id ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="relative min-w-[240px]">
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* ── Active Tab Grid Layout ─────────────────────────────────────────── */}
        <Card>
          <div className="overflow-x-auto">
            {activeTab === 'courses' && (
              <table className="w-full text-sm" aria-label="Courses roster">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Course Name</th>
                    <th className="px-4 py-3 text-center">Credit Hours</th>
                    <th className="px-4 py-3 text-left">Assigned Instructor</th>
                    <th className="px-4 py-3 text-center">Enrolled Count</th>
                    <th className="px-4 py-3 w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredData.map(c => {
                    const teacher = teachersList.find(t => t.teacher_id === c.teacher_id);
                    return (
                      <tr key={c.course_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">{c.course_name}</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800">{c.credit_hours} cr</td>
                        <td className="px-4 py-3 font-medium text-slate-600">{teacher?.full_name || c.teacher_name || 'Unassigned'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full border border-slate-200">{c.enrolled_count || 0} students</span>
                        </td>
                        <td className="px-4 py-3 flex gap-1 justify-end">
                          <button onClick={() => handleDeleteItem(c.course_id, 'course')} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"><Trash2 size={15} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {activeTab === 'timetable' && (
              <table className="w-full text-sm" aria-label="Timetable registry">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Scheduled Course</th>
                    <th className="px-4 py-3 text-center">Day</th>
                    <th className="px-4 py-3 text-center">Class Time</th>
                    <th className="px-4 py-3 text-left">Room Location</th>
                    <th className="px-4 py-3 text-left">GPS Target</th>
                    <th className="px-4 py-3 w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredData.map(s => {
                    const c = coursesList.find(item => item.course_id === s.course_id);
                    return (
                      <tr key={s.slot_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">{c?.course_name || s.course_name || 'Unknown Course'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{s.day_of_week}</span>
                        </td>
                        <td className="px-4 py-3 text-center font-medium font-mono text-xs">{s.start_time} - {s.end_time}</td>
                        <td className="px-4 py-3 font-medium text-slate-700">{s.room_location}</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-400">
                          <span className="flex items-center gap-1"><MapPin size={11} className="text-slate-300" /> {s.latitude?.toFixed(5)}, {s.longitude?.toFixed(5)}</span>
                        </td>
                        <td className="px-4 py-3 flex gap-1 justify-end">
                          <button onClick={() => handleDeleteItem(s.slot_id, 'slot')} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"><Trash2 size={15} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {activeTab === 'teachers' && (
              <table className="w-full text-sm" aria-label="Teachers roster">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Faculty Name</th>
                    <th className="px-4 py-3 text-left">Email Address</th>
                    <th className="px-4 py-3 text-left">Department</th>
                    <th className="px-4 py-3 text-left">Assigned Courses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredData.map(t => {
                    const assigned = coursesList.filter(item => item.teacher_id === t.teacher_id);
                    return (
                      <tr key={t.teacher_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">{t.full_name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{t.email}</td>
                        <td className="px-4 py-3 text-slate-600 font-medium">{t.department}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {assigned.length === 0 ? (
                              <span className="text-xs text-slate-400 italic">None assigned</span>
                            ) : (
                              assigned.map(item => (
                                <span key={item.course_id} className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">{item.course_name}</span>
                              ))
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {activeTab === 'students' && (
              <table className="w-full text-sm" aria-label="Students registry">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Student Name</th>
                    <th className="px-4 py-3 text-left">Roll Number</th>
                    <th className="px-4 py-3 text-left">Email Address</th>
                    <th className="px-4 py-3 text-center">Section</th>
                    <th className="px-4 py-3 text-center">Semester</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredData.map(s => (
                    <tr key={s.student_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{s.full_name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.roll_number}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.email}</td>
                      <td className="px-4 py-3 text-center font-medium text-slate-600">{s.section}</td>
                      <td className="px-4 py-3 text-center text-slate-600">Semester {s.semester}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'enrollments' && (
              <table className="w-full text-sm" aria-label="Student Enrollments">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Student Name</th>
                    <th className="px-4 py-3 text-left">Roll Number</th>
                    <th className="px-4 py-3 text-left">Enrolled Course</th>
                    <th className="px-4 py-3 w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredData.map(e => (
                    <tr key={e.enrollment_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{e.student_name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{e.roll_number}</td>
                      <td className="px-4 py-3 font-medium text-slate-600">{e.course_name}</td>
                      <td className="px-4 py-3 flex gap-1 justify-end">
                        <button onClick={() => handleDeleteItem(e.enrollment_id, 'enrollment')} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Unenroll Student"><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

      </div>

      {/* ── Add Course Modal ────────────────────────────────────────────────── */}
      {courseModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-scale-up">
            <form onSubmit={handleAddCourse}>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-rose-800 font-bold border-b border-slate-100 pb-3">
                  <BookOpen className="w-5 h-5" />
                  <span>Create Academic Course</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Course Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Theory of Automata"
                      required
                      value={newCourse.course_name}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, course_name: e.target.value }))}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Credit Hours</label>
                      <select
                        value={newCourse.credit_hours}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, credit_hours: Number(e.target.value) }))}
                        className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      >
                        <option value="1">1 Credit Hour</option>
                        <option value="2">2 Credit Hours</option>
                        <option value="3">3 Credit Hours</option>
                        <option value="4">4 Credit Hours</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assigned Teacher</label>
                      <select
                        value={newCourse.teacher_id}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, teacher_id: Number(e.target.value) }))}
                        className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      >
                        {teachersList.map(t => (
                          <option key={t.teacher_id} value={t.teacher_id}>{t.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setCourseModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" size="sm" className="bg-rose-600 hover:bg-rose-700 text-white">Create Course</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Timetable Slot Modal ────────────────────────────────────────── */}
      {slotModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-scale-up">
            <form onSubmit={handleAddSlot}>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-rose-800 font-bold border-b border-slate-100 pb-3">
                  <Calendar className="w-5 h-5" />
                  <span>Register Timetable Slot</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Course</label>
                    <select
                      value={newSlot.course_id}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, course_id: Number(e.target.value) }))}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    >
                      {coursesList.map(c => (
                        <option key={c.course_id} value={c.course_id}>{c.course_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Day</label>
                      <select
                        value={newSlot.day_of_week}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, day_of_week: e.target.value }))}
                        className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      >
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Time</label>
                      <input
                        type="text"
                        placeholder="08:00"
                        required
                        value={newSlot.start_time}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, start_time: e.target.value }))}
                        className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Time</label>
                      <input
                        type="text"
                        placeholder="09:30"
                        required
                        value={newSlot.end_time}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, end_time: e.target.value }))}
                        className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Room Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Lab 4"
                      required
                      value={newSlot.room_location}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, room_location: e.target.value }))}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Latitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        required
                        value={newSlot.latitude}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, latitude: Number(e.target.value) }))}
                        className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Longitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        required
                        value={newSlot.longitude}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, longitude: Number(e.target.value) }))}
                        className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setSlotModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" size="sm" className="bg-rose-600 hover:bg-rose-700 text-white">Schedule Slot</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Enroll Student Modal ────────────────────────────────────────────── */}
      {enrollModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-scale-up">
            <form onSubmit={handleEnrollStudent}>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-rose-800 font-bold border-b border-slate-100 pb-3">
                  <GraduationCap className="w-5 h-5" />
                  <span>Enroll Student in Course</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Student</label>
                    <select
                      value={newEnrollment.student_id}
                      onChange={(e) => setNewEnrollment(prev => ({ ...prev, student_id: e.target.value }))}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    >
                      {studentsList.map(s => (
                        <option key={s.student_id} value={s.student_id}>{s.full_name} ({s.roll_number})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Course</label>
                    <select
                      value={newEnrollment.course_id}
                      onChange={(e) => setNewEnrollment(prev => ({ ...prev, course_id: e.target.value }))}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    >
                      {coursesList.map(c => (
                        <option key={c.course_id} value={c.course_id}>{c.course_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setEnrollModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" size="sm" className="bg-rose-600 hover:bg-rose-700 text-white">Enroll Student</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </PageWrapper>
  );
}
