import { useEffect, useState } from 'react';
import { User, Mail, Lock, BookOpen, Hash, Layers, ShieldCheck, Save, Sparkles, AlertCircle, Building2 } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function AccountSettings() {
  const { user, updateSettings, token } = useAuth();
  const { push } = useNotification();

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
    roll_number: user?.roll_number || '',
    section: user?.section || '',
    semester: user?.semester || '',
    department: user?.department || '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch departments from backend (for student dropdown)
  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(true);

  // Fetch teacher's assigned departments from admin endpoint
  const [teacherDepts, setTeacherDepts] = useState([]);
  const [teacherDeptsLoading, setTeacherDeptsLoading] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch('/api/auth/departments');
        if (res.ok) {
          const data = await res.json();
          setDepartments(data);
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
      } finally {
        setDeptLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  // For teachers: fetch assigned departments from the teachers list endpoint
  useEffect(() => {
    if (user?.role !== 'teacher' || !token) return;
    const fetchTeacherDepts = async () => {
      setTeacherDeptsLoading(true);
      try {
        const res = await fetch('/api/admin/teachers', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Find this teacher in the list
          const me = data.find(t => t.teacher_id === user.id);
          if (me && Array.isArray(me.departments)) {
            setTeacherDepts(me.departments);
          }
        }
      } catch (err) {
        console.error('Failed to load teacher departments:', err);
      } finally {
        setTeacherDeptsLoading(false);
      }
    };
    fetchTeacherDepts();
  }, [user, token]);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      full_name: user.full_name || '',
      email: user.email || '',
      roll_number: user.roll_number || '',
      section: user.section || '',
      semester: user.semester || '',
      department: user.department || '',
    }));
  }, [user]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (form.password) {
      if (form.password.length < 8) {
        e.password = 'Password must be at least 8 characters';
      }
      if (form.password !== form.confirmPassword) {
        e.confirmPassword = 'Passwords do not match';
      }
    }
    if (user?.role === 'student') {
      if (!form.roll_number.trim()) e.roll_number = 'Roll number is required';
      if (!form.section.trim()) e.section = 'Section is required';
      if (!form.semester) e.semester = 'Semester is required';
      if (!form.department.trim()) e.department = 'Department/Program is required';
    }
    // Teachers: no department validation — admin assigns it
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);

    try {
      const payload = {
        full_name: form.full_name,
        email: form.email,
      };

      // Only send student-specific fields for students
      if (user?.role === 'student') {
        payload.roll_number = form.roll_number;
        payload.section = form.section;
        payload.semester = form.semester;
        payload.department = form.department;
      }

      if (form.password.trim() !== '') {
        payload.password = form.password;
      }

      await updateSettings(payload);
      push('success', 'Account settings updated successfully!');
      
      // Clear password fields
      setForm(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
    } catch (err) {
      push('error', err.message || 'Failed to update settings.');
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case 'admin': return 'from-rose-500 to-red-600';
      case 'teacher': return 'from-violet-500 to-indigo-600';
      default: return 'from-blue-500 to-sky-600';
    }
  };

  return (
    <PageWrapper title="Account Settings">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* User Identity Premium Banner */}
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${getRoleBadgeColor()} p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-xl font-bold border border-white/30 uppercase">
              {user?.avatar_initials || user?.full_name?.substring(0, 2)}
            </div>
            <div>
              <h2 className="text-xl font-extrabold flex items-center gap-1.5 leading-tight">
                {user?.full_name}
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              </h2>
              <p className="text-xs text-white/80 font-mono mt-0.5">{user?.email}</p>
            </div>
          </div>
          
          <div className="relative z-10">
            <span className="bg-white/20 backdrop-blur-md text-white border border-white/30 text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-full tracking-wider shadow-sm">
              {user?.role} Portal
            </span>
          </div>
          
          {/* Subtle background abstract shapes */}
          <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full -mr-8 -mt-8 blur-lg" />
        </div>

        <Card>
          <form onSubmit={handleSubmit} noValidate className="p-6 space-y-6">
            
            {/* Form general feedback */}
            {errors.form && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{errors.form}</p>
            )}

            {/* Profile Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                <User className="w-4 h-4 text-indigo-500" />
                Profile Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="sett-name"
                  label="Full Name"
                  type="text"
                  value={form.full_name}
                  onChange={set('full_name')}
                  error={errors.full_name}
                  leftIcon={<User className="w-4 h-4" />}
                />
                <Input
                  id="sett-email"
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  error={errors.email}
                  leftIcon={<Mail className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* Student Academic Fields */}
            {user?.role === 'student' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  Academic Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    id="sett-roll"
                    label="Roll Number"
                    type="text"
                    value={form.roll_number}
                    onChange={set('roll_number')}
                    error={errors.roll_number}
                    leftIcon={<Hash className="w-4 h-4" />}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      id="sett-sec"
                      label="Section"
                      type="text"
                      value={form.section}
                      onChange={set('section')}
                      error={errors.section}
                    />
                    <Input
                      id="sett-sem"
                      label="Semester"
                      type="number"
                      value={form.semester}
                      onChange={set('semester')}
                      error={errors.semester}
                      min={1}
                      max={8}
                    />
                  </div>

                  {/* Department Dropdown — students only */}
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label htmlFor="sett-dept" className="text-sm font-medium text-slate-700">
                      Department / Program
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <BookOpen className="w-4 h-4" />
                      </span>
                      <select
                        id="sett-dept"
                        value={form.department}
                        onChange={set('department')}
                        disabled={deptLoading}
                        className={`
                          w-full rounded-lg border px-3 py-2 text-sm text-slate-900 pl-9
                          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                          disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
                          transition-colors bg-white appearance-none cursor-pointer
                          ${errors.department
                            ? 'border-red-400 bg-red-50 focus:ring-red-400'
                            : 'border-slate-300 hover:border-slate-400'}
                        `}
                      >
                        <option value="">{deptLoading ? 'Loading departments...' : '— Select Department —'}</option>
                        {departments.map((d) => (
                          <option key={d.department_id} value={d.department_name}>{d.department_name}</option>
                        ))}
                      </select>
                    </div>
                    {errors.department && (
                      <p className="flex items-center gap-1 text-xs text-red-600">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {errors.department}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Teacher Assigned Departments — read-only, admin manages */}
            {user?.role === 'teacher' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  Assigned Departments
                  <span className="ml-auto text-[10px] font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Managed by Admin</span>
                </h3>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  {teacherDeptsLoading ? (
                    <p className="text-xs text-slate-400 italic">Loading assigned departments…</p>
                  ) : teacherDepts.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No departments assigned yet. Contact your administrator.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {teacherDepts.map((d) => (
                        <span
                          key={d.department_id}
                          className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold px-3 py-1 rounded-full"
                        >
                          <Building2 className="w-3 h-3" />
                          {d.department_name}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-2">
                    Department assignments are managed by the system administrator through the Admin Panel.
                  </p>
                </div>
              </div>
            )}

            {/* Password Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Lock className="w-4 h-4 text-indigo-500" />
                Change Password (Optional)
              </h3>
              <p className="text-xs text-slate-400 -mt-2">Leave blank if you do not want to change your password.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="sett-pass"
                  label="New Password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={set('password')}
                  error={errors.password}
                  leftIcon={<Lock className="w-4 h-4" />}
                />
                <Input
                  id="sett-conf"
                  label="Confirm Password"
                  type="password"
                  placeholder="Repeat new password"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  error={errors.confirmPassword}
                  leftIcon={<ShieldCheck className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                id="settings-save-btn"
                type="submit"
                loading={loading}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Settings
              </Button>
            </div>

          </form>
        </Card>
      </div>
    </PageWrapper>
  );
}
