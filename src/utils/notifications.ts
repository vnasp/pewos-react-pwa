export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number; // epoch ms
}

/** Pide permiso de notificación. Retorna true si fue concedido. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function notificationsGranted(): boolean {
  return "Notification" in window && Notification.permission === "granted";
}

/** Envía la lista de notificaciones programadas al Service Worker. */
export async function sendScheduleToSW(
  notifications: ScheduledNotification[],
): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  if (!reg.active) return;
  reg.active.postMessage({
    type: "SCHEDULE_NOTIFICATIONS",
    notifications,
  });
}

export async function clearSWNotifications(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  if (!reg.active) return;
  reg.active.postMessage({ type: "CLEAR_NOTIFICATIONS" });
}

/**
 * Convierte "HH:MM" de hoy en epoch ms.
 * Si notificationMinutes > 0, resta ese anticipio.
 */
export function timeStringToTimestamp(
  timeStr: string,
  notificationMinutesBefore = 0,
): number {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime() - notificationMinutesBefore * 60_000;
}

export function notificationMinutesFor(notifTime: string): number {
  const map: Record<string, number> = {
    none: 0,
    "15min": 15,
    "30min": 30,
    "1h": 60,
    "2h": 120,
    "1day": 1440,
  };
  return map[notifTime] ?? 0;
}
