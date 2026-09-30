/* global TrelloPowerUp */
import React from "react";
import ReactDOM from "react-dom/client";
import SettingsPopup from "./SettingsPopup.jsx";

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
    get: (scope, visibility, key) =>
      Promise.resolve(localStorage.getItem(`link_canvas_${scope}_${visibility}_${key}`)),
    set: (scope, visibility, key, val) => {
      localStorage.setItem(`link_canvas_${scope}_${visibility}_${key}`, val);
      return Promise.resolve();
    },
    remove: (scope, visibility, key) => {
      localStorage.removeItem(`link_canvas_${scope}_${visibility}_${key}`);
      return Promise.resolve();
    },
    sizeTo: () => Promise.resolve(),
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SettingsPopup t={t} />
  </React.StrictMode>
);
