import { Package } from '../packages/package.model.js';
import { PackageVersion } from '../packages/packageVersion.model.js';
import { Enquiry } from './enquiry.model.js';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';

/**
 * Rule-based / deterministic extraction engine for local development & mock mode.
 * Handles messy inputs like "2 adults and 1 kid, Kerala 5-6 nights in December, budget around 1.2 lakh total, houseboat a must".
 */
export function extractRequirementsRuleBased(text = '', structured = {}) {
  const content = `${text} ${structured.destination || ''} ${structured.requirements || ''}`.toLowerCase();

  // Adults
  let adults = structured.adults ?? null;
  if (!adults) {
    const adultMatch = content.match(/(\d+)\s*(?:adult|pax|person|people)/i);
    if (adultMatch) adults = parseInt(adultMatch[1], 10);
  }

  // Children
  let children = structured.children ?? 0;
  if (children === 0) {
    const childMatch = content.match(/(\d+)\s*(?:child|children|kid|kids)/i);
    if (childMatch) children = parseInt(childMatch[1], 10);
  }

  // Nights
  let nightsMin = null;
  let nightsMax = null;
  const nightsRangeMatch = content.match(/(\d+)\s*[-–to]\s*(\d+)\s*(?:night|day)/i);
  if (nightsRangeMatch) {
    nightsMin = parseInt(nightsRangeMatch[1], 10);
    nightsMax = parseInt(nightsRangeMatch[2], 10);
  } else {
    const singleNightMatch = content.match(/(\d+)\s*(?:night|day)/i);
    if (singleNightMatch) {
      nightsMin = parseInt(singleNightMatch[1], 10);
      nightsMax = nightsMin;
    }
  }

  // Destination
  let destination = structured.destination || null;
  if (!destination) {
    const knownDestinations = ['alleppey', 'munnar', 'thekkady', 'wayanad', 'kovalam', 'madurai', 'ooty', 'kerala'];
    for (const d of knownDestinations) {
      if (content.includes(d)) {
        destination = d.charAt(0).toUpperCase() + d.slice(1);
        break;
      }
    }
  }

  // Travel Period / Month
  let travelPeriod = structured.travelStart ? new Date(structured.travelStart).toLocaleString('default', { month: 'long' }) : null;
  if (!travelPeriod) {
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    for (const m of months) {
      if (content.includes(m)) {
        travelPeriod = m.charAt(0).toUpperCase() + m.slice(1);
        break;
      }
    }
  }

  // Budget
  let budgetInr = structured.budget?.amount ?? null;
  if (!budgetInr) {
    const lakhMatch = content.match(/([\d.]+)\s*(?:lakh|lac|l)/i);
    if (lakhMatch) {
      budgetInr = Math.round(parseFloat(lakhMatch[1]) * 100000);
    } else {
      const numMatch = content.match(/(?:rs\.?|inr|₹|budget)?\s*([\d,]{4,})/i);
      if (numMatch) {
        const val = parseInt(numMatch[1].replace(/,/g, ''), 10);
        if (val > 1000) budgetInr = val;
      }
    }
  }

  // Must-haves
  const mustHaves = [];
  const keywords = [
    { word: 'houseboat', tag: 'Houseboat stay' },
    { word: 'ayurveda', tag: 'Ayurvedic wellness' },
    { word: 'tea', tag: 'Tea plantation visit' },
    { word: 'safari', tag: 'Wildlife safari' },
    { word: 'elephant', tag: 'Elephant spotting' },
    { word: 'beach', tag: 'Beachfront resort' },
    { word: 'treehouse', tag: 'Treehouse stay' },
  ];
  for (const k of keywords) {
    if (content.includes(k.word)) {
      mustHaves.push(k.tag);
    }
  }

  return {
    adults: adults || 2,
    children: children || 0,
    destination: destination || 'Kerala',
    nightsMin: nightsMin || 4,
    nightsMax: nightsMax || 6,
    travelPeriod: travelPeriod || 'Upcoming Season',
    budgetInr,
    mustHaves,
  };
}

/**
 * Recommend top 3 published packages based on real DB records and seasons.
 * Prevents any invented prices or hallucinated packages.
 */
