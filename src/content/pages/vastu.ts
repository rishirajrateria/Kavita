/**
 * `/vastu` hub copy — optimised for vastu intent (CLAUDE.md §5, §8, §9). Typed constants; no
 * numbers about the practice, no outcomes, every Sanskrit term defined on first use. The
 * directional table follows the classical Vastu Purusha Mandala and is hedged where schools
 * differ. Every `answer` is a 40–60 word self-contained paragraph naming "Astrologer Kavita".
 */
import type { FaqItem } from "@/lib/seo/schema";
import type { HubSection, HubTable } from "./astrology";

export const VASTU_META = {
  /** 53 characters. */
  title: "Vastu Shastra Consultation Online | Astrologer Kavita",
  /** 150–160 characters. */
  description:
    "What vastu shastra is, what each direction means, how a remote reading works from a plan, which corrections need no building work, and how the chart is added.",
} as const;

export const VASTU_DATES = { published: "2026-09-11", modified: "2026-09-11" } as const;

export const VASTU_HERO = {
  eyebrow: "Vastu shastra · homes, apartments, workplaces",
  h1: "Vastu shastra, read together with your birth chart",
  lede: "Vastu shastra is the traditional Indian science of how a building's orientation, layout and the use of its rooms affect the people who live or work in it. Astrologer Kavita reads the vastu of a home or workplace from a floor plan and photographs, with one difference: the occupants' birth charts are part of the same reading, so the corrections address the person as well as the place.",
  entity:
    "Consultations are remote by default — a plan with north marked, a compass reading at the entrance and photographs are enough for a full reading — and every session ends with a written summary. Brahmasthan, the five elements and the other terms on this page are defined where they first appear.",
  primaryCta: { label: "Book a vastu consultation", href: "/book" },
  secondaryCta: { label: "Astrology, the other instrument", href: "/astrology" },
} as const;

export const VASTU_KEY_FACTS = {
  heading: "Vastu with Astrologer Kavita at a glance",
  labels: {
    service: "Service",
    practitioner: "Practitioner",
    scope: "Scope",
    inputs: "Inputs needed",
    modes: "Consultation modes",
    languages: "Languages",
    sessionLength: "Session length",
    timezone: "Practitioner time zone",
    responseTime: "Response to enquiries",
  },
  service:
    "Vastu shastra consultations for homes, apartments and commercial premises, read with the occupants' charts",
  scope:
    "Apartments, independent houses, plots, offices, shops, clinics and factories; existing buildings and plans under design",
  inputs:
    "Floor plan or sketch with north marked; compass reading at the entrance; photographs; who uses which room",
  modesRemote: "Remote from a floor plan and photographs, by video or phone, worldwide",
  modesOnSite: (city: string) => `on-site visits in and around ${city}`,
  sessionLength: (min: number, max: number) =>
    `${min}–${max} minutes depending on the premises, with a written summary`,
  timezoneNote: "sessions are scheduled in your local time",
  responseTime: (hours: number) => `Usually within ${hours} hours`,
} as const;

export const VASTU_TOC = [
  { id: "what-is-vastu", text: "What vastu is" },
  { id: "directions", text: "The directions" },
  { id: "brahmasthan", text: "Brahmasthan" },
  { id: "remote", text: "Remote consultation" },
  { id: "corrections", text: "Corrections" },
  { id: "property-types", text: "Property types" },
  { id: "with-chart", text: "Adding the chart" },
  { id: "services", text: "Services" },
  { id: "where", text: "Where" },
  { id: "faq", text: "FAQ" },
] as const;

