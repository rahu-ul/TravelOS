import { Link } from 'react-router-dom';

export default function PackageCard({ pkg }) {
  const hasPrice = pkg.startingPrice !== null && pkg.startingPrice !== undefined;

  return (
    <Link
      to={`/packages/${pkg.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-sand/60"
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={pkg.image}
          alt={pkg.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Category badges */}
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          {pkg.isDemo && (
            <span className="demo-badge">Demo</span>
          )}
          <span className="inline-flex items-center rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-0.5 text-xs font-medium text-charcoal border border-white/60">
            {pkg.hotelCategory}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Destination & duration */}
        <div className="flex items-center justify-between text-xs text-muted mb-2">
          <span className="text-olive font-medium">{pkg.destination}</span>
          <span>{pkg.duration}</span>
        </div>

        {/* Title */}
        <h3 className="font-serif text-charcoal text-lg leading-snug mb-3 group-hover:text-forest transition-colors">
          {pkg.name}
        </h3>

        {/* Tags */}
        {pkg.tags && pkg.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-4">
            {pkg.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2 py-0.5 rounded-full bg-sand/60 text-charcoal/60 font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Price */}
        <div className="flex items-end justify-between pt-3 border-t border-sand/60">
          <div>
            {hasPrice ? (
              <>
                <p className="text-xs text-muted mb-0.5">Starting from</p>
                <p className="text-forest font-bold text-lg">{pkg.priceLabel}</p>
                <p className="text-xs text-muted">{pkg.priceNote}</p>
              </>
            ) : (
              <>
                <p className="text-xs text-muted mb-0.5">Pricing</p>
                <p className="text-forest font-semibold text-sm">Price on Request</p>
              </>
            )}
          </div>
          <span className="text-xs font-medium text-forest group-hover:underline">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}

