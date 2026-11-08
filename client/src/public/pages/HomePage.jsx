import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout.jsx';
import SectionHeading from '../../components/common/SectionHeading.jsx';
import PackageCard from '../../components/common/PackageCard.jsx';
import DestinationCard from '../../components/common/DestinationCard.jsx';
import StoryCard from '../../components/common/StoryCard.jsx';
import {
  DEMO_DESTINATIONS,
  DEMO_PACKAGES,
  DEMO_STORIES,
  DEMO_TESTIMONIALS,
  WHY_TRAVELOS,
  EXPERIENCES,
} from '../../data/demoData.js';

// ─── Hero Search Widget ───────────────────────────────────────────────────────
function HeroSearch() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [month, setMonth] = useState('');
  const [travellers, setTravellers] = useState('2');

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (month) params.set('month', MONTHS.indexOf(month) + 1);
    if (travellers) params.set('travellers', travellers);
    navigate(`/packages?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-4 md:p-5 flex flex-col md:flex-row gap-3 md:gap-0 md:divide-x divide-sand/60"
    >
      {/* Destination */}
      <div className="flex-1 md:px-4 first:pl-0">
        <label className="block text-xs font-semibold text-olive uppercase tracking-wider mb-1">
          Destination
        </label>
        <select
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="w-full text-sm text-charcoal bg-transparent outline-none cursor-pointer"
        >
          <option value="">Any destination</option>
          {DEMO_DESTINATIONS.map((d) => (
            <option key={d.id} value={d.name}>{d.name}</option>
          ))}
          <option value="Ooty">Ooty</option>
          <option value="Madurai">Madurai</option>
        </select>
      </div>

      {/* Month */}
      <div className="flex-1 md:px-4">
        <label className="block text-xs font-semibold text-olive uppercase tracking-wider mb-1">
          Month
        </label>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full text-sm text-charcoal bg-transparent outline-none cursor-pointer"
        >
          <option value="">Any month</option>
          {MONTHS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Travellers */}
      <div className="flex-1 md:px-4">
        <label className="block text-xs font-semibold text-olive uppercase tracking-wider mb-1">
          Travellers
        </label>
        <select
          value={travellers}
          onChange={(e) => setTravellers(e.target.value)}
          className="w-full text-sm text-charcoal bg-transparent outline-none cursor-pointer"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <option key={n} value={n}>{n} {n === 1 ? 'Traveller' : 'Travellers'}</option>
          ))}
          <option value="9+">9+ Travellers (Group)</option>
        </select>
      </div>

      {/* Search button */}
      <div className="md:pl-4 flex items-end">
        <button
          type="submit"
          className="w-full md:w-auto bg-forest text-white font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-forest-dark transition-colors whitespace-nowrap"
        >
          Explore Packages
        </button>
      </div>
    </form>
  );
}

// ─── Testimonial Card ─────────────────────────────────────────────────────────
function TestimonialCard({ testimonial }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-sand/60">
      {/* Stars */}
      <div className="flex gap-0.5 mb-4">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <span key={i} className="text-amber-400 text-sm">★</span>
        ))}
      </div>

      <p className="text-charcoal/75 text-sm leading-relaxed mb-5">
        "{testimonial.text}"
      </p>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-forest/10 flex items-center justify-center text-forest font-semibold text-sm flex-shrink-0">
          {testimonial.initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-charcoal">{testimonial.name}</p>
          <p className="text-xs text-muted">{testimonial.location}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-olive italic">Package: {testimonial.package}</p>
      {testimonial.isDemo && (
        <p className="mt-1.5">
          <span className="demo-badge">Illustrative demo review</span>
        </p>
      )}
    </div>
  );
}

// ─── Main HomePage ────────────────────────────────────────────────────────────
export default function HomePage() {
  const [activeExperience, setActiveExperience] = useState(EXPERIENCES[0]);

  const featuredPackages = DEMO_PACKAGES.slice(0, 4);
  const featuredStories = DEMO_STORIES.slice(0, 3);

  return (
    <Layout>
      {/* ── A. HERO ───────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="/images/hero-kerala.jpg"
            alt="Kerala backwaters at sunset"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>

        {/* Hero content */}
        <div className="relative container-site pt-28 pb-16 md:pt-36 md:pb-24">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <p className="inline-flex items-center gap-2 text-white/70 text-xs font-semibold uppercase tracking-widest mb-5">
              <span className="w-6 h-px bg-white/40 inline-block" />
              Kerala &amp; South India
              <span className="w-6 h-px bg-white/40 inline-block" />
            </p>

            {/* Heading */}
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-white leading-tight mb-5">
              Discover the<br />
              <em className="not-italic text-sand">Soul of South</em><br />
              India
            </h1>

            <p className="text-white/70 text-base md:text-lg leading-relaxed mb-8 max-w-lg">
              Curated journeys through Kerala's backwaters, misty hill stations,
              ancient temples, and pristine beaches — crafted for the discerning traveller.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link
                to="/packages"
                className="inline-flex items-center justify-center gap-2 bg-forest text-white font-semibold px-7 py-3.5 rounded-full hover:bg-forest-dark transition-colors text-sm"
              >
                Explore Packages
                <span>→</span>
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 border border-white/40 text-white font-semibold px-7 py-3.5 rounded-full hover:bg-white/10 transition-colors text-sm backdrop-blur-sm"
              >
                Plan Your Journey
              </Link>
            </div>

            {/* Search widget */}
            <HeroSearch />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-white/40 text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-white/20" />
        </div>
      </section>

      {/* ── B. BRAND INTRO ───────────────────────────────────────────────── */}
      <section className="section-padding bg-cream">
        <div className="container-site">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-olive mb-4">
                Our Philosophy
              </p>
              <h2 className="font-serif text-4xl md:text-5xl text-charcoal leading-tight mb-6">
                Travel the way<br />
                <em className="not-italic text-forest">Kerala intended</em>
              </h2>
              <div className="space-y-4 text-charcoal/65 leading-relaxed">
                <p>
                  TravelOS was founded in Kochi by a team of passionate Kerala natives who
                  wanted travellers to experience the region the way locals do — not through
                  the window of a tour bus, but immersed in its landscapes, its people, and
                  its extraordinary cuisine.
                </p>
                <p>
                  Every itinerary we craft begins with a conversation. We ask where you've
                  been, what moved you, and what you're searching for. Then we build something
                  that only Kerala — in all its layered beauty — can deliver.
                </p>
              </div>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 mt-7 text-forest font-semibold text-sm hover:gap-3 transition-all"
              >
                About TravelOS <span>→</span>
              </Link>
            </div>

            {/* Image composition */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden aspect-[4/5]">
                <img
                  src="/images/seed/kerala-houseboat.jpg"
                  alt="Kerala houseboat on the backwaters"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              {/* Floating stat card */}
              <div className="absolute -bottom-5 -left-5 bg-white rounded-xl shadow-lg p-4 border border-sand/60">
                <p className="text-3xl font-serif font-bold text-forest">12+</p>
                <p className="text-xs text-muted mt-0.5">Years of expertise</p>
              </div>
              <div className="absolute top-6 -right-5 bg-forest text-white rounded-xl p-4 shadow-lg">
                <p className="text-2xl font-serif font-bold">500+</p>
                <p className="text-xs text-white/70 mt-0.5">Happy travellers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── C. DESTINATIONS ──────────────────────────────────────────────── */}
      <section className="section-padding bg-ivory">
        <div className="container-site">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-14">
            <SectionHeading
              eyebrow="Where to go"
              title="Kerala's Finest Destinations"
              subtitle="From mist-covered hills to sun-drenched beaches — each corner of Kerala tells a different story."
            />
            <Link
              to="/destinations"
              className="flex-shrink-0 inline-flex items-center gap-2 text-forest font-semibold text-sm border border-forest/30 px-5 py-2.5 rounded-full hover:bg-forest hover:text-white transition-colors"
            >
              All Destinations →
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {DEMO_DESTINATIONS.slice(0, 4).map((dest) => (
              <DestinationCard key={dest.id} destination={dest} />
            ))}
          </div>
        </div>
      </section>

      {/* ── D. FEATURED PACKAGES ─────────────────────────────────────────── */}
      <section className="section-padding bg-cream">
        <div className="container-site">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-14">
            <SectionHeading
              eyebrow="Curated for you"
              title="Featured Packages"
              subtitle="Handpicked itineraries designed by our travel experts for an unforgettable South India experience."
            />
            <Link
              to="/packages"
              className="flex-shrink-0 inline-flex items-center gap-2 text-forest font-semibold text-sm border border-forest/30 px-5 py-2.5 rounded-full hover:bg-forest hover:text-white transition-colors"
            >
              All Packages →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredPackages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </div>
      </section>

      {/* ── E. WHY TRAVELOS ──────────────────────────────────────────────── */}
      <section className="section-padding bg-forest">
        <div className="container-site">
          <SectionHeading
            eyebrow="Why TravelOS"
            title="Crafted with care. Delivered with expertise."
            subtitle="We're not a booking platform. We're your dedicated travel partner for Kerala and South India."
            light
            centered
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-2">
            {WHY_TRAVELOS.map((item) => (
              <div
                key={item.title}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
              >
                <div className="text-3xl text-sand mb-4">{item.icon}</div>
                <h3 className="font-serif text-white text-lg mb-3">{item.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── F. EXPERIENCES ───────────────────────────────────────────────── */}
      <section className="section-padding bg-ivory">
        <div className="container-site">
          <SectionHeading
            eyebrow="Experiences"
            title="Every kind of Kerala journey"
            subtitle="Whether you seek serenity on the backwaters, adventures in the forest, or cultural immersions in ancient temples."
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Tab navigation */}
            <div className="flex flex-col gap-2">
              {EXPERIENCES.map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => setActiveExperience(exp)}
                  className={`flex items-center gap-4 text-left p-4 rounded-xl transition-all ${activeExperience.id === exp.id
                      ? 'bg-forest text-white shadow-md'
                      : 'hover:bg-sand/40 text-charcoal'
                    }`}
                >
                  <span className="text-2xl w-9 text-center flex-shrink-0">{exp.icon}</span>
                  <div>
                    <p className={`font-semibold text-sm ${activeExperience.id === exp.id ? 'text-white' : 'text-charcoal'}`}>
                      {exp.label}
                    </p>
                    <p className={`text-xs mt-0.5 ${activeExperience.id === exp.id ? 'text-white/70' : 'text-muted'}`}>
                      {exp.description}
                    </p>
                  </div>
                  {activeExperience.id === exp.id && (
                    <span className="ml-auto text-white/60 text-sm">→</span>
                  )}
                </button>
              ))}
            </div>

            {/* Featured image */}
            <div className="sticky top-24 rounded-2xl overflow-hidden aspect-[4/3] shadow-lg">
              <img
                src={activeExperience.image}
                alt={activeExperience.label}
                className="w-full h-full object-cover transition-opacity duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-6 left-6">
                <p className="text-white font-serif text-2xl">{activeExperience.label}</p>
                <p className="text-white/70 text-sm mt-1">{activeExperience.description}</p>
              </div>
              <Link
                to={`/packages?experience=${activeExperience.id}`}
                className="absolute bottom-6 right-6 bg-white/15 backdrop-blur-sm border border-white/30 text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-white hover:text-charcoal transition-colors"
              >
                Explore →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── G. TRAVEL STORIES ────────────────────────────────────────────── */}
      <section className="section-padding bg-cream">
        <div className="container-site">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-14">
            <SectionHeading
              eyebrow="Travel Stories"
              title="From the Field"
              subtitle="Real accounts from real journeys — the people, the places, and the moments that make Kerala unforgettable."
            />
            <Link
              to="/stories"
              className="flex-shrink-0 inline-flex items-center gap-2 text-forest font-semibold text-sm border border-forest/30 px-5 py-2.5 rounded-full hover:bg-forest hover:text-white transition-colors"
            >
              All Stories →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </div>
      </section>

      {/* ── H. TESTIMONIALS ──────────────────────────────────────────────── */}
      <section className="section-padding bg-ivory">
        <div className="container-site">
          <SectionHeading
            eyebrow="What travellers say"
            title="Voices from the journey"
            subtitle="These are illustrative sample reviews — representative of the experiences we strive to deliver."
            centered
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {DEMO_TESTIMONIALS.map((t) => (
              <TestimonialCard key={t.id} testimonial={t} />
            ))}
          </div>

          <p className="text-center text-xs text-muted mt-6">
            * All reviews shown are illustrative demo content.
          </p>
        </div>
      </section>

      {/* ── I. FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/seed/kerala-sunset.jpg"
            alt="Kerala sunset"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-forest/80" />
        </div>

        <div className="relative container-site text-center">
          <p className="text-olive text-xs font-semibold uppercase tracking-widest mb-4">
            Your journey begins here
          </p>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-6 leading-tight">
            Ready to discover<br />Kerala?
          </h2>
          <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Share your travel dates and preferences. Our Kerala experts will craft
            a personalised itinerary within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 bg-white text-forest font-semibold px-8 py-4 rounded-full hover:bg-sand transition-colors"
            >
              Start Planning →
            </Link>
            <Link
              to="/packages"
              className="inline-flex items-center justify-center gap-2 border border-white/40 text-white font-semibold px-8 py-4 rounded-full hover:bg-white/10 transition-colors backdrop-blur-sm"
            >
              Browse Packages
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
