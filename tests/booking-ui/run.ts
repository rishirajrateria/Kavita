/**
 * Booking UI tests — `pnpm test:booking-ui`. Pure functions only: the dual-zone display
 * helpers across DST and the IST half-hour, the hand-rolled month grid, calendar links and
 * the 503 fallback summary. No DOM, no network.
 */
import { finish } from "../seo-plumbing/_assert";
import { run as format } from "./format.test";

format();
finish("booking-ui");
