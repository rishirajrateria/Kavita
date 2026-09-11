import { check, equal } from "../seo-plumbing/_assert";
import { detectPlatform, sameAsPreview, validateSocialUrl } from "@/lib/admin/social-validators";
import { socialLinkSchema } from "@/lib/admin/manage-schemas";

export function run() {
  const ok = (platform: Parameters<typeof validateSocialUrl>[0], raw: string, expected: string) => {
    const r = validateSocialUrl(platform, raw);
    check(r.ok, `social: ${platform} accepts ${raw}${r.ok ? "" : ` (${r.error})`}`);
    if (r.ok) equal(r.url, expected, `social: ${platform} normalises ${raw}`);
  };
  const bad = (platform: Parameters<typeof validateSocialUrl>[0], raw: string) => {
    check(!validateSocialUrl(platform, raw).ok, `social: ${platform} rejects ${raw}`);
  };

  ok(
    "instagram",
    "https://www.instagram.com/astrologer.kavita/",
    "https://instagram.com/astrologer.kavita",
  );
  ok("instagram", "instagram.com/kavita?igshid=abc#x", "https://instagram.com/kavita");
  bad("instagram", "https://instagram.com/");
  bad("instagram", "http://instagram.com/kavita");
  bad("instagram", "https://facebook.com/kavita");
  bad("instagram", "https://instagram.com/{{INSTAGRAM_HANDLE}}");

  ok("youtube", "https://youtube.com/@kavita", "https://youtube.com/@kavita");
  ok(
    "youtube",
    "https://www.youtube.com/channel/UCabcdefghijklmnop",
    "https://youtube.com/channel/UCabcdefghijklmnop",
  );
  bad("youtube", "https://youtube.com/watch?v=abc");
  bad("youtube", "https://youtube.com/kavita");

  ok("facebook", "https://facebook.com/astrologerkavita", "https://facebook.com/astrologerkavita");
  ok("linkedin", "https://linkedin.com/in/kavita-sharma/", "https://linkedin.com/in/kavita-sharma");
  ok(
    "linkedin",
    "https://www.linkedin.com/company/astrologer-kavita",
    "https://linkedin.com/company/astrologer-kavita",
  );
  bad("linkedin", "https://linkedin.com/kavita");
  ok("x", "https://twitter.com/kavita_astro", "https://twitter.com/kavita_astro");
  ok("x", "https://x.com/kavita", "https://x.com/kavita");
  bad("x", "https://x.com/this-handle-is-far-too-long");
  ok("whatsapp", "https://wa.me/919876543210", "https://wa.me/919876543210");
  bad("whatsapp", "https://wa.me/abc");
  ok("telegram", "https://t.me/kavita_astro", "https://t.me/kavita_astro");
  ok("pinterest", "https://in.pinterest.com/kavita/", "https://in.pinterest.com/kavita");
  ok("threads", "https://www.threads.net/@kavita", "https://threads.net/@kavita");
  bad("threads", "https://threads.net/kavita");
  ok("google_business", "https://g.page/astrologer-kavita", "https://g.page/astrologer-kavita");
  ok("google_business", "https://maps.app.goo.gl/AbCdEf", "https://maps.app.goo.gl/AbCdEf");
  ok(
    "google_business",
    "https://www.google.com/maps/place/Astrologer+Kavita/@19.07,72.87,17z",
    "https://google.com/maps/place/Astrologer+Kavita/@19.07,72.87,17z",
  );
  bad("google_business", "https://google.com/search?q=kavita");
  ok("other", "https://example.com/profile?utm_source=x&id=7", "https://example.com/profile?id=7");
  ok("other", "https://example.com", "https://example.com");
  bad("other", "ftp://example.com/x");
  bad("other", "https://user:pw@example.com/x");

  equal(detectPlatform("https://www.instagram.com/kavita"), "instagram", "detect: instagram");
  equal(detectPlatform("twitter.com/kavita"), "x", "detect: twitter → x");
  equal(detectPlatform("https://g.page/k"), "google_business", "detect: g.page");
  equal(detectPlatform("https://example.org/me"), null, "detect: unknown host");

  const preview = sameAsPreview([
    { url: "https://instagram.com/k", isVisible: true, includeInSameas: true, sortOrder: 20 },
    { url: "https://wa.me/1", isVisible: true, includeInSameas: false, sortOrder: 5 },
    { url: "https://youtube.com/@k", isVisible: true, includeInSameas: true, sortOrder: 10 },
    { url: "https://x.com/{{HANDLE}}", isVisible: true, includeInSameas: true, sortOrder: 1 },
    { url: "https://facebook.com/k", isVisible: false, includeInSameas: true, sortOrder: 2 },
  ]);
  equal(
    preview.join(" "),
    "https://youtube.com/@k https://instagram.com/k",
    "sameAs: order, hidden and placeholders excluded",
  );

  const parsed = socialLinkSchema.safeParse({
    platform: "instagram",
    url: "www.instagram.com/kavita/",
    label: "Astrologer Kavita on Instagram",
    isVisible: "on",
    showInHeader: "off",
  });
  check(parsed.success, "schema: form post parses");
  if (parsed.success) {
    equal(parsed.data.url, "https://instagram.com/kavita", "schema: url normalised");
    equal(parsed.data.icon, "instagram", "schema: icon defaults to platform");
    equal(parsed.data.showInHeader, false, "schema: 'off' → false");
    equal(parsed.data.includeInSameas, true, "schema: sameAs default true");
  }
  const wrong = socialLinkSchema.safeParse({
    platform: "youtube",
    url: "https://youtube.com/kavita",
    label: "YT",
  });
  check(!wrong.success, "schema: youtube path rule enforced");
  if (!wrong.success)
    check(
      wrong.error.issues.some((i) => i.path[0] === "url"),
      "schema: error on url field",
    );
}
