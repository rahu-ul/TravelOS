import { describe, it, expect } from 'vitest';
import { extractRequirementsRuleBased, generateDraftReply } from '../../src/modules/enquiries/ai.service.js';

describe('AI Assistant Extraction & Draft Engine', () => {
  it('extracts requirements correctly from sample brief query', () => {
    const rawMessage = 'Hi, 2 adults and 1 kid, Kerala 5-6 nights in December, budget around 1.2 lakh total, houseboat a must.';
    const result = extractRequirementsRuleBased(rawMessage);

    expect(result.adults).toBe(2);
    expect(result.children).toBe(1);
    expect(result.destination).toBe('Kerala');
    expect(result.nightsMin).toBe(5);
    expect(result.nightsMax).toBe(6);
    expect(result.travelPeriod).toBe('December');
    expect(result.budgetInr).toBe(120000);
    expect(result.mustHaves).toContain('Houseboat stay');
  });

  it('generates a professional draft reply containing real recommendations and twin-sharing disclaimer', () => {
    const extracted = {
      adults: 2,
      children: 1,
      destination: 'Kerala',
      travelPeriod: 'December',
      nightsMin: 5,
      nightsMax: 6,
      mustHaves: ['Houseboat stay'],
    };

    const mockRecs = [
      {
        packageCode: 'PKG-KL-07',
        packageName: 'Munnar, Thekkady and Alleppey Houseboat',
        startingPrice: 32500,
        reason: 'Includes private houseboat cruise and matches 5-6 nights duration.',
      },
    ];

    const draft = generateDraftReply('Sunil Sharma', extracted, mockRecs);

    expect(draft).toContain('Dear Sunil,');
    expect(draft).toContain('Munnar, Thekkady and Alleppey Houseboat');
    expect(draft).toContain('32,500');
    expect(draft).toContain('twin-sharing');
    expect(draft).toContain('GST extra');
    expect(draft).toContain('Houseboat stay');
  });
});

