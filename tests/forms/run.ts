/**
 * Form tests — `pnpm test:forms`. Plain tsx scripts, no runner, no network, no database: the
 * Zod schemas, the honeypot rule, the rate limiter and the event registry as pure functions.
 */
import { finish } from "../seo-plumbing/_assert";
import { run as events } from "./events.test";
import { run as rateLimit } from "./rate-limit.test";
import { run as schemas } from "./schemas.test";

schemas();
rateLimit();
events();
finish("forms");
