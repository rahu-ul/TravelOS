import { SunIcon, MoonIcon } from './Icons.jsx';
import { useTheme } from '../../theme/ThemeProvider.jsx';

/**
 * Sun/moon switch. `tone="onImage"` is for the transparent navbar over the hero
 * photograph; otherwise it follows the page theme.
 */
export default function ThemeToggle({ tone = 'auto', className = '' }) {
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  const toneClass =
    tone === 'onImage'
      ? 'border-white/35 bg-white/10 text-white hover:bg-white/20'
      : 'border-sand bg-card text-charcoal hover:border-gold';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={label}
      title={label}
      onClick={toggleTheme}
      className={`relative inline-grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border backdrop-blur transition-colors ${toneClass} ${className}`}
    >
      <span
        className={`col-start-1 row-start-1 transition-all duration-300 motion-reduce:transition-none ${
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'
        }`}
      >
        <MoonIcon size={18} />
      </span>
      <span
        className={`col-start-1 row-start-1 transition-all duration-300 motion-reduce:transition-none ${
          isDark ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'
        }`}
      >
        <SunIcon size={18} />
      </span>
    </button>
  );
}
