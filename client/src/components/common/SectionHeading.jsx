export default function SectionHeading({ eyebrow, title, subtitle, centered = false, light = false, flush = false }) {
  return (
    <div className={`${flush ? '' : 'mb-10 md:mb-14'} ${centered ? 'text-center' : ''}`}>
      {eyebrow && (
        <p className={`mb-3 text-sm font-medium tracking-wide ${light ? 'text-gold' : 'text-olive'}`}>
          {eyebrow}
        </p>
      )}
      <h2
        className={`mb-4 font-serif text-3xl font-medium leading-[1.15] tracking-tight md:text-4xl lg:text-[2.75rem] ${
          light ? 'text-white' : 'text-charcoal'
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`max-w-2xl text-base leading-relaxed md:text-lg ${centered ? 'mx-auto' : ''} ${
            light ? 'text-white/70' : 'text-muted'
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
