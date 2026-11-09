import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout.jsx';
import SectionHeading from '../../components/common/SectionHeading.jsx';
import PackageCard from '../../components/common/PackageCard.jsx';
import DestinationCard from '../../components/common/DestinationCard.jsx';
import StoryCard from '../../components/common/StoryCard.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import { api } from '../../api/client.js';
import {
  ArrowRightIcon,
  CalendarIcon,
  CompassIcon,
  HeadsetIcon,
  LeafIcon,
  PinIcon,
  SearchIcon,
  ShieldIcon,
  StarIcon,
  TagIcon,
  UsersIcon,
} from '../../components/ui/Icons.jsx';
import {
  DEMO_DESTINATIONS,
  DEMO_PACKAGES,
  DEMO_STORIES,
  DEMO_TESTIMONIALS,
  WHY_TRAVELOS,
  EXPERIENCES,
} from '../../data/demoData.js';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const TRUST = [
  { icon: LeafIcon, title: 'Handpicked stays', note: 'Chosen by people who live here' },
  { icon: PinIcon, title: 'Local experts', note: 'Born and based in Kochi' },
  { icon: HeadsetIcon, title: 'Personal consultant', note: 'One contact, start to finish' },
  { icon: ShieldIcon, title: 'Transparent pricing', note: 'Full breakdown before you pay' },
];

const WHY_ICONS = [CompassIcon, TagIcon, PinIcon, HeadsetIcon];

// ─── Search card (floats over the bottom edge of the hero) ────────────────────
function SearchField({ id, label, icon: Icon, children }) {
  return (
    <div className="flex flex-1 items-center gap-3 px-1 md:px-5">
      <Icon size={20} className="shrink-0 text-gold" />
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block text-xs font-medium text-muted">
          {label}
        </label>
        {children}
      </div>
    </div>
  );
}

function HeroSearch() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [month, setMonth] = useState('');
  const [travellers, setTravellers] = useState('2');

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (month) params.set('month', MONTHS.indexOf(month) + 1);
    if (travellers) params.set('travellers', travellers);
    navigate(`/packages?${params.toString()}`);
  };

  const selectClass =
    'w-full cursor-pointer appearance-none bg-transparent py-0.5 text-[15px] font-medium text-charcoal outline-none';

  return (
    <form
      onSubmit={handleSearch}
      aria-label="Find a journey"
      className="themed flex flex-col gap-4 rounded-[1.75rem] border border-sand bg-card p-4 shadow-[var(--shadow-lg)] md:flex-row md:items-center md:gap-0 md:p-5 md:[&>*+*]:border-l md:[&>*+*]:border-sand"
    >
      <SearchField id="hs-destination" label="Destination" icon={PinIcon}>
        <select id="hs-destination" value={destination} onChange={(e) => setDestination(e.target.value)} className={selectClass}>
          <option value="">Any destination</option>
          {DEMO_DESTINATIONS.map((d) => (
            <option key={d.id} value={d.name}>{d.name}</option>
          ))}
          <option value="Ooty">Ooty</option>
          <option value="Madurai">Madurai</option>
        </select>
      </SearchField>

      <SearchField id="hs-month" label="Month" icon={CalendarIcon}>
        <select id="hs-month" value={month} onChange={(e) => setMonth(e.target.value)} className={selectClass}>
          <option value="">Any month</option>
          {MONTHS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </SearchField>

      <SearchField id="hs-travellers" label="Travellers" icon={UsersIcon}>
        <select id="hs-travellers" value={travellers} onChange={(e) => setTravellers(e.target.value)} className={selectClass}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <option key={n} value={n}>{n} {n === 1 ? 'traveller' : 'travellers'}</option>
          ))}
          <option value="9+">9+ travellers (group)</option>
        </select>
      </SearchField>

      <div className="md:pl-5">
        <button type="submit" className="btn btn-primary w-full md:w-auto">
          <SearchIcon size={18} />
          Find journeys
        </button>
      </div>
    </form>
  );
}

