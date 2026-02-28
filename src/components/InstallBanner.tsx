import { useEffect, useState } from "react";
import { X, Share, PlusSquare, Download } from "lucide-react";

type Platform = "ios-safari" | "chromium" | "other";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getPrompt = () => (window as any).__pwaPrompt ?? null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const clearPrompt = () => {
  (window as any).__pwaPrompt = null;
};

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const isIosSafari = isIos && !/CriOS|FxiOS|EdgiOS/i.test(ua);
  if (isIosSafari) return "ios-safari";
  if (/Chrome|Edg|SamsungBrowser|OPR/i.test(ua)) return "chromium";
  return "other";
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).standalone === true
  );
}

export default function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem("pwa_install_dismissed")) return;

    const p = detectPlatform();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlatform(p);

    if (p === "chromium") {
      if (getPrompt()) {
        setVisible(true);
      } else {
        // Esperar el evento custom disparado desde main.tsx
        const handler = () => setVisible(true);
        window.addEventListener("pwa-prompt-ready", handler);
        return () => window.removeEventListener("pwa-prompt-ready", handler);
      }
    } else {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setClosing(true);
    localStorage.setItem("pwa_install_dismissed", "1");
    setTimeout(() => setVisible(false), 280);
  };

  const handleInstall = async () => {
    const prompt = getPrompt();
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") dismiss();
    clearPrompt();
  };

  if (!visible) return null;

  return (
    <div
      className={`bg-indigo-700 text-white px-4 py-3 transition-all duration-300 ${
        closing ? "-translate-y-2 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Icono */}
        <img
          src="/pwa-192x192.png"
          alt="Pewos"
          className="w-10 h-10 rounded-xl shrink-0 object-cover"
        />

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">Pewos</p>
          <p className="text-xs text-white/80 leading-snug mt-0.5">
            {platform === "ios-safari" && (
              <>
                Toca <Share size={11} className="inline mx-0.5" />
                <strong>Compartir</strong> y luego{" "}
                <PlusSquare size={11} className="inline mx-0.5" />
                <strong>Agregar a inicio</strong>
              </>
            )}
            {platform === "chromium" && "Instalá la app para acceso rápido"}
            {platform === "other" &&
              "Agregá Pewos a tu pantalla de inicio desde el menú del navegador"}
          </p>
        </div>

        {/* Botón instalar (solo chromium) */}
        {platform === "chromium" && (
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 bg-white text-indigo-700 font-semibold text-xs px-3 py-1.5 rounded-full shrink-0"
          >
            <Download size={13} />
            Instalar
          </button>
        )}

        {/* Cerrar */}
        <button
          onClick={dismiss}
          className="shrink-0 opacity-60 hover:opacity-100 p-1"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
