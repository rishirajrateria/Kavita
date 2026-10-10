/**
 * Page-local adjustments laid over the shared `DoorField` from outside, for gaps in the primitive
 * that this page group cannot patch (the shared files belong to the primitives agent). Each is a
 * descendant selector on the field's own class, so it outranks the shared rule without editing it;
 * `!` is needed where `doors.css` (unlayered) already sets the property.
 */

/**
 * Under the hand and on keyboard focus a door's label takes `--accent-strong` (brass-300 by night,
 * brass-700 by day) instead of the place glow, which is pale gold in both themes and fell to about
 * 1.3:1 on parchment. By night the colour is unchanged; by day it holds AA on the hover tint.
 */
export const LABEL_CONTRAST =
  "[&_.door:hover_.door-label]:text-accent-strong! [&_.door:focus-visible_.door-label]:text-accent-strong!";

/** A hair of air between a station's definition and its transliteration (macrons, underdots). */
export const STATION_META_GAP = "[&_.door--station_.door-meta]:mt-[0.35rem]";

/**
 * Below 768 px a tile field is set as ruled station rows — glyph at the left, no box — so a phone
 * reads a quiet ruled list rather than a stack of cards. Same DOM, same text, same links.
 */
export const STATION_BELOW_MD = [
  "max-md:grid-cols-1! max-md:gap-0!",
  "max-md:[&_.door--tile]:grid! max-md:[&_.door--tile]:grid-cols-[2.75rem_minmax(0,1fr)]!",
  "max-md:[&_.door--tile]:items-center! max-md:[&_.door--tile]:gap-x-4! max-md:[&_.door--tile]:gap-y-0!",
  "max-md:[&_.door--tile]:rounded-none! max-md:[&_.door--tile]:border-0! max-md:[&_.door--tile]:border-t!",
  "max-md:[&_.door--tile]:px-0! max-md:[&_.door--tile]:py-[0.85rem]! max-md:[&_.door--tile]:text-left!",
  "max-md:[&_.door--tile_.door-glyph-wrap]:row-span-3 max-md:[&_.door--tile_.door-rule]:hidden!",
  "max-md:[&_.door--tile_.door-meta]:mt-[0.35rem] max-md:[&_.door--tile:hover]:transform-none!",
].join(" ");

/**
 * A figure-less `FigureSection` set on the centre axis, so it keeps the rhythm of the figure
 * plates around it: numeral, H2 and `.answer` centred (the answer without its column bar, as the
 * centred plates set it), the doors centred beneath.
 */
export const CENTRED_PLATE =
  "[&_.plate-n]:text-center [&_h2]:mx-auto [&_h2]:text-center [&_.answer]:text-center [&_.answer]:border-s-0 [&_.answer]:ps-0";
