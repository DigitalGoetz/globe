import cssText from "./style.css?inline";

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

  const existing = document.getElementById(STYLE_ELEMENT_ID);
  if (existing) {
    injected = true;
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ELEMENT_ID;
  style.type = "text/css";

  style.appendChild(document.createTextNode(cssText));
  head.appendChild(style);

  injected = true;
}
