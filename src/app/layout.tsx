import type { Metadata } from "next";
import { Tracker } from "@/components/analytics/tracker";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Integrations } from "@/components/layout/integrations";
import { MobileCtaBar } from "@/components/layout/mobile-cta-bar";
import { BOOK_HREF } from "@/components/layout/nav-items";
import { JsonLd } from "@/components/seo/json-ld";
import { ThemeScript } from "@/components/ui/theme-script";
import { getCountries, getSameAsUrls, getSiteSettings } from "@/lib/data";
import { fontSans, fontSerif } from "@/lib/fonts";
import { personSchema, professionalServiceSchema, webSiteSchema } from "@/lib/seo/schema";
import { getSiteUrl, whatsappHref } from "@/lib/site";
import "./globals.css";

const SITE_NAME = "Astrologer Kavita";
const DEFAULT_DESCRIPTION =
  "Vedic astrology and vastu shastra read together as one integrated consultation. Online worldwide and in person, with Astrologer Kavita.";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} — Vedic Astrology & Vastu, Read Together`,
    template: `%s — ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    title: `${SITE_NAME} — Vedic Astrology & Vastu, Read Together`,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const siteUrl = getSiteUrl();
  const [settings, sameAs, countries] = await Promise.all([
    getSiteSettings(),
    getSameAsUrls(),
    getCountries(),
  ]);

  const siteSchema = [
    professionalServiceSchema({
      settings,
      sameAs,
      siteUrl,
      areaServed: countries.map((c) => c.name),
    }),
    personSchema({ settings, sameAs, siteUrl }),
    webSiteSchema({ siteUrl, name: settings.brandName }),
  ];

  return (
    <html
      lang="en"
      className={`${fontSerif.variable} ${fontSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Header />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <Footer />
        <MobileCtaBar bookHref={BOOK_HREF} whatsappHref={whatsappHref(settings.whatsapp)} />
        <Integrations />
        <Tracker />
        <JsonLd data={siteSchema} id="site-schema" />
      </body>
    </html>
  );
}
