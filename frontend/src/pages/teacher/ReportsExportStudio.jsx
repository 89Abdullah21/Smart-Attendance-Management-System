import { useState, useMemo } from 'react';
import { Download, Mail, BarChart3, Users, Filter, FileText, CheckSquare, Square, Search, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { buildCsv, createSimplePdf, downloadBlob } from '../../utils/exportUtils';

/**
 * ReportsExportStudio — /teacher/reports/export
 * 
 * Interactive analytics studio enabling faculty to analyze student engagement,
 * isolate at-risk individuals, and configure export options.
 */
export default function ReportsExportStudio() {
  const { getMyCourses, PLACEHOLDER_STUDENTS, PLACEHOLDER_ENROLLMENTS } = useAuth();
  const { push } = useNotification();

  const courses = getMyCourses();
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.course_id || 1);
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceThreshold, setAttendanceThreshold] = useState(75);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState(new Set());

  // Report fields selection
  const [fields, setFields] = useState({
    rollNumber: true,
    section: true,
    email: true,
    presentSessions: true,
    totalSessions: true,
    rate: true,
    statusFlag: true
  });

  const activeCourse = courses.find(c => c.course_id === Number(selectedCourse)) || courses[0];

  // ── Compute Analytics Mock Records ──────────────────────────────────────────
  const calculatedReportRows = useMemo(() => {
    // Filter students enrolled in this course
    const courseEnrollments = PLACEHOLDER_ENROLLMENTS.filter(e => e.course_id === Number(selectedCourse));
    const enrolledStudentIds = courseEnrollments.map(e => e.student_id);
    const enrolledStudents = PLACEHOLDER_STUDENTS.filter(s => enrolledStudentIds.includes(s.student_id));

    return enrolledStudents.map((s, idx) => {
      // Deterministic but varied stats based on student ID
      const totalSessions = 12;
      const presentSessions = idx === 0 ? 8 : idx === 1 ? 11 : idx === 2 ? 6 : idx === 3 ? 12 : 9;
      const rate = Math.round((presentSessions / totalSessions) * 100);

      return {
        student_id: s.student_id,
        full_name: s.full_name,
        roll_number: s.roll_number,
        section: s.section,
        email: s.email,
        present: presentSessions,
        total: totalSessions,
        rate: rate,
        atRisk: rate < attendanceThreshold
      };
    });
  }, [selectedCourse, attendanceThreshold]);

  // Filtered rows for displaying
  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return calculatedReportRows.filter(r => 
      r.full_name.toLowerCase().includes(q) || 
      r.roll_number.toLowerCase().includes(q)
    );
  }, [calculatedReportRows, searchQuery]);

  // At-risk students
  const atRiskStudents = useMemo(() => {
    return calculatedReportRows.filter(r => r.atRisk);
  }, [calculatedReportRows]);

  const toggleField = (field) => {
    setFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleToggleSelectAll = () => {
    if (selectedStudents.size === filteredRows.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredRows.map(r => r.student_id)));
    }
  };

  const handleToggleStudent = (id) => {
    setSelectedStudents(prev => {
      const updated = new Set(prev);
      if (updated.has(id)) updated.delete(id);
      else updated.add(id);
      return updated;
    });
  };

  const handleExport = (format) => {
    if (!filteredRows.length) {
      push('warning', 'No matching records to export.');
      return;
    }
    const safeCourse = (activeCourse?.course_name || 'course')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/(^-|-$)/g, '');

    const columns = [
      { key: 'full_name', label: 'Student', enabled: true },
      { key: 'roll_number', label: 'Roll Number', enabled: fields.rollNumber },
      { key: 'section', label: 'Section', enabled: fields.section },
      { key: 'email', label: 'Email', enabled: fields.email },
      { key: 'present', label: 'Present Sessions', enabled: fields.presentSessions },
      { key: 'total', label: 'Total Sessions', enabled: fields.totalSessions },
      { key: 'rate', label: 'Attendance Rate', enabled: fields.rate },
      { key: 'status', label: 'Eligibility Status', enabled: fields.statusFlag }
    ].filter(c => c.enabled);

    const header = columns.map(c => c.label);
    const rows = filteredRows.map(r => columns.map(c => {
      if (c.key === 'status') return r.atRisk ? 'At Risk' : 'Eligible';
      if (c.key === 'rate') return `${r.rate}%`;
      return r[c.key];
    }));

    if (format === 'csv') {
      const csv = buildCsv(header, rows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, `${safeCourse}-export.csv`);
      push('success', `CSV downloaded. ${filteredRows.length} records exported.`);
      return;
    }

    const lines = [
      `Course: ${activeCourse?.course_name || 'Course'}`,
      `Exported Records: ${filteredRows.length}`,
      '',
      header.join(' | '),
      ...rows.map(r => r.join(' | '))
    ];
    const pdfBlob = createSimplePdf(lines, { title: 'Attendance Export' });
    downloadBlob(pdfBlob, `${safeCourse}-export.pdf`);
    push('success', `PDF downloaded. ${filteredRows.length} records exported.`);
  };

  const handleSendWarnings = () => {
    if (selectedStudents.size === 0) {
      push('warning', 'Please select at least one student to send warnings.');
      return;
    }
    push('info', `Simulating bulk warning emails delivery...`);
    setTimeout(() => {
      push('success', `Bulk delivery successful! Sent academic warning emails to ${selectedStudents.size} students.`);
      setSelectedStudents(new Set());
      setEmailModalOpen(false);
    }, 2000);
  };

  return (
    <PageWrapper title="Analytics & Export Studio">
      <div className="space-y-6">
        
        {/* ── Top Filters Row ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          {/* Course selector */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(Number(e.target.value))}
              className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {courses.map(c => (
                <option key={c.course_id} value={c.course_id}>{c.course_name}</option>
              ))}
            </select>
          </div>

          {/* Search filter */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Search Student</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search name or roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Eligibility Threshold Selector */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Attendance Threshold (%)</label>
            <select
              value={attendanceThreshold}
              onChange={(e) => setAttendanceThreshold(Number(e.target.value))}
              className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="60">60% (Condonation Limit)</option>
              <option value="75">75% (Standard University Limit)</option>
              <option value="80">80% (Premium Limit)</option>
            </select>
          </div>

          {/* Action triggers */}
          <div className="md:col-span-1 flex items-end gap-2">
            <Button
              onClick={() => handleExport('csv')}
              variant="secondary"
              fullWidth
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export CSV
            </Button>
            <Button
              onClick={() => handleExport('pdf')}
              variant="secondary"
              fullWidth
              leftIcon={<FileText className="w-4 h-4" />}
            >
              Export PDF
            </Button>
          </div>
        </div>

        {/* ── Main View Grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Columns & Field Visibility Config (Sidebar) */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <div className="p-5 space-y-4">
                <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <Filter className="w-4 h-4 text-indigo-500" />
                  Report Configurations
                </h2>
                
                {/* Column Toggle Checklist */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-slate-500 uppercase">Visible Columns</span>
                  <div className="space-y-1.5">
                    {[
                      { key: 'rollNumber', label: 'Roll Number' },
                      { key: 'section', label: 'Section' },
                      { key: 'email', label: 'Email Address' },
                      { key: 'presentSessions', label: 'Present Sessions' },
                      { key: 'totalSessions', label: 'Total Sessions' },
                      { key: 'rate', label: 'Attendance Rate' },
                      { key: 'statusFlag', label: 'Eligibility Status' }
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => toggleField(f.key)}
                        className="flex items-center gap-2 text-xs text-slate-600 hover:text-indigo-600 transition-colors py-1 w-full text-left"
                      >
                        {fields[f.key] ? <CheckSquare className="w-3.5 h-3.5 text-indigo-600" /> : <Square className="w-3.5 h-3.5 text-slate-300" />}
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="block text-xs font-bold text-slate-500 uppercase">Engagement Stats</span>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Enrolled</span>
                      <p className="text-lg font-bold text-slate-800 mt-0.5">{calculatedReportRows.length}</p>
                    </div>
                    <div className="bg-rose-50 border border-rose-100 rounded-lg p-2">
                      <span className="text-[10px] text-rose-400 font-bold uppercase">At Risk</span>
                      <p className="text-lg font-bold text-rose-700 mt-0.5">{atRiskStudents.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* At-risk Warning Card */}
            {atRiskStudents.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-1.5 text-rose-800 font-bold text-sm">
                  <ShieldAlert className="w-4 h-4 animate-bounce" />
                  <span>Action Needed</span>
                </div>
                <p className="text-xs text-rose-700">
                  {atRiskStudents.length} students have fallen below the {attendanceThreshold}% threshold. Trigger warning alerts directly.
                </p>
                <Button
                  onClick={() => {
                    // Preselect all at-risk students
                    setSelectedStudents(new Set(atRiskStudents.map(s => s.student_id)));
                    setEmailModalOpen(true);
                  }}
                  variant="danger"
                  fullWidth
                  size="sm"
                  leftIcon={<Mail className="w-4.5 h-4.5" />}
                >
                  Alert At-Risk Students
                </Button>
              </div>
            )}
          </div>

          {/* Pivot Table Columns */}
          <div className="lg:col-span-3">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="Course analytics report">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-4 py-3 w-10">
                        <button onClick={handleToggleSelectAll} className="p-1 rounded hover:bg-slate-100">
                          {selectedStudents.size === filteredRows.length && filteredRows.length > 0 
                            ? <CheckSquare className="w-4 h-4 text-indigo-600" /> 
                            : <Square className="w-4 h-4 text-slate-400" />}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left">Student Name</th>
                      {fields.rollNumber && <th className="px-4 py-3 text-left">Roll Number</th>}
                      {fields.section && <th className="px-4 py-3 text-left">Section</th>}
                      {fields.email && <th className="px-4 py-3 text-left">Email Address</th>}
                      {fields.presentSessions && <th className="px-4 py-3 text-center">Present</th>}
                      {fields.totalSessions && <th className="px-4 py-3 text-center">Total</th>}
                      {fields.rate && <th className="px-4 py-3 text-center">Rate</th>}
                      {fields.statusFlag && <th className="px-4 py-3 text-center">Eligibility</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-slate-400">
                          No students matched your filter parameters.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map(row => (
                        <tr key={row.student_id} className={`hover:bg-slate-50 transition-colors ${row.atRisk ? 'bg-rose-50/10' : ''}`}>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => handleToggleStudent(row.student_id)} className="p-1 rounded hover:bg-slate-100">
                              {selectedStudents.has(row.student_id) 
                                ? <CheckSquare className="w-4 h-4 text-indigo-600" /> 
                                : <Square className="w-4 h-4 text-slate-300" />}
                            </button>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{row.full_name}</td>
                          {fields.rollNumber && <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.roll_number}</td>}
                          {fields.section && <td className="px-4 py-3 text-slate-500">{row.section}</td>}
                          {fields.email && <td className="px-4 py-3 text-slate-500 text-xs">{row.email}</td>}
                          {fields.presentSessions && <td className="px-4 py-3 text-center font-medium text-emerald-600">{row.present}</td>}
                          {fields.totalSessions && <td className="px-4 py-3 text-center text-slate-500">{row.total}</td>}
                          {fields.rate && (
                            <td className="px-4 py-3 text-center">
                              <span className={`font-bold ${row.atRisk ? 'text-rose-600' : 'text-slate-800'}`}>{row.rate}%</span>
                            </td>
                          )}
                          {fields.statusFlag && (
                            <td className="px-4 py-3 text-center">
                              <Badge
                                label={row.atRisk ? 'At Risk' : 'Eligible'}
                                variant={row.atRisk ? 'Invalid' : 'Valid'}
                              />
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

        </div>

      </div>

      {/* ── Warning Email Modal ─────────────────────────────────────────────── */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-scale-up">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-rose-800 font-bold border-b border-slate-100 pb-3">
                <Mail className="w-5 h-5" />
                <span>Bulk Email warning Dispatcher</span>
              </div>
              <p className="text-sm text-slate-600">
                You are about to send simulated formal attendance warnings to the <strong>{selectedStudents.size}</strong> selected students below the {attendanceThreshold}% examination eligibility threshold.
              </p>
              
              <div className="bg-slate-50 rounded-lg p-3 max-h-[140px] overflow-y-auto space-y-1">
                {filteredRows
                  .filter(r => selectedStudents.has(r.student_id))
                  .map(r => (
                    <div key={r.student_id} className="flex justify-between text-xs text-slate-500 font-medium">
                      <span>{r.full_name} ({r.roll_number})</span>
                      <span className="text-rose-600 font-bold">{r.rate}%</span>
                    </div>
                  ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                ⚠️ Academic offices are carbon-copied on these delivery warnings. Students will be requested to consult their faculty advisor.
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <Button variant="secondary" size="sm" onClick={() => setEmailModalOpen(false)}>Cancel</Button>
                <Button variant="danger" size="sm" onClick={handleSendWarnings} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
                  Dispatch Warnings
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
