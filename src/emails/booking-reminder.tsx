/** Client reminder, 24 hours or 1 hour before, chosen by `variant`. */
import { Heading, Text } from "@react-email/components";
import type { EmailModel } from "@/lib/notifications/model";
import { AppointmentPanel, BrandLayout, ManageBlock, PrepareList, SessionFacts } from "./_layout";
import { styles } from "./_theme";

export type ReminderVariant = "24h" | "1h";

const LEAD: Record<ReminderVariant, string> = { "24h": "tomorrow", "1h": "in about an hour" };

export function subject(model: EmailModel, variant: ReminderVariant): string {
  return variant === "24h"
    ? `Reminder: your ${model.serviceName} is tomorrow, ${model.when.client.time}`
    : `Starting soon: your ${model.serviceName} at ${model.when.client.time}`;
}

export default function BookingReminder({
  model,
  variant,
}: {
  model: EmailModel;
  variant: ReminderVariant;
}) {
  return (
    <BrandLayout
      model={model}
      preview={`Your ${model.serviceName} is ${LEAD[variant]}: ${model.when.client.label} (${model.when.client.zoneName})`}
      eyebrow={variant === "24h" ? "Reminder — 24 hours" : "Reminder — 1 hour"}
      title={`${model.clientFirstName}, your consultation is ${LEAD[variant]}.`}
    >
      <SessionFacts model={model} />
      <AppointmentPanel pair={model.when} label="Appointment" recipient="client" />
      {variant === "24h" ? (
        <PrepareList model={model} />
      ) : (
        <Text style={styles.p}>
          Please have your notes and the items you were asked to prepare within reach, and a quiet
          place with a steady connection if you are joining by video.
        </Text>
      )}
      <Heading as="h2" style={styles.h2}>
        Cannot make it?
      </Heading>
      <ManageBlock model={model} />
    </BrandLayout>
  );
}
