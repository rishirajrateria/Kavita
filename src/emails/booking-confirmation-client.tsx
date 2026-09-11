/** Client confirmation: what was booked, when (both zones), what to prepare, manage link. */
import { Heading, Text } from "@react-email/components";
import type { EmailModel } from "@/lib/notifications/model";
import { AppointmentPanel, BrandLayout, ManageBlock, PrepareList, SessionFacts } from "./_layout";
import { styles } from "./_theme";

export function subject(model: EmailModel): string {
  return `Your ${model.serviceName} is booked — ${model.when.client.date}`;
}

export default function BookingConfirmationClient({ model }: { model: EmailModel }) {
  return (
    <BrandLayout
      model={model}
      preview={`Booked: ${model.serviceName}, ${model.when.client.label} (${model.when.client.zoneName})`}
      eyebrow="Booking confirmed"
      title={`Thank you, ${model.clientFirstName}. Your consultation is booked.`}
    >
      <SessionFacts model={model} />
      <AppointmentPanel pair={model.when} label="Appointment" recipient="client" />
      <Text style={styles.p}>
        {model.practitionerName} will join you by {model.modeLabel.toLowerCase()} at the time above.
        Both times refer to the same moment; the second is shown so nothing is lost across time
        zones.
      </Text>
      <PrepareList model={model} />
      <Heading as="h2" style={styles.h2}>
        Need to change the time?
      </Heading>
      <ManageBlock model={model} />
    </BrandLayout>
  );
}