// ─── Testimonial ──────────────────────────────────────────────────────────────
function TestimonialCard({ testimonial }) {
  return (
    <figure className="flex h-full flex-col rounded-[1.4rem] border border-sand bg-card p-6 shadow-[var(--shadow-sm)]">
      <div className="mb-4 flex gap-0.5 text-gold" aria-label={`${testimonial.rating} out of 5 stars`}>
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <StarIcon key={i} size={16} />
        ))}
      </div>

      <blockquote className="mb-6 font-serif text-[1.05rem] leading-relaxed text-charcoal">
        “{testimonial.text}”
      </blockquote>

      <figcaption className="mt-auto">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand text-sm font-semibold text-accent">
            {testimonial.initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-charcoal">{testimonial.name}</p>
            <p className="text-xs text-muted">{testimonial.location}</p>
          </div>
        </div>
        <p className="mt-3 text-xs italic text-olive">Package: {testimonial.package}</p>
        {testimonial.isDemo && (
          <p className="mt-1.5">
            <span className="demo-badge">Illustrative demo review</span>
          </p>
        )}
      </figcaption>
    </figure>
  );
}

function SectionLink({ to, children }) {
  return (
    <Link to={to} className="btn btn-outline shrink-0 self-start md:self-auto">
      {children}
      <ArrowRightIcon size={16} />
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [activeExperience, setActiveExperience] = useState(EXPERIENCES[0]);
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    let active = true;
    api.get('/packages')
      .then((res) => {
        if (active && res.data?.data?.packages?.length) {
          setPackages(res.data.data.packages);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const featuredPackages = (packages.length ? packages : DEMO_PACKAGES).slice(0, 4);
  const featuredStories = DEMO_STORIES.slice(0, 3);

  return (
    <Layout>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#0B110D]">
        <div className="absolute inset-0">
          <img
            src="/images/hero-kerala-right.jpg"
            alt="A traditional Kerala houseboat on the backwaters at sunset"
            className="hero-zoom h-full w-full object-cover object-[30%_50%] md:object-[38%_50%]"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B110D]/88 via-[#0B110D]/50 to-[#0B110D]/0" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B110D]/70 via-transparent to-[#0B110D]/30" />
        </div>

        <div className="container-site relative w-full pb-52 pt-32 md:pb-56 md:pt-36">
          <div className="max-w-xl lg:max-w-2xl">
            <p className="rise-in mb-5 text-sm font-medium tracking-wide text-gold" style={{ animationDelay: '0.1s' }}>
              Kerala &amp; South India
            </p>

            <h1
              className="rise-in font-serif text-[2.85rem] font-medium leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-[4.5rem]"
              style={{ animationDelay: '0.2s' }}
            >
              Discover the Soul
              <span className="mt-1 block font-normal italic text-[#F3E9D2]">of South India.</span>
            </h1>

            <p
              className="rise-in mt-6 max-w-lg text-base leading-relaxed text-white/80 md:text-lg"
              style={{ animationDelay: '0.35s' }}
            >
              Curated journeys through Kerala&rsquo;s backwaters, misty hills, ancient temples and quiet
              beaches, planned around how you like to travel.
            </p>

            <div className="rise-in mt-9 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: '0.5s' }}>
              <Link to="/packages" className="btn btn-gold">
                Explore journeys
                <ArrowRightIcon size={16} />
              </Link>
              <Link to="/contact" className="btn btn-glass">
                Plan your trip
              </Link>
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <div className="absolute inset-x-0 bottom-24 hidden md:block">
          <div className="container-site">
            <ul className="grid grid-cols-4 divide-x divide-white/20 text-white">
              {TRUST.map(({ icon: Icon, title, note }) => (
                <li key={title} className="flex items-center gap-3 px-5 first:pl-0">
                  <Icon size={26} className="shrink-0 text-gold" />
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-white/65">{note}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── SEARCH (overlaps hero edge) ──────────────────────────────────── */}
      <div className="relative z-10 -mt-14 md:-mt-16">
        <div className="container-site">
          <HeroSearch />
        </div>
      </div>

      {/* ── PHILOSOPHY ───────────────────────────────────────────────────── */}
      <section className="section-padding bg-ivory">
        <div className="container-site">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <Reveal>
              <p className="mb-4 text-sm font-medium tracking-wide text-olive">Our philosophy</p>
              <h2 className="mb-6 font-serif text-4xl font-medium leading-[1.12] tracking-tight text-charcoal md:text-5xl">
                Travel the way
                <span className="block italic font-normal text-accent">Kerala intended</span>
              </h2>
              <div className="max-w-lg space-y-4 leading-relaxed text-muted">
                <p>
                  TravelOS was founded in Kochi by a team of Kerala natives who wanted travellers to
                  experience the region the way locals do: not through the window of a tour bus, but
                  immersed in its landscapes, its people and its extraordinary cuisine.
                </p>
                <p>
                  Every itinerary begins with a conversation. We ask where you&rsquo;ve been, what moved
                  you and what you&rsquo;re looking for, then build something only Kerala can deliver.
                </p>
              </div>
              <Link to="/about" className="btn btn-outline mt-8">
                About TravelOS
                <ArrowRightIcon size={16} />
              </Link>
            </Reveal>

            <Reveal delay={120} className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="aspect-[4/5] overflow-hidden rounded-[2rem] shadow-[var(--shadow-lg)]">
                <img
                  src="/images/seed/kerala-houseboat.jpg"
                  alt="A Kerala houseboat moored on the backwaters"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="absolute -bottom-6 -left-3 rounded-2xl border border-sand bg-card p-5 shadow-[var(--shadow-md)] sm:-left-6">
                <p className="font-serif text-3xl font-semibold text-accent">12+</p>
                <p className="mt-0.5 text-xs text-muted">Years of expertise</p>
              </div>
              <div className="absolute -right-3 top-8 rounded-2xl bg-forest p-5 text-white shadow-[var(--shadow-md)] sm:-right-6">
                <p className="font-serif text-3xl font-semibold text-gold">500+</p>
                <p className="mt-0.5 text-xs text-white/75">Happy travellers</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── DESTINATIONS ─────────────────────────────────────────────────── */}
      <section className="section-padding bg-cream">
        <div className="container-site">
          <Reveal className="mb-10 flex flex-col justify-between gap-6 md:mb-14 md:flex-row md:items-end">
            <SectionHeading
              flush
              eyebrow="Where to go"
              title="Kerala's finest destinations"
              subtitle="From mist-covered hills to sun-drenched beaches, each corner of Kerala tells a different story."
            />
            <div><SectionLink to="/destinations">All destinations</SectionLink></div>
          </Reveal>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
            {DEMO_DESTINATIONS.slice(0, 4).map((dest, i) => (
              <Reveal key={dest.id} delay={i * 80}>
                <DestinationCard destination={dest} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PACKAGES ────────────────────────────────────────────── */}
      <section className="section-padding bg-ivory">
        <div className="container-site">
          <Reveal className="mb-10 flex flex-col justify-between gap-6 md:mb-14 md:flex-row md:items-end">
            <SectionHeading
              flush
              eyebrow="Curated for you"
              title="Featured journeys"
              subtitle="Handpicked itineraries designed by our travel experts for an unforgettable South India experience."
            />
            <div><SectionLink to="/packages">All packages</SectionLink></div>
          </Reveal>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredPackages.map((pkg, i) => (
              <Reveal key={pkg.id} delay={i * 80}>
                <PackageCard pkg={pkg} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY TRAVELOS ─────────────────────────────────────────────────── */}
      <section className="section-padding bg-forest">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow="Why TravelOS"
              title="Crafted with care. Delivered with expertise."
              subtitle="We're not a booking platform. We're your dedicated travel partner for Kerala and South India."
              light
              centered
            />
          </Reveal>

          <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_TRAVELOS.map((item, i) => {
              const Icon = WHY_ICONS[i % WHY_ICONS.length];
              return (
                <Reveal key={item.title} delay={i * 80}>
                  <div className="h-full rounded-[1.4rem] border border-white/12 bg-white/[0.05] p-6 transition-colors duration-300 hover:bg-white/[0.09]">
                    <span className="mb-5 grid h-12 w-12 place-items-center rounded-full border border-gold/40 text-gold">
                      <Icon size={22} />
                    </span>
                    <h3 className="mb-3 font-serif text-xl font-medium text-white">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-white/70">{item.description}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── EXPERIENCES ──────────────────────────────────────────────────── */}
      <section className="section-padding bg-ivory">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow="Signature experiences"
              title="Every kind of Kerala journey"
              subtitle="Whether you seek serenity on the backwaters, adventure in the forest or cultural immersion in ancient temples."
            />
          </Reveal>

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col gap-2" role="group" aria-label="Choose an experience">
              {EXPERIENCES.map((exp) => {
                const active = activeExperience.id === exp.id;
                return (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => setActiveExperience(exp)}
                    aria-pressed={active}
                    className={`group flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-300 motion-reduce:transition-none ${
                      active
                        ? 'border-gold/70 bg-card shadow-[var(--shadow-md)]'
                        : 'border-transparent hover:border-sand hover:bg-card/60'
                    }`}
                  >
                    <span
                      className={`h-10 w-1 shrink-0 rounded-full transition-colors ${active ? 'bg-gold' : 'bg-sand'}`}
                      aria-hidden="true"
                    />
                    <span className="flex-1">
                      <span className="block font-serif text-xl font-medium text-charcoal">{exp.label}</span>
                      <span className="mt-0.5 block text-sm text-muted">{exp.description}</span>
                    </span>
                    <ArrowRightIcon
                      size={18}
                      className={`shrink-0 text-gold transition-all duration-300 ${active ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-[var(--shadow-lg)] lg:sticky lg:top-28">
              <img
                key={activeExperience.id}
                src={activeExperience.image}
                alt={activeExperience.label}
                className="page-in h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
                <div>
                  <p className="font-serif text-2xl font-medium text-white">{activeExperience.label}</p>
                  <p className="mt-1 text-sm text-white/75">{activeExperience.description}</p>
                </div>
                <Link
                  to={`/packages?experience=${activeExperience.id}`}
                  className="btn btn-glass shrink-0 !px-4 !py-2 !text-xs"
                >
                  Explore
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRAVEL STORIES ───────────────────────────────────────────────── */}
      <section className="section-padding bg-cream">
        <div className="container-site">
          <Reveal className="mb-10 flex flex-col justify-between gap-6 md:mb-14 md:flex-row md:items-end">
            <SectionHeading
              flush
              eyebrow="Travel stories"
              title="From the field"
              subtitle="Real accounts from real journeys: the people, the places and the moments that make Kerala unforgettable."
            />
            <div><SectionLink to="/stories">All stories</SectionLink></div>
          </Reveal>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {featuredStories.map((story, i) => (
              <Reveal key={story.id} delay={i * 80}>
                <StoryCard story={story} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="section-padding bg-ivory">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow="What travellers say"
              title="Voices from the journey"
              subtitle="These are illustrative sample reviews, representative of the experiences we strive to deliver."
              centered
            />
          </Reveal>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {DEMO_TESTIMONIALS.map((t, i) => (
              <Reveal key={t.id} delay={i * 80}>
                <TestimonialCard testimonial={t} />
              </Reveal>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-muted">* All reviews shown are illustrative demo content.</p>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0">
          <img src="/images/seed/kerala-sunset.jpg" alt="" className="h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-[#0B110D]/75" />
        </div>

        <Reveal className="container-site relative text-center">
          <p className="mb-4 text-sm font-medium tracking-wide text-gold">Your journey begins here</p>
          <h2 className="mb-6 font-serif text-4xl font-medium leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl">
            Ready to discover Kerala?
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-white/75">
            Share your travel dates and preferences. Our Kerala experts will craft a personalised
            itinerary within 24 hours.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/contact" className="btn btn-gold !px-8 !py-3.5">
              Start planning
              <ArrowRightIcon size={16} />
            </Link>
            <Link to="/packages" className="btn btn-glass !px-8 !py-3.5">
              Browse packages
            </Link>
          </div>
        </Reveal>
      </section>
    </Layout>
  );
}
