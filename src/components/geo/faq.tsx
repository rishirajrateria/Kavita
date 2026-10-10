import { Foot } from "@/components/content";
import type { LocationFaq } from "@/content/locations/schema";
import type { Question } from "./answers";

/**
 * The place's own FAQs in the quiet ruled foot (SPEC §2.3 `Foot`, `faqVisible`): the question
 * heading and its `.answer`, then every city-specific question with its answer open in the HTML
 * — on a geo page the answers are part of the location-specific copy, so none is folded. The
 * FAQPage JSON-LD (speakable on `.answer`) is emitted here from the same rows, plus any FAQ the
 * owner attached to this route.
 */
export function GeoFaq({
  faqs,
  question,
  route,
}: {
  faqs: LocationFaq[];
  question: Question;
  /** Canonical route of the page, for `/admin/aeo` overrides and attached FAQs. */
  route?: string;
}) {
  if (faqs.length === 0) return null;

  return (
    <Foot
      id="faq"
      route={route}
      eyebrow={question.eyebrow}
      heading={question.question}
      answer={question.answer}
      faqs={faqs.map((f) => ({ question: f.question, answer: f.answer }))}
      faqVisible
    />
  );
}
