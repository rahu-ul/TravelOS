import { Link } from 'react-router-dom';

export default function DestinationCard({ destination }) {
  return (
    <Link
      to={`/destinations/${destination.slug}`}
      className="group relative block rounded-2xl overflow-hidden aspect-[3/4] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image */}
      <img
        src={destination.image}
        alt={destination.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-5">
        {/* Package count */}
        <span className="text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">
          {destination.packages}+ packages
        </span>
        <h3 className="font-serif text-white text-2xl mb-1 group-hover:text-sand transition-colors">
          {destination.name}
        </h3>
        <p className="text-white/70 text-sm">{destination.tagline}</p>

        {/* Highlight pill */}
        <div className="mt-3 inline-flex items-center gap-1.5 self-start">
          <span className="inline-flex items-center gap-1 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-xs px-3 py-1 rounded-full">
            {destination.highlight} ✦
          </span>
        </div>
      </div>
    </Link>
  );
}

