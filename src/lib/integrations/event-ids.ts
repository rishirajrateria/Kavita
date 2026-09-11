/**
 * Deterministic conversion ids, so the browser pixel and the server-side Conversions API can
 * agree on one `event_id` without threading it through the booking response (CLAUDE.md §13C).
 * Both sides derive it from the booking id: Meta then treats the pair as one conversion
 * instead of two. Pure and isomorphic — the booking flow imports it in the browser.
 */

export function bookingEventId(bookingId: string): string {
  return `booking-${bookingId}`;
}