// ---------------------------------------------------------------------------------------------
// 1. What vastu shastra is
// ---------------------------------------------------------------------------------------------
export const VASTU_WHAT: HubSection = {
  id: "what-is-vastu",
  eyebrow: "The tradition",
  question: "What is vastu shastra?",
  answer:
    "Vastu shastra is the traditional Indian science of building: how the orientation of a structure, the layout of its rooms and the placement of elements within it affect the people who use it. It assigns each direction a quality and an element, and keeps the centre open. Astrologer Kavita reads it for homes, apartments and workplaces, alongside the occupants' charts.",
  paragraphs: [
    "The word vastu means a dwelling or site; shastra means a body of teaching. The classical texts describe the Vastu Purusha Mandala — a square grid laid over a site, with a presiding quality in each direction and the five elements (pancha-bhuta: earth, water, fire, air and space) assigned to its corners and centre. From that grid come the tradition's practical rules: where the entrance should be, where to cook and sleep, what to keep heavy and what to keep light.",
    "Vastu is not a set of superstitions about furniture. At its core it is a way of reading how light, heat, weight, water and movement are distributed through a building, and of arranging daily life so that the building supports rather than disturbs it. Much of what it recommends — morning light in the living spaces, heat in the corner that can bear it, a settled place to sleep, an uncluttered centre — is what a thoughtful architect would want too.",
  ],
};

// ---------------------------------------------------------------------------------------------
// 2. The directions
// ---------------------------------------------------------------------------------------------
export const VASTU_DIRECTIONS: HubSection = {
  id: "directions",
  eyebrow: "Eight directions and the centre",
  question: "What does each direction mean in vastu?",
  answer:
    "In vastu shastra each of the eight directions carries a quality and, at the four corners and the centre, one of the five elements: north-east water, south-east fire, south-west earth, north-west air, and space at the centre. Astrologer Kavita uses this map to decide which rooms belong where and which corrections matter most.",
  paragraphs: [
    "The table gives the mainstream reading of the classical scheme. Regional schools differ in detail — on secondary placements, on which compromises are acceptable in an apartment — and a consultation says where a rule is firm and where it is a preference. The names in brackets are the Sanskrit direction names, which you will hear in a session.",
  ],
};

export const VASTU_DIRECTION_TABLE: HubTable = {
  caption:
    "The classical assignment of the eight directions and the centre. Elements belong to the four corners and the centre; the cardinal directions are known by their presiding deities. Schools differ on secondary uses; this is the mainstream reading.",
  columns: [
    "Direction",
    "Element · presiding deity",
    "What the tradition assigns",
    "Rooms that suit it",
    "Keep away from it",
  ],
  rows: [
    [
      "North (Uttara)",
      "— · Kubera, lord of wealth",
      "Prosperity, opportunity, incoming flow.",
      "Entrance, living room, study, safe or cash cupboard, water features.",
      "Heavy storage, toilets, kitchen where avoidable.",
    ],
    [
      "North-east (Ishanya)",
      "Water · Ishana",
      "Clarity, light, quiet, the sacred corner of the plan.",
      "Prayer room, open space, water source, windows, a light study.",
      "Toilets, kitchen, heavy furniture, storage, staircase.",
    ],
    [
      "East (Purva)",
      "— · Indra; the rising sun",
      "Light, health, beginnings.",
      "Entrance, living room, bathing area (without the toilet), study.",
      "Heavy walls that block the morning light, storage.",
    ],
    [
      "South-east (Agneya)",
      "Fire · Agni",
      "Heat, energy, transformation.",
      "Kitchen, electrical panel, inverter or generator, boiler.",
      "Water tanks, wells, the main bedroom, the prayer room.",
    ],
    [
      "South (Dakshina)",
      "— · Yama",
      "Stability, endurance, the weight of the plan.",
      "Bedrooms, storage, staircase; solid walls with few openings.",
      "The main entrance in most schools; large windows and water.",
    ],
    [
      "South-west (Nairutya)",
      "Earth · Nirriti; the ancestors",
      "Grounding, authority, permanence. The heaviest corner.",
      "Master bedroom, heavy storage, safe; the highest floor level of a plot.",
      "Entrance, underground tanks, toilets, a child's bedroom, open pits.",
    ],
    [
      "West (Paschima)",
      "— · Varuna",
      "Completion, gain from effort, rest after work.",
      "Dining room, children's bedroom, study, staircase.",
      "Large openings to the afternoon sun in hot climates.",
    ],
    [
      "North-west (Vayavya)",
      "Air · Vayu",
      "Movement, change, what comes and goes.",
      "Guest room, store for finished goods, toilets, a second choice for the kitchen.",
      "The main bedroom of the head of household; the prayer room.",
    ],
    [
      "Centre (Brahmasthan)",
      "Space · Brahma",
      "The open heart of the plan, from which the rest is ordered.",
      "A courtyard, a lobby, an open living area — kept light and free.",
      "Pillars, staircases, toilets, kitchens, heavy furniture, storage.",
    ],
  ],
};

