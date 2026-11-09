import { useState } from 'react';

/**
 * Smooth, accessible accordion item.
 * Uses CSS grid-template-rows animation (0fr → 1fr) so no height measuring is needed.
 *
 * Props:
 *  title       — string | ReactNode — the button label
 *  meta        — optional chip label shown before the title (e.g. "Day 3")
 *  defaultOpen — boolean (default false)
 *  children    — body content
 */
export default function AccordionItem({ title, meta, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-sand last:border-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="flex items-center gap-3 min-w-0">
          {meta && (
            <span className="chip bg-gold/15 text-gold border border-gold/30 shrink-0">{meta}</span>
          )}
          <span className="font-serif text-base md:text-lg text-charcoal truncate">{title}</span>
        </span>
        <span
          aria-hidden="true"
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-sand text-gold transition-transform duration-300 motion-reduce:transition-none ${
            open ? 'rotate-45' : ''
          }`}
        >
          +
        </span>
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="pb-5 pr-12 text-sm leading-relaxed text-muted">{children}</div>
        </div>
      </div>
    </div>
  );
}

