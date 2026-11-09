import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { register, clearError } from '../../features/auth/authSlice.js';
import Logo from '../../components/ui/Logo.jsx';
import ThemeToggle from '../../components/ui/ThemeToggle.jsx';
import { EyeIcon, EyeOffIcon, MailIcon, ArrowRightIcon } from '../../components/ui/Icons.jsx';

export default function SignupPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((state) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localErr, setLocalErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalErr('');
    setSuccessMsg('');
    dispatch(clearError());

    if (!name.trim()) {
      setLocalErr('Full name is required');
      return;
    }
    if (!email.trim()) {
      setLocalErr('Email address is required');
      return;
    }
    if (password.length < 10) {
      setLocalErr('Password must be at least 10 characters long');
      return;
    }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      setLocalErr('Password must contain at least one lowercase letter, one uppercase letter, and one number');
      return;
    }
    if (password !== confirmPassword) {
      setLocalErr('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await dispatch(
        register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
        })
      ).unwrap();

      if (res) {
        setSuccessMsg('Account created successfully! Redirecting...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      }
    } catch (err) {
      setLocalErr(err || 'Registration failed. Please check your information.');
    } finally {
      setSubmitting(false);
    }
  };

  const message = localErr || error;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B110D] p-4">
      <img
        src="/images/seed/kerala-sunset.jpg"
        alt=""
        className="hero-zoom absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B110D]/75 via-[#0B110D]/50 to-[#0B110D]/85" />
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle tone="onImage" />
      </div>

      <div className="pop-in relative z-10 w-full max-w-md rounded-[1.75rem] border border-sand bg-card p-7 shadow-[var(--shadow-lg)] sm:p-9 my-8">
        <div className="mb-6 text-center text-charcoal">
          <Logo className="justify-center" tagline={false} />
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-sand bg-cream px-3 py-1 text-[11px] font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Traveller Registration
          </div>
          <h1 className="mt-4 font-serif text-2xl font-medium text-charcoal">Create Account</h1>
          <p className="mt-1 text-sm text-muted">Join TravelOS to track and manage your journeys</p>
        </div>

        {message && (
          <div role="alert" className="mb-5 rounded-xl border border-bad/30 bg-bad-soft px-4 py-3 text-xs font-medium text-bad">
            {message}
          </div>
        )}

        {successMsg && (
          <div role="status" className="mb-5 rounded-xl border border-ok/30 bg-ok-soft px-4 py-3 text-xs font-medium text-ok">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          <div>
            <label htmlFor="signup-name" className="label">
              Full Name
            </label>
            <input
              id="signup-name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="field"
            />
          </div>

          <div>
            <label htmlFor="signup-email" className="label">
              Email Address
            </label>
            <div className="relative">
              <input
                id="signup-email"
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
            <label htmlFor="signup-password" className="label">
              Password <span className="text-[10px] font-normal text-muted">(min 10 chars, uppercase, lowercase &amp; digit)</span>
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="field pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted transition-colors hover:text-charcoal"
              >
                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="signup-confirm-password" className="label">
              Confirm Password
            </label>
            <input
              id="signup-confirm-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="field"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full !py-3.5 disabled:opacity-60"
            >
              {submitting ? 'Creating account…' : <>Create Traveller Account <ArrowRightIcon size={16} /></>}
            </button>
          </div>
        </form>

        <div className="mt-6 border-t border-sand pt-5 text-center text-xs text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent underline-offset-4 hover:underline">
            Sign in here
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-muted hover:text-charcoal underline-offset-4 hover:underline">
            &larr; Return to public website
          </Link>
        </div>
      </div>
    </div>
  );
}
