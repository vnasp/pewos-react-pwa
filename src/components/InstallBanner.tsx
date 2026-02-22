import { useEffect, useRef, useState } from "react";
import { X, Share, PlusSquare, Download } from "lucide-react";

type Platform = "ios-safari" | "chromium" | "other";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  // Safari en iOS: no contiene "CriOS" ni "FxiOS" ni "EdgiOS"
  const isIosSafari = isIos && !/CriOS|FxiOS|EdgiOS/i.test(ua);
  if (isIosSafari) return "ios-safari";
  // Chrome, Edge, Samsung, Opera — soportan beforeinstallprompt
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deferredPrompt = useRef<any>(null);
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");

  useEffect(() => {
    // No mostrar si ya está instalada
    if (isStandalone()) return;
    // No mostrar si ya fue descartada en esta sesión
    if (sessionStorage.getItem("install_banner_dismissed")) return;

    const p = detectPlatform();
    setPlatform(p);

    if (p === "chromium") {
      const handler = (e: Event) => {
        e.preventDefault();
        deferredPrompt.current = e;
        setVisible(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    } else {
      // iOS Safari y otros: mostrar instrucciones manuales
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("install_banner_dismissed", "1");
    setVisible(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    deferredPrompt.current = null;
  };

  if (!visible) return null;

  return (
    <div className="bg-indigo-700 text-white px-4 py-3 flex items-start gap-3 text-sm">
      <div className="flex-1">
        {platform === "ios-safari" && (
          <p className="leading-snug">
            Instalá Pewos: toca{" "}
            <span className="inline-flex items-center gap-0.5 font-semibold">
              <Share size={14} className="inline" /> Compartir
            </span>{" "}
            y luego{" "}
            <span className="inline-flex items-center gap-0.5 font-semibold">
              <PlusSquare size={14} className="inline" /> Agregar a inicio
            </span>
            .
          </p>
        )}
        {platform === "chromium" && (
          <div className="flex items-center gap-2">
            <p className="leading-snug flex-1">
              Instalá Pewos como app para acceso rápido.
            </p>
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 bg-white text-indigo-700 font-semibold text-xs px-3 py-1.5 rounded-full shrink-0"
            >
              <Download size={13} />
              Instalar
            </button>
          </div>
        )}
        {platform === "other" && (
          <p className="leading-snug">
            Podés agregar Pewos a tu pantalla de inicio desde el menú del
            navegador.
          </p>
        )}
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 opacity-70 hover:opacity-100 mt-0.5"
      >
        <X size={16} />
      </button>
    </div>
  );
}
