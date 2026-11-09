import { useEffect } from 'react';
import { CloseIcon } from './Icons.jsx';

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function LoadingBlock({ label = 'Loading…', rows = 3 }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-sand bg-card/50 px-6 py-14 text-center">
      <p className="font-serif text-xl text-charcoal">{title}</p>
      {message && <p className="mx-auto mt-2 max-w-md text-sm text-muted">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-bad/30 bg-bad-soft px-5 py-4 text-sm text-bad">
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="rounded-full border border-bad/40 px-4 py-1.5 text-xs font-semibold hover:bg-bad/10">
          Try again
        </button>
      )}
    </div>
  );
}

/** Accessible modal: Escape / backdrop to close, focus stays inside via autofocus on panel. */
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  const width = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size];
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center">
      <div className="fade-in absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`pop-in relative w-full ${width} rounded-[1.5rem] border border-sand bg-card shadow-[var(--shadow-lg)]`}
      >
        <div className="flex items-center justify-between border-b border-sand px-6 py-4">
          <h2 className="font-serif text-xl font-medium text-charcoal">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-sand text-charcoal hover:border-gold">
            <CloseIcon size={16} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-sand px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onCancel, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" onClick={onCancel} className="btn btn-outline !py-2.5">Cancel</button>
          <button type="button" onClick={onConfirm} className={`btn !py-2.5 ${danger ? 'bg-bad text-white' : 'btn-primary'}`}>{confirmLabel}</button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-muted">{message}</p>
    </Modal>
  );
}

export function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-2">
      <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)} className="btn btn-outline !px-4 !py-2 disabled:opacity-40">Previous</button>
      {pages.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-current={n === page ? 'page' : undefined}
          className={`h-9 w-9 rounded-full text-sm font-medium transition-colors ${n === page ? 'bg-gold text-on-gold' : 'text-muted hover:bg-sand'}`}
        >
          {n}
        </button>
      ))}
      <button type="button" disabled={page === pageCount} onClick={() => onChange(page + 1)} className="btn btn-outline !px-4 !py-2 disabled:opacity-40">Next</button>
    </nav>
  );
}
