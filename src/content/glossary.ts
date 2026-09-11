/**
 * Glossary of the Vedic astrology and vastu terms the site uses (CLAUDE.md §5 `/glossary/[term]`,
 * §9). Every entry has a standalone `short` definition (≤ 40 words, lifted verbatim by answer
 * engines) and a fuller `definition` (80–150 words). Definitions describe what the tradition
 * holds and how the term is used in a reading; where traditions differ, the entry says so. No
 * entry promises an outcome. `dateModified` feeds the sitemap and the page's visible date.
 */
export type GlossaryCategory = "astrology" | "vastu";

export interface GlossaryTerm {
  /** URL slug: `/glossary/<slug>`. */
  readonly slug: string;
  /** Display form, as used in the site's prose. */
  readonly term: string;
  /** Sanskrit or IAST form, when it differs usefully from the display form. */
  readonly sanskrit?: string;
  /** Other spellings and English equivalents readers search for. */
  readonly aliases: readonly string[];
  readonly category: GlossaryCategory;
  /** ≤ 40 words, self-contained. */
  readonly short: string;
  /** 80–150 words. */
  readonly definition: string;
  readonly relatedTerms: readonly string[];
  /** `YYYY-MM-DD`; bump in the same change that edits the entry. */
  readonly dateModified: string;
}

const D = "2026-09-11";

