import { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout.jsx';
import StoryCard from '../../components/common/StoryCard.jsx';
import PackageCard from '../../components/common/PackageCard.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import { ArrowRightIcon } from '../../components/ui/Icons.jsx';
import { api } from '../../api/client.js';
import { DEMO_STORIES, DEMO_PACKAGES } from '../../data/demoData.js';

export default function StoryDetailsPage() {
  const { slug } = useParams();
  const [story, setStory] = useState(() => DEMO_STORIES.find((s) => s.slug === slug) || null);
  const [loading, setLoading] = useState(!story);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    api.get(`/stories/${slug}`)
      .then((res) => {
        if (active && res.data?.data?.story) {
          setStory(res.data.data.story);
          setNotFound(false);
        }
      })
      .catch((err) => {
        if (active) {
          const fallback = DEMO_STORIES.find((s) => s.slug === slug);
          if (fallback) setStory(fallback);
          else setNotFound(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [slug]);

  if (notFound) return <Navigate to="/stories" replace />;
  if (loading && !story) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center bg-ivory">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sand border-t-gold" />
        </div>
      </Layout>
    );
  }
  if (!story) return <Navigate to="/stories" replace />;

  const imageUrl = story.coverImage?.url || story.image || '/images/hero-kerala-right.jpg';
  const authorName = typeof story.author === 'object' ? story.author?.name : (story.author || 'Editorial Team');
  const readTimeLabel = story.readTime || `${story.readingMinutes || 4} min read`;
  const categoryLabel = story.category || story.tags?.[0] || 'Travel Guide';

  const paragraphs = Array.isArray(story.body)
    ? story.body
    : typeof story.body === 'string'
    ? story.body.split(/\n\n+/).filter(Boolean)
    : [];

  const related = story.moreStories?.length > 0
    ? story.moreStories
    : DEMO_STORIES.filter((s) => s.id !== story.id).slice(0, 2);

  const relatedPackages = story.relatedPackages?.length > 0
    ? story.relatedPackages
    : DEMO_PACKAGES.slice(0, 3);

  return (
    <Layout>
      <article>
        <header className="relative flex min-h-[26rem] items-end overflow-hidden bg-[#0B110D] pb-10 pt-32 md:min-h-[34rem] md:pb-16">
          <img src={imageUrl} alt={story.title} className="hero-zoom absolute inset-0 h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B110D]/90 via-[#0B110D]/40 to-[#0B110D]/30" />
          <div className="container-site relative w-full">
            <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-xs text-white/70">
              <Link to="/" className="hover:text-white">Home</Link><span className="text-gold">/</span>
              <Link to="/stories" className="hover:text-white">Travel Stories</Link><span className="text-gold">/</span>
              <span className="truncate text-white">{story.title}</span>
            </nav>
            <span className="chip bg-gold text-on-gold">{categoryLabel}</span>
            <h1 className="rise-in mt-4 max-w-4xl font-serif text-3xl font-medium leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl">{story.title}</h1>
            <p className="mt-5 text-sm text-white/75">
              <span className="font-semibold text-white">{authorName}</span> · {readTimeLabel}
              {story.publishedAt && (
                <>
                  {' '}· {new Date(story.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </>
              )}
            </p>
          </div>
        </header>

        <div className="bg-ivory">
          <div className="container-site py-12 md:py-16">
            <div className="mx-auto max-w-2xl">
              {story.excerpt && (
                <p className="mb-8 border-b border-sand pb-8 font-serif text-xl italic leading-relaxed text-muted">{story.excerpt}</p>
              )}

              {story.isDemo && (
                <div className="mb-8 flex items-start gap-3 rounded-2xl border border-warn/30 bg-warn-soft p-4 text-xs leading-relaxed text-warn">
                  <span aria-hidden="true">ℹ</span>
                  <p>This is a demo travel story created to illustrate the TravelOS editorial section.</p>
                </div>
              )}

              <div className="space-y-6">
                {paragraphs.map((paragraph, i) => (
                  <p key={i} className={`text-[1.0625rem] leading-[1.85] text-charcoal/85 ${i === 0 ? 'first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-6xl first-letter:leading-[0.9] first-letter:text-accent' : ''}`}>
                    {paragraph}
                  </p>
                ))}
              </div>

              {story.tags && story.tags.length > 0 && (
                <div className="mt-10 flex flex-wrap gap-2 border-t border-sand pt-8">
                  {story.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-sand/70 px-3 py-1 text-xs font-medium text-muted">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </article>

      <section className="section-padding bg-cream">
        <div className="container-site">
          <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-serif text-3xl font-medium tracking-tight text-charcoal">Journeys inspired by this story</h2>
            <Link to="/packages" className="btn btn-outline !bg-card">All packages <ArrowRightIcon size={16} /></Link>
          </Reveal>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPackages.map((p, i) => (
              <Reveal key={p.id || p._id || i} delay={i * 80}>
                <PackageCard pkg={p} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section-padding bg-ivory">
          <div className="container-site">
            <Reveal><h2 className="mb-8 font-serif text-3xl font-medium tracking-tight text-charcoal">More from the field</h2></Reveal>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {related.map((s, i) => (<Reveal key={s.id || s._id || i} delay={i * 80}><StoryCard story={s} /></Reveal>))}
            </div>
            <div className="mt-10 text-center"><Link to="/stories" className="btn btn-outline !bg-card">All travel stories <ArrowRightIcon size={16} /></Link></div>
          </div>
        </section>
      )}
    </Layout>
  );
}
