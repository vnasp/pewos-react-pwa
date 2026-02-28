/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

// Workbox inyecta el manifest aquí
precacheAndRoute(self.__WB_MANIFEST);

// skipWaiting + clientsClaim para actualizaciones inmediatas
self.skipWaiting();
self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

// ─── WEB PUSH (iOS Safari + Android) ─────────────────────────────────────
// Triggered desde el servidor (Supabase Edge Function)
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload: { title?: string; body?: string; url?: string } = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Pewos", body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Pewos", {
      body: payload.body ?? "",
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      data: { url: payload.url ?? "/" },
    }),
  );
});

// ─── NOTIFICACIONES LOCALES (Android sin push server) ─────────────────────

interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number; // epoch ms – cuándo mostrarla
}

// Mapa de timers activos: notificationId → timeoutId
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleOne(n: ScheduledNotification) {
  const delay = n.timestamp - Date.now();
  if (delay < -60_000) return; // ya pasó hace más de 1 min → ignorar

  // Cancelar si ya existía
  if (timers.has(n.id)) clearTimeout(timers.get(n.id)!);

  const tid = setTimeout(
    async () => {
      timers.delete(n.id);
      try {
        await self.registration.showNotification(n.title, {
          body: n.body,
          icon: "/pwa-192x192.png",
          badge: "/pwa-192x192.png",
          tag: n.id,
          data: { url: "/" },
        });
      } catch {
        // Permiso revocado u otro error — silencioso
      }
    },
    Math.max(0, delay),
  );

  timers.set(n.id, tid);
}

// Mensaje desde la app: { type: "SCHEDULE_NOTIFICATIONS", notifications: [...] }
self.addEventListener("message", (event) => {
  if (!event.data) return;

  if (event.data.type === "SCHEDULE_NOTIFICATIONS") {
    const incoming: ScheduledNotification[] = event.data.notifications ?? [];
    const incomingIds = new Set(incoming.map((n) => n.id));

    // Cancelar los que ya no aparecen en la nueva lista
    for (const [id, tid] of timers) {
      if (!incomingIds.has(id)) {
        clearTimeout(tid);
        timers.delete(id);
      }
    }

    // Programar/reprogramar los nuevos
    for (const n of incoming) scheduleOne(n);
  }

  if (event.data.type === "CLEAR_NOTIFICATIONS") {
    for (const tid of timers.values()) clearTimeout(tid);
    timers.clear();
  }
});

// Al tocar la notificación → abrir la app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url: string = event.notification.data?.url ?? "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) return (client as WindowClient).focus();
        }
        return self.clients.openWindow(url);
      }),
  );
});
