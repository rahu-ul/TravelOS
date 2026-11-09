import { Link, NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Logo from '../ui/Logo.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import { MenuIcon, CloseIcon } from '../ui/Icons.jsx';
import { useTheme } from '../../theme/ThemeProvider.jsx';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/destinations', label: 'Destinations' },
  { to: '/packages', label: 'Packages' },
  { to: '/stories', label: 'Travel Stories' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { isDark } = useTheme();
  const { user } = useSelector((state) => state.auth);

  // Close the mobile menu on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Background appears once the page is scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open; close on Escape
  useEffect(() => {
    if (!menuOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const isHomePage = location.pathname === '/';
  const solid = scrolled || !isHomePage || menuOpen;
  const onImage = !solid;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300 ${
        solid
          ? 'border-b border-sand/70 shadow-[0_8px_24px_-18px_rgb(0_0_0/0.35)] backdrop-blur-xl'
          : 'border-b border-transparent'
      }`}
      style={solid ? { background: menuOpen ? 'var(--bg)' : 'var(--header-bg)' } : undefined}
    >
      <div className="container-site">
        <div className="flex h-16 items-center justify-between md:h-20">
          <Link
            to="/"
            aria-label="TravelOS home"
            className={`transition-colors ${onImage ? 'text-white' : 'text-charcoal'}`}
          >
            <Logo tagline />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `relative py-1 text-sm font-medium tracking-wide transition-colors after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:bg-gold after:transition-transform after:duration-300 ${
                    isActive ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100'
                  } ${
                    onImage
                      ? isActive
                        ? 'text-white'
                        : 'text-white/80 hover:text-white'
                      : isActive
                      ? 'text-charcoal'
                      : 'text-charcoal/70 hover:text-charcoal'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            {/* Admin Portal pill - clearly visible for reviewers without dominating design */}
            <Link
              to="/admin/login"
              className={`hidden md:inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold border transition-colors ${
                onImage
                  ? 'border-white/35 bg-white/10 text-white hover:bg-white/20'
                  : 'border-sand bg-card text-charcoal hover:border-gold hover:text-gold'
              }`}
              title="Restricted Staff &amp; Reviewer Admin Portal"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Admin Portal
            </Link>

            {/* Traveller Auth Links */}
            {user ? (
              <Link
                to={user.role === 'staff_admin' ? '/admin/dashboard' : '/dashboard'}
                className={`hidden md:inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                  onImage
                    ? 'border-white/40 bg-white/15 text-white hover:bg-white/25'
                    : 'border-gold/40 bg-gold/10 text-charcoal hover:border-gold'
                }`}
              >
                <span className="font-semibold">{user.name.split(' ')[0]}</span>
                <span className="text-[10px] text-muted capitalize">({user.role === 'staff_admin' ? 'Admin' : 'Dashboard'})</span>
              </Link>
            ) : (
              <div className="hidden md:flex items-center gap-2 text-xs">
                <Link
                  to="/login"
                  className={`px-2.5 py-1 font-medium transition-colors ${
                    onImage ? 'text-white/90 hover:text-white' : 'text-charcoal hover:text-accent'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className={`rounded-full px-3 py-1 font-semibold border transition-colors ${
                    onImage
                      ? 'border-white/40 text-white hover:bg-white/15'
                      : 'border-sand bg-card text-charcoal hover:border-gold'
                  }`}
                >
                  Sign Up
                </Link>
              </div>
            )}

            <ThemeToggle tone={onImage ? 'onImage' : 'auto'} />

            <Link to="/contact" className="btn btn-gold hidden !py-2 lg:inline-flex text-xs">
              Plan Your Trip
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((p) => !p)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className={`grid h-10 w-10 place-items-center rounded-full border transition-colors lg:hidden ${
                onImage
                  ? 'border-white/35 bg-white/10 text-white hover:bg-white/20'
                  : 'border-sand bg-card text-charcoal hover:border-gold'
              }`}
            >
              {menuOpen ? <CloseIcon size={18} /> : <MenuIcon size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none lg:hidden ${
          menuOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <div className="min-h-0">
          <div className="container-site max-h-[calc(100svh-4rem)] overflow-y-auto pb-6 pt-2">
            <nav className="flex flex-col" aria-label="Mobile">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between border-b border-sand/70 py-3 font-serif text-lg transition-colors ${
                      isActive ? 'text-accent' : 'text-charcoal hover:text-accent'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Mobile Auth actions */}
            <div className="mt-4 space-y-2 border-t border-sand/70 pt-4">
              {user ? (
                <Link
                  to={user.role === 'staff_admin' ? '/admin/dashboard' : '/dashboard'}
                  className="flex items-center justify-between rounded-xl border border-sand bg-card px-4 py-3 text-sm font-semibold text-charcoal"
                >
                  <span>My {user.role === 'staff_admin' ? 'Admin Portal' : 'Traveller Dashboard'}</span>
                  <span className="chip chip-gold text-[10px] uppercase">{user.role}</span>
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    className="btn btn-outline text-center !py-2.5 text-xs"
                  >
                    Traveller Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="btn btn-primary text-center !py-2.5 text-xs"
                  >
                    Traveller Sign Up
                  </Link>
                </div>
              )}

              <Link
                to="/admin/login"
                className="flex items-center justify-between rounded-xl border border-gold/30 bg-gold/10 px-4 py-2.5 text-xs font-semibold text-charcoal hover:border-gold"
              >
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  Staff / Reviewer Admin Portal
                </span>
                <span>&rarr;</span>
              </Link>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-sand bg-card px-4 py-3">
              <span className="text-sm text-muted">{isDark ? 'Dark appearance' : 'Light appearance'}</span>
              <ThemeToggle />
            </div>

            <Link to="/contact" className="btn btn-gold mt-4 w-full text-xs !py-3">
              Plan Your Trip
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
