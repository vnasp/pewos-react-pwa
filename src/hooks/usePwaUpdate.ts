import { useEffect } from "react";

/**
 * Escucha el evento `controllerchange` del Service Worker.
 * Cuando la nueva versión toma el control (después de skipWaiting),
 * recarga la página automáticamente para que el usuario siempre
 * tenga la última versión.
 */
export function usePwaUpdate() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;

    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange,
    );

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );
    };
  }, []);
}
