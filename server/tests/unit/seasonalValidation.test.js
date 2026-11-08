import { describe, it, expect } from 'vitest';
import { validateSeasonalPeriods } from '../../src/modules/packages/packageCms.service.js';

describe('Seasonal pricing engine validation', () => {
  it('accepts non-overlapping valid seasons', () => {
    const seasons = [
      { name: 'Peak Season', startDate: '2026-10-01', endDate: '2027-03-31', pricePerPerson: 32500 },
      { name: 'Monsoon Season', startDate: '2027-06-01', endDate: '2027-09-30', pricePerPerson: 24900 },
    ];
    expect(() => validateSeasonalPeriods(seasons)).not.toThrow();
  });

  it('rejects overlapping seasons', () => {
    const overlapping = [
      { name: 'Season 1', startDate: '2026-10-01', endDate: '2027-01-31', pricePerPerson: 30000 },
      { name: 'Season 2', startDate: '2027-01-15', endDate: '2027-03-31', pricePerPerson: 28000 },
    ];
    expect(() => validateSeasonalPeriods(overlapping)).toThrow(/Overlapping season dates detected/);
  });

  it('rejects end date before start date', () => {
    const invalid = [
      { name: 'Bad Dates', startDate: '2027-05-10', endDate: '2027-05-01', pricePerPerson: 25000 },
    ];
    expect(() => validateSeasonalPeriods(invalid)).toThrow(/end date must be on or after start date/);
  });

  it('rejects non-integer or negative prices', () => {
    const negative = [
      { name: 'Negative', startDate: '2027-01-01', endDate: '2027-02-01', pricePerPerson: -500 },
    ];
    expect(() => validateSeasonalPeriods(negative)).toThrow(/price must be a non-negative integer/);

    const fractional = [
      { name: 'Fractional', startDate: '2027-01-01', endDate: '2027-02-01', pricePerPerson: 19999.5 },
    ];
    expect(() => validateSeasonalPeriods(fractional)).toThrow(/price must be a non-negative integer/);
  });
});

