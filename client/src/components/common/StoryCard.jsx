import { Link } from 'react-router-dom';

export default function StoryCard({ story, featured = false }) {
  const imageUrl = story.coverImage?.url || story.image || '/images/kerala-card.jpg';
  const categoryLabel = story.category || story.tags?.[0] || 'Travel Guide';
  const readTimeLabel = story.readTime || `${story.readingMinutes || 3} min read`;
  const authorName = typeof story.author === 'object' ? story.author?.name : (story.author || 'Editorial Team');
  const pubDate = story.publishedAt ? new Date(story.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  return (
    <Link
      to={`/stories/${story.slug}`}
      className={`group block overflow-hidden rounded-[1.4rem] border border-sand bg-card shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-[var(--shadow-md)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
        featured ? 'md:flex md:flex-row' : ''
      }`}
    >
      <div className={`relative overflow-hidden ${featured ? 'h-52 md:h-auto md:w-2/5' : 'h-48'}`}>
        <img
          src={imageUrl}
          alt={story.title}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          loading="lazy"
        />
        <div className="absolute left-3 top-3">
          <span className="inline-flex items-center rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {categoryLabel}
          </span>
        </div>
      </div>

      <div className={`p-5 ${featured ? 'flex flex-col justify-center md:flex-1 md:p-7' : ''}`}>
        <p className="mb-3 text-xs text-muted">
          {authorName}
          <span className="mx-2 text-gold">/</span>
          {readTimeLabel}
          {pubDate && (
            <>
              <span className="mx-2 text-gold">/</span>
              {pubDate}
            </>
          )}
        </p>

        <h3 className={`mb-3 font-serif font-medium leading-snug text-charcoal ${featured ? 'text-xl md:text-2xl' : 'text-lg'}`}>
          {story.title}
        </h3>

        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-muted">{story.excerpt}</p>

        {story.tags && story.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {story.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-sand/70 px-2.5 py-0.5 text-[11px] text-muted">
                {tag}
              </span>
            ))}
          </div>
        )}

        <span className="text-sm font-medium text-accent underline-offset-4 group-hover:underline">Read story</span>
      </div>
    </Link>
  );
}
