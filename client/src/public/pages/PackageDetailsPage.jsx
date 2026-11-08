import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout.jsx';
import PackageCard from '../../components/common/PackageCard.jsx';
import { DEMO_PACKAGES } from '../../data/demoData.js';

function AccordionItem({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-sand/60">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between w-full py-4 text-left text-sm font-semibold text-charcoal hover:text-forest transition-colors"
      >
        {title}
        <span className={`text-muted text-lg transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <div className="pb-4 text-sm text-charcoal/70 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

export default function PackageDetailsPage() {
  const { slug } = useParams();
  const pkg = DEMO_PACKAGES.find((p) => p.slug === slug);

  const [activeImage, setActiveImage] = useState(0);
  const [guests, setGuests] = useState(2);

  if (!pkg) return <Navigate to="/packages" replace />;

  const related = DEMO_PACKAGES.filter((p) => p.id !== pkg.id && p.region === pkg.region).slice(0, 3);

  const gallery = pkg.gallery || [pkg.image];
  const basePrice = pkg.startingPrice;
  const totalPrice = basePrice ? basePrice * guests : null;

  return (
    <Layout>
      <div className="pt-16 md:pt-20">
        {/* Breadcrumb */}
        <div className="container-site py-4">
          <nav className="flex items-center gap-2 text-xs text-muted">
            <Link to="/" className="hover:text-forest transition-colors">Home</Link>
            <span>/</span>
            <Link to="/packages" className="hover:text-forest transition-colors">Packages</Link>
            <span>/</span>
            <span className="text-charcoal">{pkg.name}</span>
          </nav>
        </div>

        {/* Hero image */}
        <div className="relative h-72 md:h-96 overflow-hidden">
          <img
            src={gallery[activeImage]}
            alt={pkg.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Badges */}
          <div className="absolute top-5 left-5 flex gap-2">
            {pkg.isDemo && <span className="demo-badge">Demo Package</span>}
            <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-charcoal">
              {pkg.hotelCategory}
            </span>
          </div>

          {/* Title overlay on mobile */}
          <div className="absolute bottom-5 left-5 md:hidden">
            <h1 className="font-serif text-2xl text-white">{pkg.name}</h1>
          </div>
        </div>

        {/* Gallery thumbnails */}
        {gallery.length > 1 && (
          <div className="container-site py-4">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    activeImage === i ? 'border-forest' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="container-site py-6 md:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left: Details */}
            <div className="lg:col-span-2 space-y-10">
              {/* Title (desktop) */}
              <div className="hidden md:block">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 text-sm text-muted mb-2">
                      <span className="text-olive font-medium">{pkg.destination}</span>
                      <span>·</span>
                      <span>{pkg.duration}</span>
                      <span>·</span>
                      <span>{pkg.hotelCategory}</span>
                    </div>
                    <h1 className="font-serif text-3xl md:text-4xl text-charcoal">{pkg.name}</h1>
                  </div>
                </div>
              </div>

              {/* Overview */}
              <div>
                <h2 className="font-serif text-xl text-charcoal mb-3">Overview</h2>
                <p className="text-charcoal/70 leading-relaxed">{pkg.overview}</p>
              </div>

              {/* Highlights */}
              {pkg.highlights && (
                <div>
                  <h2 className="font-serif text-xl text-charcoal mb-4">What's Included in Your Tour Plan</h2>
                  <ul className="space-y-2.5">
                    {pkg.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-charcoal/75">
                        <span className="text-forest mt-0.5 flex-shrink-0">✓</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Itinerary */}
              {pkg.itinerary && (
                <div>
                  <h2 className="font-serif text-xl text-charcoal mb-4">Day-by-Day Itinerary</h2>
                  <div className="space-y-1">
                    {pkg.itinerary.map((day) => (
                      <AccordionItem key={day.day} title={`Day ${day.day}: ${day.title}`}>
                        {day.description}
                      </AccordionItem>
                    ))}
                  </div>
                </div>
              )}

              {/* Inclusions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pkg.included && (
                  <div>
                    <h3 className="font-semibold text-sm text-charcoal mb-3 flex items-center gap-2">
                      <span className="text-forest">✓</span> What's included
                    </h3>
                    <ul className="space-y-1.5">
                      {pkg.included.map((item, i) => (
                        <li key={i} className="text-sm text-charcoal/65 flex items-start gap-2">
                          <span className="text-green-500 mt-0.5 flex-shrink-0">●</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {pkg.notIncluded && (
                  <div>
                    <h3 className="font-semibold text-sm text-charcoal mb-3 flex items-center gap-2">
                      <span className="text-red-400">✗</span> Not included
                    </h3>
                    <ul className="space-y-1.5">
                      {pkg.notIncluded.map((item, i) => (
                        <li key={i} className="text-sm text-charcoal/65 flex items-start gap-2">
                          <span className="text-red-300 mt-0.5 flex-shrink-0">●</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Booking widget */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white rounded-2xl shadow-md border border-sand/60 overflow-hidden">
                {/* Price */}
                <div className="bg-forest p-5 text-white">
                  {pkg.startingPrice ? (
                    <>
                      <p className="text-xs text-white/60 mb-1">Starting from</p>
                      <p className="font-serif text-3xl font-bold">{pkg.priceLabel}</p>
                      <p className="text-xs text-white/60 mt-1">{pkg.priceNote}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-white/60 mb-1">Pricing</p>
                      <p className="font-serif text-2xl font-bold">Price on Request</p>
                      <p className="text-xs text-white/60 mt-1">Contact us for a personalised quote</p>
                    </>
                  )}
                </div>

                <div className="p-5 space-y-4">
                  {/* Seasons */}
                  {pkg.seasons && pkg.seasons.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Seasonal Pricing</p>
                      {pkg.seasons.map((s, i) => (
                        <div key={i} className="flex justify-between items-center text-sm py-1.5 border-b border-sand/40 last:border-0">
                          <span className="text-charcoal/70">{s.label}</span>
                          <span className="font-semibold text-forest">
                            ₹{s.pricePerPerson.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                      <p className="text-xs text-muted mt-2">* All prices are per person, illustrative demo rates</p>
                    </div>
                  )}

                  {/* Guest calculator */}
                  {pkg.startingPrice && (
                    <div className="bg-ivory rounded-xl p-4">
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Quick Estimate</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-charcoal">Guests</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setGuests((g) => Math.max(1, g - 1))}
                            className="w-7 h-7 rounded-full border border-sand flex items-center justify-center text-charcoal hover:border-forest hover:text-forest transition-colors text-sm"
                          >
                            −
                          </button>
                          <span className="text-sm font-semibold w-4 text-center">{guests}</span>
                          <button
                            onClick={() => setGuests((g) => Math.min(20, g + 1))}
                            className="w-7 h-7 rounded-full border border-sand flex items-center justify-center text-charcoal hover:border-forest hover:text-forest transition-colors text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-sand/60">
                        <span className="text-sm text-charcoal">Estimated Total</span>
                        <span className="font-serif text-lg font-bold text-forest">
                          ₹{totalPrice?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-1">Demo estimate only. Actual pricing varies.</p>
                    </div>
                  )}

                  {/* CTA */}
                  <Link
                    to={`/contact?package=${pkg.slug}`}
                    className="block w-full bg-forest text-white font-semibold py-3.5 rounded-xl text-center hover:bg-forest-dark transition-colors text-sm"
                  >
                    Enquire About This Package
                  </Link>

                  <Link
                    to="/contact"
                    className="block w-full border border-forest/30 text-forest font-medium py-3 rounded-xl text-center hover:bg-forest/5 transition-colors text-sm"
                  >
                    Talk to a Travel Expert
                  </Link>

                  <p className="text-center text-xs text-muted">
                    Free consultation · No obligation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related packages */}
        {related.length > 0 && (
          <section className="bg-cream py-14 md:py-20">
            <div className="container-site">
              <h2 className="font-serif text-2xl md:text-3xl text-charcoal mb-8">More Inspiring Journeys</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {related.map((p) => (
                  <PackageCard key={p.id} pkg={p} />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}

