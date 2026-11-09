import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout.jsx';
import SectionHeading from '../../components/common/SectionHeading.jsx';
import PageHero from '../../components/ui/PageHero.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import { ArrowRightIcon } from '../../components/ui/Icons.jsx';

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
      <PageHero
        eyebrow="About TravelOS"
        title="We know Kerala like our own backyard."
        subtitle="Founded in Kochi by a team of Kerala natives, TravelOS was built with a single mission: to give travellers access to the same quality of local knowledge that only insiders hold."
        image="/images/seed/alleppey-backwaters.jpg"
      >
        <div className="rise-in mt-8" style={{ animationDelay: '0.3s' }}>
          <Link to="/contact" className="btn btn-gold">Plan your journey <ArrowRightIcon size={16} /></Link>
        </div>
      </PageHero>

      <section className="section-padding bg-ivory">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow="What we believe"
              title="Our values"
              subtitle="These principles guide every itinerary we create, every guide we partner with, every hotel we recommend."
            />
          </Reveal>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 80}>
                <div className="h-full rounded-[1.4rem] border border-sand bg-card p-6 shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-[var(--shadow-md)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                  <div className="mb-5 h-1 w-9 rounded-full bg-gold" />
                  <h3 className="mb-3 font-serif text-xl font-medium text-charcoal">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{v.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-cream">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              eyebrow="The team"
              title="People who know Kerala"
              subtitle="Our consultants are passionate Kerala natives with deep personal knowledge of every destination we offer."
            />
          </Reveal>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {TEAM.map((member, i) => (
              <Reveal key={member.name} delay={i * 80}>
                <div className="h-full rounded-[1.4rem] border border-sand bg-card p-6 shadow-[var(--shadow-sm)]">
                  <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-sand font-serif text-lg font-semibold text-accent">{member.initials}</div>
                  <h3 className="font-serif text-xl font-medium text-charcoal">{member.name}</h3>
                  <p className="mb-3 mt-0.5 text-xs font-medium text-olive">{member.role}</p>
                  <p className="text-sm leading-relaxed text-muted">{member.bio}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-forest py-14 md:py-20">
        <div className="container-site">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {[
              { value: '12+', label: 'Years of experience' },
              { value: '500+', label: 'Happy travellers' },
              { value: '8', label: 'Destinations' },
              { value: '24hr', label: 'Response time' },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 70}>
                <p className="mb-2 font-serif text-4xl font-medium text-gold md:text-5xl">{stat.value}</p>
                <p className="text-sm text-white/70">{stat.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-ivory">
        <Reveal className="container-site text-center">
          <h2 className="mb-5 font-serif text-3xl font-medium tracking-tight text-charcoal md:text-4xl">Ready to explore Kerala with us?</h2>
          <p className="mx-auto mb-8 max-w-lg text-muted">Get in touch with our travel consultants for a free, no-obligation itinerary consultation.</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/contact" className="btn btn-primary !px-8 !py-3.5">Contact us <ArrowRightIcon size={16} /></Link>
            <Link to="/packages" className="btn btn-outline !px-8 !py-3.5">Browse packages</Link>
          </div>
        </Reveal>
      </section>
    </Layout>
  );
}
