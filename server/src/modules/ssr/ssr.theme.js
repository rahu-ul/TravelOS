import { createHash } from 'node:crypto';
import helmet from 'helmet';

/**
 * Theme support for the server-rendered package page.
 *
 * The React app and this page share one visitor preference through the same
 * localStorage key. Keep THEME_KEY in sync with client/src/theme/ThemeProvider.jsx
 * and client/index.html.
 *
 * No flash of the wrong theme: THEME_SCRIPT is inlined in <head>, before any
 * stylesheet or body content, and sets <html data-theme> synchronously.
 *
 * CSP: the app uses helmet() whose default policy forbids inline scripts. Rather
 * than loosening the policy globally, the SSR routes get a policy that allows
 * exactly this one script by its SHA-256 hash (getSsrCspHeader).
 */
export const THEME_KEY = 'travelos-theme';

export const THEME_SCRIPT = `(function(){
var KEY='${THEME_KEY}',root=document.documentElement;
root.classList.add('js');
function stored(){try{var v=localStorage.getItem(KEY);return v==='light'||v==='dark'?v:null}catch(e){return null}}
function system(){return window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}
function sync(t){
var b=document.querySelectorAll('[data-theme-toggle]');
for(var i=0;i<b.length;i++){b[i].setAttribute('aria-checked',t==='dark'?'true':'false');b[i].setAttribute('aria-label',t==='dark'?'Switch to light mode':'Switch to dark mode');b[i].setAttribute('title',t==='dark'?'Light mode':'Dark mode');}
}
function apply(t){root.setAttribute('data-theme',t);sync(t)}
apply(stored()||system());
document.addEventListener('DOMContentLoaded',function(){sync(root.getAttribute('data-theme'));requestAnimationFrame(function(){root.classList.add('theme-ready')})});
document.addEventListener('click',function(e){
var el=e.target&&e.target.closest?e.target.closest('[data-theme-toggle]'):null;
if(!el)return;
var next=root.getAttribute('data-theme')==='dark'?'light':'dark';
try{localStorage.setItem(KEY,next)}catch(x){}
apply(next);
});
window.addEventListener('storage',function(e){if(e.key===KEY&&(e.newValue==='light'||e.newValue==='dark'))apply(e.newValue)});
if(window.matchMedia){var mq=window.matchMedia('(prefers-color-scheme: dark)');var on=function(e){if(!stored())apply(e.matches?'dark':'light')};if(mq.addEventListener)mq.addEventListener('change',on);else if(mq.addListener)mq.addListener(on)}
})();`;

export const THEME_SCRIPT_HASH = `sha256-${createHash('sha256').update(THEME_SCRIPT, 'utf8').digest('base64')}`;

/** helmet's default CSP with script-src widened by exactly one hash. */
export function getSsrCspHeader() {
  const directives = { ...helmet.contentSecurityPolicy.getDefaultDirectives() };
  directives['script-src'] = ["'self'", `'${THEME_SCRIPT_HASH}'`];
  return Object.entries(directives)
    .map(([name, values]) => (values.length ? `${name} ${values.join(' ')}` : name))
    .join(';');
}

// ── Design tokens (identical values to client/src/index.css) ───────────────
const LIGHT_VARS = `
  color-scheme: light;
  --bg: #F7F8F5; --bg-alt: #EEF3EC; --card: #FFFFFF; --line: #E1E6DE;
  --text: #252A27; --muted: #636B62; --forest: #183F35; --olive: #66704D;
  --gold: #C5A46D; --accent: #183F35; --btn-bg: #183F35; --btn-fg: #F7F8F5;
  --on-gold: #17201A; --footer: #102F28; --header: rgb(247 248 245 / 0.96);
  --shadow-sm: 0 1px 2px rgb(24 63 53 / 0.06);
  --shadow-md: 0 10px 30px -12px rgb(24 63 53 / 0.18);
  --shadow-lg: 0 24px 60px -20px rgb(16 47 40 / 0.28);`;

const DARK_VARS = `
  color-scheme: dark;
  --bg: #101713; --bg-alt: #17211B; --card: #202B23; --line: #344137;
  --text: #F3F0E8; --muted: #B4B9B0; --forest: #244B3D; --olive: #A3AE86;
  --gold: #C5A46D; --accent: #C5A46D; --btn-bg: #C5A46D; --btn-fg: #17201A;
  --on-gold: #17201A; --footer: #0B110D; --header: rgb(16 23 19 / 0.94);
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.4);
  --shadow-md: 0 12px 30px -12px rgb(0 0 0 / 0.6);
  --shadow-lg: 0 28px 60px -20px rgb(0 0 0 / 0.7);`;

