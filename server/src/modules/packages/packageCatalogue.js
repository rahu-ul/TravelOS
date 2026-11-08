// Pure catalogue logic for the PUBLIC website (no database, no Express, no imports).
// Keeping it pure means it can be unit-tested without MongoDB and reused by SSR through the service layer.
//
// An "item" is the in-memory join of one published Package + its published PackageVersion:
//   { card, version, seasons, months, places, haystack, publishedAt }
// `card` is the only part that is ever sent to the browser from the listing endpoints.

export const DURATION_BUCKETS = Object.freeze({
  '1-2': { label: '1 – 2 days', min: 1, max: 2 },
  '3-4': { label: '3 – 4 days', min: 3, max: 4 },
  '5-6': { label: '5 – 6 days', min: 5, max: 6 },
  '7-9': { label: '7 – 9 days', min: 7, max: 9 },
  '10+': { label: '10+ days', min: 10, max: Infinity },
});
export const DURATION_KEYS = Object.keys(DURATION_BUCKETS);
export const SORT_OPTIONS = Object.freeze(['recommended', 'price_asc', 'price_desc', 'duration']);

const lc = (value) => String(value ?? '').toLowerCase().trim();
const byName = (a, b) => a.card.name.localeCompare(b.card.name);
const time = (d) => (d ? new Date(d).getTime() || 0 : 0);

/** Calendar months (1-12, UTC) touched by a date range. A range of a year or more covers all twelve. */
export function monthsCovered(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const months = new Set();
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return months;
  const cursor = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), 1));
  const last = Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), 1);
  while (cursor.getTime() <= last && months.size < 12) {
    months.add(cursor.getUTCMonth() + 1);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

/** Lowest per-person season price, or null when no season has a usable price ("Price on request"). */
export function startingPrice(seasons = []) {
  const prices = seasons.map((s) => s?.pricePerPerson).filter((p) => Number.isFinite(p) && p >= 0);
  return prices.length ? Math.min(...prices) : null;
}

// Place names that can be searched / used as destination filters: hotel locations and the location label.
function extractPlaces(content) {
  const raw = [content.location?.label, ...(content.hotels ?? []).map((h) => h.location)];
  const tokens = raw
    .filter(Boolean)
    .flatMap((text) => String(text).split(/\s*(?:\/|,|–|\s-\s)\s*/))
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && t.length <= 40);
  const seen = new Map();
  for (const t of tokens) if (!seen.has(lc(t))) seen.set(lc(t), t);
  return [...seen.values()];
}

/** Join a package identity row and its published version into a catalogue item. */
export function buildItem(pkg, version) {
  const c = version.content ?? {};
  const seasons = [...(version.seasons ?? [])].sort((a, b) => time(a.startDate) - time(b.startDate));
  const price = startingPrice(seasons);
  const months = new Set();
  for (const s of seasons) monthsCovered(s.startDate, s.endDate).forEach((m) => months.add(m));
  const places = extractPlaces(c);

  const card = {
    id: String(pkg._id),
    slug: pkg.slug,
    code: pkg.code,
    name: c.name,
    destination: c.destination ?? null,
    category: c.category ?? null,
    durationDays: c.durationDays ?? null,
    nights: c.nights ?? null,
    hotelCategory: c.hotelCategory ?? null,
    summary: c.summary ?? null,
    heroImage: c.heroImage?.url ? { url: c.heroImage.url, alt: c.heroImage.alt || c.name } : null,
    startingPrice: price,
    currency: 'INR',
    priceOnRequest: price === null,
    isDemo: Boolean(pkg.isDemo),
  };

  const haystack = lc(
    [c.name, c.destination, c.category, c.summary, ...places, ...(c.itinerary ?? []).map((i) => i.title)].join(' ')
  );
  return { card, version, seasons, months, places, haystack, publishedAt: version.publishedAt ?? null };
}

function matchesDestination(item, destination) {
  const d = lc(destination);
  if (!d) return true;
  const c = item.card;
  return lc(c.destination) === d || lc(c.category) === d || item.places.some((p) => lc(p) === d) || lc(c.name).includes(d);
}

/**
 * Apply the public filters. Every filter is optional.
 * f = { q, destination, duration: string[], hotelCategory: string[], minPrice, maxPrice, month }
 */
export function applyFilters(items, f = {}) {
  const terms = lc(f.q).split(/\s+/).filter(Boolean);
  const buckets = (f.duration ?? []).map((k) => DURATION_BUCKETS[k]).filter(Boolean);
  const hotels = f.hotelCategory ?? [];
  const hasMin = Number.isFinite(f.minPrice);
  const hasMax = Number.isFinite(f.maxPrice);

  return items.filter((item) => {
    const c = item.card;
    if (terms.length && !terms.every((t) => item.haystack.includes(t))) return false;
    if (!matchesDestination(item, f.destination)) return false;
    if (buckets.length && !buckets.some((b) => c.durationDays >= b.min && c.durationDays <= b.max)) return false;
    if (hotels.length && !hotels.includes(c.hotelCategory)) return false;
    if (hasMin || hasMax) {
      if (c.startingPrice === null) return false; // "Price on request" packages cannot satisfy a budget
      if (hasMin && c.startingPrice < f.minPrice) return false;
      if (hasMax && c.startingPrice > f.maxPrice) return false;
    }
    if (f.month && !item.months.has(f.month)) return false;
    return true;
  });
}

