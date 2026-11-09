// Supplied sample data is authoritative. Anything marked ASSUMPTION is not in the brief.
// Seasons use absolute dates (see PROJECT_CONTEXT.md, assumption B).
export const packagesSeed = [
  {
    code: 'PKG-KL-07',
    slug: 'munnar-thekkady-alleppey-houseboat',
    published: true,
    content: {
      name: 'Munnar, Thekkady and Alleppey Houseboat',
      destination: 'Kerala',
      category: 'Kerala',
      durationDays: 6,
      nights: 5,
      hotelCategory: '4-star',
      summary: 'Tea-covered hills, spice-scented forests and a night afloat on the Alleppey backwaters.',
      description:
        'A six-day journey through the best of Kerala: the misty tea estates of Munnar, the wildlife and spice country of Thekkady, and an overnight houseboat cruise through the Alleppey backwaters. (Demo copy for the assignment.)',
      itinerary: [
        { day: 1, title: 'Arrive in Kochi, drive to Munnar', description: 'Meet your driver at Kochi and travel into the Western Ghats.' },
        { day: 2, title: 'Munnar tea country', description: 'Tea estates, viewpoints and a local market visit.' },
        { day: 3, title: 'Munnar to Thekkady', description: 'Scenic drive to Thekkady with a spice plantation visit.' },
        { day: 4, title: 'Thekkady and Periyar', description: 'Periyar nature experience and an evening cultural performance.' },
        { day: 5, title: 'Thekkady to Alleppey houseboat', description: 'Board a private houseboat for a backwater cruise and overnight stay.' },
        { day: 6, title: 'Alleppey to Kochi departure', description: 'Disembark after breakfast and transfer to Kochi.' },
      ],
      hotels: [
        { name: 'Demo 4-star property, Munnar', location: 'Munnar', category: '4-star', nights: 2 },
        { name: 'Demo 4-star property, Thekkady', location: 'Thekkady', category: '4-star', nights: 2 },
        { name: 'Private houseboat (deluxe)', location: 'Alleppey', category: 'mixed', nights: 1 },
      ],
      inclusions: ['Accommodation as listed', 'Daily breakfast', 'Private air-conditioned vehicle', 'Overnight houseboat with meals', 'Airport or station transfers'],
      exclusions: ['Flights and train fares', 'Entry fees and activity charges', 'Personal expenses', 'Travel insurance'],
      heroImage: { url: '/images/seed/kerala-houseboat.jpg', alt: 'Houseboat on the Alleppey backwaters' },
      gallery: [
        { url: '/images/seed/munnar-tea.jpg', alt: 'Tea plantations in Munnar' },
        { url: '/images/seed/thekkady-elephants.jpg', alt: 'Elephants near a forest lake in Thekkady' },
        { url: '/images/seed/alleppey-backwaters.jpg', alt: 'Alleppey backwaters' },
      ], // demo imagery: crops of the design mockups
      location: { label: 'Munnar - Thekkady - Alleppey, Kerala', lat: 9.9312, lng: 76.2673 },
      seo: {
        title: 'Munnar, Thekkady and Alleppey Houseboat Package',
        description: '6-day Kerala holiday covering Munnar, Thekkady and an Alleppey houseboat stay.',
      },
    },
    seasons: [
      // Brief: Peak season October to March, Rs 32,500 per person
      { name: 'Peak season', startDate: '2026-10-01', endDate: '2027-03-31', pricePerPerson: 32500, occupancyBasis: 'double', gstIncluded: false, currency: 'INR' }, // ASSUMPTION: double occupancy, GST excluded
      // Brief: Monsoon June to September, Rs 24,900 per person
      { name: 'Monsoon season', startDate: '2027-06-01', endDate: '2027-09-30', pricePerPerson: 24900, occupancyBasis: 'double', gstIncluded: false, currency: 'INR' },
    ],
  },
  {
    code: 'PKG-SI-12',
    slug: 'madurai-rameswaram-kanyakumari',
    published: false, // Draft only: must not appear on the public site
    content: {
      name: 'Madurai, Rameswaram and Kanyakumari',
      destination: 'Tamil Nadu',
      category: 'South India',
      durationDays: 5,
      nights: 4,
      hotelCategory: '3-star',
      summary: 'Temple towns and the southern tip of India in five days.',
      description: 'Draft content for the South India circuit. (Demo copy for the assignment.)',
      itinerary: [
        { day: 1, title: 'Arrive in Madurai', description: 'Evening at the Meenakshi temple area.' },
        { day: 2, title: 'Madurai to Rameswaram', description: 'Drive to Rameswaram and visit the temple.' },
        { day: 3, title: 'Rameswaram to Kanyakumari', description: 'Long scenic drive to the southern tip.' },
        { day: 4, title: 'Kanyakumari', description: 'Sunrise point and Vivekananda Rock Memorial.' },
        { day: 5, title: 'Departure', description: 'Transfer to Trivandrum or Madurai for onward travel.' },
      ],
      hotels: [{ name: 'Demo 3-star property', location: 'Madurai / Rameswaram / Kanyakumari', category: '3-star', nights: 4 }],
      inclusions: ['Accommodation as listed', 'Daily breakfast', 'Private vehicle'],
      exclusions: ['Flights and train fares', 'Entry fees', 'Personal expenses'],
      heroImage: { url: '/images/seed/madurai-temple.jpg', alt: 'Gopuram of a Madurai temple' },
      location: { label: 'Madurai - Rameswaram - Kanyakumari, Tamil Nadu', lat: 9.9252, lng: 78.1198 },
    },
    seasons: [
      // Brief gives only a price (Rs 18,750 per person) and no season. ASSUMPTION: one year-round season.
      { name: 'Year-round', startDate: '2026-11-01', endDate: '2027-10-31', pricePerPerson: 18750, occupancyBasis: 'double', gstIncluded: false, currency: 'INR' },
    ],
  },
];
