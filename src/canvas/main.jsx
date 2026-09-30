/* global TrelloPowerUp */
import React from "react";
import ReactDOM from "react-dom/client";
import CanvasApp from "./CanvasApp.jsx";

let t = null;
try {
  if (typeof TrelloPowerUp !== "undefined" && typeof TrelloPowerUp.iframe === "function") {
    t = TrelloPowerUp.iframe();
  }
} catch (_) {
  // Silent fallback for standalone browser context
}

if (!t) {
  t = {
    get: () => Promise.resolve(null),
    set: () => Promise.resolve(),
    closeModal: () => {},
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CanvasApp t={t} />
  </React.StrictMode>
);
