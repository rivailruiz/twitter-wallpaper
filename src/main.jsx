import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

const goatcounterUrl = import.meta.env.VITE_GOATCOUNTER_URL?.trim();

if (import.meta.env.PROD && goatcounterUrl) {
  const existingScript = document.querySelector("script[data-goatcounter]");

  if (!existingScript) {
    const script = document.createElement("script");
    script.async = true;
    script.dataset.goatcounter = goatcounterUrl;
    script.src = "https://gc.zgo.at/count.js";
    document.head.appendChild(script);
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
