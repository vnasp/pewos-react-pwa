import { useEffect } from "react";
import { supabase } from "../utils/supabase";
import { useAuth } from "../context/AuthContext";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * Suscribe al usuario a Web Push y guarda la suscripción en Supabase.
 * Funciona en iOS Safari 16.4+ (Add to Home Screen) y Android Chrome.
 */
export function usePushSubscription() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !VAPID_PUBLIC_KEY) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission !== "granted") return;

    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;

        let subscription = await reg.pushManager.getSubscription();

        if (!subscription) {
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
              .buffer as ArrayBuffer,
          });
        }

        // Guardar/actualizar en Supabase (tabla sin tipos generados aún)
        const sub = subscription.toJSON();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = supabase as any;
        await db.from("push_subscriptions").upsert(
          {
            user_id: user.id,
            endpoint: sub.endpoint,
            p256dh: (sub.keys as { p256dh: string; auth: string }).p256dh,
            auth: (sub.keys as { p256dh: string; auth: string }).auth,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
      } catch (err) {
        // Falla silenciosa — el usuario puede no haberlo instalado aún
        console.warn("[PushSubscription]", err);
      }
    })();
  }, [user]);
}
