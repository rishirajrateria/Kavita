/**
 * Practitioner copy of a new booking. Carries the client's question and contact details so she
 * can reply directly (reply-to is the client), but NEVER birth details: those stay encrypted and
 * are read in the admin.
 */
import { Heading, Text } from "@react-email/components";
import type { EmailModel } from "@/lib/notifications/model";
import { AppointmentPanel, BrandLayout, ClientContact, SessionFacts } from "./_layout";
import { styles } from "./_theme";

export function subject(model: EmailModel): string {
  return `New booking: ${model.serviceName} — ${model.when.practitioner.label}`;
}

export default function BookingNotificationPractitioner({ model }: { model: EmailModel }) {
  return (
    <BrandLayout
      model={model}
      preview={`${model.clientFullName} booked ${model.serviceName} for ${model.when.practitioner.label}`}
      eyebrow="New booking"
      title={`${model.clientFullName} has booked a ${model.serviceName}.`}
    >
      <SessionFacts model={model} />
      <AppointmentPanel pair={model.when} label="Appointment" recipient="practitioner" />
      <ClientContact model={model} />
      <Heading as="h2" style={styles.h2}>
        What they want to discuss
      </Heading>
      <Text style={styles.p}>{model.question ?? "No question was entered."}</Text>
      <Text style={styles.muted}>Replying to this email replies to the client.</Text>
    </BrandLayout>
  );
}
