import { z } from 'zod';
import { HOTEL_CATEGORIES } from '../../config/constants.js';
import { DURATION_KEYS, SORT_OPTIONS } from './packageCatalogue.js';

// Public query strings are user-controlled URLs (shared links, old bookmarks). Invalid values are ignored
// (.catch) instead of returning 400, so a stale link still renders a page.
const csvOf = (allowed) =>
  z
    .preprocess((v) => {
      const list = Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : [];
      return [...new Set(list.map((s) => String(s).trim()).filter((s) => allowed.includes(s)))];
    }, z.array(z.string()))
    .catch([]);

const optionalInt = (min, max) => z.coerce.number().int().min(min).max(max).optional().catch(undefined);

export const listPackagesQuery = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  destination: z.string().trim().max(80).optional().catch(undefined),
  duration: csvOf(DURATION_KEYS),
  hotelCategory: csvOf(HOTEL_CATEGORIES),
  minPrice: optionalInt(0, 10_000_000),
  maxPrice: optionalInt(0, 10_000_000),
  month: optionalInt(1, 12),
  sort: z.enum(SORT_OPTIONS).catch('recommended'),
  page: z.coerce.number().int().min(1).max(1000).catch(1),
  limit: z.coerce.number().int().min(1).max(48).catch(6),
});
