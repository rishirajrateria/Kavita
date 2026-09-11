/** Sent to client and practitioner when a booking is cancelled. */
import { Link, Text } from "@react-email/components";
import type { EmailModel } from "@/lib/notifications/model";
import { AppointmentPanel, BrandLayout, ClientContact, ManageBlock, SessionFacts } from "./_layout";
import { styles } from "./_theme";

export function subject(model: EmailModel): string {
  return model.recipient === "practitioner"
    ? `Cancelled: ${model.clientFullName}, ${model.serviceName} — ${model.when.practitioner.label}`
    : `Your ${model.serviceName} on ${model.when.client.date} is cancelled`;
}

export default function BookingCancelled({ model }: { model: EmailModel }) {
  const practitioner = model.recipient === "practitioner";
  return (
    <BrandLayout
      model={model}
      preview={`Cancelled: ${model.serviceName}, ${(practitioner ? model.when.practitioner : model.when.client).label}`}
      eyebrow="Booking cancelled"
      title={
        practitioner
          ? `${model.clientFullName} cancelled their ${model.serviceName}.`
          : `${model.clientFirstName}, your consultation is cancelled.`
      }
    >
      <SessionFacts model={model} />
      <AppointmentPanel
        pair={model.when}
        label="Cancelled appointment"
        recipient={model.recipient}
      />
      {model.cancellationReason && (
        <Text style={styles.p}>Reason given: {model.cancellationReason}</Text>
      )}
      {practitioner ? (
        <>
          <ClientContact model={model} />
          <Text style={styles.muted}>The slot is free again in the calendar.</Text>
        </>
      ) : (
        <>
          <Text style={styles.p}>
            The time has been released and no further action is needed. You are welcome to book
            again whenever it suits you:{" "}
            <Link href={`${model.siteUrl}book`} style={styles.link}>
              {model.siteUrl}book
            </Link>
          </Text>
          <ManageBlock model={model} verb="View" />
        </>
      )}
    </BrandLayout>
  );
}
