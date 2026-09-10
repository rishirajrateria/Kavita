/**
 * Inline, render-blocking script that applies the persisted theme before first paint.
 * Must be rendered inside <head> of the root layout (server component, no JS bundle).
 *
 * Contract shared with <ThemeToggle />:
 *   localStorage "theme" ∈ "light" | "dark"   → sets <html data-theme="…">
 *   anything else / missing ("system")         → removes the attribute, media query decides
 */
const THEME_INIT = `(function(){try{var t=localStorage.getItem("theme");var d=document.documentElement;if(t==="dark"||t==="light"){d.setAttribute("data-theme",t)}else{d.removeAttribute("data-theme")}}catch(e){}})();`;

export function ThemeScript() {
  return <script id="theme-init" dangerouslySetInnerHTML={{ __html: THEME_INIT }} />;
}
