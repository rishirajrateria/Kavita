/**
 * Delivery providers. `ResendEmailProvider` when `RESEND_API_KEY` is set, otherwise
 * `NoopEmailProvider`, which logs one redacted line (kind of message, never the address or the
 * body). WhatsApp is an interface with a Noop behind `WHATSAPP_NOTIFICATIONS_ENABLED`, so a real
 * provider (e.g. the WhatsApp Business API) is one class away.
 */
import { Resend } from "resend";
import { FALLBACK_EMAIL_FROM, getNotificationEnv } from "./env";
import type {
  EmailMessage,
  EmailProvider,
  EmailSendResult,
  WhatsAppMessage,
  WhatsAppProvider,
} from "./types";

/** `j***@example.com` — enough to recognise a log line, not enough to identify anyone. */
export function redactEmail(address: string): string {
  const at = address.indexOf("@");
  if (at <= 0) return "***";
  return `${address[0]}***${address.slice(at)}`;
}

export class NoopEmailProvider implements EmailProvider {
  readonly name = "noop";
  /** Every message the provider would have sent, for tests. */
  readonly sent: EmailMessage[] = [];
  constructor(private readonly quiet = false) {}

  async send(message: EmailMessage): Promise<EmailSendResult> {
    this.sent.push(message);
    if (!this.quiet) {
      console.info(
        `[notifications] email not sent (no RESEND_API_KEY): to=${redactEmail(message.to)} subject="${message.subject}"`,
      );
    }
    return { providerRef: null };
  }
}

export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";
  private readonly client: Resend;
  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    this.client = new Resend(apiKey);
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const { data, error } = await this.client.emails.send({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.replyTo ? { replyTo: message.replyTo } : {}),
    });
    if (error) throw new Error(`Resend: ${error.name}`);
    return { providerRef: data?.id ?? null };
  }
}

export class NoopWhatsAppProvider implements WhatsAppProvider {
  readonly name = "noop";
  readonly sent: WhatsAppMessage[] = [];
  async send(message: WhatsAppMessage): Promise<EmailSendResult> {
    this.sent.push(message);
    return { providerRef: null };
  }
}

let emailProvider: EmailProvider | undefined;
let whatsappProvider: WhatsAppProvider | undefined;

export function getEmailProvider(): EmailProvider {
  if (emailProvider) return emailProvider;
  const env = getNotificationEnv();
  emailProvider = env.RESEND_API_KEY
    ? new ResendEmailProvider(env.RESEND_API_KEY, env.EMAIL_FROM ?? FALLBACK_EMAIL_FROM)
    : new NoopEmailProvider();
  return emailProvider;
}

/** `null` while WhatsApp notifications are switched off; the notifier then skips the channel. */
export function getWhatsAppProvider(): WhatsAppProvider | null {
  if (getNotificationEnv().WHATSAPP_NOTIFICATIONS_ENABLED !== "true") return null;
  whatsappProvider ??= new NoopWhatsAppProvider();
  return whatsappProvider;
}
