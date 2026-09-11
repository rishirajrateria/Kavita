/**
 * Social / entity profiles for the footer and the `sameAs` schema array. Every URL is a
 * `{{PLACEHOLDER}}` until the client supplies the real profile — see NEEDS-REAL-DATA.md.
 */
import type { SocialLink } from "@/db/schema";
import type { SeedRow } from "./_shared";

export const socialLinksSeed: SeedRow<SocialLink>[] = [
  {
    platform: "instagram",
    url: "https://instagram.com/{{INSTAGRAM_HANDLE}}",
    label: "Astrologer Kavita on Instagram",
    icon: "instagram",
    sortOrder: 10,
    isVisible: true,
    showInFooter: true,
    showInHeader: false,
    includeInSameas: true,
  },
  {
    platform: "youtube",
    url: "https://youtube.com/@{{YOUTUBE_HANDLE}}",
    label: "Astrologer Kavita on YouTube",
    icon: "youtube",
    sortOrder: 20,
    isVisible: true,
    showInFooter: true,
    showInHeader: false,
    includeInSameas: true,
  },
  {
    platform: "facebook",
    url: "https://facebook.com/{{FACEBOOK_PAGE}}",
    label: "Astrologer Kavita on Facebook",
    icon: "facebook",
    sortOrder: 30,
    isVisible: true,
    showInFooter: true,
    showInHeader: false,
    includeInSameas: true,
  },
  {
    platform: "linkedin",
    url: "https://linkedin.com/in/{{LINKEDIN_HANDLE}}",
    label: "Astrologer Kavita on LinkedIn",
    icon: "linkedin",
    sortOrder: 40,
    isVisible: true,
    showInFooter: true,
    showInHeader: false,
    includeInSameas: true,
  },
  {
    platform: "google_business",
    // Absolute so the unfilled placeholder is an external link, not a same-origin 404 on
    // every page of the site (`g.page` is Google's own Business Profile short domain).
    url: "https://g.page/{{GOOGLE_BUSINESS_PROFILE_SLUG}}",
    label: "Astrologer Kavita on Google",
    icon: "google",
    sortOrder: 50,
    isVisible: true,
    showInFooter: true,
    showInHeader: false,
    includeInSameas: true,
  },
  {
    platform: "whatsapp",
    url: "https://wa.me/{{WHATSAPP_NUMBER_DIGITS}}",
    label: "Message Astrologer Kavita on WhatsApp",
    icon: "whatsapp",
    sortOrder: 60,
    isVisible: true,
    showInFooter: true,
    showInHeader: true,
    // A chat link is a contact channel, not an entity profile.
    includeInSameas: false,
  },
];
