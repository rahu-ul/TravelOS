export default function SectionHeading({ eyebrow, title, subtitle, centered = false, light = false }) {
  return (
    <div className={`mb-10 md:mb-14 ${centered ? 'text-center' : ''}`}>
      {eyebrow && (
        <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${light ? 'text-olive/70' : 'text-olive'}`}>
          {eyebrow}
        </p>
      )}
      <h2 className={`font-serif text-3xl md:text-4xl lg:text-5xl leading-tight mb-4 ${light ? 'text-white' : 'text-charcoal'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-base md:text-lg leading-relaxed max-w-2xl ${centered ? 'mx-auto' : ''} ${light ? 'text-white/60' : 'text-charcoal/60'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

