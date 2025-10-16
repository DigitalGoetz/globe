import stylesheet from "./style.css?inline";
import "./style.css";

let stylesInjected = false;

export function ensureGlobeStyles() {
  if (stylesInjected) {
    return;
  }

  if (typeof document === "undefined") {
    return;
  }

  const styleElement = document.createElement("style");
  styleElement.setAttribute("data-web-components-globe", "true");
  styleElement.textContent = stylesheet;
  document.head.appendChild(styleElement);
  stylesInjected = true;
}
