"use client";

import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { FAQ_SEARCH } from "@/content/pages/faq";

/**
 * Filters the ALREADY-RENDERED FAQ: on input it toggles `hidden` on every `[data-faq]` element
 * (and on subgroups/groups left empty) by matching their text. No content is fetched or
 * rendered here; with JavaScript off the box does nothing and every answer stays visible.
 */
export function FaqSearch({ total }: { total: number }) {
  const id = useId();
  const [shown, setShown] = useState(total);
  const [query, setQuery] = useState("");

  function apply(value: string) {
    setQuery(value);
    const terms = value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const el of document.querySelectorAll<HTMLDetailsElement>("details[data-faq]")) {
      const hay = (el.textContent ?? "").toLowerCase();
      const match = terms.every((t) => hay.includes(t));
      el.hidden = !match;
      if (match) visible++;
      if (terms.length && match) el.open = true;
    }
    for (const sub of document.querySelectorAll<HTMLElement>("[data-faq-subgroup]")) {
      sub.hidden = !sub.querySelector("[data-faq]:not([hidden])");
    }
    for (const group of document.querySelectorAll<HTMLElement>("[data-faq-group]")) {
      group.hidden = !group.querySelector("[data-faq]:not([hidden])");
    }
    setShown(visible);
  }

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {FAQ_SEARCH.label}
      </label>
      <Input
        id={id}
        type="search"
        value={query}
        onChange={(e) => apply(e.target.value)}
        placeholder={FAQ_SEARCH.placeholder}
        autoComplete="off"
        className="h-11 max-w-xl text-base"
      />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {shown === 0 ? FAQ_SEARCH.none : FAQ_SEARCH.results(shown, total)}
      </p>
    </div>
  );
}
