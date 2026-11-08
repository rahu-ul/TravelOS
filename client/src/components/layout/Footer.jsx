import { Link } from 'react-router-dom';

const FOOTER_LINKS = {
  Explore: [
    { label: 'Destinations', to: '/destinations' },
    { label: 'Packages', to: '/packages' },
    { label: 'Travel Stories', to: '/stories' },
    { label: 'About TravelOS', to: '/about' },
  ],
  'Plan Your Trip': [
    { label: 'Contact Us', to: '/contact' },
    { label: 'Enquiry Form', to: '/contact#enquiry' },
    { label: 'Kerala Packages', to: '/packages?region=Kerala' },
    { label: 'South India Tours', to: '/packages?region=South+India' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white">
      {/* Main footer */}
      <div className="container-site py-14 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-full bg-forest flex items-center justify-center">
                <span className="text-white text-sm font-serif font-bold">T</span>
              </div>
              <span className="text-xl font-serif font-bold tracking-tight">
                Travel<span className="text-olive">OS</span>
              </span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              Premium travel experiences across Kerala and South India. Curated itineraries,
              local expertise, and personalised service — crafted for the discerning traveller.
            </p>
            <div className="mt-6 flex flex-col gap-2 text-sm text-white/50">
              <span>📍 Based in Kochi, Kerala</span>
              <span>📞 +91 98470 00000</span>
              <span>✉ hello@travelos.in</span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                {heading}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-white/55 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container-site py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-white/40 text-xs">
          <p>© {new Date().getFullYear()} TravelOS. All rights reserved.</p>
          <p>Illustrations and sample content are for demonstration purposes only.</p>
        </div>
      </div>
    </footer>
  );
}

