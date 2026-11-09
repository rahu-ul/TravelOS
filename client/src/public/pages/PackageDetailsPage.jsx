import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout.jsx';
import PackageCard from '../../components/common/PackageCard.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import { ArrowRightIcon, CalendarIcon, PinIcon, StarIcon } from '../../components/ui/Icons.jsx';
import { api } from '../../api/client.js';
import { DEMO_PACKAGES } from '../../data/demoData.js';

function AccordionItem({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-sand">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-4 py-5 text-left font-serif text-lg font-medium text-charcoal transition-colors hover:text-accent"
        >
          {title}
          <span
            aria-hidden="true"
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-sand text-gold transition-transform duration-300 motion-reduce:transition-none ${
              open ? 'rotate-45' : ''
            }`}
          >
            +
          </span>
        </button>
      </h3>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="pb-5 pr-12 leading-relaxed text-muted">{children}</p>
        </div>
      </div>
    </div>
  );
}

function Tick({ tone = 'yes' }) {
  return (
    <span
      aria-hidden="true"
      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
        tone === 'yes' ? 'bg-forest text-white' : 'bg-sand text-muted'
      }`}
    >
      {tone === 'yes' ? '✓' : '–'}
    </span>
  );
}

export default function PackageDetailsPage() {
  const { slug } = useParams();
  const [pkg, setPkg] = useState(() => DEMO_PACKAGES.find((p) => p.slug === slug) || null);
  const [loading, setLoading] = useState(!pkg);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    api.get(`/packages/${slug}`)
      .then((res) => {
        if (active && res.data?.data?.package) {
          setPkg(res.data.data.package);
          setNotFound(false);
        }
      })
      .catch((err) => {
        if (active) {
          const fallback = DEMO_PACKAGES.find((p) => p.slug === slug);
          if (fallback) {
            setPkg(fallback);
          } else {
            setNotFound(true);
          }
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [slug]);

  const [activeImage, setActiveImage] = useState(0);
  const [guests, setGuests] = useState(2);

  if (notFound) return <Navigate to="/packages" replace />;
  if (loading && !pkg) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center bg-ivory">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sand border-t-gold" />
        </div>
      </Layout>
    );
  }
  if (!pkg) return <Navigate to="/packages" replace />;

  const related = (pkg.related && pkg.related.length > 0)
    ? pkg.related
    : DEMO_PACKAGES.filter((p) => p.id !== pkg.id && p.region === pkg.region).slice(0, 3);

  const rawGallery = pkg.gallery && pkg.gallery.length > 0
    ? pkg.gallery.map((g) => (typeof g === 'string' ? g : g.url))
    : [(pkg.heroImage?.url || pkg.image || '/images/kerala-card.jpg')];
  const gallery = rawGallery.filter(Boolean);

  const basePrice = pkg.startingPrice;
  const priceLabel = pkg.priceLabel || (basePrice ? `₹${Number(basePrice).toLocaleString('en-IN')}` : null);
  const priceNote = pkg.priceNote || 'Per person twin-sharing (5% GST extra)';
  const totalPrice = basePrice ? basePrice * guests : null;
  const durationLabel = pkg.duration || (pkg.durationDays ? `${pkg.durationDays} Days / ${pkg.nights || Math.max(1, pkg.durationDays - 1)} Nights` : null);
  const overviewText = pkg.overview || pkg.description || pkg.summary || '';
  const includedList = pkg.included || pkg.inclusions || [];
  const notIncludedList = pkg.notIncluded || pkg.exclusions || [];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    pkg.itinerary?.length > 0 && { id: 'itinerary', label: 'Itinerary' },
    (includedList.length > 0 || notIncludedList.length > 0) && { id: 'inclusions', label: 'Inclusions' },
    pkg.seasons?.length > 0 && { id: 'pricing', label: 'Pricing' },
  ].filter(Boolean);

  return (
    <Layout>
      <div className="bg-ivory pt-16 md:pt-20">
        <div className="container-site pb-14 pt-5 md:pb-20">
          <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-xs text-muted">
            <Link to="/" className="transition-colors hover:text-accent">Home</Link>
            <span className="text-gold">/</span>
            <Link to="/packages" className="transition-colors hover:text-accent">Packages</Link>
            <span className="text-gold">/</span>
            <span className="text-charcoal">{pkg.name}</span>
          </nav>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_22rem] xl:grid-cols-[1fr_24rem]">
            {/* ── Left column ───────────────────────────────────────── */}
            <div className="min-w-0">
              <header className="mb-6">
                <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
                  <span className="inline-flex items-center gap-1.5"><PinIcon size={16} className="text-gold" />{pkg.destination}</span>
                  {durationLabel && <span className="inline-flex items-center gap-1.5"><CalendarIcon size={16} className="text-gold" />{durationLabel}</span>}
                  {pkg.hotelCategory && <span className="inline-flex items-center gap-1.5"><StarIcon size={14} className="text-gold" />{pkg.hotelCategory} stays</span>}
                  {pkg.isDemo && <span className="demo-badge">Demo package</span>}
                </div>
                <h1 className="font-serif text-3xl font-medium leading-[1.1] tracking-tight text-charcoal md:text-5xl">
                  {pkg.name}
                </h1>
              </header>

              {/* Gallery */}
              <div className="overflow-hidden rounded-[1.75rem] shadow-[var(--shadow-md)]">
                <div className="relative aspect-[16/10] bg-sand">
                  <img
                    key={gallery[activeImage]}
                    src={gallery[activeImage]}
                    alt={`${pkg.name}, photo ${activeImage + 1} of ${gallery.length}`}
                    className="page-in h-full w-full object-cover"
                  />
                </div>
              </div>
              {gallery.length > 1 && (
                <div className="mt-3 flex gap-3 overflow-x-auto pb-1" role="group" aria-label="Gallery thumbnails">
                  {gallery.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      aria-label={`Show photo ${i + 1}`}
                      aria-pressed={activeImage === i}
                      className={`h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                        activeImage === i ? 'border-gold' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Section tabs */}
              <nav
                aria-label="Package sections"
                className="sticky top-16 z-20 -mx-4 mt-8 flex gap-1 overflow-x-auto border-b border-sand bg-ivory/95 px-4 backdrop-blur md:top-20 sm:mx-0 sm:px-0"
              >
                {tabs.map((t) => (
                  <a
                    key={t.id}
                    href={`#${t.id}`}
                    className="whitespace-nowrap border-b-2 border-transparent px-4 py-3.5 text-sm font-medium text-muted transition-colors hover:border-gold hover:text-charcoal"
                  >
                    {t.label}
                  </a>
                ))}
              </nav>

              <div className="space-y-14 pt-10">
                <section id="overview" className="scroll-mt-40">
                  <h2 className="mb-4 font-serif text-2xl font-medium text-charcoal md:text-3xl">About this journey</h2>
                  <p className="max-w-3xl text-lg leading-relaxed text-muted">{overviewText}</p>

                  {pkg.highlights && (
                    <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                      {pkg.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-3 rounded-2xl border border-sand bg-card p-4 text-sm leading-relaxed text-charcoal">
                          <Tick />
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {pkg.itinerary?.length > 0 && (
                  <section id="itinerary" className="scroll-mt-40">
                    <h2 className="mb-2 font-serif text-2xl font-medium text-charcoal md:text-3xl">Day-by-day itinerary</h2>
                    <div className="border-t border-sand">
                      {pkg.itinerary.map((day, i) => (
                        <AccordionItem key={day.day} title={`Day ${day.day}: ${day.title}`} defaultOpen={i === 0}>
                          {day.description}
                        </AccordionItem>
                      ))}
                    </div>
                  </section>
                )}

                {(includedList.length > 0 || notIncludedList.length > 0) && (
                  <section id="inclusions" className="scroll-mt-40">
                    <h2 className="mb-6 font-serif text-2xl font-medium text-charcoal md:text-3xl">What&rsquo;s included</h2>
                    <div className="grid gap-5 md:grid-cols-2">
                      {includedList.length > 0 && (
                        <div className="rounded-[1.4rem] border border-sand bg-card p-6">
                          <h3 className="mb-4 font-serif text-lg font-medium text-charcoal">Included</h3>
                          <ul className="space-y-3">
                            {includedList.map((item, i) => (
                              <li key={i} className="flex items-start gap-3 text-sm text-muted"><Tick />{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {notIncludedList.length > 0 && (
                        <div className="rounded-[1.4rem] border border-sand bg-card p-6">
                          <h3 className="mb-4 font-serif text-lg font-medium text-charcoal">Not included</h3>
                          <ul className="space-y-3">
                            {notIncludedList.map((item, i) => (
                              <li key={i} className="flex items-start gap-3 text-sm text-muted"><Tick tone="no" />{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {pkg.seasons?.length > 0 && (
                  <section id="pricing" className="scroll-mt-40">
                    <h2 className="mb-6 font-serif text-2xl font-medium text-charcoal md:text-3xl">Seasonal pricing</h2>
                    <div className="overflow-hidden rounded-[1.4rem] border border-sand bg-card">
                      {pkg.seasons.map((s, i) => (
                        <div key={i} className="flex items-center justify-between gap-4 border-b border-sand px-6 py-4 last:border-0">
                          <span className="text-charcoal">{s.label || s.name}</span>
                          <span className="font-serif text-xl font-semibold text-accent">
                            {s.pricePerPerson ? `₹${Number(s.pricePerPerson).toLocaleString('en-IN')}` : 'Price on request'}
                            {s.pricePerPerson && <span className="ml-1 text-xs font-normal text-muted">per person</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-muted">All prices are per person on twin-sharing basis (5% GST extra).</p>
                  </section>
                )}
              </div>
            </div>

            {/* ── Sticky enquiry card ───────────────────────────────── */}
            <aside>
              <div className="overflow-hidden rounded-[1.75rem] border border-sand bg-card shadow-[var(--shadow-lg)] lg:sticky lg:top-28">
                <div className="bg-forest p-6 text-white">
                  {pkg.startingPrice ? (
                    <>
                      <p className="mb-1 text-sm text-white/70">Starting from</p>
                      <p className="font-serif text-4xl font-medium text-gold">{priceLabel}</p>
                      <p className="mt-1 text-xs text-white/70">{priceNote}</p>
                    </>
                  ) : (
                    <>
                      <p className="mb-1 text-sm text-white/70">Pricing</p>
                      <p className="font-serif text-3xl font-medium text-gold">Price on request</p>
                      <p className="mt-1 text-xs text-white/70">Contact us for a personalised quote</p>
                    </>
                  )}
                </div>

                <div className="space-y-5 p-6">
                  {pkg.startingPrice && (
                    <div className="rounded-2xl bg-ivory p-4">
                      <p className="mb-3 text-sm font-semibold text-charcoal">Quick estimate</p>
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm text-muted">Guests</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setGuests((g) => Math.max(1, g - 1))}
                            aria-label="Remove a guest"
                            className="grid h-8 w-8 place-items-center rounded-full border border-sand bg-card text-charcoal transition-colors hover:border-gold"
                          >
                            −
                          </button>
                          <span className="w-5 text-center text-sm font-semibold text-charcoal" aria-live="polite">{guests}</span>
                          <button
                            type="button"
                            onClick={() => setGuests((g) => Math.min(20, g + 1))}
                            aria-label="Add a guest"
                            className="grid h-8 w-8 place-items-center rounded-full border border-sand bg-card text-charcoal transition-colors hover:border-gold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-sand pt-3">
                        <span className="text-sm text-charcoal">Estimated total</span>
                        <span className="font-serif text-xl font-semibold text-accent">₹{totalPrice?.toLocaleString('en-IN')}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted">Demo estimate only. Actual pricing varies.</p>
                    </div>
                  )}

                  <Link to={`/contact?package=${pkg.slug}`} className="btn btn-primary w-full">
                    Enquire about this package
                    <ArrowRightIcon size={16} />
                  </Link>
                  <Link to="/contact" className="btn btn-outline w-full">
                    Talk to a travel expert
                  </Link>
                  <p className="text-center text-xs text-muted">Free consultation, no obligation</p>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {related.length > 0 && (
          <section className="bg-cream py-14 md:py-20">
            <div className="container-site">
              <Reveal>
                <h2 className="mb-8 font-serif text-3xl font-medium tracking-tight text-charcoal">More inspiring journeys</h2>
              </Reveal>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {related.map((p, i) => (
                  <Reveal key={p.id} delay={i * 80}>
                    <PackageCard pkg={p} />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