export const GLOSSARY: readonly GlossaryTerm[] = [
  {
    slug: "kundli",
    term: "Kundli",
    sanskrit: "kuṇḍalī",
    aliases: ["birth chart", "janam kundli", "janam patri", "horoscope", "natal chart"],
    category: "astrology",
    short:
      "A kundli is the Vedic birth chart: a diagram of where the Sun, Moon and planets stood in the twelve signs and twelve houses at the date, time and place of a person's birth.",
    definition:
      "A kundli is the Vedic birth chart, cast for the exact date, time and place of birth. It records the sign rising in the east (the lagna), the twelve houses counted from it, and the position of each of the nine grahas in sign and house. Indian astrologers draw it in one of two layouts: the North Indian diamond, where houses are fixed and signs rotate, or the South Indian square, where signs are fixed and the ascendant is marked. The kundli is the base document of a reading; from it are derived the divisional charts, the dasha timeline and the transits. Because the ascendant and houses depend on the birth time, the accuracy of a kundli is only as good as the recorded time behind it.",
    relatedTerms: ["lagna", "bhava", "graha", "navamsa", "dasha"],
    dateModified: D,
  },
  {
    slug: "dasha",
    term: "Dasha",
    sanskrit: "daśā",
    aliases: ["planetary period", "vimshottari dasha"],
    category: "astrology",
    short:
      "A dasha is a planetary period: a span of years during which one graha is held to set the tone of a person's life. The most used system, Vimshottari, cycles through nine periods totalling 120 years.",
    definition:
      "A dasha is a planetary period, the main timing device of Vedic astrology. The most widely used system, Vimshottari, assigns each of the nine grahas a fixed span — from six years for the Sun to twenty for Venus — in a sequence totalling 120 years. The sequence starts from the nakshatra the Moon occupied at birth, and the portion of the first period already elapsed is worked out from the Moon's exact position within that nakshatra, which is why the birth time matters to dasha dates. Each major period (mahadasha) is subdivided into sub-periods (antardasha) in the same proportions. Astrologers read a dasha as the season a person is in, judging its likely character from the condition of its ruling planet in the kundli. Other dasha systems exist and some practitioners use several together.",
    relatedTerms: ["mahadasha", "antardasha", "nakshatra", "gochar"],
    dateModified: D,
  },
  {
    slug: "mahadasha",
    term: "Mahadasha",
    sanskrit: "mahādaśā",
    aliases: ["major period", "main period"],
    category: "astrology",
    short:
      "A mahadasha is a major planetary period in the Vimshottari system, lasting between six and twenty years depending on the ruling graha. It is the top level of the dasha timeline, subdivided into antardashas.",
    definition:
      "A mahadasha is the major period of the Vimshottari dasha system. Each of the nine grahas rules one mahadasha of a fixed length: Sun six years, Moon ten, Mars seven, Rahu eighteen, Jupiter sixteen, Saturn nineteen, Mercury seventeen, Ketu seven and Venus twenty, in that order. The cycle begins from the lord of the Moon's birth nakshatra, so two people born on the same day can start in different periods. A mahadasha is read as the broad chapter a person is living through; the strength, placement and house rulership of its lord in the kundli suggest which areas of life are most active. Within it, antardashas mark shorter phases. Practitioners differ on how much weight to give the mahadasha lord relative to the sub-period lord, and most read them together with current transits.",
    relatedTerms: ["dasha", "antardasha", "graha"],
    dateModified: D,
  },
  {
    slug: "antardasha",
    term: "Antardasha",
    sanskrit: "antardaśā",
    aliases: ["sub-period", "bhukti"],
    category: "astrology",
    short:
      "An antardasha, also called a bhukti, is a sub-period within a mahadasha. Each major period is divided among the nine grahas in the same proportions as the main cycle, giving phases of months to a few years.",
    definition:
      "An antardasha, also called a bhukti in South Indian usage, is a sub-period within a mahadasha. Each major period is divided among all nine grahas in the same proportions as the 120-year cycle, beginning with the mahadasha lord itself. A Venus mahadasha of twenty years, for example, opens with a Venus antardasha of about three years and four months, followed by Sun, Moon, Mars and so on. Astrologers read the antardasha as the more immediate phase within the broader chapter, and the relationship between the two lords — whether they are friendly, whether they occupy or rule supportive houses — is central to how the period is judged. Antardashas are themselves divisible into pratyantar dashas for finer timing, though the precision this implies depends entirely on an accurate birth time.",
    relatedTerms: ["dasha", "mahadasha"],
    dateModified: D,
  },
  {
    slug: "sade-sati",
    term: "Sade sati",
    sanskrit: "sāḍhe sātī",
    aliases: ["saturn transit over the moon", "seven and a half years of saturn"],
    category: "astrology",
    short:
      "Sade sati is the roughly seven-and-a-half-year period during which transiting Saturn passes through the sign before a person's Moon sign, the Moon sign itself, and the sign after it.",
    definition:
      "Sade sati, literally 'seven and a half', is the period during which Saturn transits the three signs centred on a person's natal Moon: the sign before the Moon sign, the Moon sign, and the sign after. Saturn spends about two and a half years in each sign, giving a total near seven and a half years, and the cycle recurs roughly every thirty years. The tradition treats it as a demanding but formative time, associated with responsibility, effort and the pruning of what no longer serves, rather than as uniformly bad; the three phases are often read differently, and the Moon's own condition in the kundli shapes the experience. A related transit, dhaiya, is Saturn in the fourth or eighth sign from the Moon. How much weight sade sati deserves relative to the running dasha is a matter on which practitioners differ.",
    relatedTerms: ["gochar", "rashi", "graha"],
    dateModified: D,
  },
  {
    slug: "rashi",
    term: "Rashi",
    sanskrit: "rāśi",
    aliases: ["moon sign", "zodiac sign", "chandra rashi"],
    category: "astrology",
    short:
      "A rashi is one of the twelve signs of the sidereal zodiac, each thirty degrees wide. In everyday Indian usage 'my rashi' means the sign the Moon occupied at birth, not the Sun sign of Western horoscopes.",
    definition:
      "A rashi is one of the twelve thirty-degree divisions of the zodiac — Mesha (Aries) through Meena (Pisces) — measured in Vedic astrology along the sidereal zodiac, which is offset from the Western tropical zodiac by the ayanamsa. When an Indian family speaks of a person's rashi, it almost always means the chandra rashi, the sign the Moon was in at birth, which also gives the traditional first syllable of a child's name. This is why a person's Vedic sign can differ from the Sun sign they know from Western horoscopes. The Moon changes rashi about every two and a quarter days, so on most dates the sign is fixed without a birth time, but on a sign-change day the time decides it. The rashi is the reference point for transit readings such as sade sati and for many panchang calculations.",
    relatedTerms: ["nakshatra", "lagna", "ayanamsa", "sade-sati"],
    dateModified: D,
  },
  {
    slug: "nakshatra",
    term: "Nakshatra",
    sanskrit: "nakṣatra",
    aliases: ["lunar mansion", "birth star", "janma nakshatra"],
    category: "astrology",
    short:
      "A nakshatra is one of twenty-seven lunar mansions, each spanning thirteen degrees and twenty minutes of the zodiac. The nakshatra the Moon occupied at birth is the birth star, and it sets the starting dasha.",
    definition:
      "A nakshatra is one of the twenty-seven lunar mansions into which Vedic astrology divides the zodiac, each thirteen degrees and twenty minutes wide, beginning with Ashwini and ending with Revati. The Moon takes roughly a day to cross one, so the birth nakshatra — the janma nakshatra — is fixed for most birth dates. Each nakshatra has a ruling graha, a presiding deity and a set of traditional qualities, and each is divided into four quarters (padas) that are also used in the navamsa chart. The birth nakshatra determines which mahadasha a person is born into under the Vimshottari system, which makes it one of the most consequential points in the chart. Nakshatras also govern much of the panchang and the choosing of muhurats, and they are used in kundli milan (horoscope matching) for marriage.",
    relatedTerms: ["rashi", "dasha", "panchang", "navamsa"],
    dateModified: D,
  },
  {
    slug: "lagna",
    term: "Lagna",
    sanskrit: "lagna",
    aliases: ["ascendant", "rising sign", "udaya lagna"],
    category: "astrology",
    short:
      "The lagna, or ascendant, is the sign rising on the eastern horizon at the moment and place of birth. It becomes the first house of the kundli and fixes the position of all twelve houses.",
    definition:
      "The lagna, or ascendant, is the point of the zodiac rising on the eastern horizon at the exact moment and place of birth, and the sign containing that point becomes the first house of the kundli. Because the Earth turns through the whole zodiac each day, the lagna changes sign roughly every two hours — faster or slower depending on latitude and on the sign — which is why it is the part of the chart most dependent on an accurate birth time. Every other house is counted from the lagna, so it governs how the planets are read: a graha in the tenth house from one lagna becomes a graha in the ninth from the next. The lagna and its ruling planet are read for constitution, temperament and the general direction of a life. Divisional charts each have their own lagna, calculated from the same moment.",
    relatedTerms: ["kundli", "bhava", "rashi", "navamsa"],
    dateModified: D,
  },
  {
    slug: "navamsa",
    term: "Navamsa",
    sanskrit: "navāṃśa",
    aliases: ["d9 chart", "ninth divisional chart", "d-9"],
    category: "astrology",
    short:
      "The navamsa is the ninth divisional chart, made by splitting each sign into nine parts of three degrees twenty minutes. Astrologers read it alongside the birth chart, especially for marriage and a planet's underlying strength.",
    definition:
      "The navamsa, or D-9, is the most used of the divisional charts (vargas) of Vedic astrology. Each sign of the zodiac is divided into nine equal parts of three degrees and twenty minutes, and a planet's navamsa position depends on which ninth of its sign it occupies. The resulting chart is read beside the main kundli: a planet that is well placed in both is held to be reliably strong, and the tradition treats the navamsa as the chart of marriage, partnership and the later unfolding of what the birth chart promises. The navamsa lagna changes about every thirteen minutes, so the chart is sensitive to the birth time; a time that is only roughly known makes the navamsa provisional. The nine parts of each sign also correspond to the four quarters of the nakshatras.",
    relatedTerms: ["kundli", "lagna", "nakshatra"],
    dateModified: D,
  },
  {
    slug: "muhurat",
    term: "Muhurat",
    sanskrit: "muhūrta",
    aliases: ["auspicious time", "muhurta", "electional astrology"],
    category: "astrology",
    short:
      "A muhurat is a chosen auspicious time for beginning something — a wedding, a house entry, a business — selected from the panchang so that the lunar day, star, weekday and rising sign favour the undertaking.",
    definition:
      "A muhurat is an auspicious window of time chosen for starting an undertaking: a marriage, a griha pravesh (house-warming), the opening of a business, a journey, a surgery date or the signing of an agreement. Strictly, a muhurta is a unit of about forty-eight minutes, of which there are thirty in a day, but in common use the word means the chosen moment itself. It is selected by reading the panchang — the lunar day, weekday, nakshatra, yoga and karana — together with the rising sign at the proposed time and, ideally, the birth charts of the people involved, so that the moment suits both the activity and the person. Families and communities follow differing conventions about which combinations to avoid, and a practical muhurat balances the ideal with what is actually possible.",
    relatedTerms: ["panchang", "nakshatra", "lagna"],
    dateModified: D,
  },
  {
    slug: "manglik",
    term: "Manglik (mangal dosha)",
    sanskrit: "maṅgala doṣa",
    aliases: ["mangal dosha", "kuja dosha", "mars affliction", "mangalik"],
    category: "astrology",
    short:
      "A person is called manglik when Mars occupies certain houses of the kundli — commonly the first, fourth, seventh, eighth or twelfth — a placement the tradition weighs in marriage matching, with many recognised exceptions.",
    definition:
      "Mangal dosha, and the adjective manglik, describe a kundli in which Mars (Mangal) occupies one of a set of houses — usually the first, fourth, seventh, eighth or twelfth from the lagna, with the second added in South Indian practice, and often checked from the Moon and Venus as well. The tradition holds that the assertive quality of Mars in these houses can strain a marriage, and so the placement is examined in kundli milan, horoscope matching. It is also hedged with many cancellations: the sign Mars occupies, aspects from Jupiter, the partner having a similar placement, and the person's age are all held to reduce or remove the effect, and practitioners differ considerably on how strictly to apply it. A responsible reading treats mangal dosha as one factor among many, never as a verdict on a person.",
    relatedTerms: ["graha", "bhava", "kundli"],
    dateModified: D,
  },
  {
    slug: "gochar",
    term: "Gochar (transit)",
    sanskrit: "gocara",
    aliases: ["transit", "planetary transit", "gochara"],
    category: "astrology",
    short:
      "Gochar is the transit of a planet through the zodiac in the present, read against the positions fixed in a person's birth chart — usually counted from the Moon sign — to gauge the current period.",
    definition:
      "Gochar, or transit, is the present-day movement of the grahas through the signs, read against the fixed positions of a person's kundli. Where the dasha describes the chapter a person is in, transits describe the weather within it: the two are read together, and a transit is generally held to deliver only what the running dasha permits. Indian practice counts transits chiefly from the Moon sign, so 'Jupiter in the fifth' means the fifth sign from the natal Moon, though the lagna is used as well. The slow planets matter most: Saturn takes about two and a half years per sign, Jupiter about a year, and Rahu and Ketu about eighteen months, so their transits mark longer phases. Sade sati is the best-known transit reading. Faster planets are used for shorter-term timing and for choosing muhurats.",
    relatedTerms: ["sade-sati", "dasha", "rashi"],
    dateModified: D,
  },
  {
    slug: "yoga",
    term: "Yoga",
    sanskrit: "yoga",
    aliases: ["planetary combination", "raja yoga", "dhana yoga"],
    category: "astrology",
    short:
      "In a kundli, a yoga is a named combination of planets, signs and houses that the classical texts link to a particular result, such as a raja yoga for authority. In the panchang, yoga is one of five daily limbs.",
    definition:
      "Yoga, meaning union or combination, has two uses in Vedic astrology. In the kundli, a yoga is a specific configuration of grahas, houses and signs that the classical texts name and attach a meaning to: raja yogas formed by lords of angular and trinal houses are associated with standing and authority, dhana yogas with resources, and there are hundreds of others, including difficult ones such as kemadruma yoga, formed when the Moon has no planets beside it. A yoga in the chart is only a potential; astrologers judge its strength from the condition of the planets involved and expect it to show during their dasha periods. In the panchang, yoga is a separate concept: one of twenty-seven daily combinations calculated from the joint positions of the Sun and Moon, used in selecting a muhurat.",
    relatedTerms: ["graha", "bhava", "panchang", "dasha"],
    dateModified: D,
  },
  {
    slug: "drishti",
    term: "Drishti (aspect)",
    sanskrit: "dṛṣṭi",
    aliases: ["aspect", "planetary aspect", "planetary glance"],
    category: "astrology",
    short:
      "Drishti, or aspect, is the influence a planet casts on a house or planet some distance from it. Every graha aspects the seventh house from itself; Mars, Jupiter and Saturn have additional special aspects.",
    definition:
      "Drishti, literally 'sight' or 'glance', is the Vedic concept of aspect: the influence a graha casts on houses and planets at particular distances from its own position. Every planet aspects the seventh sign from itself in full, so two planets opposite each other aspect one another. Three planets have additional special aspects: Mars also aspects the fourth and eighth signs from itself, Jupiter the fifth and ninth, and Saturn the third and tenth. Many practitioners give Rahu and Ketu the fifth and ninth as well, though the texts differ. Unlike Western aspects, which are measured in degrees between planets, drishti is counted in whole signs, and it runs from the planet to the house it looks at, not both ways. Astrologers read a house as coloured by whichever planets aspect it, alongside any that occupy it.",
    relatedTerms: ["graha", "bhava", "kundli"],
    dateModified: D,
  },
  {
    slug: "ayanamsa",
    term: "Ayanamsa",
    sanskrit: "ayanāṃśa",
    aliases: ["sidereal offset", "precession correction", "lahiri ayanamsa"],
    category: "astrology",
    short:
      "The ayanamsa is the angular difference between the tropical zodiac used in Western astrology and the sidereal zodiac used in Vedic astrology — currently around twenty-four degrees, growing slowly as the equinoxes precess.",
    definition:
      "The ayanamsa is the offset between the two zodiacs. Western astrology uses the tropical zodiac, anchored to the spring equinox; Vedic astrology uses the sidereal zodiac, anchored to the fixed stars. Because the equinox slowly drifts backwards against the stars — the precession of the equinoxes, about one degree in seventy-two years — the two zodiacs have separated since they coincided roughly two thousand years ago, and the gap is now around twenty-four degrees. Subtracting the ayanamsa from a tropical position gives the sidereal one, which is why a person's Vedic Sun sign is often the sign before their Western one. Several ayanamsas are in use; the Lahiri or Chitrapaksha ayanamsa, adopted by India's Calendar Reform Committee, is the most widely used, with Raman and Krishnamurti values among the alternatives. The choice can move a planet near a sign boundary.",
    relatedTerms: ["rashi", "nakshatra", "kundli"],
    dateModified: D,
  },
  {
    slug: "bhava",
    term: "Bhava (house)",
    sanskrit: "bhāva",
    aliases: ["house", "astrological house", "sthana"],
    category: "astrology",
    short:
      "A bhava is one of the twelve houses of a kundli, counted from the lagna. Each governs an area of life — self, wealth, siblings, home, children, health, partnership, longevity, fortune, career, gains and loss.",
    definition:
      "A bhava is one of the twelve houses of the kundli, counted from the lagna, and each is assigned a domain of life: the first for the self and body, second for wealth, speech and family, third for siblings and effort, fourth for home, mother and property, fifth for children, intellect and creativity, sixth for illness, debt and service, seventh for marriage and partnership, eighth for longevity and transformation, ninth for fortune, father and dharma, tenth for career and public standing, eleventh for gains and friends, and twelfth for expenditure, loss and distant places. Vedic astrology most often uses whole-sign houses, in which each house is an entire sign, though some practitioners use house cusps calculated from the mid-heaven. A house is read from its occupants, its ruling planet's condition, and the aspects it receives.",
    relatedTerms: ["lagna", "kundli", "drishti", "graha"],
    dateModified: D,
  },
  {
    slug: "graha",
    term: "Graha (planet)",
    sanskrit: "graha",
    aliases: ["planet", "navagraha", "nine planets"],
    category: "astrology",
    short:
      "A graha is one of the nine 'planets' of Vedic astrology: the Sun, Moon, Mars, Mercury, Jupiter, Venus and Saturn, plus Rahu and Ketu, the two lunar nodes. Together they are the navagraha.",
    definition:
      "Graha, literally 'that which grasps', is the Vedic term for the nine bodies whose positions the kundli records: Surya (Sun), Chandra (Moon), Mangal (Mars), Budha (Mercury), Guru or Brihaspati (Jupiter), Shukra (Venus), Shani (Saturn), and the two lunar nodes Rahu and Ketu, which are not physical bodies but the points where the Moon's orbit crosses the ecliptic. Together they are the navagraha. The outer planets Uranus, Neptune and Pluto are not part of the classical system, though some modern practitioners note them. Each graha has a nature, a set of significations, signs it rules, a sign of exaltation and one of debilitation, and friendships and enmities with the others; its condition in the chart — sign, house, aspects, strength — is the basis of most judgements, and each graha in turn rules a dasha period.",
    relatedTerms: ["bhava", "drishti", "dasha", "kundli"],
    dateModified: D,
  },
  {
    slug: "panchang",
    term: "Panchang",
    sanskrit: "pañcāṅga",
    aliases: ["hindu almanac", "panchangam", "panchanga"],
    category: "astrology",
    short:
      "The panchang is the traditional Hindu almanac, giving five daily elements — lunar day (tithi), weekday (vara), lunar mansion (nakshatra), yoga and karana — from which festivals, fasts and muhurats are fixed.",
    definition:
      "The panchang, 'five limbs', is the Hindu almanac that records, for each day and place, the five elements of the traditional calendar: the tithi (lunar day, of which there are thirty in a lunar month), the vara (weekday), the nakshatra the Moon is passing through, the yoga (one of twenty-seven combinations of the Sun and Moon's positions) and the karana (half a tithi). From these are fixed the dates of festivals and fasts, the timing of rites, and the muhurats chosen for weddings, house entries and new ventures. Panchangs also list sunrise and sunset, eclipses, and inauspicious daily periods such as rahu kala. Regional panchangs differ: North India generally reckons months from full moon to full moon (purnimanta), the South and West from new moon (amanta), and Tamil, Malayalam and Bengali calendars use solar months.",
    relatedTerms: ["muhurat", "nakshatra", "yoga"],
    dateModified: D,
  },
  // --- vastu ------------------------------------------------------------------------------------
  {
    slug: "vastu-purusha-mandala",
    term: "Vastu purusha mandala",
    sanskrit: "vāstu puruṣa maṇḍala",
    aliases: ["vastu grid", "mandala", "vastu mandala"],
    category: "vastu",
    short:
      "The vastu purusha mandala is the square grid — most often nine by nine — on which vastu shastra maps a plot or building, with the cosmic being Vastu Purusha lying across it and a deity assigned to each zone.",
    definition:
      "The vastu purusha mandala is the diagram at the base of vastu shastra: a square divided into a grid of cells (padas), most commonly eight by eight or nine by nine, laid over a plot or a building's footprint and aligned to the cardinal directions. Across it lies the Vastu Purusha, the personified spirit of the site, traditionally shown with his head to the north-east and feet to the south-west, and each zone of the grid is assigned to one of forty-five deities. The mandala gives every part of the plan a direction, an element and a character: the centre (brahmasthan) is kept open, the diagonal corners carry the elements, and the points where the Purusha's vital organs fall (marma sthan) are protected. Vastu advice for room placement, entrances and heavy structure is read off this grid.",
    relatedTerms: ["brahmasthan", "marma-sthan", "ishaan", "nairutya"],
    dateModified: D,
  },
  {
    slug: "brahmasthan",
    term: "Brahmasthan",
    sanskrit: "brahmasthāna",
    aliases: ["centre of the house", "central zone", "brahma sthan"],
    category: "vastu",
    short:
      "The brahmasthan is the central zone of a plot or building in the vastu purusha mandala, assigned to Brahma. Vastu shastra advises keeping it open, light and free of heavy structure, pillars and toilets.",
    definition:
      "The brahmasthan is the centre of the vastu purusha mandala — the middle cell or cells of the grid, held to belong to Brahma, the creator — and by extension the central zone of a plot, a house or an apartment. Traditional courtyard houses across India left it literally open to the sky, as a courtyard or an atrium; the principle behind that is that the centre should be light, uncluttered and unobstructed so that air and light move through the whole dwelling. Vastu guidance therefore advises against placing a toilet, a kitchen, a staircase, a pillar or heavy storage in the brahmasthan, and favours using it as a living area, a passage or a lightly furnished space. In a modern flat where the plan is fixed, the practical remedy is usually to keep the centre clear and well lit rather than to alter structure.",
    relatedTerms: ["vastu-purusha-mandala", "marma-sthan"],
    dateModified: D,
  },
  {
    slug: "ishaan",
    term: "Ishaan (north-east)",
    sanskrit: "īśāna",
    aliases: ["north-east", "northeast corner", "ishan kon", "eshan"],
    category: "vastu",
    short:
      "Ishaan is the north-east direction in vastu shastra, named for Ishana, a form of Shiva, and linked to the water element. It is traditionally kept open, light and clean, and favoured for prayer, water and the main entrance.",
    definition:
      "Ishaan, or ishan kon, is the north-east corner of the vastu purusha mandala, presided over by Ishana, a form of Shiva, and associated with the water element and with the head of the Vastu Purusha. Vastu shastra treats it as the most sensitive zone of a dwelling: it is traditionally kept low, open, light and clean, and favoured for the prayer room, a water source or an entrance. The tradition advises against placing a toilet, a kitchen, a staircase or heavy storage there, and against a plot or building that is cut short in this corner. The reasoning connects with the physical environment — in much of India the north-east receives soft morning light — which is one reason the advice is adjusted rather than applied mechanically in climates and building types the classical texts did not anticipate.",
    relatedTerms: ["vastu-purusha-mandala", "agneya", "nairutya", "vayavya"],
    dateModified: D,
  },
  {
    slug: "agneya",
    term: "Agneya (south-east)",
    sanskrit: "āgneya",
    aliases: ["south-east", "southeast corner", "agni kon"],
    category: "vastu",
    short:
      "Agneya is the south-east direction in vastu shastra, presided over by Agni, the fire deity, and linked to the fire element. It is the traditional position for the kitchen and for electrical equipment.",
    definition:
      "Agneya, or agni kon, is the south-east corner of the vastu purusha mandala, ruled by Agni, the deity of fire, and associated with the fire element. Vastu shastra places the kitchen here, ideally with the cook facing east, and it is also the preferred zone for electrical panels, boilers, generators and other heat-producing equipment. The tradition advises against a water tank, a bedroom for children, or the main entrance in this corner, and against extending or cutting the plot here. The north-west is the usual second choice for a kitchen when the south-east is unavailable, which is often the case in an apartment. Because vastu reads the person and the home together, a consultant will also weigh the occupants' charts — an already fiery temperament in a fire corner is handled differently from a cool one — before recommending a change.",
    relatedTerms: ["vastu-purusha-mandala", "ishaan", "nairutya", "vayavya"],
    dateModified: D,
  },
  {
    slug: "nairutya",
    term: "Nairutya (south-west)",
    sanskrit: "nairṛtya",
    aliases: ["south-west", "southwest corner", "nairuthi"],
    category: "vastu",
    short:
      "Nairutya is the south-west direction in vastu shastra, presided over by Nirriti and linked to the earth element. It is traditionally the heaviest, highest and most enclosed part of a home, and the preferred place for the master bedroom.",
    definition:
      "Nairutya is the south-west corner of the vastu purusha mandala, presided over by Nirriti and associated with the earth element and the feet of the Vastu Purusha. Where the north-east is kept open and light, the south-west is kept heavy, closed and stable: vastu shastra places the master bedroom here, along with heavy storage, safes and thick walls, and favours a plot that is higher or more built up in this corner than in the north-east. The tradition advises against an entrance, an open verandah, a water body or a septic tank in the south-west, and against a plot cut short there. The pairing of a solid south-west with an open north-east is the single most consistent principle across the vastu literature, and it is one that can usually be honoured in a flat through furniture and use rather than structural change.",
    relatedTerms: ["vastu-purusha-mandala", "ishaan", "agneya", "vayavya"],
    dateModified: D,
  },
  {
    slug: "vayavya",
    term: "Vayavya (north-west)",
    sanskrit: "vāyavya",
    aliases: ["north-west", "northwest corner", "vayu kon"],
    category: "vastu",
    short:
      "Vayavya is the north-west direction in vastu shastra, presided over by Vayu, the wind deity, and linked to the air element. It is associated with movement, and used for guest rooms, stores of finished goods and a second kitchen position.",
    definition:
      "Vayavya, or vayu kon, is the north-west corner of the vastu purusha mandala, ruled by Vayu, the deity of wind, and associated with the air element and with movement and change. Vastu shastra treats it as the zone of things that should not stay: guests, goods ready for sale, grain that will be used, and — in some readings — a daughter of marriageable age, reflecting the older social context of the texts. It is the accepted second position for a kitchen when the south-east is not available, and a common location for a toilet or a garage. The tradition advises against placing the master bedroom or the treasury here, on the reasoning that the air element unsettles what should be stable. In practice, a consultant reads the north-west with the prevailing wind and the plan's ventilation in mind.",
    relatedTerms: ["vastu-purusha-mandala", "ishaan", "agneya", "nairutya"],
    dateModified: D,
  },
  {
    slug: "marma-sthan",
    term: "Marma sthan",
    sanskrit: "marma sthāna",
    aliases: ["vital point", "marma point", "marmasthan"],
    category: "vastu",
    short:
      "Marma sthan are the vital points of the vastu purusha mandala — where its diagonals and principal lines cross, corresponding to the Vastu Purusha's organs — which vastu shastra says should be free of pillars, walls and heavy loads.",
    definition:
      "Marma sthan, the vital points, are the locations on the vastu purusha mandala where the major diagonals and the lines joining the mid-points of the sides intersect, corresponding in the tradition to the vital organs and joints of the Vastu Purusha lying across the grid. The classical texts hold that these points should not be pierced or loaded: no pillar, load-bearing wall, staircase, well or toilet should fall on a marma, and the centre of the grid, the brahmasthan, is the most important of them. The concept comes from the same body of thought as the marma points of Ayurveda. In modern practice a consultant overlays the mandala on the floor plan to see where the marmas fall; in an existing building they cannot be moved, so the advice is usually about what is placed over them rather than about structure.",
    relatedTerms: ["vastu-purusha-mandala", "brahmasthan"],
    dateModified: D,
  },
] as const;