// ---------------------------------------------------------------------------------------------
// 3. The brahmasthan
// ---------------------------------------------------------------------------------------------
export const VASTU_BRAHMASTHAN: HubSection = {
  id: "brahmasthan",
  eyebrow: "The centre",
  question: "What is the brahmasthan, and why is the centre of a home kept open?",
  answer:
    "The brahmasthan is the central zone of a building's plan — in the classical grid, the nine middle squares of eighty-one. Vastu shastra assigns it to space, the fifth element, and keeps it open, light and unobstructed, because the tradition holds that the rest of the plan is ordered from it. Astrologer Kavita checks it in every reading.",
  paragraphs: [
    "In a traditional Indian house the brahmasthan was literally open: the inner courtyard that the rooms faced onto and the sky looked into. In an apartment it is the middle of the plan — usually the living or dining area, the lobby, or the corridor. What the tradition asks is that it is not built over with a pillar, a staircase, a toilet or a kitchen, and that it is not filled: no heavy cupboard, no store, no permanent clutter in the centre of the home.",
    "It is also the one rule of vastu that needs no belief to make sense of. A plan with a clear centre has better light, better air movement and better circulation than one with its middle blocked, and a household that keeps the centre clear tends to keep the rest in order too.",
  ],
};

// ---------------------------------------------------------------------------------------------
// 4. Remote consultation
// ---------------------------------------------------------------------------------------------
export const VASTU_REMOTE: HubSection = {
  id: "remote",
  eyebrow: "How it works remotely",
  question: "How does a remote vastu consultation work, and what do you need to send?",
  answer:
    "A remote vastu consultation with Astrologer Kavita is read from three things: a floor plan or hand sketch with north marked, a compass reading taken at the main entrance, and photographs of each room. She overlays the directional grid on the plan, reads it against the occupants' charts, and presents the findings live by video, with a written summary afterwards.",
  paragraphs: [
    "The floor plan does not have to be an architect's drawing. A builder's brochure plan, a rental listing plan or a careful hand sketch on squared paper all work, as long as the rooms are in proportion and north is marked. Mark which room is used for what — a “bedroom” on the plan that is really the home office matters — and who sleeps where.",
    "Photographs should show each room from its doorway, the main entrance from outside and inside, the kitchen with the cooking position visible, and any water bodies, tanks or heavy storage. Video walkthroughs are welcome but not required.",
  ],
};

export const VASTU_COMPASS_HOWTO = {
  heading: "How to take a compass reading with your phone",
  intro:
    "The one measurement that cannot be guessed from a plan is where north actually lies. A phone's compass app is accurate enough for a vastu reading if it is used carefully.",
  steps: [
    "Open the compass app (built into iPhone; on Android, any compass app or the one in Google Maps' calibration). Calibrate it if asked, by moving the phone in a figure of eight.",
    "Stand just inside the main entrance, facing out through the door, with the phone flat in your palm at waist height.",
    "Step away from metal door frames, steel furniture, speakers and large appliances — they pull the needle. Half a metre is usually enough; if the reading swings, move and try again.",
    "Note the bearing in degrees shown at the top of the app — for example “Facing 247° SW”. That is the direction the entrance faces.",
    "Repeat once or twice from slightly different spots and average them. Then take the same reading from the centre of the home, facing the same way, as a check.",
    "Note whether the app was set to true north or magnetic north (iPhone: Settings › Compass › Use True North). Either is fine; say which, so the reading is corrected consistently.",
  ],
  note: "Send the degree figure, not just “south-west”: the tradition subdivides each direction, and a door at 240° and one at 255° are not read the same way.",
} as const;

