// Scenic page header used by listing / editorial pages. Always dark-on-photo,
// so it looks the same in both themes.
export default function PageHero({ eyebrow, title, subtitle, image, align = 'left', children }) {
  return (
    <section className="relative overflow-hidden bg-[#0B110D] pb-14 pt-28 md:pb-20 md:pt-40">
      {image && (
        <div className="absolute inset-0">
          <img src={image} alt="" className="h-full w-full object-cover opacity-55" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B110D]/90 via-[#0B110D]/60 to-[#0B110D]/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B110D]/60 to-transparent" />
        </div>
      )}
      <div className={`container-site relative w-full ${align === 'center' ? 'text-center' : ''}`}>
        {eyebrow && <p className="rise-in mb-3 text-sm font-medium tracking-wide text-gold">{eyebrow}</p>}
        <h1
          className={`rise-in max-w-3xl font-serif text-4xl font-medium leading-[1.08] tracking-tight text-white md:text-5xl lg:text-6xl ${
            align === 'center' ? 'mx-auto' : ''
          }`}
          style={{ animationDelay: '0.08s' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className={`rise-in mt-5 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg ${
              align === 'center' ? 'mx-auto' : ''
            }`}
            style={{ animationDelay: '0.18s' }}
          >
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
