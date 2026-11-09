import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { login, clearError } from '../../features/auth/authSlice.js';
import Logo from '../../components/ui/Logo.jsx';
import ThemeToggle from '../../components/ui/ThemeToggle.jsx';
import { EyeIcon, EyeOffIcon, MailIcon, ArrowRightIcon } from '../../components/ui/Icons.jsx';

export default function AdminLoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localErr, setLocalErr] = useState('');

  useEffect(() => {
    if (searchParams.get('error') === 'unauthorized') {
      setLocalErr('Access denied. Admin portal requires a Staff Admin account.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && user.role === 'staff_admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalErr('');
    dispatch(clearError());
    setSubmitting(true);
    try {
      const res = await dispatch(login({ email: email.trim().toLowerCase(), password })).unwrap();
      if (res) {
        if (res.role === 'staff_admin') {
          navigate('/admin/dashboard');
        } else {
          setLocalErr('Access denied. Traveller accounts cannot access the Staff Admin Portal.');
        }
      }
    } catch (err) {
      setLocalErr(err || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const message = localErr || error;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B110D] p-4">
      <img src="/images/seed/munnar-tea.jpg" alt="" className="hero-zoom absolute inset-0 h-full w-full object-cover opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B110D]/70 via-[#0B110D]/45 to-[#0B110D]/80" />
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle tone="onImage" />
      </div>

      <div className="pop-in relative z-10 w-full max-w-md rounded-[1.75rem] border border-sand bg-card p-7 shadow-[var(--shadow-lg)] sm:p-9">
        <div className="mb-7 text-center text-charcoal">
          <Logo className="justify-center" tagline={false} />
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-sand bg-cream px-3 py-1 text-[11px] font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Restricted Staff &amp; Reviewer Access
          </div>
          <h1 className="mt-4 font-serif text-2xl font-medium text-charcoal">Admin Portal</h1>
          <p className="mt-1 text-sm text-muted">Package CMS &amp; Enquiry Management</p>
        </div>

        {message && (
          <div role="alert" className="mb-5 rounded-xl border border-bad/30 bg-bad-soft px-4 py-3 text-xs font-medium text-bad">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
          <div>
            <label htmlFor="login-email" className="label">Staff Email Address</label>
            <div className="relative">
              <input
                id="login-email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@travelos.example"
                aria-invalid={Boolean(message)}
                className="field pr-11"
              />
              <MailIcon size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="label">Password</label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                aria-invalid={Boolean(message)}
                className="field pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted transition-colors hover:text-charcoal"
              >
                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn btn-primary w-full !py-3.5 disabled:opacity-60">
            {submitting ? 'Authenticating…' : <>Sign into Admin Portal <ArrowRightIcon size={16} /></>}
          </button>
        </form>

        <div className="mt-7 border-t border-sand pt-6 text-center">
          <Link to="/" className="text-xs text-accent underline-offset-4 hover:underline">
            &larr; Return to public traveller website
          </Link>
        </div>
      </div>
    </div>
  );
}
