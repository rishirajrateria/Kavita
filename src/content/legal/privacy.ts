/**
 * Privacy policy copy (CLAUDE.md §10 personal data, §13 integrations and consent, §12 honesty).
 * Written for THIS site: it describes exactly what the code stores, and nothing it does not.
 * The marketing-pixel section is generated from the integrations that are enabled right now.
 */
import { LEGAL_PLACEHOLDERS as P, toConfirm, type LegalContext, type LegalDocument } from "./types";

const DATE = "2026-09-11";

export function privacyDocument(ctx: LegalContext): LegalDocument {
  const controller = `${ctx.legalEntity} (trading as ${ctx.brandName})`;
  const contactMonths = toConfirm("12 months", P.retentionContactMonths);
  const bookingYears = toConfirm("7 years", P.retentionBookingYears);
  const unpublishedMonths = toConfirm("6 months", P.retentionTestimonialUnpublishedMonths);
  const privacyEmail = `${ctx.email} (${P.privacyContactEmail} — confirm this is the address for privacy requests)`;

  return {
    slug: "privacy",
    eyebrow: "Privacy policy",
    title: "Privacy policy",
    metaTitle: "Privacy Policy — Astrologer Kavita",
    metaDescription:
      "How Astrologer Kavita collects, protects and deletes personal data: birth details, floor plans, bookings, cookieless analytics, consent and your rights.",
    lede: `This policy explains what personal data ${ctx.brandName} collects through this website, why, how long it is kept, and how to exercise your rights. It is written in plain language and describes what the site actually does.`,
    datePublished: DATE,
    dateModified: DATE,
    version: "2026-09-11",
    sections: [
      {
        id: "controller",
        tocLabel: "Controller",
        heading: "Who is responsible for your personal data?",
        answer: `${ctx.brandName} is the data controller for personal data collected through this website. The practice is run by ${ctx.practitionerName}, based in ${ctx.basedIn}, and the responsible legal entity is ${ctx.legalEntity}. Privacy requests go to the contact address at the end of this policy.`,
        blocks: [
          {
            type: "dl",
            rows: [
              { term: "Controller", detail: controller },
              { term: "Practitioner", detail: ctx.practitionerName },
              { term: "Based in", detail: ctx.basedIn },
              { term: "Privacy contact", detail: privacyEmail },
              { term: "Policy version", detail: DATE },
            ],
          },
          {
            type: "p",
            text: "There is no separate data-protection officer; the practitioner handles every request personally.",
          },
        ],
      },
      {
        id: "what-we-collect",
        tocLabel: "What we collect",
        heading: "What personal data does this website collect, and why?",
        answer: `Astrologer Kavita collects only the data needed to answer an enquiry, run a consultation or publish a consented testimonial: contact details, booking details including birth date, time and place, floor plans or property photographs for vastu work, and cookieless usage statistics. Nothing is sold, and nothing is collected silently.`,
        blocks: [
          { type: "h3", text: "Contact form" },
          {
            type: "p",
            text: "When you write through [the contact page](/contact) the site stores your name, email address, optional phone number, the message you type, and the time it was sent. Purpose: to reply to you. Legal basis: taking steps at your request before entering a contract (and legitimate interest in answering enquiries).",
          },
          { type: "h3", text: "Testimonial submissions" },
          {
            type: "p",
            text: "If you share your experience through the site, we store your name (or the name you ask us to show), your city, the service you took, your words, and your explicit consent to publish. Nothing is published without that consent, and you can withdraw it at any time. Legal basis: consent.",
          },
          { type: "h3", text: "Bookings, including birth details" },
          {
            type: "p",
            text: "To book a consultation the site records your name, email, phone number, timezone, preferred language, the service and slot you chose, and — for astrology-led sessions — your date, time and place of birth. A Vedic birth chart (kundli) cannot be calculated without these three details, so they are asked for only when the service needs them.",
          },
          {
            type: "p",
            text: "Birth details are treated as sensitive. They are encrypted at rest with a key held only on the server, are never written to logs or analytics, are never readable from the browser, and are decrypted only to prepare and deliver your reading. Legal basis: performance of the contract you enter when booking.",
          },
          { type: "h3", text: "Floor plans and property photographs" },
          {
            type: "p",
            text: "For vastu work you may upload a floor plan, a compass reading and photographs of your home or workplace. These are stored in a private storage bucket that is not publicly listable; the practitioner opens them through short-lived signed links, and they are deleted with the booking record. Please do not upload documents that show other people's faces, identity numbers or financial details. Legal basis: performance of the contract.",
          },
          { type: "h3", text: "Payment data" },
          {
            type: "p",
            text: "The current version of this website takes no card or bank details and stores no payment data. Consultations are settled directly with the practitioner. If online payment through a gateway such as Razorpay or Stripe is added later, this policy will be updated first, and card details will be handled by the gateway — never stored here.",
          },
          { type: "h3", text: "Server logs" },
          {
            type: "p",
            text: "The hosting platform keeps short-lived technical logs (request path, status, timestamp, truncated IP address) for security and reliability. These logs are not joined to any of the data above and are cleared automatically by the host.",
          },
        ],
      },
      {
        id: "analytics",
        tocLabel: "Cookieless analytics",
        heading: "How does the site measure visits without cookies?",
        answer: `Astrologer Kavita uses a first-party, cookieless analytics tracker built into the website itself, not a third-party analytics product. It sets no cookie, stores no raw IP address and cannot follow you across other websites. It counts pages, referrers and how far people read, so the site can be improved.`,
        blocks: [
          {
            type: "p",
            text: "Because it is cookieless and identifies nobody, the tracker is disclosed here rather than gated behind a consent banner. In detail, it records:",
          },
          {
            type: "ul",
            items: [
              "the page viewed, the previous page (referrer) and any campaign tags in the link you clicked;",
              "coarse device type (desktop, mobile, tablet) and the country of the request, taken from the hosting platform's edge headers — never a precise location;",
              "interaction events with no personal content: how far a page was scrolled, which section or button was clicked, whether a form was started or completed, and when the page became hidden or visible (the Page Visibility signal, used to measure real reading time);",
              "a visitor identifier that is derived on the server from a salted hash of the IP address and browser signature. The salt rotates every day, so the identifier cannot be linked to you from one day to the next, is never stored with the IP address, and is used only to count returning visits within a day and to rate-limit abuse.",
            ],
          },
          {
            type: "p",
            text: "Raw events are kept for 90 days and then deleted. Daily aggregates (page counts, referrers, device mix, conversion counts) contain no identifier and are kept indefinitely. The tracker is being completed in a later release; this section describes exactly what it will record, and will be revised if that changes.",
          },
        ],
      },
      {
        id: "marketing-pixels",
        tocLabel: "Marketing pixels",
        heading: "Which third-party marketing pixels are active on this site?",
        answer:
          ctx.enabledIntegrations.length === 0
            ? "No third-party marketing pixels or tags are active on the Astrologer Kavita website at the moment. No Meta Pixel, Google tag, LinkedIn, Pinterest, TikTok or Microsoft tag loads on any page. If one is enabled in future, this section will list it automatically and the consent banner described below will apply."
            : `The Astrologer Kavita website currently loads the following third-party tags: ${ctx.enabledIntegrations.join(", ")}. Each may set its own cookies and receive the page you visited. For visitors in the United Kingdom, the European Economic Area and Switzerland these tags load only after consent through the banner described below.`,
        blocks:
          ctx.enabledIntegrations.length === 0
            ? [
                {
                  type: "note",
                  text: "This list is generated from the site's live configuration each time the page is built, so it always matches what is actually loading.",
                },
              ]
            : [
                {
                  type: "table",
                  caption: "Third-party tags enabled at the time this page was built",
                  columns: ["Tag", "Purpose"],
                  rows: ctx.enabledIntegrations.map((name) => [
                    name,
                    "Measures the effectiveness of paid campaigns and may set cookies from the provider's domain.",
                  ]),
                },
                {
                  type: "note",
                  text: "This list is generated from the site's live configuration each time the page is built, so it always matches what is actually loading. Each provider's own privacy policy governs what it does with the data it receives.",
                },
              ],
      },
      {
        id: "consent",
        tocLabel: "Consent",
        heading: "How does consent work, and how can it be changed?",
        answer: `If you visit the Astrologer Kavita website from the United Kingdom, the European Economic Area or Switzerland, no third-party marketing tag loads until you accept it in a small, plain banner. Elsewhere, tags load according to the site owner's settings. Choices are recorded, and can be changed at any time from the "Manage consent" link in the footer.`,
        blocks: [
          {
            type: "ul",
            items: [
              "The banner appears only when at least one third-party tag is enabled. When none is enabled — as now — there is no banner, because there is nothing to consent to.",
              "Your region is read from the hosting platform's edge headers; the site does not look up your location itself.",
              "Each choice is written to a consent log with an anonymous visitor identifier, your country code, the choices made, the policy version you saw and the time. This log exists to prove what was agreed and is never used for marketing.",
              "Declining changes nothing about the site's content or functionality. The first-party analytics described above run either way because they identify nobody.",
            ],
          },
        ],
      },
      {
        id: "retention",
        tocLabel: "Retention",
        heading: "How long is personal data kept?",
        answer: `Astrologer Kavita keeps personal data only as long as the purpose it was collected for requires: contact messages for ${contactMonths}, booking and consultation records for ${bookingYears} where tax and accounting rules apply, and uploaded floor plans only until the consultation is delivered. Encrypted birth details are deleted with the booking.`,
        blocks: [
          {
            type: "table",
            columns: ["Data", "Kept for", "Then"],
            rows: [
              ["Contact form messages", contactMonths, "Deleted"],
              [
                "Booking record (name, contact, service, slot)",
                bookingYears,
                "Deleted, or anonymised where an accounting record must remain",
              ],
              [
                "Encrypted birth details",
                "Until the consultation and any agreed follow-up are delivered, then with the booking record",
                "Deleted",
              ],
              [
                "Floor plans and property photographs",
                "Until the consultation is delivered, or on request",
                "Deleted from private storage",
              ],
              [
                "Testimonial (published)",
                "While your consent stands",
                "Removed within 14 days of withdrawal",
              ],
              ["Testimonial (not published)", unpublishedMonths, "Deleted"],
              [
                "Consent log entry",
                "As long as the consented tag remains in use, then 12 months",
                "Deleted",
              ],
              ["Analytics raw events", "90 days", "Deleted; aggregates kept without identifiers"],
            ],
          },
          {
            type: "note",
            text: "Periods marked “to confirm” are sensible defaults awaiting the practitioner's confirmation; the confirmed periods will replace them in this table.",
          },
        ],
      },
      {
        id: "sharing",
        tocLabel: "Sharing and storage",
        heading: "Who is personal data shared with, and where is it stored?",
        answer: `Astrologer Kavita does not sell, rent or trade personal data. Data is stored with two processors — Supabase (database, authentication and file storage) and Vercel (hosting) — in the ${P.hostingRegion} region, and transactional email is sent through a transactional email provider. No advertiser or data broker receives client data.`,
        blocks: [
          {
            type: "dl",
            rows: [
              {
                term: "Supabase",
                detail: `Managed Postgres database, authentication and private file storage. Hosting region: ${P.hostingRegion}.`,
              },
              {
                term: "Vercel",
                detail:
                  "Web hosting, edge network and short-lived request logs. Regional edge locations serve the pages; personal data is stored only in the database region above.",
              },
              {
                term: "Transactional email provider",
                detail:
                  "Sends booking confirmations, reminders and replies. Receives your name, email address and the message content, nothing else.",
              },
              {
                term: "Video and phone",
                detail:
                  "Online consultations use a video or phone service you and the practitioner agree on; that provider's own privacy policy applies to the call.",
              },
            ],
          },
          { type: "h3", text: "International transfers" },
          {
            type: "p",
            text: `The practitioner works from ${ctx.basedIn} and reads consultation data there. Clients in the United Kingdom, the European Economic Area and Switzerland should note that their data is therefore accessed from outside those territories. Transfers to processors rely on the provider's standard contractual clauses, and access by the practitioner rests on the contract you enter when you book, with the safeguards described in this policy (encryption at rest, private storage, minimal retention).`,
          },
        ],
      },
      {
        id: "your-rights",
        tocLabel: "Your rights",
        heading: "What rights do you have over your personal data?",
        answer: `Everyone whose data Astrologer Kavita holds can ask to see it, correct it, delete it, restrict or object to its use, or receive a portable copy. Where consent is the basis — testimonials and marketing tags — it can be withdrawn at any time. Requests are answered within one month.`,
        blocks: [
          {
            type: "ul",
            items: [
              "Access: a copy of the personal data held about you.",
              "Rectification: correction of anything inaccurate, including birth details entered wrongly.",
              "Erasure: deletion of your data where there is no legal reason to keep it (an accounting record of a paid booking may need to remain, anonymised).",
              "Restriction and objection: pausing or stopping a particular use, including any direct marketing.",
              "Portability: your booking and contact data in a common machine-readable format.",
              "Withdrawal of consent: for a published testimonial or for marketing tags, without affecting anything done before withdrawal.",
              "Complaint: if you are in the United Kingdom you may complain to the Information Commissioner's Office (ico.org.uk); in the EEA, to the supervisory authority of your country; in India, to the Data Protection Board of India under the Digital Personal Data Protection Act, 2023. We would appreciate the chance to resolve the concern first.",
            ],
          },
          {
            type: "p",
            text: `To exercise any right, email ${privacyEmail} from the address you used with the practice, or write through [the contact page](/contact). Identity is confirmed before data is released.`,
          },
        ],
      },
      {
        id: "security",
        tocLabel: "Security",
        heading: "How is personal data protected?",
        blocks: [
          {
            type: "ul",
            items: [
              "All traffic is served over HTTPS.",
              "Birth details are encrypted before they reach the database; the key lives only on the server and is rotated.",
              "The database enforces row-level security: the public website can read only published content, and client records are reachable only by the practitioner's authenticated admin account.",
              "Uploaded files sit in a private bucket and are reached through signed links that expire within minutes.",
              "Personal data is never written to application logs, error reports or analytics.",
              "Admin actions on client records are recorded in an audit log.",
            ],
          },
        ],
      },
      {
        id: "children",
        tocLabel: "Children",
        heading: "Can children use this website?",
        blocks: [
          {
            type: "p",
            text: "Consultations are for adults. The booking form asks you to confirm you are 18 or older. A parent or guardian may book a consultation that concerns a child's chart, in which case the parent is the client and provides the details; no account is created for the child.",
          },
        ],
      },
      {
        id: "changes",
        tocLabel: "Changes",
        heading: "How will changes to this policy be communicated?",
        blocks: [
          {
            type: "p",
            text: "The date at the top of this page shows when the policy last changed, and the policy version is recorded with every consent choice. Material changes — for instance enabling a marketing tag, adding online payment, or changing a retention period — are made here before they take effect, and clients with an open booking are told by email.",
          },
        ],
      },
      {
        id: "contact",
        tocLabel: "Contact",
        heading: "How to contact the practice about privacy",
        blocks: [
          {
            type: "dl",
            rows: [
              { term: "Email", detail: privacyEmail },
              { term: "Post", detail: `${controller}, ${ctx.basedIn}` },
              { term: "Web", detail: "[Contact page](/contact)" },
            ],
          },
          {
            type: "p",
            text: "Related pages: [Terms of service](/terms) and [Disclaimer](/disclaimer).",
          },
        ],
      },
    ],
  };
}
