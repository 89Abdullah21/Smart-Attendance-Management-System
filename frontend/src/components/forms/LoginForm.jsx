import { useState } from 'react';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Tabs from '../ui/Tabs';

const ROLE_TABS = [
  { id: 'student', label: 'Student' },
  { id: 'teacher', label: 'Teacher' },
  { id: 'admin', label: 'Admin' },
];

/**
 * LoginForm — Email + password + role selector.
 * Submits via AuthContext.login() and redirects by role.
 */
export default function LoginForm() {
  const { login }  = useAuth();
  const { push }   = useNotification();
  const navigate   = useNavigate();

  const [role, setRole]       = useState('student');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!email)    e.email    = 'Email is required';
    if (!password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    try {
      await login(email, password, role);
      push('success', 'Welcome back!');
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setErrors({ form: err.message });
      push('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Tabs tabs={ROLE_TABS} activeTab={role} onChange={setRole} />

      {errors.form && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{errors.form}</p>
      )}

      <Input
        id="login-email"
        label="Email address"
        type="email"
        placeholder="you@university.edu"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        leftIcon={<Mail className="w-4 h-4" />}
        autoComplete="email"
      />
      <Input
        id="login-password"
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        leftIcon={<Lock className="w-4 h-4" />}
        autoComplete="current-password"
      />

      <Button
        id="login-submit-btn"
        type="submit"
        fullWidth
        loading={loading}
        leftIcon={<LogIn className="w-4 h-4" />}
      >
        Sign In as {role.charAt(0).toUpperCase() + role.slice(1)}
      </Button>
    </form>
  );
}
