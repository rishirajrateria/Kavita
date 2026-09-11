/**
 * Shared email chrome and the blocks every booking message uses: brand layout, the
 * both-timezones appointment panel, the what-to-prepare list, the manage link and the honesty
 * disclaimer. Templates compose these so the rules live in one place.
 */
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import type { EmailModel } from "@/lib/notifications/model";
import type { ZonedPair } from "@/lib/notifications/types";
import { styles } from "./_theme";

export function BrandLayout({
  model,
  preview,
  eyebrow,
  title,
  children,
}: {
  model: EmailModel;
  preview: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.eyebrow}>{model.brandName}</Text>
          <Text style={{ ...styles.eyebrow, color: styles.muted.color }}>{eyebrow}</Text>
          <Heading as="h1" style={styles.h1}>
            {title}
          </Heading>
          {children}
          <Hr style={styles.rule} />
          <Text style={styles.footer}>
            {model.recipient === "practitioner" ? "Client's booking page" : "Your booking page"}:{" "}
            <Link href={model.manageUrl} style={styles.link}>
              {model.manageUrl}
            </Link>
          </Text>
          <Text style={styles.footer}>{model.disclaimer}</Text>
          <Text style={styles.footer}>
            Booking reference {model.bookingRef}.{" "}
            {model.contactEmail ? (
              <>
                Questions? Reply to this email or write to{" "}
                <Link href={`mailto:${model.contactEmail}`} style={styles.link}>
                  {model.contactEmail}
                </Link>
                .
              </>
            ) : (
              "Questions? Reply to this email."
            )}
          </Text>
          <Text style={styles.footer}>
            <Link href={model.siteUrl} style={styles.link}>
              {model.siteUrl.replace(/^https?:\/\//, "")}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

/** The appointment in both zones, zone names spelled out; once when the zones coincide. */
export function AppointmentPanel({
  pair,
  label,
  recipient,
}: {
  pair: ZonedPair;
  label: string;
  recipient: EmailModel["recipient"];
}) {
  const first = recipient === "practitioner" ? pair.practitioner : pair.client;
  const firstEnd = recipient === "practitioner" ? pair.practitionerEnd : pair.clientEnd;
  const second = recipient === "practitioner" ? pair.client : pair.practitioner;
  const secondEnd = recipient === "practitioner" ? pair.clientEnd : pair.practitionerEnd;
  const firstWho = recipient === "practitioner" ? "Your time" : "Your local time";
  const secondWho = recipient === "practitioner" ? "Client's local time" : "Practitioner's time";
  return (
    <Section style={styles.panel}>
      <Text style={styles.panelLabel}>{label}</Text>
      <Text style={styles.panelLabel}>
        {firstWho} — {first.zoneName} ({first.zone})
      </Text>
      <Text style={styles.panelValue}>
        {first.label} to {firstEnd.time}
      </Text>
      {!pair.sameZone && (
        <>
          <Text style={styles.panelLabel}>
            {secondWho} — {second.zoneName} ({second.zone})
          </Text>
          <Text style={styles.panelValue}>
            {second.label} to {secondEnd.time}
          </Text>
        </>
      )}
    </Section>
  );
}

export function SessionFacts({ model }: { model: EmailModel }) {
  return (
    <Text style={styles.p}>
      <strong>{model.serviceName}</strong> · {model.durationLabel} · {model.modeLabel}
    </Text>
  );
}

export function PrepareList({ model }: { model: EmailModel }) {
  if (model.whatToPrepare.length === 0) return null;
  return (
    <>
      <Heading as="h2" style={styles.h2}>
        What to have ready
      </Heading>
      <ul style={{ margin: "0 0 14px", paddingLeft: 20 }}>
        {model.whatToPrepare.map((item) => (
          <li key={item} style={styles.li}>
            {item}
          </li>
        ))}
      </ul>
    </>
  );
}

export function ManageBlock({ model, verb = "Manage" }: { model: EmailModel; verb?: string }) {
  return (
    <Section style={{ margin: "20px 0 8px" }}>
      <Link href={model.manageUrl} style={styles.button}>
        {verb} this booking
      </Link>
      <Text style={styles.muted}>Reschedule or cancel any time from your booking page.</Text>
    </Section>
  );
}

/** Practitioner copies: how to reach the client, and the standing note about birth details. */
export const BIRTH_DETAILS_NOTE =
  "Birth details are in the admin; they are never included in email.";

export function ClientContact({ model }: { model: EmailModel }) {
  return (
    <>
      <Heading as="h2" style={styles.h2}>
        Client
      </Heading>
      <Text style={styles.p}>
        {model.clientFullName}
        {model.clientEmail && (
          <>
            <br />
            <Link href={`mailto:${model.clientEmail}`} style={styles.link}>
              {model.clientEmail}
            </Link>
          </>
        )}
        {model.clientPhone && (
          <>
            <br />
            {model.clientPhone}
          </>
        )}
      </Text>
      <Text style={styles.muted}>{BIRTH_DETAILS_NOTE}</Text>
    </>
  );
}
