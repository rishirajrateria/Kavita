import Link from "next/link";

const LINK_PATTERN = /\[([^\]]+)\]\((\/[^)\s]*|https?:\/\/[^)\s]+|mailto:[^)\s]+)\)/g;

/**
 * Renders a legal text string with the minimal `[label](href)` inline-link form. Nothing else
 * is interpreted — no HTML, no markdown — so admin-edited copy can never inject markup.
 * Internal hrefs become `<Link>`; external ones open in the same tab with `rel="noopener"`.
 */
export function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK_PATTERN)) {
    const [whole, label, href] = match;
    const start = match.index;
    if (start > last) parts.push(text.slice(last, start));
    if (label && href) {
      parts.push(
        href.startsWith("/") ? (
          <Link key={start} href={href}>
            {label}
          </Link>
        ) : (
          <a key={start} href={href} rel="noopener">
            {label}
          </a>
        ),
      );
    }
    last = start + whole.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
