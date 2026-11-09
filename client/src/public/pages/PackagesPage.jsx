import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../../components/layout/Layout.jsx';
import PackageCard from '../../components/common/PackageCard.jsx';
import PageHero from '../../components/ui/PageHero.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import { SearchIcon, CloseIcon } from '../../components/ui/Icons.jsx';
import { api } from '../../api/client.js';
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
  if (!days) return false;
  if (filter === '1-3') return days >= 1 && days <= 3;
  if (filter === '4-6') return days >= 4 && days <= 6;
  if (filter === '7-9') return days >= 7 && days <= 9;
  if (filter === '10+') return days >= 10;
  return true;
}

function matchesHotelCategory(pkgCategory, filterCat) {
  if (filterCat === 'All') return true;
  if (!pkgCategory) return false;
  const pNorm = String(pkgCategory).toLowerCase().replace(/[^a-z0-9]/g, '');
  const fNorm = String(filterCat).toLowerCase().replace(/[^a-z0-9]/g, '');
  return pNorm === fNorm;
}

function matchesRegion(pkg, filterRegion) {
  if (filterRegion === 'All') return true;
  const rNorm = filterRegion.toLowerCase();
  const dest = (pkg.destination || '').toLowerCase();
  const cat = (pkg.region || pkg.category || '').toLowerCase();
  return dest.includes(rNorm) || cat.includes(rNorm);
}

