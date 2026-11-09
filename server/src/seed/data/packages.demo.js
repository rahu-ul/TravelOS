// DEMO packages for developing and testing the public website (listing filters, sorting, pagination, price states).
// They are NOT client data: names, itineraries, hotels AND PRICES are placeholders. Every one is flagged isDemo,
// which the public site shows as a "Demo content" badge, and each description says so.
// Images are crops of the design reference mockups (low resolution): replace with real photography/Cloudinary.

const IMG = (file, alt) => ({ url: `/images/seed/${file}`, alt });
const demoNote = ' (Demo content for website development. Not a real offer; price is a placeholder.)';

const season = (name, startDate, endDate, pricePerPerson) => ({ name, startDate, endDate, pricePerPerson, occupancyBasis: 'double', gstIncluded: false, currency: 'INR' });
const PEAK = (price) => season('Peak season', '2026-10-01', '2027-03-31', price);
const OFF = (price) => season('Off season', '2027-04-01', '2027-09-30', price);

const STD_IN = ['Accommodation as listed', 'Daily breakfast', 'Private air-conditioned vehicle', 'Airport or station transfers'];
const STD_EX = ['Flights and train fares', 'Entry fees and activity charges', 'Personal expenses', 'Travel insurance'];

function demo(d) {
  return {
    code: d.code,
    slug: d.slug,
    published: true,
    isDemo: true,
    content: {
      name: d.name,
      destination: d.destination,
      category: d.category,
      durationDays: d.days,
      nights: d.days - 1,
      hotelCategory: d.hotelCategory,
      summary: d.summary,
      description: d.description + demoNote,
      itinerary: d.itinerary.map(([title, description], i) => ({ day: i + 1, title, description })),
      hotels: d.hotels.map(([name, location, category, nights]) => ({ name, location, category, nights })),
      inclusions: d.inclusions ?? STD_IN,
      exclusions: STD_EX,
      heroImage: IMG(d.hero[0], d.hero[1]),
      gallery: d.gallery.map(([f, a]) => IMG(f, a)),
      location: d.location,
      seo: { title: d.name.slice(0, 70), description: `${d.summary} (Demo package.)`.slice(0, 170) },
    },
    seasons: d.seasons,
  };
}

