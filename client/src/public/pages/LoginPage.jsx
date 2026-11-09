import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { login, clearError } from '../../features/auth/authSlice.js';
import Logo from '../../components/ui/Logo.jsx';
import ThemeToggle from '../../components/ui/ThemeToggle.jsx';
import { EyeIcon, EyeOffIcon, MailIcon, ArrowRightIcon } from '../../components/ui/Icons.jsx';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localErr, setLocalErr] = useState('');

  // If already logged in, redirect accordingly
  useEffect(() => {
    if (user) {
      if (user.role === 'staff_admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalErr('');
    dispatch(clearError());

    if (!email.trim()) {
      setLocalErr('Email address is required');
      return;
    }
    if (!password) {
      setLocalErr('Password is required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await dispatch(
        login({
          email: email.trim().toLowerCase(),
          password,
        })
      ).unwrap();

      if (res) {
        if (res.role === 'staff_admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setLocalErr(err || 'Invalid email or password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const message = localErr || error;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B110D] p-4">
      <img
        src="/images/seed/alleppey-backwaters.jpg"
        alt=""
        className="hero-zoom absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B110D]/75 via-[#0B110D]/50 to-[#0B110D]/85" />
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle tone="onImage" />
      </div>

      <div className="pop-in relative z-10 w-full max-w-md rounded-[1.75rem] border border-sand bg-card p-7 shadow-[var(--shadow-lg)] sm:p-9">
        <div className="mb-7 text-center text-charcoal">
          <Logo className="justify-center" tagline={false} />
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-sand bg-cream px-3 py-1 text-[11px] font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Traveller Account Portal
          </div>
          <h1 className="mt-4 font-serif text-2xl font-medium text-charcoal">Welcome Back</h1>
          <p className="mt-1 text-sm text-muted">Sign in to your traveller account</p>
        </div>

        {message && (
          <div role="alert" className="mb-5 rounded-xl border border-bad/30 bg-bad-soft px-4 py-3 text-xs font-medium text-bad">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="traveller-email" className="label">
              Email Address
            </label>
            <div className="relative">
              <input
                id="traveller-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="field pr-11"
              />
              <MailIcon size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
            </div>
          </div>

          <div>
            <label htmlFor="traveller-password" className="label">
              Password
            </label>
            <div className="relative">
              <input
                id="traveller-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
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

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full !py-3.5 disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : <>Sign In <ArrowRightIcon size={16} /></>}
          </button>
        </form>

        <div className="mt-7 border-t border-sand pt-6 text-center text-xs text-muted">
          Don&apos;t have an account yet?{' '}
          <Link to="/signup" className="font-semibold text-accent underline-offset-4 hover:underline">
            Create account
          </Link>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-sand/60 pt-4 text-xs">
          <Link to="/" className="text-muted hover:text-charcoal underline-offset-4 hover:underline">
            &larr; Back to website
          </Link>
          <Link to="/admin/login" className="font-semibold text-gold hover:underline">
            Staff Admin Portal &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