function FilterGroup({ title, name, value, onChange, options }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-charcoal">{title}</legend>
      <div className="space-y-1.5">
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value || 'all'}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                checked ? 'bg-sand/70 text-charcoal' : 'text-muted hover:bg-sand/40'
              }`}
            >
              <input
                type="radio"
                name={name}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="h-4 w-4 accent-[var(--gold)]"
              />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function PackagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('destination') || '');
  const [duration, setDuration] = useState('');
  const [hotelCat, setHotelCat] = useState('All');
  const [region, setRegion] = useState('All');
  const [sort, setSort] = useState('recommended');

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get('/packages')
      .then((res) => {
        if (active && res.data?.data?.packages) {
          setPackages(res.data.data.packages);
        }
      })
      .catch((err) => {
        console.warn('Using cached catalogue fallback:', err);
        if (active) setPackages(DEMO_PACKAGES);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    let pkgs = packages.length > 0 ? [...packages] : [...DEMO_PACKAGES];

    if (search.trim()) {
      const q = search.toLowerCase();
      pkgs = pkgs.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.destination && p.destination.toLowerCase().includes(q)) ||
          (p.summary && p.summary.toLowerCase().includes(q)) ||
          (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    if (duration) pkgs = pkgs.filter((p) => matchesDuration(p.durationDays, duration));
    if (hotelCat !== 'All') pkgs = pkgs.filter((p) => matchesHotelCategory(p.hotelCategory, hotelCat));
    if (region !== 'All') pkgs = pkgs.filter((p) => matchesRegion(p, region));

    if (sort === 'price_asc') pkgs.sort((a, b) => (a.startingPrice ?? 999999) - (b.startingPrice ?? 999999));
    if (sort === 'price_desc') pkgs.sort((a, b) => (b.startingPrice ?? 0) - (a.startingPrice ?? 0));
    if (sort === 'duration') pkgs.sort((a, b) => (a.durationDays ?? 0) - (b.durationDays ?? 0));

    return pkgs;
  }, [packages, search, duration, hotelCat, region, sort]);

  const clearFilters = () => {
    setSearch('');
    setDuration('');
    setHotelCat('All');
    setRegion('All');
    setSort('recommended');
  };

  const hasFilters = search || duration || hotelCat !== 'All' || region !== 'All';

  const [drawerOpen, setDrawerOpen] = useState(false);

  // Lock scroll + Escape to close while the mobile filter drawer is open
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setDrawerOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  const activeCount = [duration, hotelCat !== 'All', region !== 'All'].filter(Boolean).length;

  // Rendered twice (sidebar + drawer): radio names must differ per copy or the
  // browser merges them into one group and unchecks the other copy.
  const renderFilters = (prefix) => (
    <div className="space-y-7">
      <FilterGroup title="Region" name={`${prefix}-region`} value={region} onChange={setRegion}
        options={REGIONS.map((r) => ({ value: r, label: r === 'All' ? 'All regions' : r }))} />
      <FilterGroup title="Duration" name={`${prefix}-duration`} value={duration} onChange={setDuration}
        options={DURATIONS.map((d) => ({ value: d.value, label: d.label }))} />
      <FilterGroup title="Hotel category" name={`${prefix}-hotel`} value={hotelCat} onChange={setHotelCat}
        options={HOTEL_CATEGORIES.map((c) => ({ value: c, label: c === 'All' ? 'All categories' : c }))} />
    </div>
  );

  return (
    <Layout>
      <PageHero
        eyebrow="Our packages"
        title="Curated Kerala journeys"
        subtitle={`${DEMO_PACKAGES.length} handcrafted itineraries across Kerala and South India. All prices are illustrative demo content.`}
        image="/images/seed/munnar-wide.jpg"
      />

      <section className="bg-ivory py-10 md:py-16">
        <div className="container-site">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[17rem_1fr] lg:gap-10">
            {/* Desktop filters */}
            <aside className="hidden lg:block">
              <div className="sticky top-28 rounded-[1.4rem] border border-sand bg-card p-6 shadow-[var(--shadow-sm)]">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-serif text-xl font-medium text-charcoal">Filters</h2>
                  {hasFilters && (
                    <button type="button" onClick={clearFilters} className="text-xs text-accent underline underline-offset-4">
                      Clear all
                    </button>
                  )}
                </div>
                {renderFilters('side')}
              </div>
            </aside>

            <div>
              {/* Search + sort */}
              <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <SearchIcon size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gold" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search packages or destinations"
                    aria-label="Search packages or destinations"
                    className="w-full rounded-full border border-sand bg-card py-3 pl-11 pr-4 text-sm text-charcoal outline-none transition-colors placeholder:text-muted focus:border-gold"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="btn btn-outline flex-1 !bg-card lg:hidden"
                  >
                    Filters{activeCount > 0 ? ` (${activeCount})` : ''}
                  </button>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    aria-label="Sort packages"
                    className="min-w-[11rem] flex-1 cursor-pointer rounded-full border border-sand bg-card px-4 py-3 text-sm text-charcoal outline-none focus:border-gold sm:flex-none"
                  >
                    <option value="recommended">Sort: Recommended</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="duration">Duration</option>
                  </select>
                </div>
              </div>

              <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted" aria-live="polite">
                  {filtered.length} {filtered.length === 1 ? 'package' : 'packages'} found
                </p>
                <p className="text-xs text-muted">
                  <span className="demo-badge">Demo data</span> Prices are illustrative
                </p>
              </div>

              {filtered.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((pkg, i) => (
                    <Reveal key={pkg.id} delay={(i % 3) * 70}>
                      <PackageCard pkg={pkg} />
                    </Reveal>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.4rem] border border-dashed border-sand py-16 text-center">
                  <h3 className="mb-3 font-serif text-2xl text-charcoal">No packages match these filters</h3>
                  <p className="mb-6 text-muted">Try a different search term or clear the filters.</p>
                  <button type="button" onClick={clearFilters} className="btn btn-primary">
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile filter drawer */}
      <div
        className={`fixed inset-0 z-[60] overflow-hidden transition-[visibility] duration-300 lg:hidden ${drawerOpen ? '' : 'invisible pointer-events-none'}`}
        aria-hidden={!drawerOpen}
        inert={!drawerOpen}
      >
        <div
          onClick={() => setDrawerOpen(false)}
          className={`absolute inset-0 bg-black/55 transition-opacity duration-300 motion-reduce:transition-none ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filter packages"
          className={`absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-ivory shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
            drawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-sand px-5 py-4">
            <h2 className="font-serif text-xl font-medium text-charcoal">Filters</h2>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close filters"
              className="grid h-9 w-9 place-items-center rounded-full border border-sand text-charcoal"
            >
              <CloseIcon size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-6">{renderFilters('drawer')}</div>
          <div className="flex gap-3 border-t border-sand p-4">
            <button type="button" onClick={clearFilters} className="btn btn-outline flex-1">
              Clear
            </button>
            <button type="button" onClick={() => setDrawerOpen(false)} className="btn btn-primary flex-1">
              Show {filtered.length}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
