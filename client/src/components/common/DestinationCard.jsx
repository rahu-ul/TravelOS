import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '../ui/Icons.jsx';

export default function DestinationCard({ destination }) {
  return (
    <Link
      to={`/destinations/${destination.slug}`}
      className="group relative block aspect-[3/4] overflow-hidden rounded-[1.4rem] shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <img
        src={destination.image}
        alt={destination.name}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
        <div>
          <h3 className="font-serif text-2xl font-medium text-white">{destination.name}</h3>
          <p className="mt-1 text-sm text-white/75">{destination.highlight}</p>
        </div>
        <span className="arrow-chip" aria-hidden="true">
          <ArrowRightIcon size={16} />
        </span>
      </div>
    </Link>
  );
}
