import { Link, useLocation } from 'react-router-dom';
import Layout from '../../components/layout/Layout.jsx';
import { ArrowRightIcon } from '../../components/ui/Icons.jsx';

export default function NotFoundPage() {
  const { pathname } = useLocation();
  return (
    <Layout>
      <section className="relative flex min-h-[85vh] items-center overflow-hidden bg-[#0B110D] pb-16 pt-32">
        <img src="/images/seed/ooty-hills.jpg" alt="" className="hero-zoom absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B110D]/85 via-[#0B110D]/50 to-[#0B110D]/60" />
        <div className="container-site relative w-full text-center">
          <p className="rise-in font-serif text-[7rem] font-medium leading-none text-gold md:text-[10rem]" aria-hidden="true">404</p>
          <h1 className="rise-in mt-2 font-serif text-3xl font-medium text-white md:text-5xl" style={{ animationDelay: '0.1s' }}>
            This road leads nowhere
          </h1>
          <p className="rise-in mx-auto mt-4 max-w-md text-base text-white/75" style={{ animationDelay: '0.2s' }}>
            We couldn&rsquo;t find <span className="break-all font-mono text-sm text-white">{pathname}</span>. It may have moved, or the link may be mistyped.
          </p>
          <div className="rise-in mt-9 flex flex-col justify-center gap-3 sm:flex-row" style={{ animationDelay: '0.3s' }}>
            <Link to="/" className="btn btn-gold">Back to home <ArrowRightIcon size={16} /></Link>
            <Link to="/packages" className="btn btn-glass">Browse packages</Link>
            <Link to="/destinations" className="btn btn-glass">Explore destinations</Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
