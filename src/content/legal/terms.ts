/**
 * Terms of service copy (CLAUDE.md §11 payments seam, §12 honesty). Defaults marked "to confirm"
 * are sensible starting points the practitioner must confirm; each placeholder is listed in
 * NEEDS-REAL-DATA.md under "Legal".
 */
import { LEGAL_PLACEHOLDERS as P, toConfirm, type LegalContext, type LegalDocument } from "./types";

const DATE = "2026-09-11";

export function termsDocument(ctx: LegalContext): LegalDocument {
  const provider = `${ctx.legalEntity} (trading as ${ctx.brandName})`;
  const notice = toConfirm("24 hours", P.rescheduleNoticeHours);
  const cancellation = toConfirm(
    "a session cancelled with at least the notice above may be rebooked once at no charge; a session cancelled with less notice, or missed, is treated as delivered",
    P.cancellationPolicy,
  );
  const refund = toConfirm(
    "fees are refunded in full if the practitioner cancels and no alternative time suits you; otherwise fees are not refunded once a session has been delivered",
    P.refundPolicy,
  );

  return {
    slug: "terms",
    eyebrow: "Terms of service",
    title: "Terms of service",
    metaTitle: "Terms of Service — Astrologer Kavita",
    metaDescription:
      "The terms for consulting Astrologer Kavita: what a reading is and is not, booking, rescheduling and cancellation, payment, your responsibilities, and liability.",
    lede: `These terms govern every consultation booked with ${ctx.brandName} and every use of this website. They are deliberately short and in plain language; if anything is unclear, ask before you book.`,
    datePublished: DATE,
    dateModified: DATE,
    version: DATE,
    sections: [
      {
        id: "parties",
        tocLabel: "Parties",
        heading: "Who provides the service, and who do these terms apply to?",
        answer: `Consultations with Astrologer Kavita are provided by ${provider}, run by ${ctx.practitionerName} from ${ctx.basedIn}. These terms apply to anyone who books a consultation, submits a form on this website or uses its content, wherever in the world they are.`,
        blocks: [
          {
            type: "dl",
            rows: [
              { term: "Provider", detail: provider },
              { term: "Practitioner", detail: ctx.practitionerName },
              { term: "Based in", detail: `${ctx.basedIn} (${ctx.timezone})` },
              { term: "Contact", detail: `${ctx.email} · [Contact page](/contact)` },
            ],
          },
          {
            type: "p",
            text: "By booking, submitting a form or continuing to use the site you accept these terms, the [privacy policy](/privacy) and the [disclaimer](/disclaimer).",
          },
        ],
      },
      {
        id: "services",
        tocLabel: "What a consultation is",
        heading: "What is a consultation, and what is it not?",
        answer:
          "A consultation with Astrologer Kavita is a traditional Vedic astrology and vastu reading offered for guidance and reflection. It is not medical, legal, financial, psychological or engineering advice, and no outcome is promised. The practitioner interprets a birth chart and a home or workplace; decisions and their consequences remain yours.",
        blocks: [
          {
            type: "p",
            text: "The services listed on [the services page](/services) describe what each session covers, how long it runs, whether it is astrology-led, vastu-led or integrated, and what you receive afterwards. That description forms part of these terms. Sessions take place online by video or phone, by written report from a floor plan, or in person where offered.",
          },
          {
            type: "ul",
            items: [
              "Readings rely on the birth details and property information you supply; their quality depends on that information being accurate.",
              "Remedies suggested — gemstones, timings, colours, arrangement of rooms, rituals — are traditional suggestions. You are never required to buy anything, and the practice sells no gemstones or objects.",
              "Structural changes to a property should be checked by a licensed architect or engineer before any work is done.",
              "The practitioner does not diagnose illness, predict death, offer legal opinions, or advise on the purchase or sale of specific financial products.",
            ],
          },
        ],
      },
      {
        id: "booking",
        tocLabel: "Booking",
        heading: "How does booking work?",
        answer:
          "A booking with Astrologer Kavita is confirmed once the practitioner accepts the requested time and you receive a confirmation by email. Until then the slot is held provisionally. Times are shown in both your timezone and the practitioner's; please check the date and time in the confirmation carefully.",
        blocks: [
          {
            type: "ul",
            items: [
              `Bookings are made through [the booking page](/book) or by arrangement with the practitioner directly. You must be 18 or older to book.`,
              "The confirmation email contains the session time in your timezone and the practitioner's, the meeting details, and a link to reschedule or cancel.",
              "The practitioner may decline or cancel a booking at any time — for instance if the request falls outside what the practice offers — and will refund any fee paid for it.",
              "Please join online sessions on time. A session that starts late because of the client still ends at the scheduled time.",
            ],
          },
        ],
      },
      {
        id: "rescheduling",
        tocLabel: "Rescheduling and refunds",
        heading: "What is the rescheduling, cancellation and refund policy?",
        answer: `Astrologer Kavita asks for at least ${notice} notice to reschedule or cancel a consultation. Rescheduling with that notice is free. Cancellation and refund terms are set out below; the practitioner refunds in full whenever she cancels and no alternative time suits you.`,
        blocks: [
          {
            type: "dl",
            rows: [
              { term: "Notice to reschedule", detail: notice },
              { term: "Cancellation", detail: cancellation },
              { term: "Refunds", detail: refund },
              {
                term: "Practitioner cancels",
                detail:
                  "You choose a new time or receive a full refund of any fee paid; no other compensation is offered.",
              },
              {
                term: "Technical failure",
                detail:
                  "If a video or phone connection fails and the session cannot reasonably continue, the remaining time is rescheduled at no charge.",
              },
            ],
          },
          {
            type: "note",
            text: "Items marked “to confirm” are default wording awaiting the practitioner's decision and will be replaced by the confirmed policy.",
          },
        ],
      },
      {
        id: "payment",
        tocLabel: "Payment",
        heading: "How and when is payment made?",
        answer:
          "At present Astrologer Kavita takes no payment through this website. After a booking is confirmed the practitioner shares the fee and payment details directly, in Indian rupees, US dollars, pounds sterling or UAE dirhams. When online payment is added, it will be handled by a payment gateway and these terms will say so.",
        blocks: [
          {
            type: "ul",
            items: [
              "Fees are those shown on the service page or quoted in writing at the time of booking; a quote holds for the booking it was given for.",
              "Currencies accepted: INR, USD, GBP and AED. Bank or transfer charges on your side are yours; on the practitioner's side, hers.",
              "Payment is due before the session unless the practitioner agrees otherwise in writing. A booking marked as awaiting payment may be released if payment has not arrived by the session time.",
              "No card or bank details are ever stored by this website.",
            ],
          },
        ],
      },
      {
        id: "your-responsibilities",
        tocLabel: "Your responsibilities",
        heading: "What are you responsible for as a client?",
        blocks: [
          {
            type: "ul",
            items: [
              "Providing accurate birth details — date, time and place — and telling the practitioner how certain the birth time is. A chart cast from a wrong time is a wrong chart, and the practitioner cannot be responsible for readings based on inaccurate details.",
              "Providing floor plans, compass directions and photographs that genuinely represent the property, and having the right to share them.",
              "Making your own decisions. A reading is one input among many; you remain responsible for what you do with it, and for consulting a doctor, lawyer, accountant, therapist or engineer where a decision needs one.",
              "Treating the practitioner and any other person on a call with courtesy. Abusive behaviour ends the session without refund.",
              "Not recording a session without the practitioner's agreement, and not reselling or republishing a reading.",
            ],
          },
        ],
      },
      {
        id: "intellectual-property",
        tocLabel: "Intellectual property",
        heading: "Who owns the content on this site and in your reading?",
        blocks: [
          {
            type: "p",
            text: `The articles, glossary, page copy, diagrams and design of this website belong to ${provider} and may not be copied, scraped for republication or used to train a commercial product without written permission. Quoting a short passage with a link to the source is welcome.`,
          },
          {
            type: "p",
            text: "Your written report and any chart prepared for you are yours to keep and use personally. The method, templates and explanatory text inside them remain the practitioner's. Birth details and property documents you supply stay yours; you grant only the permission needed to prepare your reading.",
          },
        ],
      },
      {
        id: "liability",
        tocLabel: "Liability",
        heading: "What is the limit of the practitioner's liability?",
        answer:
          "Astrologer Kavita provides consultations with reasonable care and skill, but because astrology and vastu are interpretive traditional practices, no result is guaranteed and no liability is accepted for decisions made on the basis of a reading. Liability for any claim is limited to the fee paid for the consultation concerned.",
        blocks: [
          {
            type: "ul",
            items: [
              "Nothing in these terms limits liability for death or personal injury caused by negligence, for fraud, or for anything that cannot lawfully be limited in your country.",
              "Subject to that, the practitioner is not liable for indirect or consequential loss — lost profit, lost opportunity, costs of building work, or emotional distress — arising from a reading or from reliance on website content.",
              "The total liability for any one booking is limited to the amount you paid for it.",
              "Website content is provided as general information and may be out of date; it is not advice for your situation.",
              "This website links to other sites and services (video calling, maps, social platforms) whose content and terms are their own.",
            ],
          },
        ],
      },
      {
        id: "website-use",
        tocLabel: "Website use",
        heading: "Rules for using the website",
        blocks: [
          {
            type: "ul",
            items: [
              "Do not submit forms on behalf of someone else without their permission, or submit false, abusive or automated content.",
              "Do not attempt to access admin areas, other people's bookings, or the database, or to disrupt the service. Requests are rate-limited and abuse is logged.",
              "Testimonials you submit may be edited for length and clarity, never for meaning, and are published only with your consent as described in the [privacy policy](/privacy).",
            ],
          },
        ],
      },
      {
        id: "governing-law",
        tocLabel: "Governing law",
        heading: "Which law governs these terms?",
        blocks: [
          {
            type: "p",
            text: `These terms are governed by the laws of ${P.governingLaw}, and the courts of that jurisdiction have non-exclusive jurisdiction over any dispute. Nothing in this clause takes away consumer protections that apply in the country where you live. Before any formal step, please raise the concern with the practitioner directly; most issues are resolved in a conversation.`,
          },
          {
            type: "p",
            text: "If any part of these terms is found unenforceable, the rest continues to apply. Failure to enforce a term is not a waiver of it.",
          },
        ],
      },
      {
        id: "changes",
        tocLabel: "Changes",
        heading: "Changes to these terms",
        blocks: [
          {
            type: "p",
            text: "The date at the top of this page shows when these terms last changed. Bookings are governed by the terms in force when they were confirmed. Material changes are posted here before they take effect.",
          },
          {
            type: "p",
            text: `Questions about these terms: ${ctx.email}, or through [the contact page](/contact).`,
          },
        ],
      },
    ],
  };
}
