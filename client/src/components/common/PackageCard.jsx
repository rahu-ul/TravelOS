import { Link } from 'react-router-dom';
import { ArrowRightIcon, CalendarIcon, PinIcon } from '../ui/Icons.jsx';

export default function PackageCard({ pkg }) {
  const hasPrice = pkg.startingPrice !== null && pkg.startingPrice !== undefined;
  const imageUrl = pkg.heroImage?.url || pkg.image || '/images/kerala-card.jpg';
  const durationLabel = pkg.duration || (pkg.durationDays ? `${pkg.durationDays} Days / ${pkg.nights || Math.max(1, pkg.durationDays - 1)} Nights` : null);
  const formattedPrice = hasPrice ? (pkg.priceLabel || `₹${Number(pkg.startingPrice).toLocaleString('en-IN')}`) : null;
  const priceSubtitle = pkg.priceNote || 'Per person twin sharing';

  return (
    <Link
      to={`/packages/${pkg.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-sand bg-card shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-[var(--shadow-md)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative h-52 overflow-hidden">
        <img
          src={imageUrl}
          alt={pkg.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {pkg.isDemo && <span className="demo-badge !bg-black/45 !text-white backdrop-blur-sm">Demo</span>}
          {pkg.hotelCategory && (
            <span className="inline-flex items-center rounded-full bg-black/45 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              {pkg.hotelCategory}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-3 font-serif text-xl font-medium leading-snug text-charcoal">{pkg.name}</h3>

        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          {pkg.destination && (
            <span className="inline-flex items-center gap-1.5">
              <PinIcon size={14} className="text-gold" />
              {pkg.destination}
            </span>
          )}
          {durationLabel && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon size={14} className="text-gold" />
              {durationLabel}
            </span>
          )}
        </div>

        {pkg.tags && pkg.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {pkg.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-sand/70 px-2.5 py-0.5 text-[11px] font-medium text-muted">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between border-t border-sand pt-4">
          <div>
            {hasPrice ? (
              <>
                <p className="mb-0.5 text-xs text-muted">From</p>
                <p className="font-serif text-xl font-semibold text-accent">{formattedPrice}</p>
                <p className="text-xs text-muted">{priceSubtitle}</p>
              </>
            ) : (
              <>
                <p className="mb-0.5 text-xs text-muted">Pricing</p>
                <p className="text-sm font-semibold text-accent">Price on request</p>
              </>
            )}
          </div>
          <span className="arrow-chip" aria-hidden="true">
            <ArrowRightIcon size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}
