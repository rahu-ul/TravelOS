import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout.jsx';
import DestinationCard from '../../components/common/DestinationCard.jsx';
import SectionHeading from '../../components/common/SectionHeading.jsx';
import PageHero from '../../components/ui/PageHero.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import { ArrowRightIcon } from '../../components/ui/Icons.jsx';
import { DEMO_DESTINATIONS } from '../../data/demoData.js';

const SOUTH_INDIA = [
  {
    id: 'madurai',
    name: 'Madurai',
    tagline: 'City of the Undying',
    description: 'Home to the magnificent Meenakshi Amman Temple and one of the oldest continuously inhabited cities in the world.',
    image: '/images/seed/madurai-temple.jpg',
    highlight: 'Temples',
    packages: 6,
    slug: 'madurai',
  },
  {
    id: 'ooty',
    name: 'Ooty & Nilgiris',
    tagline: 'Queen of Hill Stations',
    description: 'Take the UNESCO-listed toy train through spectacular landscapes to this charming colonial hill town.',
    image: '/images/seed/ooty-hills.jpg',
    highlight: 'Toy Train',
    packages: 5,
    slug: 'ooty',
  },
];

function DestinationBlock({ dest, showCount = true, delay = 0 }) {
  return (
    <Reveal delay={delay} className="group">
      <DestinationCard destination={dest} />
      <div className="mt-4 px-1">
        <p className="mb-3 text-sm leading-relaxed text-muted">{dest.description}</p>
        <div className="flex items-center justify-between gap-3">
          {showCount ? <span className="text-xs text-muted">{dest.packages}+ packages available</span> : <span />}
          <Link
            to={`/packages?destination=${dest.name}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            View packages <ArrowRightIcon size={14} />
          </Link>
        </div>
      </div>
    </Reveal>
  );
}

export default function DestinationsPage() {
  return (
    <Layout>
      <PageHero
        eyebrow="Destinations"
        title="Explore Kerala & South India"
        subtitle="From mist-cloaked highland estates to sun-warmed beaches, from quiet backwater canals to vibrant temple towns. Every destination we feature is chosen for its depth, beauty and authenticity."
        image="/images/seed/kerala-sunset.jpg"
      />

      <section className="section-padding bg-ivory">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow="God's Own Country"
              title="Kerala"
              subtitle="One of the most biodiverse and culturally rich regions in Asia, Kerala rewards every kind of traveller."
            />
          </Reveal>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {DEMO_DESTINATIONS.map((dest, i) => (
              <DestinationBlock key={dest.id} dest={dest} delay={(i % 3) * 80} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-cream">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow="Beyond Kerala"
              title="South India"
              subtitle="Extend your journey into the ancient temple towns, misty Nilgiris and coastal gems of Tamil Nadu."
            />
          </Reveal>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {SOUTH_INDIA.map((dest, i) => (
              <DestinationBlock key={dest.id} dest={dest} showCount={false} delay={i * 80} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-forest py-16 md:py-20">
        <Reveal className="container-site text-center">
          <h2 className="mb-5 font-serif text-3xl font-medium tracking-tight text-white md:text-4xl">
            Can&rsquo;t decide where to go?
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-lg text-white/75">
            Our travel consultants will help you pick the perfect destination based on your interests,
            budget and travel dates.
          </p>
          <Link to="/contact" className="btn btn-gold !px-8 !py-3.5">
            Get expert advice <ArrowRightIcon size={16} />
          </Link>
        </Reveal>
      </section>
    </Layout>
  );
}
