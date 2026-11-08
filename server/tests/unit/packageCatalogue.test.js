import { describe, it, expect } from 'vitest';
import { applyFilters, buildFacets, buildItem, monthsCovered, paginate, pickRelated, sortItems, startingPrice, toDetail } from '../../src/modules/packages/packageCatalogue.js';

const season = (name, startDate, endDate, pricePerPerson) => ({ name, startDate: new Date(startDate), endDate: new Date(endDate), pricePerPerson, occupancyBasis: 'double', gstIncluded: false, currency: 'INR' });

function make(n, { slug, name, destination = 'Kerala', category = 'Kerala', days = 5, hotel = '4-star', seasons = [], isDemo = false, publishedAt = '2026-10-01', hotels = [], itinerary = [] } = {}) {
  const pkg = { _id: `id${n}`, slug: slug ?? `pkg-${n}`, code: `PKG-KL-0${n}`, isDemo };
  const version = { publishedAt: new Date(publishedAt), content: { name: name ?? `Package ${n}`, destination, category, durationDays: days, nights: days - 1, hotelCategory: hotel, summary: 'Summary', hotels, itinerary }, seasons };
  return buildItem(pkg, version);
}

const peak = season('Peak', '2026-10-01', '2027-03-31', 32500);
const monsoon = season('Monsoon', '2027-06-01', '2027-09-30', 24900);

describe('monthsCovered', () => {
  it('covers Oct-Mar across a year boundary', () => {
    expect([...monthsCovered('2026-10-01', '2027-03-31')].sort((a, b) => a - b)).toEqual([1, 2, 3, 10, 11, 12]);
  });
  it('covers all 12 for a year-long range and none for an invalid range', () => {
    expect(monthsCovered('2026-11-01', '2027-10-31').size).toBe(12);
    expect(monthsCovered('2027-03-31', '2026-10-01').size).toBe(0);
  });
});

describe('startingPrice', () => {
  it('is the lowest season price, or null when none is configured', () => {
    expect(startingPrice([peak, monsoon])).toBe(24900);
    expect(startingPrice([])).toBeNull();
    expect(startingPrice([{ pricePerPerson: undefined }])).toBeNull();
  });
});

describe('applyFilters / sortItems / paginate', () => {
  const items = [
    make(1, { name: 'Munnar Houseboat', days: 6, seasons: [peak, monsoon], hotels: [{ location: 'Munnar' }] }),
    make(2, { name: 'Ooty Escape', destination: 'Tamil Nadu', category: 'South India', days: 4, hotel: '3-star', seasons: [season('Year', '2026-11-01', '2027-10-31', 17500)], isDemo: true }),
    make(3, { name: 'Grand Circuit', days: 9, hotel: '5-star', seasons: [season('Peak', '2026-10-01', '2027-03-31', 64500)], isDemo: true }),
    make(4, { name: 'Villa Retreat', days: 4, hotel: 'homestay', seasons: [], isDemo: true }),
  ];
  const names = (list) => list.map((i) => i.card.name);

  it('searches text (including itinerary/hotel places)', () => {
    expect(names(applyFilters(items, { q: 'ooty' }))).toEqual(['Ooty Escape']);
    expect(names(applyFilters(items, { q: 'munnar houseboat' }))).toEqual(['Munnar Houseboat']);
  });
  it('filters by destination (region or place)', () => {
    expect(names(applyFilters(items, { destination: 'tamil nadu' }))).toEqual(['Ooty Escape']);
    expect(names(applyFilters(items, { destination: 'Munnar' }))).toEqual(['Munnar Houseboat']);
  });
  it('filters by duration buckets and hotel category', () => {
    expect(names(applyFilters(items, { duration: ['3-4'] }))).toEqual(['Ooty Escape', 'Villa Retreat']);
    expect(names(applyFilters(items, { duration: ['7-9'], hotelCategory: ['5-star'] }))).toEqual(['Grand Circuit']);
  });
  it('filters by budget and excludes unpriced packages when a budget is set', () => {
    expect(names(applyFilters(items, { minPrice: 20000, maxPrice: 40000 }))).toEqual(['Munnar Houseboat']);
    expect(names(applyFilters(items, { maxPrice: 100000 }))).not.toContain('Villa Retreat');
    expect(names(applyFilters(items, {}))).toContain('Villa Retreat');
  });
  it('filters by travel month', () => {
    expect(names(applyFilters(items, { month: 7 }))).toEqual(['Munnar Houseboat', 'Ooty Escape']);
    expect(names(applyFilters(items, { month: 12 }))).toEqual(['Munnar Houseboat', 'Ooty Escape', 'Grand Circuit']);
  });
  it('sorts: price asc puts unpriced last, desc likewise, duration asc, recommended puts real before demo', () => {
    expect(names(sortItems(items, 'price_asc'))).toEqual(['Ooty Escape', 'Munnar Houseboat', 'Grand Circuit', 'Villa Retreat']);
    expect(names(sortItems(items, 'price_desc'))).toEqual(['Grand Circuit', 'Munnar Houseboat', 'Ooty Escape', 'Villa Retreat']);
    expect(names(sortItems(items, 'duration'))[3]).toBe('Grand Circuit');
    expect(names(sortItems(items, 'recommended'))[0]).toBe('Munnar Houseboat');
  });
  it('paginates and clamps the page', () => {
    const { slice, meta } = paginate(items, 2, 3);
    expect(slice).toHaveLength(1);
    expect(meta).toEqual({ page: 2, limit: 3, total: 4, totalPages: 2 });
    expect(paginate(items, 99, 3).meta.page).toBe(2);
    expect(paginate([], 1, 3).meta).toMatchObject({ total: 0, totalPages: 1 });
  });
});

describe('card, facets, detail', () => {
  it('marks unpriced packages as priceOnRequest and never invents a price', () => {
    const item = make(4, { seasons: [] });
    expect(item.card.startingPrice).toBeNull();
    expect(item.card.priceOnRequest).toBe(true);
  });
  it('builds facets from the data', () => {
    const f = buildFacets([make(1, { days: 6, seasons: [peak] }), make(2, { days: 4, hotel: '3-star', seasons: [] })]);
    expect(f.total).toBe(2);
    expect(f.durations.map((d) => d.value)).toEqual(['3-4', '5-6']);
    expect(f.price).toEqual({ min: 32500, max: 32500 });
    expect(f.hotelCategories).toEqual([{ value: '3-star', count: 1 }, { value: '4-star', count: 1 }]);
  });
  it('detail exposes only whitelisted fields and related excludes self', () => {
    const a = make(1, { seasons: [peak] });
    const b = make(2, { seasons: [monsoon] });
    const related = pickRelated(a, [a, b], 3);
    expect(related.map((c) => c.id)).toEqual(['id2']);
    const detail = toDetail(a, related);
    expect(detail.seasons[0]).toMatchObject({ name: 'Peak', pricePerPerson: 32500, gstIncluded: false, occupancyBasis: 'double' });
    expect(detail).not.toHaveProperty('createdBy');
    expect(detail).not.toHaveProperty('revision');
  });
});