// ---------------------------------------------------------------------------------------------
// 5. Corrections without construction
// ---------------------------------------------------------------------------------------------
export const VASTU_CORRECTIONS: HubSection = {
  id: "corrections",
  eyebrow: "Non-structural first",
  question: "Can vastu problems be corrected without demolition?",
  answer:
    "Most vastu issues in an existing home can be addressed without construction: by changing what a room is used for, the direction people sleep and work in, where weight and water sit, and what the centre holds. Astrologer Kavita recommends non-structural corrections first and says plainly when a building cannot be brought into line.",
  paragraphs: [
    "The tradition distinguishes between the building and its use. The building — where the walls, doors and wet areas are — is expensive to change and in an apartment usually cannot be changed at all. The use — what happens in each room, how it is furnished, which way the bed and the desk face, what is stored where — can be changed in an afternoon. A good consultation works through the second list before mentioning the first, and often does not need to mention it.",
    "The table gives the common issues and the category of non-structural remedy the tradition offers for each. What the specific step is for your home depends on the plan and, in an integrated reading, on which occupant's chart is under pressure.",
  ],
};

export const VASTU_CORRECTION_TABLE: HubTable = {
  caption:
    "Common issues and the kind of non-structural correction each one takes. “Honest limit” notes where only structural change would fully answer — said in the consultation, not hidden.",
  columns: ["Issue found", "Non-structural remedy category", "Honest limit"],
  rows: [
    [
      "Kitchen in the north-east",
      "Cooking position and orientation within the kitchen; moving heat sources to the south-east of the room; keeping the corner light and dry.",
      "The kitchen cannot be moved without construction; use and orientation are what can change.",
    ],
    [
      "Toilet in the north-east",
      "Use, cleanliness and door practice; keeping the space dry, ventilated and closed; taking weight and storage out of the corner.",
      "A toilet stays a toilet; the aim is to limit its effect, not remove it.",
    ],
    [
      "Main bedroom not in the south-west",
      "Swapping room use where a south-west room exists; otherwise sleeping direction (head to the south or east), heavier furniture on the room's south-west side.",
      "None if a swap is possible; otherwise the correction is partial and says so.",
    ],
    [
      "Bed with the head to the north",
      "Turn the bed: head to the south is the classical preference, east the second.",
      "None — this is the single most common and easiest correction.",
    ],
    [
      "Clutter or heavy storage in the north-east",
      "Clearing, lightening, opening windows; moving storage to the south, west or south-west.",
      "None.",
    ],
    [
      "Brahmasthan blocked by furniture or storage",
      "Clearing the centre; moving cupboards and stores to the perimeter; keeping it lit.",
      "A pillar or staircase in the centre is structural; the space around it is still cleared.",
    ],
    [
      "Entrance facing an unfavourable direction",
      "Threshold, lighting, nameplate and approach; keeping the entrance clear and used; a secondary door as the daily entrance where one exists.",
      "The door itself is structural; in an apartment it is fixed and is worked with, not against.",
    ],
    [
      "Desk facing away from north or east",
      "Turn the desk so the sitter faces north or east, with a solid wall behind the chair.",
      "None.",
    ],
    [
      "Water tank or water feature in the south-west or south-east",
      "Relocating movable water — aquariums, fountains, filter units — to the north or north-east; balancing weight in the south-west.",
      "An underground or built-in tank is structural; its effect is balanced, not removed.",
    ],
    [
      "Mirror facing the bed, or bed under a beam",
      "Moving or covering the mirror; moving the bed off the beam line; a canopy or false ceiling where a move is impossible.",
      "None for the mirror; the beam remains if the bed cannot move.",
    ],
  ],
};

// ---------------------------------------------------------------------------------------------
// 6. Apartment vs house vs commercial
// ---------------------------------------------------------------------------------------------
export const VASTU_PROPERTY_TYPES: HubSection = {
  id: "property-types",
  eyebrow: "Three kinds of premises",
  question: "How does vastu differ for an apartment, an independent house and a commercial space?",
  answer:
    "Vastu applies to all three, but what can change differs. In an apartment the walls, entrance and wet areas are fixed, so Astrologer Kavita works with room use, direction and weight. In an independent house the plot, entrance and extensions are in play. In commercial premises the reading follows the flow of money, staff and customers.",
  paragraphs: [
    "The question people ask most about apartments is whether vastu even applies when the plan was set by a developer for a whole tower. It does — the directions do not change because there are neighbours above and below — but the reading is honest about what is fixed. The apartment's own entrance, not the building's, is the one read; the floor level matters less than the plan; and the corrections are almost entirely in use and furniture.",
  ],
};

