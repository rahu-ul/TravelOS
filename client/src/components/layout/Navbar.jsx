import { Link, NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

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

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  // Add background on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isHomePage = location.pathname === '/';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !isHomePage || menuOpen
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-sand/60'
          : 'bg-transparent'
      }`}
    >
      <div className="container-site">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full bg-forest flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-serif font-bold">T</span>
            </div>
            <div className="leading-none">
              <span
                className={`text-xl font-serif font-bold tracking-tight transition-colors ${
                  scrolled || !isHomePage || menuOpen ? 'text-forest' : 'text-white'
                }`}
              >
                Travel<span className="text-olive">OS</span>
              </span>
              <p
                className={`text-[9px] tracking-widest uppercase mt-0.5 transition-colors ${
                  scrolled || !isHomePage || menuOpen ? 'text-olive' : 'text-white/70'
                }`}
              >
                Kerala &amp; South India
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `text-sm font-medium tracking-wide transition-colors relative ${
                    isActive
                      ? 'text-forest after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-0.5 after:bg-forest after:rounded-full'
                      : scrolled || !isHomePage || menuOpen
                      ? 'text-charcoal/70 hover:text-forest'
                      : 'text-white/80 hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* CTA + Hamburger */}
          <div className="flex items-center gap-3">
            <Link
              to="/contact"
              className="hidden lg:inline-flex items-center gap-2 bg-forest text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-forest-dark transition-colors"
            >
              Plan Your Trip
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen((p) => !p)}
              aria-label="Toggle menu"
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                scrolled || !isHomePage || menuOpen ? 'text-charcoal hover:bg-sand/40' : 'text-white hover:bg-white/10'
              }`}
            >
              <span className="block w-5 h-0.5 bg-current mb-1.5 transition-all" style={{ transform: menuOpen ? 'rotate(45deg) translateY(8px)' : 'none' }} />
              <span className="block w-5 h-0.5 bg-current mb-1.5 transition-all" style={{ opacity: menuOpen ? 0 : 1 }} />
              <span className="block w-5 h-0.5 bg-current transition-all" style={{ transform: menuOpen ? 'rotate(-45deg) translateY(-8px)' : 'none' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-sand/60 shadow-lg">
          <div className="container-site py-4">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-forest/5 text-forest' : 'text-charcoal hover:bg-sand/40'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <Link
                to="/contact"
                className="mt-3 inline-flex items-center justify-center bg-forest text-white text-sm font-medium px-5 py-3 rounded-full hover:bg-forest-dark transition-colors"
              >
                Plan Your Trip →
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

