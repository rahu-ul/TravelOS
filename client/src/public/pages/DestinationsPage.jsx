import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout.jsx';
import DestinationCard from '../../components/common/DestinationCard.jsx';
import SectionHeading from '../../components/common/SectionHeading.jsx';
import { DEMO_DESTINATIONS } from '../../data/demoData.js';

export default function DestinationsPage() {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-20 bg-forest-dark overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src="/images/seed/kerala-sunset.jpg" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative container-site text-center">
          <p className="text-olive text-xs font-semibold uppercase tracking-widest mb-3">Destinations</p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-5">
            Explore Kerala &amp; South India
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            From mist-cloaked highland estates to sun-warmed beaches, from serene backwater canals to vibrant temple towns — every destination we feature is chosen for its depth, beauty, and authenticity.
          </p>
        </div>
      </section>

      {/* Kerala section */}
      <section className="section-padding bg-ivory">
        <div className="container-site">
          <SectionHeading
            eyebrow="God's Own Country"
            title="Kerala"
            subtitle="One of the most biodiverse and culturally rich regions in Asia, Kerala rewards every kind of traveller."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEMO_DESTINATIONS.map((dest) => (
              <div key={dest.id} className="group">
                <DestinationCard destination={dest} />
                <div className="mt-4">
                  <p className="text-sm text-charcoal/70 leading-relaxed mb-3">{dest.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">{dest.packages}+ packages available</span>
                    <Link
                      to={`/packages?destination=${dest.name}`}
                      className="text-xs font-semibold text-forest hover:underline"
                    >
                      View Packages →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* South India section */}
      <section className="section-padding bg-cream">
        <div className="container-site">
          <SectionHeading
            eyebrow="Beyond Kerala"
            title="South India"
            subtitle="Extend your journey beyond Kerala into the ancient temple towns, misty Nilgiris, and coastal gems of Tamil Nadu."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
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
            ].map((dest) => (
              <div key={dest.id} className="group">
                <DestinationCard destination={dest} />
                <div className="mt-4">
                  <p className="text-sm text-charcoal/70 leading-relaxed mb-3">{dest.description}</p>
                  <Link
                    to={`/packages?destination=${dest.name}`}
                    className="text-xs font-semibold text-forest hover:underline"
                  >
                    View Packages →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-forest py-16 md:py-20">
        <div className="container-site text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-white mb-5">
            Can't decide where to go?
          </h2>
          <p className="text-white/60 text-lg mb-8 max-w-lg mx-auto">
            Our travel consultants will help you pick the perfect destination based on your interests, budget, and travel dates.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-white text-forest font-semibold px-7 py-3.5 rounded-full hover:bg-sand transition-colors"
          >
            Get Expert Advice →
          </Link>
        </div>
      </section>
    </Layout>
  );
}

