import { useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, fetchMe } from '../features/auth/authSlice.js';

export default function AdminLayout({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, status } = useSelector((state) => state.auth);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchMe());
    }
  }, [dispatch, status]);

  // Redirect unauthenticated users once the auth check is done
  useEffect(() => {
    if (status === 'ready' && !user) {
      navigate('/admin/login', { replace: true });
    }
  }, [status, user, navigate]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/admin/login');
  };

  // Show a spinner while checking auth — prevents content flash before redirect
  if (status !== 'ready') {
    return (
      <div className="min-h-screen bg-forest-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-olive border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">Verifying access…</p>
        </div>
      </div>
    );
  }

  // If not authenticated, the useEffect above will redirect — render nothing in the meantime
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-charcoal">
      {/* Admin Top Navigation */}
      <header className="bg-forest-dark text-white border-b border-forest shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/admin/packages" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-olive flex items-center justify-center font-bold text-white text-sm">
                T
              </div>
              <div className="leading-tight">
                <span className="font-serif font-bold text-lg text-white">TravelOS</span>
                <span className="text-[10px] uppercase tracking-wider text-olive block">Staff Portal</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <NavLink
                to="/admin/packages"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-forest text-sand' : 'text-white/80 hover:bg-forest/60 hover:text-white'
                  }`
                }
              >
                Package CMS
              </NavLink>
              <NavLink
                to="/admin/enquiries"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-forest text-sand' : 'text-white/80 hover:bg-forest/60 hover:text-white'
                  }`
                }
              >
                Enquiry Inbox &amp; AI Assistant
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-sand/80 hover:text-white border border-sand/30 px-3 py-1.5 rounded-md transition-colors"
            >
              <span>Public Website</span>
              <span>↗</span>
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-white">{user.name}</div>
                  <div className="text-[10px] text-olive capitalize">{user.role?.replace('_', ' ')}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-md transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/admin/login"
                className="bg-olive hover:bg-olive/90 text-white text-xs px-3 py-1.5 rounded-md font-medium"
              >
                Staff Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