export const PAGE_CSS = `
:root, [data-theme="light"] {${LIGHT_VARS}
}
[data-theme="dark"] {${DARK_VARS}
}
/* Without JavaScript the page still follows the operating-system preference */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {${DARK_VARS}
  }
}

*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; background: var(--bg); -webkit-text-size-adjust: 100%; }
body {
  margin: 0; background: var(--bg); color: var(--text); line-height: 1.6;
  font-family: "Inter", "Helvetica Neue", Arial, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
html.theme-ready body, html.theme-ready .card, html.theme-ready .site-header, html.theme-ready .site-footer {
  transition: background-color .28s ease, color .28s ease, border-color .28s ease;
}
h1, h2, h3, .serif { font-family: "Playfair Display", Georgia, "Times New Roman", serif; font-weight: 500; }
a { color: inherit; }
:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
img { max-width: 100%; }
.container { width: 100%; max-width: 80rem; margin: 0 auto; padding: 0 1rem; }
@media (min-width: 640px) { .container { padding: 0 1.5rem; } }
@media (min-width: 1024px) { .container { padding: 0 2rem; } }
.skip { position: absolute; left: -9999px; }
.skip:focus { left: 1rem; top: 1rem; z-index: 100; background: var(--card); padding: .5rem 1rem; border-radius: 999px; }

/* Header */
.site-header {
  position: sticky; top: 0; z-index: 50; background: var(--header);
  -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px);
  border-bottom: 1px solid color-mix(in srgb, var(--line) 70%, transparent);
}
.header-row { display: flex; align-items: center; justify-content: space-between; height: 4rem; gap: 1rem; }
@media (min-width: 768px) { .header-row { height: 5rem; } }
.brand { display: inline-flex; align-items: center; gap: .625rem; text-decoration: none; color: var(--text); }
.brand svg { color: var(--gold); flex: none; }
.brand-name { display: block; font-family: "Playfair Display", Georgia, serif; font-size: 1.45rem; font-weight: 500; letter-spacing: -.01em; line-height: 1; }
.brand-tag { display: block; margin-top: .25rem; font-size: 9px; font-weight: 500; letter-spacing: .22em; text-transform: uppercase; opacity: .7; }
.nav { display: none; gap: 2rem; }
.nav a { position: relative; font-size: .875rem; font-weight: 500; color: color-mix(in srgb, var(--text) 70%, transparent); text-decoration: none; padding: .25rem 0; }
.nav a::after { content: ""; position: absolute; left: 0; right: 0; bottom: -4px; height: 1px; background: var(--gold); transform: scaleX(0); transform-origin: left; transition: transform .3s ease; }
.nav a:hover, .nav a[aria-current="page"] { color: var(--text); }
.nav a:hover::after, .nav a[aria-current="page"]::after { transform: scaleX(1); }
.header-actions { display: flex; align-items: center; gap: .625rem; }
@media (min-width: 1024px) { .nav { display: flex; } .mnav { display: none !important; } }

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: .5rem; border-radius: 999px;
  padding: .75rem 1.5rem; font: 600 .875rem/1.2 "Inter", system-ui, sans-serif; text-decoration: none;
  border: 1px solid transparent; cursor: pointer; white-space: nowrap;
  transition: transform .2s ease, box-shadow .2s ease, filter .2s ease, background-color .2s ease, border-color .2s ease;
}
.btn:hover { transform: translateY(-1px); }
.btn-gold { background: var(--gold); color: var(--on-gold); }
.btn-primary { background: var(--btn-bg); color: var(--btn-fg); }
.btn-primary:hover, .btn-gold:hover { filter: brightness(1.08); box-shadow: var(--shadow-md); }
.btn-outline { border-color: color-mix(in srgb, var(--text) 28%, transparent); color: var(--text); }
.btn-outline:hover { border-color: var(--gold); background: color-mix(in srgb, var(--text) 6%, transparent); }
.btn-block { width: 100%; }
.header-cta { display: none; padding: .625rem 1.5rem; }
@media (min-width: 1024px) { .header-cta { display: inline-flex; } }

/* Theme toggle (needs JS, so hidden until the script has run) */
.theme-toggle {
  display: none; place-items: center; width: 2.5rem; height: 2.5rem; padding: 0; border-radius: 999px;
  border: 1px solid var(--line); background: var(--card); color: var(--text); cursor: pointer;
  transition: border-color .2s ease;
}
html.js .theme-toggle { display: inline-grid; }
.theme-toggle:hover { border-color: var(--gold); }
.theme-toggle svg { grid-area: 1 / 1; transition: transform .3s ease, opacity .3s ease; }
.theme-toggle .i-moon { opacity: 0; transform: rotate(-90deg) scale(.5); }
[data-theme="dark"] .theme-toggle .i-sun { opacity: 0; transform: rotate(90deg) scale(.5); }
[data-theme="dark"] .theme-toggle .i-moon { opacity: 1; transform: none; }

/* Mobile menu (no JavaScript: native <details>) */
.mnav { position: relative; }
.mnav summary {
  list-style: none; display: grid; place-items: center; width: 2.5rem; height: 2.5rem; border-radius: 999px;
  border: 1px solid var(--line); background: var(--card); cursor: pointer;
}
.mnav summary::-webkit-details-marker { display: none; }
.mnav-panel {
  position: absolute; right: 0; top: calc(100% + .75rem); width: min(20rem, calc(100vw - 2rem));
  background: var(--card); border: 1px solid var(--line); border-radius: 1.25rem; padding: .5rem 1.25rem 1.25rem;
  box-shadow: var(--shadow-lg);
}
.mnav-panel a.l { display: block; padding: .875rem 0; border-bottom: 1px solid var(--line); text-decoration: none; font: 500 1.2rem "Playfair Display", Georgia, serif; }
.mnav-panel .btn { margin-top: 1rem; }

/* Page */
main { padding: 1.25rem 0 4rem; }
.crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; margin-bottom: 1.25rem; font-size: .75rem; color: var(--muted); }
.crumbs a { text-decoration: none; }
.crumbs a:hover { color: var(--accent); }
.crumbs .sep { color: var(--gold); }
.crumbs [aria-current] { color: var(--text); }
.layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 2.5rem; }
@media (min-width: 1024px) { .layout { grid-template-columns: minmax(0, 1fr) 22rem; } }
@media (min-width: 1280px) { .layout { grid-template-columns: minmax(0, 1fr) 24rem; } }

.meta { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem 1.25rem; margin-bottom: .75rem; font-size: .875rem; color: var(--muted); }
.meta .ic { display: inline-flex; align-items: center; gap: .375rem; }
.meta svg { color: var(--gold); }
.badge { display: inline-flex; align-items: center; border-radius: 999px; padding: .125rem .75rem; font-size: .75rem; font-weight: 500; background: color-mix(in srgb, var(--gold) 18%, transparent); border: 1px solid color-mix(in srgb, var(--gold) 45%, transparent); color: var(--text); }
h1 { margin: 0 0 1.5rem; font-size: clamp(1.9rem, 4.2vw, 3rem); line-height: 1.1; letter-spacing: -.01em; }

.hero { overflow: hidden; border-radius: 1.75rem; box-shadow: var(--shadow-md); background: var(--line); }
.hero img { display: block; width: 100%; height: auto; aspect-ratio: 16 / 10; object-fit: cover; }
.thumbs { display: flex; gap: .75rem; margin-top: .75rem; overflow-x: auto; padding-bottom: .25rem; }
.thumbs img { display: block; width: 6rem; height: 4rem; object-fit: cover; border-radius: .75rem; flex: none; }

.tabs {
  position: sticky; top: 4rem; z-index: 20; display: flex; gap: .25rem; overflow-x: auto; margin-top: 2rem;
  background: color-mix(in srgb, var(--bg) 95%, transparent); border-bottom: 1px solid var(--line);
  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
}
@media (min-width: 768px) { .tabs { top: 5rem; } }
.tabs a { white-space: nowrap; padding: .875rem 1rem; font-size: .875rem; font-weight: 500; color: var(--muted); text-decoration: none; border-bottom: 2px solid transparent; }
.tabs a:hover { color: var(--text); border-bottom-color: var(--gold); }
section[id] { scroll-margin-top: 9.5rem; }
.sections > section { margin-top: 3.5rem; }
.sections > section:first-child { margin-top: 2.5rem; }
h2 { margin: 0 0 1.25rem; font-size: clamp(1.5rem, 3vw, 1.875rem); line-height: 1.2; }
.lead { margin: 0; max-width: 48rem; font-size: 1.125rem; line-height: 1.7; color: var(--muted); }

.card { background: var(--card); border: 1px solid var(--line); border-radius: 1.4rem; }

/* Itinerary accordion */
.days { border-top: 1px solid var(--line); }
.day { border-bottom: 1px solid var(--line); }
.day summary { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.25rem 0; cursor: pointer; list-style: none; }
.day summary::-webkit-details-marker { display: none; }
.day summary h3 { margin: 0; font-size: 1.125rem; }
.day summary:hover h3 { color: var(--accent); }
.day .plus { display: grid; place-items: center; flex: none; width: 2rem; height: 2rem; border: 1px solid var(--line); border-radius: 999px; color: var(--gold); transition: transform .3s ease; }
.day[open] .plus { transform: rotate(45deg); }
.day p { margin: 0; padding: 0 3rem 1.25rem 0; color: var(--muted); }

.two { display: grid; gap: 1.25rem; }
@media (min-width: 768px) { .two { grid-template-columns: 1fr 1fr; } }
.box { padding: 1.5rem; }
.box h3 { margin: 0 0 1rem; font-size: 1.125rem; }
.ticks { margin: 0; padding: 0; list-style: none; display: grid; gap: .75rem; font-size: .875rem; color: var(--muted); }
.ticks li { display: flex; gap: .75rem; align-items: flex-start; }
.tick { flex: none; margin-top: .125rem; display: grid; place-items: center; width: 1.25rem; height: 1.25rem; border-radius: 999px; font-size: 11px; font-weight: 700; background: var(--forest); color: #fff; }
.tick.no { background: var(--line); color: var(--muted); }
.hotels { display: grid; gap: .75rem; margin: 0; padding: 0; list-style: none; }
@media (min-width: 640px) { .hotels { grid-template-columns: 1fr 1fr; } }
.hotels li { padding: 1rem 1.25rem; }
.hotels strong { display: block; font-weight: 600; }
.hotels span { font-size: .8125rem; color: var(--muted); }

.rates { overflow: hidden; }
.rate { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1rem 1.5rem; border-bottom: 1px solid var(--line); }
.rate:last-child { border-bottom: 0; }
.rate .amt { font: 600 1.25rem "Playfair Display", Georgia, serif; color: var(--accent); white-space: nowrap; }
.rate .amt small { font: 400 .75rem "Inter", sans-serif; color: var(--muted); margin-left: .25rem; }
.disclaimer { margin: .75rem 0 0; font-size: .75rem; color: var(--muted); }

/* Enquiry card */
.enquiry { overflow: hidden; box-shadow: var(--shadow-lg); border-radius: 1.75rem; }
@media (min-width: 1024px) { .enquiry { position: sticky; top: 6.5rem; } }
.price-box { background: var(--forest); color: #fff; padding: 1.5rem; }
.price-box .lbl { font-size: .875rem; color: rgb(255 255 255 / .75); }
.price-box .val { margin: .25rem 0; font: 500 2.25rem/1.1 "Playfair Display", Georgia, serif; color: var(--gold); }
.price-box .sub { font-size: .75rem; color: rgb(255 255 255 / .75); }
.enquiry-body { padding: 1.5rem; display: grid; gap: 1rem; }
.enquiry-body h4 { margin: 0 0 .25rem; font-size: .8125rem; font-weight: 600; color: var(--olive); }
.enquiry-body .rate { padding: .5rem 0; border-bottom: 1px solid var(--line); font-size: .875rem; }
.enquiry-body .rate .amt { font-size: 1rem; }
.fine { margin: 0; text-align: center; font-size: .75rem; color: var(--muted); }

/* Footer */
.site-footer { background: var(--footer); color: #F3F0E8; margin-top: 2rem; }
.footer-grid { display: grid; gap: 2.5rem; padding: 3.5rem 0; }
@media (min-width: 768px) { .footer-grid { grid-template-columns: 2fr 1fr 1fr; } }
.site-footer .brand { color: #F3F0E8; }
.site-footer p { margin: 1.25rem 0 0; max-width: 24rem; font-size: .875rem; color: rgb(255 255 255 / .65); }
.site-footer h4 { margin: 0 0 1rem; font: 500 1.125rem "Playfair Display", Georgia, serif; color: var(--gold); }
.site-footer ul { margin: 0; padding: 0; list-style: none; display: grid; gap: .625rem; }
.site-footer li a { font-size: .875rem; color: rgb(255 255 255 / .65); text-decoration: none; }
.site-footer li a:hover { color: #fff; }
.copyright { border-top: 1px solid rgb(255 255 255 / .1); padding: 1.25rem 0; font-size: .75rem; color: rgb(255 255 255 / .55); text-align: center; }
.copyright p { margin: 0; max-width: none; font-size: .75rem; color: inherit; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { transition: none !important; animation: none !important; }
}
`;
