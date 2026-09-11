/* Astrologer Kavita first-party analytics. Cookieless, no third parties, no personal data.
   Honours Do Not Track, Global Privacy Control and localStorage.ak_optout = "1".
   Wire format is validated by POST /api/t (src/lib/analytics/schema.ts). ES2017, no deps. */
/* eslint-disable */
// prettier-ignore
(function () {
  var w = window, d = document, n = navigator, ls = null, ss = null;
  try { ls = w.localStorage; ss = w.sessionStorage; } catch (e) {}
  var q = w.__ak = w.__ak || [];
  var off = n.doNotTrack === "1" || w.doNotTrack === "1" || n.globalPrivacyControl === true ||
    (ls && ls.getItem("ak_optout") === "1");
  if (off || w.__akLoaded) { q.push = function () {}; q.length = 0; return; }
  w.__akLoaded = true;

  var URL_ = "/api/t", MAX = 20, WAIT = 5000, SESSION_IDLE = 30 * 60 * 1000;
  var CONV = ["booking_started", "booking_step", "booking_completed", "contact_submitted",
    "whatsapp_clicked", "call_clicked", "testimonial_submitted"];
  var INTERACTIVE = "a,button,input,select,textarea,label,summary,[role=button],[role=link]," +
    "[role=menuitem],[role=tab],[onclick],[tabindex],[data-track],[data-event],[contenteditable]";

  function rid() {
    var s = "", a = new Uint8Array(8), c = w.crypto;
    if (c && c.getRandomValues) c.getRandomValues(a);
    else for (var j = 0; j < 8; j++) a[j] = Math.random() * 256;
    for (var i = 0; i < 8; i++) s += ("0" + a[i].toString(16)).slice(-2);
    return s;
  }
  function now() { return Date.now(); }

  /* Session id lives in sessionStorage (per tab, gone when the tab closes); 30 min idle = new. */
  var sid, fresh = false;
  try {
    var raw = ss && ss.getItem("ak_s"), parts = raw ? raw.split(":") : [];
    if (parts.length === 2 && now() - Number(parts[1]) < SESSION_IDLE) sid = parts[0];
  } catch (e) {}
  if (!sid) { sid = rid(); fresh = true; }
  function touch() { try { ss && ss.setItem("ak_s", sid + ":" + now()); } catch (e) {} }
  touch();

  /* Batching: max 20 events or 5 s, flushed with sendBeacon on hide/pagehide. */
  var buf = [], timer = null;
  function conn() { var c = n.connection; return c && c.effectiveType ? String(c.effectiveType) : undefined; }
  function flush() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!buf.length) return;
    var body = JSON.stringify({
      v: 1, sid: sid, ns: fresh || undefined, ref: d.referrer || undefined,
      sw: w.screen && w.screen.width, sh: w.screen && w.screen.height,
      vw: w.innerWidth, vh: w.innerHeight, conn: conn(), ev: buf.splice(0, MAX)
    });
    fresh = false;
    var sent = false;
    try { if (n.sendBeacon) sent = n.sendBeacon(URL_, body); } catch (e) {}
    if (!sent && w.fetch) {
      try { fetch(URL_, { method: "POST", body: body, keepalive: true, credentials: "omit" }).catch(function () {}); } catch (e) {}
    }
    if (buf.length) flush();
  }
  function send(ev) {
    ev.ts = now();
    if (!ev.p) ev.p = location.pathname;
    buf.push(ev);
    touch();
    if (buf.length >= MAX) flush();
    else if (!timer) timer = setTimeout(flush, WAIT);
  }

  /* Pageview lifecycle: key per view, visible time via Page Visibility, scroll milestones. */
  var pv = null;
  function utm() {
    var out = {}, any = false, s = location.search, m = { s: "utm_source", m: "utm_medium", c: "utm_campaign", n: "utm_content", t: "utm_term" };
    if (!s || !w.URLSearchParams) return undefined;
    var p = new URLSearchParams(s);
    for (var k in m) { var v = p.get(m[k]); if (v) { out[k] = v.slice(0, 120); any = true; } }
    return any ? out : undefined;
  }
  function endView() {
    if (!pv) return;
    accumulate();
    send({ t: "pe", k: pv.k, p: pv.p, tp: pv.tp, sd: pv.sd, ti: pv.ti || d.title.slice(0, 200) });
    if (pv.form && !pv.form.done) send({ t: "e", n: "form_abandon", p: pv.p, pr: { form: pv.form.id, last: pv.form.last } });
  }
  function startView(ref) {
    endView();
    pv = { k: rid(), p: location.pathname, tp: 0, sd: 0, seen: {}, v0: d.hidden ? 0 : now(), ti: "", form: null, fields: {} };
    send({ t: "pv", k: pv.k, p: pv.p, r: ref || undefined, ti: d.title.slice(0, 200), u: utm() });
    setTimeout(function () { if (pv && !pv.ti) pv.ti = d.title.slice(0, 200); }, 300);
    onScroll();
  }
  function accumulate() {
    if (pv && pv.v0) { pv.tp += now() - pv.v0; pv.v0 = d.hidden ? 0 : now(); }
  }
  function onScroll() {
    if (!pv) return;
    var h = d.documentElement, max = (h.scrollHeight || 1) - w.innerHeight;
    var pct = max <= 0 ? 100 : Math.min(100, Math.round((w.scrollY + w.innerHeight) / (h.scrollHeight || 1) * 100));
    var marks = [25, 50, 75, 90, 100];
    for (var i = 0; i < marks.length; i++) {
      if (pct >= marks[i] && !pv.seen[marks[i]]) { pv.seen[marks[i]] = 1; pv.sd = marks[i]; send({ t: "sd", k: pv.k, p: pv.p, d: marks[i] }); }
    }
  }
  var scrollTimer = null;
  w.addEventListener("scroll", function () { if (!scrollTimer) scrollTimer = setTimeout(function () { scrollTimer = null; onScroll(); }, 250); }, { passive: true });
  d.addEventListener("visibilitychange", function () {
    if (d.hidden) { accumulate(); endViewSoft(); flush(); } else if (pv) pv.v0 = now();
  });
  function endViewSoft() { if (pv) send({ t: "pe", k: pv.k, p: pv.p, tp: pv.tp, sd: pv.sd, ti: pv.ti || d.title.slice(0, 200) }); }
  w.addEventListener("pagehide", function () { endView(); pv = null; flush(); });
  w.addEventListener("pageshow", function (e) { if (e.persisted && !pv) startView(); });

  /* Client-side navigation (Next.js router uses pushState). */
  var lastPath = location.pathname;
  function nav() {
    if (location.pathname === lastPath) return;
    var from = lastPath; lastPath = location.pathname;
    setTimeout(function () { startView(location.origin + from); }, 50);
  }
  ["pushState", "replaceState"].forEach(function (m) {
    var orig = history[m];
    if (!orig) return;
    history[m] = function () { var r = orig.apply(this, arguments); nav(); return r; };
  });
  w.addEventListener("popstate", nav);

  /* Clicks: heat points, CTA/data-event, outbound, rage and dead clicks. */
  function sel(el) {
    var out = [], e = el, depth = 0;
    while (e && e.nodeType === 1 && depth < 3 && e !== d.body) {
      var s = e.tagName.toLowerCase();
      if (e.id) s += "#" + e.id;
      else if (e.classList && e.classList.length) s += "." + e.classList[0];
      out.unshift(s); e = e.parentNode; depth++;
    }
    return out.join(">").slice(0, 120);
  }
  function text(el) {
    var tag = el.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return "";
    return ((el.innerText || el.textContent || "").replace(/\s+/g, " ").trim()).slice(0, 60);
  }
  var clicks = [];
  d.addEventListener("click", function (e) {
    var el = e.target;
    if (!el || el.nodeType !== 1) el = el && el.parentElement;
    if (!el) return;
    var t = now(), x = Math.round(e.clientX / (w.innerWidth || 1) * 1000) / 10, y = Math.round(e.clientY / (w.innerHeight || 1) * 1000) / 10;
    var inter = el.closest(INTERACTIVE), s = sel(el), tx = text(el), path = pv ? pv.p : location.pathname;
    send({ t: "e", n: "click", p: path, pr: { sel: s, txt: tx, x: x, y: y, i: inter ? 1 : 0 } });
    clicks.push({ t: t, x: e.clientX, y: e.clientY });
    clicks = clicks.filter(function (c) { return t - c.t <= 700 && Math.abs(c.x - e.clientX) <= 30 && Math.abs(c.y - e.clientY) <= 30; });
    if (clicks.length >= 3) { clicks = []; send({ t: "e", n: "rage_click", p: path, pr: { sel: s, txt: tx, x: x, y: y } }); }
    var a = el.closest("a[href]");
    if (a) {
      var host = a.hostname;
      if (host && host !== location.hostname && /^https?:/.test(a.protocol)) send({ t: "e", n: "outbound", p: path, pr: { href: (a.origin + a.pathname).slice(0, 200), txt: tx } });
    }
    var cta = el.closest("[data-track]");
    if (cta) send({ t: "e", n: "cta", p: path, pr: { id: String(cta.getAttribute("data-track")).slice(0, 80), txt: tx } });
    var ce = el.closest("[data-event]"), name = ce && ce.getAttribute("data-event");
    if (name && CONV.indexOf(name) >= 0) send({ t: "e", n: name, p: path, id: rid() + rid(), pr: { placement: (ce.getAttribute("data-placement") || s).slice(0, 80) } });
    if (!inter && w.MutationObserver) {
      var changed = false, href = location.href;
      var mo = new MutationObserver(function () { changed = true; });
      mo.observe(d.body, { childList: true, subtree: true, attributes: true, characterData: true });
      setTimeout(function () {
        mo.disconnect();
        if (!changed && href === location.href) send({ t: "e", n: "dead_click", p: path, pr: { sel: s, txt: tx, x: x, y: y } });
      }, 500);
    }
  }, true);

  /* Forms: field names only, never values. Abandon = focused a field, left without submit. */
  function field(el) {
    if (!el || !/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) || el.type === "password" || el.type === "hidden") return null;
    return { f: (el.name || el.id || el.type || "field").slice(0, 60), form: (el.form && (el.form.id || el.form.getAttribute("name") || el.form.getAttribute("action") || "form")) || "none" };
  }
  d.addEventListener("focusin", function (e) {
    var f = field(e.target); if (!f || !pv) return;
    if (!pv.fields[f.form + "/" + f.f]) { pv.fields[f.form + "/" + f.f] = 1; send({ t: "e", n: "form_focus", p: pv.p, pr: { field: f.f, form: f.form } }); }
    if (f.form !== "none") pv.form = { id: f.form, last: f.f, done: false };
  });
  d.addEventListener("focusout", function (e) {
    var f = field(e.target); if (!f || !pv) return;
    send({ t: "e", n: "form_blur", p: pv.p, pr: { field: f.f, form: f.form } });
  });
  d.addEventListener("submit", function (e) {
    var fm = e.target; if (pv && pv.form && fm && (fm.id || fm.getAttribute("name") || fm.getAttribute("action") || "form") === pv.form.id) pv.form.done = true;
  }, true);

  /* Queue: window.__ak.push({ n, pr, id }) from src/lib/events-browser.ts (conversion fan-out). */
  function drain(item) {
    if (!item || typeof item !== "object" || typeof item.n !== "string") return;
    send({ t: "e", n: item.n, p: item.p, pr: item.pr || {}, id: item.id });
  }
  var pending = q.splice(0, q.length);
  q.push = function () { for (var i = 0; i < arguments.length; i++) drain(arguments[i]); return q.length; };

  startView(d.referrer);
  pending.forEach(drain);
})();
