import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Centralised theme management.
 *  - Source of truth in the DOM is <html data-theme="light|dark">, which index.html
 *    sets before first paint (no flash). This provider keeps React in sync with it.
 *  - Preference is stored in localStorage under THEME_KEY. Until the user chooses,
 *    the operating-system preference is followed (and tracked live).
 *  - Keep THEME_KEY and the admin rule in sync with the inline script in index.html.
 */
export const THEME_KEY = 'travelos-theme';

// The admin panel is fully themed, so it follows the same preference as the public site.
// (Set to false to pin the admin to light.)
const ADMIN_THEMED = true;

const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

const readStored = () => {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
};

const systemTheme = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

export function ThemeProvider({ children }) {
  const { pathname } = useLocation();
  const [preference, setPreference] = useState(() => readStored() ?? systemTheme());
  const [hasChoice, setHasChoice] = useState(() => readStored() !== null);

  const onAdminRoute = /^\/admin(\/|$)/.test(pathname);
  const applied = onAdminRoute && !ADMIN_THEMED ? 'light' : preference;

  // Apply to <html> before paint
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', applied);
  }, [applied]);

  // Enable colour transitions only after the first paint
  useEffect(() => {
    const id = requestAnimationFrame(() => document.documentElement.classList.add('theme-ready'));
    return () => cancelAnimationFrame(id);
  }, []);

  // Follow the OS only while the visitor has not made an explicit choice
  useEffect(() => {
    if (hasChoice || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setPreference(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [hasChoice]);

  // Keep several open tabs in sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === THEME_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
        setPreference(e.newValue);
        setHasChoice(true);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setTheme = useCallback((next) => {
    if (next !== 'light' && next !== 'dark') return;
    setPreference(next);
    setHasChoice(true);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage unavailable (private mode) — theme still applies for this session */
    }
  }, []);

  const toggleTheme = useCallback(() => setTheme(applied === 'dark' ? 'light' : 'dark'), [applied, setTheme]);

  const value = useMemo(
    () => ({ theme: applied, isDark: applied === 'dark', setTheme, toggleTheme }),
    [applied, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