export const VASTU_PROPERTY_TABLE: HubTable = {
  caption: "What is read, what can change and what to send, by type of premises.",
  columns: ["", "Apartment", "Independent house", "Commercial (office, shop, clinic, factory)"],
  rows: [
    [
      "What is read",
      "The unit's own plan and entrance; the position of wet areas, kitchen and bedrooms; the centre.",
      "The plot and its slope, the compound entrance, the house entrance, the plan, water sources, extensions and outbuildings.",
      "The entrance customers or staff use, the owner's and cashier's seats, the direction of the desk, storage, the flow from entry to sale, and the centre.",
    ],
    [
      "What can change",
      "Room use, sleeping and working direction, furniture weight, storage, colour, lighting, movable water.",
      "All of the above, plus the entrance gate, boundary wall height, water tanks, garden, extensions and, at build stage, the plan itself.",
      "Seating, desk direction, counter position, storage, signage and lighting; at fit-out stage, partitions and the position of the cash desk.",
    ],
    [
      "Who decides",
      "The occupants, within the lease or society rules.",
      "The owner, within planning rules.",
      "The owner or the business, within the tenancy and fit-out budget.",
    ],
    [
      "Common findings",
      "Kitchen or toilet in the north-east; master bedroom in the wrong corner; clutter at the centre; bed head to the north.",
      "Entrance or gate in an unfavourable sector; south-west lower than north-east; underground tank in the south-west; the brahmasthan built over.",
      "Owner's seat facing away from the entrance or with a window behind; cash kept in the wrong sector; stock blocking the centre; a north-east toilet.",
    ],
    [
      "What to send",
      "Unit plan with north marked, compass reading at the unit's door, photographs of each room.",
      "Plot plan and floor plans with north marked, compass reading at the gate and the door, photographs including the compound and roof.",
      "Fit-out plan with north marked, compass reading at the customer entrance, photographs of seating, counters and storage; who sits where.",
    ],
    [
      "Consultation format",
      "Remote from plan and photographs; a video walkthrough helps.",
      "Remote from plan and photographs; on-site where a build or extension is planned and distance allows.",
      "Remote for existing premises; on-site or from drawings for a new fit-out.",
    ],
  ],
};

// ---------------------------------------------------------------------------------------------
// 7. Adding the chart
// ---------------------------------------------------------------------------------------------
export const VASTU_WITH_CHART: HubSection = {
  id: "with-chart",
  eyebrow: "The other instrument",
  question: "How is the birth chart added to a vastu consultation?",
  answer:
    "Before the plan, Astrologer Kavita reads the occupants' kundli — the Vedic birth chart — for the themes and periods active now. Each theme points to a direction and a room in vastu shastra, so the plan is read for those areas first. The chart ranks the vastu findings; the plan says how much of the chart's remedy is needed.",
  paragraphs: [
    "A vastu reading on its own produces a list of everything in the plan that departs from the tradition. In a real home that list can be long, and not all of it matters equally. The chart is what ranks it. A household in which the head of the family is in a Saturn period — the graha the tradition associates with structure, delay and the south-west — has a different first correction from one whose pressing question is a child's studies, which points to the north-east and the study.",
    "The pairing runs the other way too. A chart remedy that would be prescribed on its own can turn out to be unnecessary, or already in place, once the home is seen: the south-west is settled, the sleeping direction is right, the centre is clear. The combined reading gives one shorter list, in order, with the non-structural steps first.",
  ],
};

// ---------------------------------------------------------------------------------------------
// 8. Services and 9. geo
// ---------------------------------------------------------------------------------------------
export const VASTU_SERVICES: HubSection = {
  id: "services",
  eyebrow: "Services",
  question: "Which vastu services does Astrologer Kavita offer?",
  answer:
    "Astrologer Kavita offers vastu-led consultations for homes and apartments and for commercial premises — offices, shops, clinics and factories — read remotely from a floor plan or on site, and the integrated life reading in which the home's vastu and the occupants' birth charts are read together. Each service page states its length, what to prepare and what you receive.",
};

