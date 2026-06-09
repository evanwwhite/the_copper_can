import { runtime } from "../gameState.js";

export const { statusBar, mainContent } = runtime;

export function setMainContentMode(modeName = "") {
  mainContent.className = modeName;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