const cmp = (a, b) => (a === b ? 0 : a < b ? -1 : 1);

export function sortItems(items, sort = 'recommended') {
  const list = [...items];
  const priceKeyAsc = (i) => i.card.startingPrice ?? Infinity; // unpriced packages always last
  const priceKeyDesc = (i) => i.card.startingPrice ?? -Infinity;
  const durationKey = (i) => i.card.durationDays ?? Infinity;
  switch (sort) {
    case 'price_asc':
      return list.sort((a, b) => cmp(priceKeyAsc(a), priceKeyAsc(b)) || byName(a, b));
    case 'price_desc':
      return list.sort((a, b) => cmp(priceKeyDesc(b), priceKeyDesc(a)) || byName(a, b));
    case 'duration':
      return list.sort((a, b) => cmp(durationKey(a), durationKey(b)) || byName(a, b));
    default: // recommended: real client packages first, then most recently published
      return list.sort(
        (a, b) => Number(a.card.isDemo) - Number(b.card.isDemo) || time(b.publishedAt) - time(a.publishedAt) || byName(a, b)
      );
  }
}

export function paginate(items, page = 1, limit = 6) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * limit;
  return { slice: items.slice(start, start + limit), meta: { page: current, limit, total, totalPages } };
}

/** Filter options derived from real published data, so the sidebar never offers a filter that cannot match. */
export function buildFacets(items) {
  const dest = new Map();
  const hotelCounts = new Map();
  const durationCounts = Object.fromEntries(DURATION_KEYS.map((k) => [k, 0]));
  const monthCounts = Array.from({ length: 12 }, () => 0);
  const prices = [];

  for (const item of items) {
    const c = item.card;
    const labels = new Map();
    for (const v of [c.destination, c.category, ...item.places]) if (v) labels.set(lc(v), v);
    for (const [key, value] of labels) {
      const entry = dest.get(key) ?? { value, count: 0 };
      entry.count += 1;
      dest.set(key, entry);
    }
    if (c.hotelCategory) hotelCounts.set(c.hotelCategory, (hotelCounts.get(c.hotelCategory) ?? 0) + 1);
    for (const k of DURATION_KEYS) {
      const b = DURATION_BUCKETS[k];
      if (c.durationDays >= b.min && c.durationDays <= b.max) durationCounts[k] += 1;
    }
    item.months.forEach((m) => (monthCounts[m - 1] += 1));
    if (c.startingPrice !== null) prices.push(c.startingPrice);
  }

  return {
    total: items.length,
    destinations: [...dest.values()].sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)).slice(0, 12),
    durations: DURATION_KEYS.map((k) => ({ value: k, label: DURATION_BUCKETS[k].label, count: durationCounts[k] })).filter((d) => d.count > 0),
    hotelCategories: [...hotelCounts].map(([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value)),
    months: monthCounts.map((count, i) => ({ value: i + 1, count })),
    price: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : { min: null, max: null },
  };
}

/** Same category first, then same destination, then the rest; never the package itself. */
export function pickRelated(item, others, count = 3) {
  const score = (o) => (o.card.category && o.card.category === item.card.category ? 2 : 0) + (o.card.destination && o.card.destination === item.card.destination ? 1 : 0);
  return others
    .filter((o) => o.card.id !== item.card.id)
    .sort((a, b) => score(b) - score(a) || byName(a, b))
    .slice(0, count)
    .map((o) => o.card);
}

const iso = (d) => (d ? new Date(d).toISOString() : null);

/** Full public detail DTO. Only whitelisted fields leave the server (no createdBy, revision, changeNote...). */
export function toDetail(item, related = []) {
  const c = item.version.content ?? {};
  return {
    ...item.card,
    description: c.description ?? null,
    itinerary: [...(c.itinerary ?? [])].sort((a, b) => a.day - b.day).map(({ day, title, description }) => ({ day, title, description: description ?? null })),
    hotels: (c.hotels ?? []).map(({ name, location, category, nights }) => ({ name, location: location ?? null, category: category ?? null, nights: nights ?? null })),
    inclusions: c.inclusions ?? [],
    exclusions: c.exclusions ?? [],
    gallery: (c.gallery ?? []).filter((g) => g?.url).map((g) => ({ url: g.url, alt: g.alt || c.name })),
    location: c.location?.label || Number.isFinite(c.location?.lat) ? { label: c.location?.label ?? null, lat: c.location?.lat ?? null, lng: c.location?.lng ?? null } : null,
    seasons: item.seasons.map((s) => ({
      name: s.name,
      startDate: iso(s.startDate),
      endDate: iso(s.endDate),
      pricePerPerson: Number.isFinite(s.pricePerPerson) ? s.pricePerPerson : null, // null => "Price on request"
      occupancyBasis: s.occupancyBasis ?? 'double',
      gstIncluded: Boolean(s.gstIncluded),
      currency: s.currency ?? 'INR',
    })),
    seo: { title: c.seo?.title || c.name, description: c.seo?.description || c.summary || null },
    publishedAt: iso(item.publishedAt),
    related,
  };
}
