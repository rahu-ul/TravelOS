import { Link } from 'react-router-dom';

export default function StoryCard({ story, featured = false }) {
  return (
    <Link
      to={`/stories/${story.slug}`}
      className={`group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-sand/60 ${
        featured ? 'md:flex md:flex-row' : ''
      }`}
    >
      {/* Image */}
      <div className={`relative overflow-hidden ${featured ? 'md:w-2/5 h-52 md:h-auto' : 'h-48'}`}>
        <img
          src={story.image}
          alt={story.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center rounded-full bg-forest text-white px-2.5 py-0.5 text-xs font-medium">
            {story.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className={`p-5 ${featured ? 'md:flex-1 md:p-7 flex flex-col justify-center' : ''}`}>
        <div className="flex items-center gap-3 text-xs text-muted mb-3">
          <span>{story.author}</span>
          <span>·</span>
          <span>{story.readTime}</span>
          <span>·</span>
          <span>{new Date(story.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>

        <h3 className={`font-serif text-charcoal leading-snug mb-3 group-hover:text-forest transition-colors ${featured ? 'text-xl md:text-2xl' : 'text-lg'}`}>
          {story.title}
        </h3>

        <p className="text-sm text-charcoal/60 leading-relaxed line-clamp-3 mb-4">
          {story.excerpt}
        </p>

        {/* Tags */}
        {story.tags && story.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-4">
            {story.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-sand/60 text-charcoal/60">
                {tag}
              </span>
            ))}
          </div>
        )}

        <span className="text-sm font-medium text-forest group-hover:underline">
          Read more →
        </span>
      </div>
    </Link>
  );
}

