import styleHref from "./style.css?url";

const STYLE_ELEMENT_ID = "wc-globe-style-sheet";
let injected = false;

export function ensureGlobeStyles() {
  if (injected) {
    return;
  }

  if (typeof document === "undefined") {
    // Defer injection until we're running in a browser-like environment.
    return;
  }

  const head = document.head ?? document.getElementsByTagName("head")[0];
  if (!head) {
    return;
  }

  const existing =
    document.getElementById(STYLE_ELEMENT_ID) ??
    head.querySelector<HTMLLinkElement>(`link[href="${styleHref}"]`);
  if (existing) {
    injected = true;
    return;
  }

  const link = document.createElement("link");
  link.id = STYLE_ELEMENT_ID;
  link.rel = "stylesheet";
  link.href = styleHref;
  link.type = "text/css";

  head.appendChild(link);
  injected = true;
}
