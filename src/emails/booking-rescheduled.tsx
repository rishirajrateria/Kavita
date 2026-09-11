/** Sent to client and practitioner when a booking moves; shows old and new in both zones. */
import { Text } from "@react-email/components";
import type { EmailModel } from "@/lib/notifications/model";
import {
  AppointmentPanel,
  BrandLayout,
  ClientContact,
  ManageBlock,
  PrepareList,
  SessionFacts,
} from "./_layout";
import { styles } from "./_theme";

export function subject(model: EmailModel): string {
  const when = model.recipient === "practitioner" ? model.when.practitioner : model.when.client;
  return model.recipient === "practitioner"
    ? `Rescheduled: ${model.clientFullName}, ${model.serviceName} — ${when.label}`
    : `Your ${model.serviceName} has moved to ${when.label}`;
}

export default function BookingRescheduled({ model }: { model: EmailModel }) {
  const practitioner = model.recipient === "practitioner";
  return (
    <BrandLayout
      model={model}
      preview={`New time: ${(practitioner ? model.when.practitioner : model.when.client).label}`}
      eyebrow="Booking rescheduled"
      title={
        practitioner
          ? `${model.clientFullName} moved their ${model.serviceName}.`
          : `${model.clientFirstName}, your consultation has a new time.`
      }
    >
      <SessionFacts model={model} />
      <AppointmentPanel pair={model.when} label="New appointment" recipient={model.recipient} />
      {model.previous && (
        <AppointmentPanel
          pair={model.previous}
          label="Previous appointment (no longer held)"
          recipient={model.recipient}
        />
      )}
      {practitioner ? (
        <>
          <ClientContact model={model} />
          {model.question && <Text style={styles.p}>Their question: {model.question}</Text>}
        </>
      ) : (
        <>
          <Text style={styles.p}>
            The earlier time has been released. Nothing else about your booking has changed.
          </Text>
          <PrepareList model={model} />
          <ManageBlock model={model} />
        </>
      )}
    </BrandLayout>
  );
}
