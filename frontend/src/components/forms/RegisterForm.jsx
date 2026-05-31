import { useState } from 'react';
import { Mail, Lock, User, Hash, BookOpen, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Tabs from '../ui/Tabs';

const ROLE_TABS = [
  { id: 'student', label: 'Student' },
  { id: 'teacher', label: 'Teacher' },
];

/**
 * RegisterForm — Tabbed student / teacher registration.
 * Student fields: full_name, email, password, roll_number, section, semester
 * Teacher fields: full_name, email, password, department
 */
export default function RegisterForm() {
  const { register } = useAuth();
  const { push }     = useNotification();
  const navigate     = useNavigate();

  const [role, setRole]     = useState('student');
  const [form, setForm]     = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.full_name) e.full_name = 'Full name is required';
    if (!form.email)     e.email     = 'Email is required';
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (role === 'student') {
      if (!form.roll_number) e.roll_number = 'Roll number is required';
      if (!form.section)     e.section     = 'Section is required';
      if (!form.semester)    e.semester    = 'Semester is required';
      if (!form.department)  e.department  = 'Department/Program is required';
    }
    if (role === 'teacher' && !form.department) e.department = 'Department is required';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    try {
      await register(form, role);
      push('success', 'Account created! Welcome to SmartAttend.');
      navigate(role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
    } catch (err) {
      setErrors({ form: err.message });
      push('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Tabs tabs={ROLE_TABS} activeTab={role} onChange={(r) => { setRole(r); setForm({}); setErrors({}); }} />

      {errors.form && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{errors.form}</p>
      )}

      <Input id="reg-name"     label="Full Name"      type="text"     placeholder="Jane Smith"          value={form.full_name    ?? ''} onChange={set('full_name')}    error={errors.full_name}    leftIcon={<User className="w-4 h-4" />} />
      <Input id="reg-email"    label="Email Address"  type="email"    placeholder="you@university.edu"  value={form.email        ?? ''} onChange={set('email')}        error={errors.email}        leftIcon={<Mail className="w-4 h-4" />} />
      <Input id="reg-password" label="Password"       type="password" placeholder="Min 8 characters"   value={form.password     ?? ''} onChange={set('password')}     error={errors.password}     leftIcon={<Lock className="w-4 h-4" />} />

        {role === 'student' && (
          <>
            <Input id="reg-roll"     label="Roll Number"   type="text"   placeholder="2021-CS-001"  value={form.roll_number ?? ''} onChange={set('roll_number')} error={errors.roll_number} leftIcon={<Hash className="w-4 h-4" />} />
            <div className="grid grid-cols-2 gap-3">
              <Input id="reg-section"  label="Section"   type="text"   placeholder="A"  value={form.section  ?? ''} onChange={set('section')}  error={errors.section} />
              <Input id="reg-semester" label="Semester"  type="number" placeholder="1"  value={form.semester ?? ''} onChange={set('semester')} error={errors.semester} min={1} max={8} />
            </div>
            <Input id="reg-dept" label="Department / Program" type="text" placeholder="Computer Science" value={form.department ?? ''} onChange={set('department')} error={errors.department} leftIcon={<BookOpen className="w-4 h-4" />} />
          </>
        )}

        {role === 'teacher' && (
        <Input id="reg-dept" label="Department" type="text" placeholder="Computer Science" value={form.department ?? ''} onChange={set('department')} error={errors.department} leftIcon={<BookOpen className="w-4 h-4" />} />
      )}

      <Button id="register-submit-btn" type="submit" fullWidth loading={loading} leftIcon={<UserPlus className="w-4 h-4" />}>
        Create Account
      </Button>
    </form>
  );
}
