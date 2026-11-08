import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../../components/layout/Layout.jsx';
import PackageCard from '../../components/common/PackageCard.jsx';
import SectionHeading from '../../components/common/SectionHeading.jsx';
import { DEMO_PACKAGES, DEMO_DESTINATIONS } from '../../data/demoData.js';

const DURATIONS = [
  { label: 'All Durations', value: '' },
  { label: '1–3 Days', value: '1-3' },
  { label: '4–6 Days', value: '4-6' },
  { label: '7–9 Days', value: '7-9' },
  { label: '10+ Days', value: '10+' },
];

const HOTEL_CATEGORIES = ['All', '3 Star', '4 Star', '5 Star'];
const REGIONS = ['All', 'Kerala', 'South India'];

function matchesDuration(days, filter) {
  if (!filter) return true;
  if (filter === '1-3') return days >= 1 && days <= 3;
  if (filter === '4-6') return days >= 4 && days <= 6;
  if (filter === '7-9') return days >= 7 && days <= 9;
  if (filter === '10+') return days >= 10;
  return true;
}

export default function PackagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('destination') || '');
  const [duration, setDuration] = useState('');
  const [hotelCat, setHotelCat] = useState('All');
  const [region, setRegion] = useState('All');
  const [sort, setSort] = useState('recommended');

  const filtered = useMemo(() => {
    let pkgs = [...DEMO_PACKAGES];

    if (search.trim()) {
      const q = search.toLowerCase();
      pkgs = pkgs.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.destination.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (duration) pkgs = pkgs.filter((p) => matchesDuration(p.durationDays, duration));
    if (hotelCat !== 'All') pkgs = pkgs.filter((p) => p.hotelCategory === hotelCat);
    if (region !== 'All') pkgs = pkgs.filter((p) => p.region === region);

    if (sort === 'price_asc') pkgs.sort((a, b) => (a.startingPrice ?? 999999) - (b.startingPrice ?? 999999));
    if (sort === 'price_desc') pkgs.sort((a, b) => (b.startingPrice ?? 0) - (a.startingPrice ?? 0));
    if (sort === 'duration') pkgs.sort((a, b) => a.durationDays - b.durationDays);

    return pkgs;
  }, [search, duration, hotelCat, region, sort]);

  const clearFilters = () => {
    setSearch('');
    setDuration('');
    setHotelCat('All');
    setRegion('All');
    setSort('recommended');
  };

  const hasFilters = search || duration || hotelCat !== 'All' || region !== 'All';

  return (
    <Layout>
      {/* Page hero */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-20 bg-forest overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src="/images/seed/munnar-wide.jpg" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative container-site text-center">
          <p className="text-olive text-xs font-semibold uppercase tracking-widest mb-3">Our Packages</p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-5">
            Curated Kerala Journeys
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto leading-relaxed">
            {DEMO_PACKAGES.length} handcrafted itineraries across Kerala and South India.
            All prices are illustrative demo content.
          </p>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="section-padding bg-ivory">
        <div className="container-site">
          {/* Filter bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-sand/60 p-5 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">🔍</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search destination or package..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-sand rounded-xl outline-none focus:border-forest transition-colors bg-ivory"
                />
              </div>

              {/* Duration */}
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="px-4 py-2.5 text-sm border border-sand rounded-xl outline-none focus:border-forest bg-ivory min-w-[140px]"
              >
                {DURATIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>

              {/* Hotel category */}
              <select
                value={hotelCat}
                onChange={(e) => setHotelCat(e.target.value)}
                className="px-4 py-2.5 text-sm border border-sand rounded-xl outline-none focus:border-forest bg-ivory min-w-[130px]"
              >
                {HOTEL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
                ))}
              </select>

              {/* Region */}
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="px-4 py-2.5 text-sm border border-sand rounded-xl outline-none focus:border-forest bg-ivory min-w-[130px]"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r === 'All' ? 'All Regions' : r}</option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-4 py-2.5 text-sm border border-sand rounded-xl outline-none focus:border-forest bg-ivory min-w-[160px]"
              >
                <option value="recommended">Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="duration">Duration</option>
              </select>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-muted hover:text-forest transition-colors whitespace-nowrap underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted">
              {filtered.length} {filtered.length === 1 ? 'package' : 'packages'} found
            </p>
            <p className="text-xs text-muted">
              <span className="demo-badge">Demo Data</span> — Prices are illustrative
            </p>
          </div>

          {/* Package grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-4xl mb-4">🏔</p>
              <h3 className="font-serif text-2xl text-charcoal mb-3">No packages found</h3>
              <p className="text-muted mb-6">Try adjusting your filters or search term.</p>
              <button
                onClick={clearFilters}
                className="bg-forest text-white font-semibold px-6 py-3 rounded-full hover:bg-forest-dark transition-colors text-sm"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

