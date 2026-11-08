import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../../features/auth/authSlice.js';

export default function AdminLoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localErr, setLocalErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalErr('');
    setSubmitting(true);
    try {
      const res = await dispatch(login({ email, password })).unwrap();
      if (res) {
        navigate('/admin/packages');
      }
    } catch (err) {
      setLocalErr(err || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillCredentials = (userEmail) => {
    setEmail(userEmail);
    setPassword('TravelOS_Demo_2026!');
  };

  return (
    <div className="min-h-screen bg-forest-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border border-sand">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-forest rounded-xl mx-auto flex items-center justify-center text-white font-bold text-xl mb-3">
            T
          </div>
          <h1 className="font-serif text-2xl font-bold text-forest">TravelOS Staff Portal</h1>
          <p className="text-xs text-muted mt-1">Package Management CMS &amp; Enquiry Processing</p>
        </div>

        {(error || localErr) && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {error || localErr}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@travelos.example"
              className="w-full px-3.5 py-2.5 text-sm border border-sand rounded-xl outline-none focus:border-forest bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 text-sm border border-sand rounded-xl outline-none focus:border-forest bg-slate-50"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-forest text-white font-semibold py-3 rounded-xl hover:bg-forest-dark transition-colors text-sm shadow-md disabled:opacity-50"
          >
            {submitting ? 'Authenticating...' : 'Sign In to Staff CMS'}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2 text-center">
            Demo Credentials (1-Click Fill)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('admin@travelos.example')}
              className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-charcoal text-xs rounded-lg text-left"
            >
              <span className="font-semibold block text-[11px]">Staff Admin</span>
              <span className="text-[10px] text-muted truncate block">admin@travelos.example</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('consultant@travelos.example')}
              className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-charcoal text-xs rounded-lg text-left"
            >
              <span className="font-semibold block text-[11px]">Consultant</span>
              <span className="text-[10px] text-muted truncate block">consultant@travelos.example</span>
            </button>
          </div>
          <div className="text-center mt-4">
            <a href="/" className="text-xs text-olive hover:underline">
              ← Return to Public Website
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

