/**
 * Disclaimer copy (CLAUDE.md §8 E-E-A-T, §12 honesty). Plain language: what astrology and vastu
 * are offered as, what they are not, and how testimonials are handled. No legalese padding.
 */
import type { LegalContext, LegalDocument } from "./types";

const DATE = "2026-09-11";

export function disclaimerDocument(ctx: LegalContext): LegalDocument {
  return {
    slug: "disclaimer",
    eyebrow: "Disclaimer",
    title: "Disclaimer",
    metaTitle: "Disclaimer — Astrologer Kavita",
    metaDescription:
      "What a consultation with Astrologer Kavita is and is not: Vedic astrology and vastu offered as traditional guidance, no guaranteed outcomes, and no substitute for licensed advice.",
    lede: `Astrology and vastu are traditional practices. ${ctx.brandName} offers them honestly, as guidance and reflection, and wants every visitor to understand exactly what that means before booking.`,
    datePublished: DATE,
    dateModified: DATE,
    version: DATE,
    sections: [
      {
        id: "what-this-is",
        tocLabel: "What this is",
        heading: "What are astrology and vastu offered as on this site?",
        answer:
          "Astrologer Kavita offers Vedic astrology (jyotish, the reading of a birth chart) and vastu shastra (the traditional Indian science of buildings and directions) as traditional practices for guidance and reflection. They are interpretive, not scientific instruments, and every reading is one perspective for you to weigh, not an instruction.",
        blocks: [
          {
            type: "p",
            text: `${ctx.practitionerName} reads a birth chart and a home or workplace together, drawing on training in both traditions. The reading describes tendencies, timings and environments as the tradition understands them. What you do with that is your decision.`,
          },
        ],
      },
      {
        id: "not-professional-advice",
        tocLabel: "Not professional advice",
        heading: "Is a consultation a substitute for professional advice?",
        answer:
          "No. A consultation with Astrologer Kavita is not medical, psychological, legal, financial, investment or structural-engineering advice, and must not be used in place of it. If a reading touches on your health, money, a legal matter or building work, please take it to a licensed professional in that field before acting.",
        blocks: [
          {
            type: "ul",
            items: [
              "Health: the practitioner does not diagnose, treat or advise on any medical or mental-health condition, pregnancy or fertility. Never stop or change treatment because of a reading.",
              "Money and career: nothing said about a period, a dasha (planetary period) or a direction is investment or employment advice. Decisions about property, business, loans or investments should rest on professional financial and legal advice.",
              "Legal matters: no opinion on a dispute, contract, marriage, divorce or immigration question is legal advice.",
              "Buildings: vastu suggestions describe a traditional ideal. Any structural change, demolition, plumbing or electrical work must be assessed and carried out by licensed architects, engineers and tradespeople, and must comply with local building law.",
              "Emergencies: if you or someone else is at risk, contact local emergency services or a crisis line immediately.",
            ],
          },
        ],
      },
      {
        id: "no-guarantees",
        tocLabel: "No guarantees",
        heading: "Does a reading guarantee any outcome?",
        answer:
          "No. Astrologer Kavita makes no guarantee that any prediction will come true, that any timing will prove auspicious, or that any remedy will bring a particular result. Astrology and vastu are interpretive traditions; two practitioners may read the same chart differently, and the practitioner does not claim to be infallible.",
        blocks: [
          {
            type: "ul",
            items: [
              "Remedies — gemstones, mantras, colours, timings (muhurat), rearranging rooms, placing objects — are traditional suggestions offered for those who wish to follow them. They are never required, and the practice sells nothing.",
              "Gemstones and other objects bought from third parties are your own purchase; the practitioner earns nothing from them and takes no responsibility for their quality or effect.",
              "Statements about a person, a period or a place describe tendencies within the tradition, not facts about the future.",
              "Any statistics about the practice shown on this website are real figures the practitioner stands behind; where a figure has not yet been supplied, none is shown.",
            ],
          },
        ],
      },
      {
        id: "accuracy",
        tocLabel: "Accuracy",
        heading: "What does a reading depend on?",
        blocks: [
          {
            type: "p",
            text: "A birth chart (kundli) is calculated from the date, time and place of birth. A wrong or approximate time changes the chart, sometimes substantially, so the practitioner asks how certain the time is and says so in the reading when it is uncertain. Vastu advice depends on accurate floor plans, compass directions and photographs. The practitioner is not responsible for readings based on inaccurate details.",
          },
        ],
      },
      {
        id: "testimonials",
        tocLabel: "Testimonials",
        heading: "How are testimonials on this site handled?",
        answer:
          "Every client experience published on the Astrologer Kavita website is real, comes from an actual client, and is shown only with that client's explicit consent, which they can withdraw at any time. Testimonials describe one person's experience; they are not evidence that you will have the same.",
        blocks: [
          {
            type: "ul",
            items: [
              "Names are shown as the client asked — full name, first name or initials — with their city where they agreed.",
              "Wording may be trimmed for length, never altered in meaning.",
              "No testimonial, review count, star rating or “as featured in” claim is invented. While no consented testimonials have been supplied, the site shows clearly-marked placeholder text and nothing more.",
              "To withdraw a testimonial, use [the contact page](/contact); it is removed within 14 days.",
            ],
          },
        ],
      },
      {
        id: "website-content",
        tocLabel: "Articles and glossary",
        heading: "About the articles and glossary",
        blocks: [
          {
            type: "p",
            text: "The [Learn section](/learn) and glossary explain the traditions in general terms for readers and for AI assistants. They are educational, written by the practitioner, dated, and not tailored to any reader's chart or home. Traditions vary by region and lineage; where the practitioner follows one convention (for example North Indian chart style or a particular ayanamsa), the article says so. Nothing on the site should be read as advice for your situation.",
          },
        ],
      },
      {
        id: "responsibility",
        tocLabel: "Your responsibility",
        heading: "Your responsibility",
        blocks: [
          {
            type: "p",
            text: "By booking or by using this website you accept that astrology and vastu are traditional practices offered for guidance and reflection, that no outcome is promised, and that decisions and their consequences are yours. The [terms of service](/terms) set out the limits of liability, and the [privacy policy](/privacy) explains how your birth details and documents are protected.",
          },
          {
            type: "p",
            text: `Questions about anything on this page: ${ctx.email}, or through [the contact page](/contact).`,
          },
        ],
      },
    ],
  };
}
