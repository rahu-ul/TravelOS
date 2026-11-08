import { useState } from 'react';
import Layout from '../../components/layout/Layout.jsx';
import StoryCard from '../../components/common/StoryCard.jsx';
import SectionHeading from '../../components/common/SectionHeading.jsx';
import { DEMO_STORIES } from '../../data/demoData.js';

const CATEGORIES = ['All', ...Array.from(new Set(DEMO_STORIES.map((s) => s.category)))];

export default function StoriesPage() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? DEMO_STORIES
    : DEMO_STORIES.filter((s) => s.category === activeCategory);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-20 bg-charcoal overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src="/images/seed/kerala-houseboat.jpg" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative container-site text-center">
          <p className="text-olive text-xs font-semibold uppercase tracking-widest mb-3">Travel Stories</p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-5">
            From the Field
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto leading-relaxed">
            Real accounts from real journeys. The people, the places, and the moments that make Kerala and South India unforgettable.
          </p>
          <p className="mt-4">
            <span className="demo-badge">Demo Stories — Illustrative Content</span>
          </p>
        </div>
      </section>

      {/* Filter + Grid */}
      <section className="section-padding bg-ivory">
        <div className="container-site">
          {/* Category filters */}
          <div className="flex gap-2 flex-wrap mb-10">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-forest text-white'
                    : 'bg-white border border-sand text-charcoal/70 hover:border-forest hover:text-forest'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Stories grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((story, i) => (
                <StoryCard key={story.id} story={story} featured={i === 0 && filtered.length === DEMO_STORIES.length} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-4xl mb-4">📖</p>
              <h3 className="font-serif text-2xl text-charcoal mb-3">No stories in this category yet</h3>
              <button onClick={() => setActiveCategory('All')} className="text-forest text-sm font-medium hover:underline">
                View all stories
              </button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

