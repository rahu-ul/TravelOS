import { Link } from 'react-router-dom';
import Logo from '../ui/Logo.jsx';
import { PinIcon, PhoneIcon, MailIcon } from '../ui/Icons.jsx';

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
  'Traveller Portal': [
    { label: 'Traveller Sign In', to: '/login' },
    { label: 'Create Account', to: '/signup' },
    { label: 'My Dashboard', to: '/dashboard' },
  ],
  'Assessment & Staff': [
    { label: 'Staff Admin Portal', to: '/admin/login' },
    { label: 'Package CMS', to: '/admin/packages' },
    { label: 'Enquiries Inbox', to: '/admin/enquiries' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-footer text-[#F3F0E8]">
      <div className="container-site py-14 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link to="/" aria-label="TravelOS home" className="inline-block">
              <Logo />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/65">
              Premium travel experiences across Kerala and South India. Curated itineraries,
              local expertise and personal service, crafted for the discerning traveller.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-white/60">
              <li className="flex items-center gap-2">
                <PinIcon size={16} className="text-gold shrink-0" /> Based in Kochi, Kerala
              </li>
              <li className="flex items-center gap-2">
                <PhoneIcon size={16} className="text-gold shrink-0" /> +91 98470 00000
              </li>
              <li className="flex items-center gap-2">
                <MailIcon size={16} className="text-gold shrink-0" /> hello@travelos.in
              </li>
            </ul>

            <div className="mt-6">
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs font-medium text-gold hover:bg-gold/20 transition-colors"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                Assessment Reviewer / Admin Login &rarr;
              </Link>
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="mb-4 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold">{heading}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm text-white/65 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-site flex flex-col items-center justify-between gap-3 py-5 text-xs text-white/50 md:flex-row">
          <p>© {new Date().getFullYear()} TravelOS. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/admin/login" className="hover:text-gold transition-colors">Admin Portal Access</Link>
            <span>·</span>
            <span>Illustrations &amp; demo data for evaluation purposes.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