export const demoPackagesSeed = [
  demo({
    code: 'PKG-KL-21', slug: 'kerala-backwaters-and-beach-escape', name: 'Kerala Backwaters and Beach Escape',
    destination: 'Kerala', category: 'Kerala', days: 5, hotelCategory: '4-star',
    summary: "Cruise through Alleppey's quiet backwaters and unwind on Kerala's scenic beaches.",
    description: 'Five days that pair a private backwater cruise with relaxed beach time on the Kerala coast.',
    itinerary: [['Arrive in Kochi', 'Transfer to Alleppey and settle in.'], ['Alleppey backwaters', 'Canoe ride through village canals and a lakeside sunset.'], ['Alleppey to Marari', 'Drive to the coast for a beach afternoon.'], ['Beach day', 'Free day for the beach, spa or a fishing-village walk.'], ['Departure', 'Transfer to Kochi for onward travel.']],
    hotels: [['Demo lakeside resort', 'Alleppey', '4-star', 2], ['Demo beach resort', 'Marari', '4-star', 2]],
    hero: ['alleppey-backwaters.jpg', 'A houseboat on the Alleppey backwaters'], gallery: [['kerala-sunset.jpg', 'Houseboat at sunset'], ['kerala-houseboat.jpg', 'Traditional kettuvallam houseboat']],
    location: { label: 'Alleppey - Marari, Kerala', lat: 9.4981, lng: 76.3388 }, seasons: [PEAK(28900), OFF(21900)],
  }),
  demo({
    code: 'PKG-KL-22', slug: 'wildlife-spice-trails-and-backwaters', name: 'Wildlife, Spice Trails and Backwaters',
    destination: 'Kerala', category: 'Kerala', days: 6, hotelCategory: '4-star',
    summary: "A blend of wilderness, spice plantations and Kerala's charming backwaters.",
    description: 'Elephant country in Periyar, aromatic spice plantations and a gentle finish on the backwaters.',
    itinerary: [['Arrive in Kochi', 'Drive towards Thekkady.'], ['Periyar wildlife', 'Guided nature walk and boat ride on the lake.'], ['Spice plantations', 'Plantation tour and a cooking demonstration.'], ['Thekkady to Alleppey', 'Scenic drive to the backwaters.'], ['Backwater cruise', 'Full-day cruise with village stops.'], ['Departure', 'Transfer to Kochi.']],
    hotels: [['Demo jungle lodge', 'Thekkady', '4-star', 3], ['Demo backwater resort', 'Alleppey', '4-star', 2]],
    hero: ['thekkady-elephants.jpg', 'Elephants near a forest lake in Thekkady'], gallery: [['alleppey-backwaters.jpg', 'Alleppey backwaters'], ['munnar-tea.jpg', 'Tea estates in the Western Ghats']],
    location: { label: 'Thekkady - Alleppey, Kerala', lat: 9.6, lng: 77.17 }, seasons: [PEAK(29800), OFF(23800)],
  }),
  demo({
    code: 'PKG-KL-23', slug: 'kerala-beaches-and-cliffside-retreat', name: 'Kerala Beaches and Cliffside Retreat',
    destination: 'Kerala', category: 'Kerala', days: 5, hotelCategory: '4-star',
    summary: 'Golden beaches, coastal heritage and a peaceful Kerala getaway.',
    description: 'A slow coastal itinerary through Kovalam and Varkala with lighthouse views and cliff-top sunsets.',
    itinerary: [['Arrive in Trivandrum', 'Transfer to Kovalam.'], ['Kovalam', 'Lighthouse beach and local seafood dinner.'], ['Kovalam to Varkala', 'Drive along the coast to the cliffs.'], ['Varkala cliffs', 'Cliff walk, temple visit and sunset.'], ['Departure', 'Transfer to Trivandrum.']],
    hotels: [['Demo beach hotel', 'Kovalam', '4-star', 2], ['Demo cliff-top resort', 'Varkala', '4-star', 2]],
    hero: ['kovalam-lighthouse.jpg', 'Lighthouse on the Kovalam coast'], gallery: [['kerala-sunset.jpg', 'Sunset over the water']],
    location: { label: 'Kovalam - Varkala, Kerala', lat: 8.4004, lng: 76.9787 }, seasons: [PEAK(26500), OFF(19900)],
  }),
  demo({
    code: 'PKG-TN-31', slug: 'ooty-and-coonoor-hill-escape', name: 'Ooty and Coonoor Hill Escape',
    destination: 'Tamil Nadu', category: 'South India', days: 4, hotelCategory: '3-star',
    summary: 'A refreshing hill holiday with scenic train rides, tea estates and colonial charm.',
    description: 'Four easy days in the Nilgiris with toy-train views, tea factories and cool-weather walks.',
    itinerary: [['Arrive in Coimbatore', 'Drive up to Ooty.'], ['Ooty', 'Botanical garden and lake.'], ['Coonoor', 'Tea estate visit and viewpoints.'], ['Departure', 'Return to Coimbatore.']],
    hotels: [['Demo hill hotel', 'Ooty', '3-star', 2], ['Demo estate stay', 'Coonoor', '3-star', 1]],
    hero: ['ooty-hills.jpg', 'Misty hills and tea slopes near Ooty'], gallery: [['munnar-wide.jpg', 'Tea country at sunrise']],
    location: { label: 'Ooty - Coonoor, Tamil Nadu', lat: 11.41, lng: 76.695 }, seasons: [PEAK(21900), OFF(17500)],
  }),
  demo({
    code: 'PKG-KL-24', slug: 'munnar-tea-estate-retreat', name: 'Munnar Tea Estate Retreat',
    destination: 'Kerala', category: 'Kerala', days: 3, hotelCategory: 'homestay',
    summary: 'Three slow days among Munnar tea estates, with mist, viewpoints and home-cooked meals.',
    description: 'A short break in a planter-style homestay above the tea gardens.',
    itinerary: [['Arrive and drive to Munnar', 'Evening tea on the veranda.'], ['Tea country', 'Estate walk, factory visit and viewpoints.'], ['Departure', 'Transfer to Kochi.']],
    hotels: [['Demo planter homestay', 'Munnar', 'homestay', 2]],
    hero: ['munnar-tea.jpg', 'Terraced tea plantations in Munnar'], gallery: [['munnar-wide.jpg', 'Hills above the tea estates']],
    location: { label: 'Munnar, Kerala', lat: 10.0889, lng: 77.0595 }, seasons: [PEAK(15900), OFF(12900)],
  }),
  demo({
    code: 'PKG-KL-25', slug: 'kerala-grand-circuit', name: 'Kerala Grand Circuit', destination: 'Kerala', category: 'Kerala', days: 9, hotelCategory: '5-star',
    summary: 'Nine days across hills, wildlife, backwaters and beaches, with luxury stays throughout.',
    description: 'The full Kerala story: Munnar, Thekkady, Alleppey and Kovalam in one unhurried journey.',
    itinerary: [['Arrive in Kochi', 'Rest and a heritage walk.'], ['Kochi to Munnar', 'Drive into the hills.'], ['Munnar', 'Tea estates and viewpoints.'], ['Munnar to Thekkady', 'Spice-country drive.'], ['Periyar', 'Wildlife boat ride and nature walk.'], ['Thekkady to Alleppey', 'Board a private houseboat.'], ['Alleppey to Kovalam', 'Drive south to the coast.'], ['Kovalam', 'Beach day.'], ['Departure', 'Transfer to Trivandrum.']],
    hotels: [['Demo luxury hotel', 'Kochi', '5-star', 1], ['Demo hill resort', 'Munnar', '5-star', 2], ['Demo jungle resort', 'Thekkady', '5-star', 2], ['Private houseboat (premium)', 'Alleppey', 'mixed', 1], ['Demo beach resort', 'Kovalam', '5-star', 2]],
    hero: ['munnar-wide.jpg', 'Misty hills of Munnar at sunrise'], gallery: [['kerala-houseboat.jpg', 'Houseboat cruise'], ['thekkady-elephants.jpg', 'Elephants at Periyar'], ['kovalam-lighthouse.jpg', 'Kovalam lighthouse']],
    location: { label: 'Kochi - Munnar - Thekkady - Alleppey - Kovalam, Kerala', lat: 9.9312, lng: 76.2673 }, seasons: [PEAK(64500), OFF(52900)],
  }),
  demo({
    code: 'PKG-KL-26', slug: 'kochi-heritage-and-alleppey-weekend', name: 'Kochi Heritage and Alleppey Weekend', destination: 'Kerala', category: 'Kerala', days: 3, hotelCategory: '3-star',
    summary: "A short weekend pairing Fort Kochi's heritage lanes with a night on the backwaters.",
    description: 'Two nights, two moods: old-port Kochi and a quiet Alleppey stay.',
    itinerary: [['Fort Kochi', 'Heritage walk, Chinese fishing nets and a seafood dinner.'], ['Kochi to Alleppey', 'Backwater canoe ride and sunset on the lake.'], ['Departure', 'Return to Kochi.']],
    hotels: [['Demo heritage hotel', 'Fort Kochi', '3-star', 1], ['Demo lakeside stay', 'Alleppey', '3-star', 1]],
    hero: ['kerala-sunset.jpg', 'Sunset over Kerala backwaters'], gallery: [['alleppey-backwaters.jpg', 'Alleppey canals']],
    location: { label: 'Fort Kochi - Alleppey, Kerala', lat: 9.9658, lng: 76.2421 }, seasons: [PEAK(11900), OFF(9900)],
  }),
  // Demonstrates the "Price on request" state: a published package with no configured season price.
  demo({
    code: 'PKG-KL-27', slug: 'wayanad-private-villa-retreat', name: 'Wayanad Private Villa Retreat', destination: 'Kerala', category: 'Kerala', days: 4, hotelCategory: 'homestay',
    summary: 'A private villa among coffee and spice estates in Wayanad. Pricing is shared on request.',
    description: 'A secluded estate stay with guided plantation walks and home-style meals.',
    itinerary: [['Arrive in Wayanad', 'Settle into the villa.'], ['Estate walk', 'Coffee and spice plantation walk.'], ['Waterfalls and caves', 'Day excursions with a local guide.'], ['Departure', 'Transfer to Kozhikode.']],
    hotels: [['Demo private villa', 'Wayanad', 'homestay', 3]],
    hero: ['munnar-tea.jpg', 'Green estate hills'], gallery: [['munnar-wide.jpg', 'Hills at sunrise']],
    location: { label: 'Wayanad, Kerala', lat: 11.6854, lng: 76.132 }, seasons: [],
  }),
];
