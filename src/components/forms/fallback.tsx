import { Callout } from "@/components/ui/callout";

export interface FallbackChannels {
  whatsapp: string | null;
  email: string | null;
  tel: string | null;
  emailText?: string;
  phoneText?: string;
}

/** Shown when the API answers 503 `not_connected`: the real channels from `site_settings`. */
export function FormFallback({
  title,
  body,
  channels,
}: {
  title: string;
  body: string;
  channels: FallbackChannels;
}) {
  const links = [
    channels.whatsapp ? { href: channels.whatsapp, label: "WhatsApp", external: true } : null,
    channels.email ? { href: channels.email, label: channels.emailText ?? "Email" } : null,
    channels.tel ? { href: channels.tel, label: channels.phoneText ?? "Call" } : null,
  ].filter((l): l is { href: string; label: string; external?: boolean } => l !== null);

  return (
    <Callout variant="warn" title={title} id="form-fallback">
      <p>{body}</p>
      {links.length ? (
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                rel={l.external ? "noopener" : undefined}
                className="font-medium text-accent-strong"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2">Contact details are being confirmed; please try again in a few days.</p>
      )}
    </Callout>
  );
}
