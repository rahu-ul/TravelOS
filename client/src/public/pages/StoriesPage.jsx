import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout.jsx';
import StoryCard from '../../components/common/StoryCard.jsx';
import PageHero from '../../components/ui/PageHero.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import { EmptyState, Pagination } from '../../components/ui/States.jsx';
import { ArrowRightIcon } from '../../components/ui/Icons.jsx';
import { api } from '../../api/client.js';
import { DEMO_STORIES } from '../../data/demoData.js';

const PAGE_SIZE = 6;

const fmt = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function StoriesPage() {
  const [stories, setStories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    api.get('/stories')
      .then((res) => {
        if (active && res.data?.data?.stories?.length) {
          setStories(res.data.data.stories);
        }
      })
      .catch(() => {
        if (active) setStories(DEMO_STORIES);
      });
    return () => { active = false; };
  }, []);

  const allStories = stories.length > 0 ? stories : DEMO_STORIES;
  const categories = useMemo(() => {
    const raw = allStories.map((s) => s.category || s.tags?.[0] || 'Guide');
    return ['All', ...Array.from(new Set(raw.filter(Boolean)))];
  }, [allStories]);

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return allStories;
    return allStories.filter((s) => (s.category || s.tags?.[0]) === activeCategory);
  }, [allStories, activeCategory]);

  const choose = (cat) => {
    setActiveCategory(cat);
    setPage(1);
  };

  // Magazine layout: a featured story + side list on the first page of "All"
  const showFeatured = activeCategory === 'All' && page === 1 && filtered.length >= 3;
  const featured = showFeatured ? filtered[0] : null;
  const side = showFeatured ? filtered.slice(1, 4) : [];
  const rest = showFeatured ? filtered.slice(4) : filtered;
  const pageCount = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const pageItems = showFeatured ? rest : rest.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Layout>
      <PageHero
        eyebrow="Travel stories"
        title="Stories from Kerala"
        subtitle="Travel guides, local experiences and inspiration for your next journey: the people, places and moments that make Kerala and South India unforgettable."
        image="/images/seed/kerala-houseboat.jpg"
      >
        <p className="rise-in mt-5" style={{ animationDelay: '0.28s' }}>
          <span className="demo-badge !bg-white/10 !text-white">Demo stories · illustrative content</span>
        </p>
      </PageHero>

      <section className="section-padding bg-ivory">
        <div className="container-site">
          <div className="mb-10 flex flex-wrap gap-2" role="group" aria-label="Filter stories by category">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => choose(cat)}
                aria-pressed={activeCategory === cat}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  activeCategory === cat ? 'bg-gold text-on-gold' : 'border border-sand bg-card text-muted hover:border-gold hover:text-charcoal'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {featured && (
            <Reveal className="mb-12 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <Link
                to={`/stories/${featured.slug}`}
                className="group relative block min-h-[22rem] overflow-hidden rounded-[1.75rem] shadow-[var(--shadow-md)] lg:min-h-[30rem]"
              >
                <img src={featured.image} alt={featured.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-9">
                  <span className="chip bg-gold text-on-gold">{featured.category}</span>
                  <h2 className="mt-4 max-w-xl font-serif text-2xl font-medium leading-tight text-white md:text-4xl">{featured.title}</h2>
                  <p className="mt-3 max-w-lg text-sm text-white/75 md:text-base">{featured.excerpt}</p>
                  <p className="mt-4 flex items-center gap-3 text-xs text-white/70">
                    By {featured.author} · {fmt(featured.publishedAt)} · {featured.readTime}
                    <span className="ml-auto inline-flex items-center gap-1 font-semibold text-gold">Read story <ArrowRightIcon size={14} /></span>
                  </p>
                </div>
              </Link>

              <ul className="flex flex-col gap-4">
                {side.map((s) => (
                  <li key={s.id} className="flex-1">
                    <Link to={`/stories/${s.slug}`} className="group flex h-full gap-4 rounded-[1.4rem] border border-sand bg-card p-3 shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-[var(--shadow-md)] motion-reduce:transition-none">
                      <img src={s.image} alt="" className="h-24 w-28 shrink-0 rounded-2xl object-cover sm:h-28 sm:w-32" loading="lazy" />
                      <div className="flex min-w-0 flex-col justify-center">
                        <span className="text-[11px] font-semibold text-olive">{s.category}</span>
                        <h3 className="mt-1 line-clamp-2 font-serif text-base font-medium leading-snug text-charcoal group-hover:text-accent">{s.title}</h3>
                        <p className="mt-1.5 text-xs text-muted">{fmt(s.publishedAt)} · {s.readTime}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}

          {pageItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((story, i) => (
                <Reveal key={story.id} delay={(i % 3) * 70}>
                  <StoryCard story={story} />
                </Reveal>
              ))}
            </div>
          ) : (
            !featured && (
              <EmptyState
                title="No stories in this category yet"
                message="Try another category to keep reading."
                action={<button type="button" onClick={() => choose('All')} className="btn btn-primary">View all stories</button>}
              />
            )
          )}

          {!showFeatured && <Pagination page={page} pageCount={pageCount} onChange={setPage} />}
        </div>
      </section>
    </Layout>
  );
}
