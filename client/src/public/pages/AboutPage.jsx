import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout.jsx';
import SectionHeading from '../../components/common/SectionHeading.jsx';

const TEAM = [
  { name: 'Arun Nair', role: 'Founder & CEO', initials: 'AN', bio: 'Born in Alappuzha, Arun has spent 15 years building curated travel experiences in Kerala. He founded TravelOS to bring the same quality of personalised travel to the digital world.' },
  { name: 'Meera Krishnan', role: 'Head of Operations', initials: 'MK', bio: 'A logistics expert and passionate traveller, Meera oversees every itinerary to ensure it exceeds expectations — before the client even leaves home.' },
  { name: 'Thomas Philip', role: 'Senior Travel Consultant', initials: 'TP', bio: 'Thomas specialises in South India heritage circuits and wildlife experiences, with a particular expertise in Thekkady and Wayanad.' },
];

const VALUES = [
  { title: 'Authenticity', description: 'We build journeys that go beyond tourist trails into the genuine heart of each destination.' },
  { title: 'Responsibility', description: 'We work with local guides, locally-owned accommodations, and eco-conscious operators wherever possible.' },
  { title: 'Transparency', description: 'No hidden costs. No opaque pricing. Every component of your itinerary is itemised before you commit.' },
  { title: 'Excellence', description: 'We hold ourselves to the highest standards of service — from the first enquiry to the last transfer.' },
];

export default function AboutPage() {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative pt-28 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-cream">
        <div className="container-site">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-olive uppercase tracking-widest mb-4">About TravelOS</p>
            <h1 className="font-serif text-5xl md:text-6xl text-charcoal leading-tight mb-6">
              We know Kerala<br />like our own<br />backyard.
            </h1>
            <p className="text-charcoal/60 text-lg leading-relaxed mb-8">
              Founded in Kochi by a team of Kerala natives, TravelOS was built with a single mission:
              to give travellers access to the same quality of local knowledge that only insiders hold.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-forest text-white font-semibold px-7 py-3.5 rounded-full hover:bg-forest-dark transition-colors text-sm"
            >
              Plan Your Journey →
            </Link>
          </div>
        </div>

        {/* Background accent */}
        <div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block">
          <img
            src="/images/seed/alleppey-backwaters.jpg"
            alt="Kerala backwaters"
            className="w-full h-full object-cover opacity-30 rounded-l-3xl"
          />
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-ivory">
        <div className="container-site">
          <SectionHeading
            eyebrow="What we believe"
            title="Our Values"
            subtitle="These principles guide every itinerary we create, every guide we partner with, every hotel we recommend."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl p-6 border border-sand/60 shadow-sm">
                <div className="w-8 h-1 bg-forest rounded-full mb-4" />
                <h3 className="font-serif text-lg text-charcoal mb-3">{v.title}</h3>
                <p className="text-sm text-charcoal/60 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding bg-cream">
        <div className="container-site">
          <SectionHeading
            eyebrow="The team"
            title="People who know Kerala"
            subtitle="Our consultants are passionate Kerala natives with deep personal knowledge of every destination we offer."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TEAM.map((member) => (
              <div key={member.name} className="bg-white rounded-2xl p-6 border border-sand/60 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-forest/10 flex items-center justify-center text-forest font-serif font-bold text-xl mb-4">
                  {member.initials}
                </div>
                <h3 className="font-serif text-lg text-charcoal mb-0.5">{member.name}</h3>
                <p className="text-xs text-olive font-medium mb-3">{member.role}</p>
                <p className="text-sm text-charcoal/60 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-forest py-14 md:py-20">
        <div className="container-site">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '12+', label: 'Years of Experience' },
              { value: '500+', label: 'Happy Travellers' },
              { value: '8', label: 'Destinations' },
              { value: '24hr', label: 'Response Time' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-serif text-4xl md:text-5xl text-white mb-2">{stat.value}</p>
                <p className="text-white/55 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-ivory">
        <div className="container-site text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-charcoal mb-5">
            Ready to explore Kerala with us?
          </h2>
          <p className="text-charcoal/60 mb-8 max-w-lg mx-auto">
            Get in touch with our travel consultants for a free, no-obligation itinerary consultation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 bg-forest text-white font-semibold px-7 py-3.5 rounded-full hover:bg-forest-dark transition-colors text-sm"
            >
              Contact Us →
            </Link>
            <Link
              to="/packages"
              className="inline-flex items-center justify-center gap-2 border border-forest/30 text-forest font-semibold px-7 py-3.5 rounded-full hover:bg-forest/5 transition-colors text-sm"
            >
              Browse Packages
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

