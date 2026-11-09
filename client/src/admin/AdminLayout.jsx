import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, fetchMe } from '../features/auth/authSlice.js';
import Logo from '../components/ui/Logo.jsx';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';
import { GridIcon, PackageIcon, InboxIcon, LogoutIcon, MenuIcon, CloseIcon, ExternalIcon, TagIcon, CompassIcon } from '../components/ui/Icons.jsx';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: GridIcon, end: true },
  { to: '/admin/packages', label: 'Package CMS', icon: PackageIcon },
  { to: '/admin/stories', label: 'Story CMS', icon: TagIcon },
  { to: '/admin/enquiries', label: 'Enquiries & AI', icon: InboxIcon },
  { to: '/admin/quotes', label: 'Quote Builder', icon: CompassIcon },
];

export default function AdminLayout({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, status } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchMe());
  }, [dispatch, status]);

  // Redirect unauthenticated users or non-admin users once auth check is done
  useEffect(() => {
    if (status === 'ready') {
      if (!user) {
        navigate('/admin/login', { replace: true });
      } else if (user.role !== 'staff_admin') {
        // Prevent travellers from accessing admin panel
        navigate('/admin/login?error=unauthorized', { replace: true });
      }
    }
  }, [status, user, navigate]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/admin/login');
  };

  // Spinner while checking auth, prevents content flash before redirect
  if (status !== 'ready') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream" role="status">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-sand border-t-gold" />
          <p className="text-sm text-muted">Verifying access…</p>
        </div>
      </div>
    );
  }
  if (!user || user.role !== 'staff_admin') return null;

  const initials = (user.name || 'A').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5 md:h-20">
        <Link to="/admin" aria-label="TravelOS admin home" className="text-charcoal">
          <Logo tagline={false} />
        </Link>
        <span className="rounded-full bg-sand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">Admin</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Admin">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 motion-reduce:transition-none ${
                isActive ? 'bg-[var(--btn-bg)] text-[var(--btn-fg)] shadow-[var(--shadow-sm)]' : 'text-muted hover:bg-sand/70 hover:text-charcoal'
              }`
            }
          >
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-3 border-t border-sand p-4">
        <Link to="/" target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm text-muted transition-colors hover:bg-sand/70 hover:text-charcoal">
          Public website <ExternalIcon size={15} />
        </Link>
        <div className="flex items-center gap-3 rounded-xl bg-cream px-3 py-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold text-xs font-bold text-on-gold">{initials}</span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-charcoal">{user.name}</p>
            <p className="truncate text-[11px] capitalize text-muted">{user.role?.replace('_', ' ')}</p>
          </div>
          <button type="button" onClick={handleLogout} aria-label="Sign out" title="Sign out" className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-sand hover:text-charcoal">
            <LogoutIcon size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream text-charcoal">
      {/* Desktop sidebar */}
      <aside className="themed fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sand bg-card lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-[60] overflow-hidden transition-[visibility] duration-300 lg:hidden ${open ? '' : 'invisible pointer-events-none'}`} inert={!open} aria-hidden={!open}>
        <div onClick={() => setOpen(false)} className={`absolute inset-0 bg-black/55 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-sand bg-card shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          {sidebar}
        </div>
      </div>

      <div className="lg:pl-64">
        <header className="themed sticky top-0 z-30 flex h-16 items-center justify-between border-b border-sand bg-card/90 px-4 backdrop-blur-xl sm:px-6 md:h-20 lg:px-8">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setOpen(true)} aria-label="Open navigation" className="grid h-10 w-10 place-items-center rounded-full border border-sand bg-card text-charcoal lg:hidden">
              {open ? <CloseIcon size={18} /> : <MenuIcon size={18} />}
            </button>
            <p className="hidden text-sm text-muted sm:block">TravelOS Staff Portal</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="hidden text-right leading-tight sm:block">
              <span className="block text-sm font-semibold text-charcoal">{user.name}</span>
              <span className="block text-[11px] capitalize text-muted">{user.role?.replace('_', ' ')}</span>
            </span>
          </div>
        </header>

        <main className="page-in mx-auto w-full max-w-[90rem] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