export const VASTU_WHERE: HubSection = {
  id: "where",
  eyebrow: "Remote, worldwide",
  question: "Where can you get a vastu consultation from Astrologer Kavita?",
  answer:
    "Astrologer Kavita reads vastu remotely for homes and workplaces in India, the United States, the United Kingdom, the United Arab Emirates, Canada, Australia and Singapore, from a floor plan and photographs. Each country and city page describes the local housing stock, sun and wind, and the questions clients from that place most often bring.",
};

export const VASTU_WHERE_LABELS = {
  countries: "By country",
  cities: "By city",
  linkLabel: (name: string) => `Vastu consultant in ${name}`,
} as const;

// ---------------------------------------------------------------------------------------------
// 10. FAQ
// ---------------------------------------------------------------------------------------------
export const VASTU_FAQ = {
  eyebrow: "Questions",
  heading: "What do people ask about vastu before a first consultation?",
  answer:
    "Before a first vastu consultation, people most often ask Astrologer Kavita whether vastu applies to apartments and rented homes, whether a reading can be done without a visit, how to find north, whether corrections mean construction, and whether the whole family's charts are needed. The answers below are the ones given in a session.",
  items: [
    {
      question: "Does vastu apply to apartments?",
      answer:
        "Yes. The directions do not change because there are neighbours above and below. What differs is what can be corrected: in an apartment the walls, entrance and wet areas are fixed, so the reading concentrates on room use, sleeping and working direction, weight, storage and the centre — which is where most of the practical benefit lies in any home.",
    },
    {
      question: "Can vastu be corrected without demolition?",
      answer:
        "In most existing homes, yes. The tradition separates the building from its use, and the use — what each room is for, which way the bed and desk face, where weight and water sit, what the centre holds — can be changed without a builder. Astrologer Kavita recommends these first and says plainly when only structural change would fully answer.",
    },
    {
      question: "Can a vastu consultation be done remotely, without a site visit?",
      answer:
        "Yes. A floor plan or careful sketch with north marked, a compass reading taken at the main entrance with a phone, and photographs of each room give enough for a full reading. On-site visits are arranged where a build or extension is planned and the distance allows; for an apartment they rarely add anything a good plan does not.",
    },
    {
      question: "Is vastu for a rented home worth doing?",
      answer:
        "Usually, because the corrections that matter most in a rented home are the ones a tenant controls: which room is used for what, sleeping and working direction, furniture and storage, and keeping the centre clear. Nothing structural is recommended for a rental, and the reading can travel with you to the next home.",
    },
    {
      question: "Do I need my birth chart for a vastu consultation?",
      answer:
        "Not for a vastu-only consultation, which reads the plan on its own. The integrated reading adds the occupants' charts — usually the head of the household's, and any family member whose question is pressing — because the chart ranks the plan's findings and shows which corrections matter most now. Astrologer Kavita recommends it but does not require it.",
    },
    {
      question: "Which direction should the main entrance face?",
      answer:
        "The tradition prefers entrances in the north, east and north-east sectors, and reads each direction in finer subdivisions than the compass points. But an entrance is only one factor, and in an apartment it is fixed. A consultation reads the entrance you have against the rest of the plan rather than judging the home by its door alone.",
    },
    {
      question: "What is the best direction to sleep in?",
      answer:
        "The classical preference is to sleep with the head to the south, and east as the second choice; the head to the north is the placement the tradition advises against. In a room where the bed cannot turn, a partial correction is discussed. Sleeping direction is the easiest change in vastu and one of the most commonly recommended.",
    },
    {
      question: "How long does a vastu consultation take, and what do I receive?",
      answer:
        "A home consultation is a live session by video or phone, prepared in advance from your plan and photographs; commercial premises take longer. You receive a walkthrough of the findings, the corrections in order with the non-structural steps first, and a written summary you can act on room by room. Session lengths are on each service page.",
    },
  ] satisfies FaqItem[],
} as const;

export const VASTU_CTA = {
  eyebrow: "Next step",
  title: "Would you like your home read with your chart in view?",
  body: "Book a vastu consultation on its own, or the integrated reading that adds the occupants' birth charts. Send a plan and photographs; receive a written, room-by-room summary.",
  primary: { label: "Book a vastu consultation", href: "/book" },
  secondary: { label: "Ask a question first", href: "/contact" },
} as const;
