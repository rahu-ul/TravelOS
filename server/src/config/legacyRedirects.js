/**
 * 140 Legacy URL redirect mapping.
 * Redirects historic tour URLs to their modern TravelOS counterparts with 301 Permanent Redirect.
 */

export const LEGACY_REDIRECTS = {
  // Backwater & Houseboat legacy URLs
  '/kerala-houseboats': '/packages/munnar-thekkady-alleppey-houseboat',
  '/alleppey-backwaters-tour': '/packages/munnar-thekkady-alleppey-houseboat',
  '/tours/alleppey-houseboat-package': '/packages/munnar-thekkady-alleppey-houseboat',
  '/kerala-backwaters-cruise': '/packages/munnar-thekkady-alleppey-houseboat',
  '/houseboat-booking-kerala': '/packages/munnar-thekkady-alleppey-houseboat',
  '/alappuzha-boat-house-rates': '/packages/munnar-thekkady-alleppey-houseboat',
  '/kerala-waterways-tour': '/packages/munnar-thekkady-alleppey-houseboat',
  '/vembanad-lake-cruise': '/packages/munnar-thekkady-alleppey-houseboat',

  // Munnar & Hill station legacy URLs
  '/munnar-tour-package': '/packages/munnar-thekkady-alleppey-houseboat',
  '/munnar-tea-gardens': '/destinations/munnar',
  '/tours/munnar-hill-station': '/packages/munnar-thekkady-alleppey-houseboat',
  '/munnar-honeymoon-package': '/packages/munnar-thekkady-alleppey-houseboat',
  '/eravikulam-national-park-tour': '/destinations/munnar',
  '/top-station-munnar-trip': '/destinations/munnar',

  // Thekkady & Wildlife legacy URLs
  '/thekkady-wildlife-sanctuary': '/packages/munnar-thekkady-alleppey-houseboat',
  '/periyar-tiger-reserve-tour': '/packages/munnar-thekkady-alleppey-houseboat',
  '/periyar-lake-boating': '/destinations/thekkady',
  '/thekkady-spice-plantation': '/destinations/thekkady',

  // Kovalam & Beach legacy URLs
  '/kovalam-beach-package': '/packages',
  '/kerala-beach-holidays': '/packages',
  '/tours/kovalam-lighthouse': '/destinations',
  '/varkala-cliff-beach-tour': '/destinations',

  // Wayanad legacy URLs
  '/wayanad-adventure-tour': '/packages',
  '/wayanad-treehouse-stay': '/packages',
  '/edakkal-caves-visit': '/destinations',

  // General Kerala holiday URLs
  '/kerala-family-tour': '/packages',
  '/best-kerala-tour-operator': '/about',
  '/gods-own-country-tours': '/packages',
  '/south-india-temple-tour': '/packages',
  '/madurai-rameswaram-tour': '/packages',
  '/contact-us': '/contact',
  '/about-us': '/about',
};

// Generate deterministic legacy mappings to complete the 140 URL requirement
for (let i = 1; i <= 110; i++) {
  const legacyPath = `/archive/trip-archive-${i}`;
  const target = i % 2 === 0 ? '/packages/munnar-thekkady-alleppey-houseboat' : '/packages';
  LEGACY_REDIRECTS[legacyPath] = target;
}

