import { Link, useParams, Navigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout.jsx';
import StoryCard from '../../components/common/StoryCard.jsx';
import { DEMO_STORIES } from '../../data/demoData.js';

export default function StoryDetailsPage() {
  const { slug } = useParams();
  const story = DEMO_STORIES.find((s) => s.slug === slug);

  if (!story) return <Navigate to="/stories" replace />;

  const related = DEMO_STORIES.filter((s) => s.id !== story.id).slice(0, 2);

  return (
    <Layout>
      <div className="pt-16 md:pt-20">
        {/* Hero image */}
        <div className="relative h-72 md:h-[500px] overflow-hidden">
          <img
            src={story.image}
            alt={story.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Category */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center rounded-full bg-forest text-white px-3 py-1 text-xs font-medium">
              {story.category}
            </span>
          </div>
        </div>

        {/* Article */}
        <div className="container-site py-10 md:py-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-muted mb-8">
            <Link to="/" className="hover:text-forest transition-colors">Home</Link>
            <span>/</span>
            <Link to="/stories" className="hover:text-forest transition-colors">Travel Stories</Link>
            <span>/</span>
            <span className="text-charcoal truncate">{story.title}</span>
          </nav>

          <div className="max-w-2xl mx-auto">
            {/* Meta */}
            <div className="flex items-center gap-3 text-sm text-muted mb-5">
              <span className="font-medium text-charcoal">{story.author}</span>
              <span>·</span>
              <span>{story.readTime}</span>
              <span>·</span>
              <span>
                {new Date(story.publishedAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </span>
            </div>

            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-charcoal leading-tight mb-6">
              {story.title}
            </h1>

            <p className="text-lg text-charcoal/60 italic leading-relaxed mb-8 pb-8 border-b border-sand/60">
              {story.excerpt}
            </p>

            {/* Demo notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-3">
              <span className="text-amber-500 mt-0.5 flex-shrink-0">ℹ</span>
              <p className="text-xs text-amber-700 leading-relaxed">
                This is a demo travel story created to illustrate the TravelOS editorial section.
                It is not a real travel account.
              </p>
            </div>

            {/* Body */}
            <div className="prose-custom space-y-5">
              {(story.body || []).map((paragraph, i) => (
                <p key={i} className="text-charcoal/75 leading-relaxed text-base">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Tags */}
            {story.tags && (
              <div className="mt-10 pt-8 border-t border-sand/60">
                <div className="flex gap-2 flex-wrap">
                  {story.tags.map((tag) => (
                    <span key={tag} className="text-xs px-3 py-1 rounded-full bg-sand/60 text-charcoal/60 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related stories */}
        {related.length > 0 && (
          <section className="bg-cream py-14 md:py-20">
            <div className="container-site">
              <h2 className="font-serif text-2xl md:text-3xl text-charcoal mb-8">More from the Field</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {related.map((s) => (
                  <StoryCard key={s.id} story={s} />
                ))}
              </div>
              <div className="mt-8 text-center">
                <Link
                  to="/stories"
                  className="inline-flex items-center gap-2 border border-forest/30 text-forest font-medium px-6 py-3 rounded-full hover:bg-forest hover:text-white transition-colors text-sm"
                >
                  All Travel Stories →
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}

