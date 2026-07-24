import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { defaultTheme, themeToCssCustomProperties } from "./theme";

for (const [property, value] of Object.entries(themeToCssCustomProperties(defaultTheme))) {
  document.documentElement.style.setProperty(property, value);
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
