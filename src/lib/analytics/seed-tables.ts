/**
 * Weighted distribution tables for the analytics seed (`seed-data.ts`): markets, cities,
 * devices, browsers, screens, acquisition hosts, campaigns and site paths. Weights are
 * illustrative, not measurements.
 */

export const COUNTRIES = [
  ["IN", 46],
  ["US", 15],
  ["GB", 10],
  ["AE", 10],
  ["CA", 7],
  ["AU", 5],
  ["SG", 4],
  ["DE", 1.5],
  ["NL", 1],
  ["NZ", 0.5],
] as const;

export const CITIES: Record<string, readonly (readonly [[string, string], number])[]> = {
  IN: [
    [["Maharashtra", "Mumbai"], 22],
    [["Delhi", "New Delhi"], 18],
    [["Karnataka", "Bengaluru"], 14],
    [["Telangana", "Hyderabad"], 8],
    [["Tamil Nadu", "Chennai"], 7],
    [["West Bengal", "Kolkata"], 6],
    [["Gujarat", "Ahmedabad"], 6],
    [["Rajasthan", "Jaipur"], 5],
    [["Maharashtra", "Pune"], 6],
    [["Uttar Pradesh", "Lucknow"], 4],
    [["Haryana", "Gurugram"], 4],
  ],
  US: [
    [["New Jersey", "Edison"], 22],
    [["California", "San Jose"], 18],
    [["Texas", "Houston"], 14],
    [["New York", "New York"], 16],
    [["Illinois", "Chicago"], 10],
    [["Georgia", "Atlanta"], 8],
    [["Washington", "Seattle"], 7],
    [["Texas", "Dallas"], 5],
  ],
  GB: [
    [["England", "London"], 50],
    [["England", "Leicester"], 15],
    [["England", "Birmingham"], 12],
    [["England", "Manchester"], 9],
    [["England", "Slough"], 8],
    [["Scotland", "Glasgow"], 6],
  ],
  AE: [
    [["Dubai", "Dubai"], 65],
    [["Abu Dhabi", "Abu Dhabi"], 22],
    [["Sharjah", "Sharjah"], 10],
    [["Ajman", "Ajman"], 3],
  ],
  CA: [
    [["Ontario", "Toronto"], 40],
    [["Ontario", "Brampton"], 22],
    [["Ontario", "Mississauga"], 12],
    [["British Columbia", "Vancouver"], 14],
    [["British Columbia", "Surrey"], 7],
    [["Alberta", "Calgary"], 5],
  ],
  AU: [
    [["New South Wales", "Sydney"], 45],
    [["Victoria", "Melbourne"], 35],
    [["Queensland", "Brisbane"], 12],
    [["Western Australia", "Perth"], 8],
  ],
  SG: [[["Singapore", "Singapore"], 1]],
  DE: [[["Hesse", "Frankfurt"], 1]],
  NL: [[["North Holland", "Amsterdam"], 1]],
  NZ: [[["Auckland", "Auckland"], 1]],
};

export const DEVICES = [
  ["mobile", 62],
  ["desktop", 33],
  ["tablet", 5],
] as const;

export const OS_BY_DEVICE: Record<string, readonly (readonly [string, number])[]> = {
  mobile: [
    ["Android", 68],
    ["iOS", 32],
  ],
  desktop: [
    ["Windows", 62],
    ["macOS", 30],
    ["Linux", 5],
    ["ChromeOS", 3],
  ],
  tablet: [
    ["iOS", 70],
    ["Android", 30],
  ],
};

export const BROWSER_BY_OS: Record<string, readonly (readonly [string, number])[]> = {
  Android: [
    ["Chrome", 82],
    ["Samsung Internet", 12],
    ["Firefox", 3],
    ["UC Browser", 3],
  ],
  iOS: [
    ["Safari", 84],
    ["Chrome", 14],
    ["Firefox", 2],
  ],
  Windows: [
    ["Chrome", 68],
    ["Edge", 24],
    ["Firefox", 8],
  ],
  macOS: [
    ["Safari", 52],
    ["Chrome", 42],
    ["Firefox", 6],
  ],
  Linux: [
    ["Chrome", 55],
    ["Firefox", 45],
  ],
  ChromeOS: [["Chrome", 1]],
};

export const SCREENS_BY_DEVICE: Record<string, readonly (readonly [string, number])[]> = {
  mobile: [
    ["390x844", 30],
    ["360x800", 32],
    ["412x915", 20],
    ["393x852", 12],
    ["430x932", 6],
  ],
  desktop: [
    ["1920x1080", 40],
    ["1536x864", 22],
    ["1440x900", 16],
    ["1366x768", 14],
    ["2560x1440", 8],
  ],
  tablet: [
    ["820x1180", 50],
    ["768x1024", 30],
    ["1024x1366", 20],
  ],
};

export const CONNECTIONS = [
  ["4g", 78],
  ["3g", 12],
  ["slow-2g", 2],
  ["2g", 3],
  ["5g", 5],
] as const;

export const SEARCH = [
  ["google.com", 85],
  ["bing.com", 9],
  ["duckduckgo.com", 4],
  ["yahoo.com", 2],
] as const;
export const SOCIAL = [
  ["instagram.com", 40],
  ["youtube.com", 25],
  ["facebook.com", 18],
  ["linkedin.com", 9],
  ["whatsapp.com", 8],
] as const;
export const AI = [
  ["chatgpt.com", 50],
  ["perplexity.ai", 20],
  ["gemini.google.com", 15],
  ["claude.ai", 8],
  ["copilot.microsoft.com", 5],
  ["bing.com/chat", 2],
] as const;
export const REFERRAL = [
  ["astrologyforum.example", 30],
  ["desidirectory.example", 25],
  ["nrilife.example", 20],
  ["vastuguide.example", 15],
  ["expatgulf.example", 10],
] as const;
export const CAMPAIGNS = [
  ["diwali-readings", 30],
  ["navratri-muhurat", 20],
  ["vastu-dubai", 20],
  ["kundli-milan-usa", 15],
  ["new-year-forecast", 15],
] as const;

export const CORE_PATHS = [
  ["/", 26],
  ["/about", 5],
  ["/astrology", 7],
  ["/vastu", 7],
  ["/services", 6],
  ["/services/integrated-life-reading", 6],
  ["/services/kundli-analysis", 5],
  ["/services/kundli-milan", 4],
  ["/services/vastu-home", 4],
  ["/services/vastu-commercial", 2],
  ["/services/muhurat", 2],
  ["/learn", 4],
  ["/learn/vastu/is-vastu-applicable-to-apartments", 3],
  ["/learn/astrology/do-i-need-my-exact-birth-time", 3],
  ["/learn/integrated/how-astrology-and-vastu-work-together", 3],
  ["/glossary/kundli", 2],
  ["/glossary/dasha", 1],
  ["/glossary/brahmasthan", 1],
  ["/testimonials", 3],
  ["/faq", 3],
  ["/contact", 4],
  ["/book", 6],
] as const;

export const TITLES: Record<string, string> = {
  "/": "Astrologer Kavita — Vedic Astrology & Vastu, Read Together",
  "/book": "Book a consultation — Astrologer Kavita",
  "/contact": "Contact — Astrologer Kavita",
};
