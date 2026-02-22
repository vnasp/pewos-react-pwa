import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Capturar beforeinstallprompt lo antes posible para que Chrome
// no lo pierda antes de que React monte el InstallBanner
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).__pwaPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__pwaPrompt = e;
  window.dispatchEvent(new Event("pwa-prompt-ready"));
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
