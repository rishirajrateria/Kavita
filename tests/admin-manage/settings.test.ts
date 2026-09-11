import { check, equal, includes } from "../seo-plumbing/_assert";
import { fixture } from "../notifications/_fixtures";
import {
  applyTemplateOverride,
  fillPlaceholders,
  resolveFlagFrom,
  templateVariables,
} from "@/lib/admin/settings";
import {
  addDays,
  localMidnight,
  monthGrid,
  startOfWeek,
  weekGrid,
  gridRange,
} from "@/lib/admin/calendar";

export function run() {
  // --- flags: db → env → default -------------------------------------------------------------
  const now = new Date("2026-09-11T00:00:00Z");
  const dbTrue = resolveFlagFrom(
    "PAYMENTS_ENABLED",
    [{ key: "PAYMENTS_ENABLED", value: true, description: null, updatedAt: now }],
    { PAYMENTS_ENABLED: "false" },
  );
  equal(dbTrue.value, true, "flags: database row wins over env");
  equal(dbTrue.source, "database", "flags: source database");
  const envTrue = resolveFlagFrom("WHATSAPP_NOTIFICATIONS_ENABLED", [], {
    WHATSAPP_NOTIFICATIONS_ENABLED: "true",
  });
  equal(envTrue.value, true, "flags: env fallback");
  equal(envTrue.source, "environment", "flags: source environment");
  const def = resolveFlagFrom("FEATURE_SOCIAL_WIDGETS", [], {});
  equal(def.value, false, "flags: default false");
  equal(def.source, "default", "flags: source default");
  check((def.description ?? "").length > 10, "flags: description present");

  // --- template overrides ----------------------------------------------------------------------
  const data = fixture();
  const vars = templateVariables(data);
  equal(vars.clientFirstName, "Test", "template vars: first name");
  equal(vars.serviceName, data.service.name, "template vars: service");
  check(/2026/.test(vars.date ?? ""), "template vars: date in client zone");
  check(!("clientEmail" in vars), "template vars: no contact data");
  equal(
    fillPlaceholders("Hi {{clientFirstName}}, {{ serviceName }} on {{date}} {{unknown}}", vars),
    `Hi Test, ${data.service.name} on ${vars.date} {{unknown}}`,
    "placeholders: known filled, unknown kept",
  );
  const rendered = {
    subject: "Original",
    html: "<html><body><h1>Title</h1><p>Body</p></body></html>",
    text: "TITLE\n\nBody",
  };
  equal(applyTemplateOverride(rendered, null, vars), rendered, "override: null is a no-op");
  const out = applyTemplateOverride(
    rendered,
    { subject: "{{brandName}}: your {{serviceName}}", intro: "Namaste {{clientFirstName}} <3" },
    vars,
  );
  equal(out.subject, `${data.settings.brandName}: your ${data.service.name}`, "override: subject");
  includes(
    out.html,
    '</h1><p data-template-intro style="margin:0 0 14px;font-size:16px;line-height:1.6">Namaste Test &lt;3</p><p>Body</p>',
    "override: intro after h1, escaped",
  );
  check(out.text.startsWith("Namaste Test <3\n\nTITLE"), "override: intro first in text");
  const subjectOnly = applyTemplateOverride(rendered, { subject: "S", intro: null }, vars);
  equal(subjectOnly.html, rendered.html, "override: subject-only leaves html");

  // --- calendar grids ------------------------------------------------------------------------
  equal(startOfWeek("2026-09-11"), "2026-09-07", "calendar: Monday of week (Fri)");
  equal(startOfWeek("2026-09-13"), "2026-09-07", "calendar: Monday of week (Sun)");
  equal(addDays("2026-02-28", 1), "2026-03-01", "calendar: addDays across month");
  equal(
    localMidnight("2026-10-05", "Asia/Kolkata").toISOString(),
    "2026-10-04T18:30:00.000Z",
    "calendar: IST midnight",
  );
  equal(
    localMidnight("2026-03-08", "America/New_York").toISOString(),
    "2026-03-08T05:00:00.000Z",
    "calendar: EST midnight on DST day",
  );
  equal(
    localMidnight("2026-03-09", "America/New_York").toISOString(),
    "2026-03-09T04:00:00.000Z",
    "calendar: EDT midnight after DST",
  );
  const week = weekGrid("2026-09-11", "Asia/Kolkata", new Date("2026-09-11T10:00:00Z"));
  equal(week.length, 7, "calendar: 7 days");
  equal(week[0]?.date, "2026-09-07", "calendar: week starts Monday");
  equal(week[4]?.isToday, true, "calendar: today flagged");
  const range = gridRange(week);
  equal(range.from.toISOString(), "2026-09-06T18:30:00.000Z", "calendar: range from");
  equal(range.to.toISOString(), "2026-09-13T18:29:59.999Z", "calendar: range to");
  const month = monthGrid("2026-09", "Asia/Kolkata");
  equal(month.length, 5, "calendar: Sept 2026 spans 5 weeks");
  equal(month[0]?.[0]?.date, "2026-08-31", "calendar: month grid leads with prior Monday");
  equal(month[0]?.[0]?.inMonth, false, "calendar: leading day outside month");
  equal(month[4]?.[6]?.date, "2026-10-04", "calendar: month grid ends on Sunday");
  equal(monthGrid("2027-02", "UTC").length, 4, "calendar: Feb 2027 is exactly 4 weeks");
}
