/**
 * Plugin options shared by the renderer and the tests (kept free of ESM-only imports so the
 * tsx test runner can load it as CommonJS).
 */
export const AUTOLINK_OPTIONS = {
  behavior: "append",
  properties: {
    className: [
      "heading-anchor",
      "ml-2",
      "font-sans",
      "text-base",
      "font-normal",
      "text-accent-strong/70",
      "no-underline",
      "opacity-0",
      "transition-opacity",
      "group-hover:opacity-100",
      "focus-visible:opacity-100",
    ],
    ariaLabel: "Link to this section",
  },
  content: { type: "text", value: "#" },
} as const;