export async function recommendPackages(extracted) {
  const publishedPackages = await Package.find({ publishedVersionId: { $ne: null } })
    .populate('publishedVersionId')
    .lean();

  if (!publishedPackages.length) return [];

  const scored = publishedPackages.map((pkg) => {
    const v = pkg.publishedVersionId;
    const content = v.content || {};
    const seasons = v.seasons || [];
    let score = 0;
    const reasons = [];

    // Destination match
    if (extracted.destination) {
      const destLower = extracted.destination.toLowerCase();
      if (
        (content.destination && content.destination.toLowerCase().includes(destLower)) ||
        (content.name && content.name.toLowerCase().includes(destLower))
      ) {
        score += 30;
        reasons.push(`Matches destination "${extracted.destination}"`);
      }
    }

    // Duration match
    if (extracted.nightsMin && content.nights) {
      if (content.nights >= extracted.nightsMin && content.nights <= (extracted.nightsMax || extracted.nightsMin + 2)) {
        score += 25;
        reasons.push(`Ideal duration (${content.durationDays} days / ${content.nights} nights)`);
      }
    }

    // Must-haves keyword match
    if (extracted.mustHaves && extracted.mustHaves.length > 0) {
      const summaryText = `${content.summary || ''} ${content.description || ''} ${JSON.stringify(content.itinerary || [])}`.toLowerCase();
      for (const req of extracted.mustHaves) {
        const key = req.split(' ')[0].toLowerCase();
        if (summaryText.includes(key)) {
          score += 20;
          reasons.push(`Includes requested feature: ${req}`);
        }
      }
    }

    // Budget match
    const prices = seasons.map(s => s.pricePerPerson).filter(p => Number.isFinite(p) && p > 0);
    const startPrice = prices.length ? Math.min(...prices) : null;
    if (extracted.budgetInr && startPrice) {
      const totalEstimated = startPrice * (extracted.adults || 2);
      if (totalEstimated <= extracted.budgetInr) {
        score += 20;
        reasons.push(`Within budget (approx ₹${totalEstimated.toLocaleString('en-IN')} for ${extracted.adults || 2} adults)`);
      } else if (totalEstimated <= extracted.budgetInr * 1.15) {
        score += 10;
        reasons.push(`Slightly above estimated budget, offers superior tier experience`);
      }
    }

    return {
      packageId: pkg._id,
      versionId: v._id,
      code: pkg.code,
      name: content.name,
      startingPrice: startPrice,
      score,
      reason: reasons.length ? reasons.join('. ') : 'Curated Kerala experience matching your travel profile.',
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map(s => ({
    packageId: s.packageId,
    versionId: s.versionId,
    reason: s.reason,
    packageName: s.name,
    packageCode: s.code,
    startingPrice: s.startingPrice,
  }));
}

/**
 * Generate a professional draft reply using real package titles and authoritative prices.
 */
export function generateDraftReply(customerName, extracted, recommendations) {
  const greeting = customerName ? `Dear ${customerName.split(' ')[0]},` : 'Dear Traveller,';
  const partyDesc = `${extracted.adults || 2} adult${(extracted.adults || 2) > 1 ? 's' : ''}${extracted.children ? ` and ${extracted.children} child` : ''}`;

  let packageSection = '';
  if (recommendations.length > 0) {
    packageSection = recommendations
      .map((rec, i) => {
        const priceInfo = rec.startingPrice
          ? `Starting from ₹${rec.startingPrice.toLocaleString('en-IN')} per person (twin-sharing, GST extra as applicable)`
          : 'Price on Request';
        return `${i + 1}. **${rec.packageName || 'Featured Package'}**\n   - Pricing: ${priceInfo}\n   - Why we recommend this: ${rec.reason}`;
      })
      .join('\n\n');
  } else {
    packageSection = 'We are curating custom options tailored specifically to your dates and preferences.';
  }

  return `${greeting}

Thank you for choosing TravelOS for your upcoming journey to ${extracted.destination || 'Kerala'}.

We have received your enquiry for ${partyDesc}${extracted.travelPeriod ? ` for ${extracted.travelPeriod}` : ''}${extracted.nightsMin ? ` for ${extracted.nightsMin}–${extracted.nightsMax || extracted.nightsMin} nights` : ''}.

Based on your preferences${extracted.mustHaves?.length ? ` including ${extracted.mustHaves.join(', ')}` : ''}, our travel team has handpicked the following recommended itineraries:

${packageSection}

All our packages include private chauffeured transportation, handpicked accommodations, and dedicated on-ground local support.

Would you prefer a morning or evening call to discuss your itinerary details and personalize any activities?

Warm regards,
TravelOS Reservations Team
Kochi, Kerala
+91 98470 00000 | hello@travelos.in`;
}

/**
 * Complete asynchronous processing pipeline for an enquiry.
 * Never throws outside to ensure safe non-blocking execution.
 */
export async function processEnquiryWithAi(enquiryId) {
  try {
    const enquiry = await Enquiry.findById(enquiryId);
    if (!enquiry) return;

    logger.info(`Running AI Assistant pipeline for Enquiry ${enquiry.reference}...`);

    // 1. Extraction
    const extracted = extractRequirementsRuleBased(enquiry.message, {
      destination: enquiry.destination,
      adults: enquiry.adults,
      children: enquiry.children,
      requirements: enquiry.requirements,
      travelStart: enquiry.travelStart,
      budget: enquiry.budget,
    });

    enquiry.extracted = enquiry.extracted || {};
    enquiry.extracted.ai = extracted;
    enquiry.ai = enquiry.ai || {};
    enquiry.ai.status = enquiry.ai.status || {};
    enquiry.ai.status.extract = 'ok';

    // 2. Recommendations
    const recs = await recommendPackages(extracted);
    enquiry.ai.recommendations = recs.map(r => ({
      packageId: r.packageId,
      versionId: r.versionId,
      reason: r.reason,
    }));
    enquiry.ai.status.recommend = 'ok';

    // 3. Draft Reply
    const draft = generateDraftReply(enquiry.customer?.name, extracted, recs);
    enquiry.ai.replyDraft = draft;
    enquiry.ai.status.draft = 'ok';
    enquiry.ai.lastRunAt = new Date();

    await enquiry.save();
    logger.info(`AI Assistant pipeline completed for Enquiry ${enquiry.reference}`);
  } catch (err) {
    logger.error(`AI Assistant processing failed for enquiry ${enquiryId}:`, err.message);
    try {
      await Enquiry.updateOne(
        { _id: enquiryId },
        {
          $set: {
            'ai.status.extract': 'failed',
            'ai.status.recommend': 'failed',
            'ai.status.draft': 'failed',
            'ai.lastError': err.message,
          },
        }
      );
    } catch {
      // ignore secondary error
    }
  }
}

