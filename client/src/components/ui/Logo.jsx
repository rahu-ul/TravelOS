// TravelOS mark: a stylised palm-leaf fan, drawn in the current text colour.
export function LogoMark({ className = '', size = 30 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M16 28V15" />
      <path d="M16 15C16 9.5 13 6 8.5 4.8c0 4.4 2.3 7.8 7.5 10.2z" />
      <path d="M16 15c0-5.5 3-9 7.5-10.2 0 4.4-2.3 7.8-7.5 10.2z" />
      <path d="M16 21.5c-4.3.2-8.3-1.6-10.5-5.8 4.2-.5 8.6.7 10.5 5.8z" />
      <path d="M16 21.5c4.3.2 8.3-1.6 10.5-5.8-4.2-.5-8.6.7-10.5 5.8z" />
    </svg>
  );
}

export default function Logo({ className = '', markClassName = 'text-gold', tagline = false }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={markClassName} />
      <span className="leading-none">
        <span className="block font-serif text-[1.45rem] font-medium tracking-tight">TravelOS</span>
        {tagline && (
          <span className="mt-1 block text-[9px] font-medium tracking-[0.22em] uppercase opacity-70">
            Kerala &amp; South India
          </span>
        )}
      </span>
    </span>
  );
}
