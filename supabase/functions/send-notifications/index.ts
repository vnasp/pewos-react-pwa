/**
 * Supabase Edge Function: send-notifications
 *
 * Ejecutar en CRON cada 15 minutos desde Supabase Dashboard → Edge Functions → Cron:15
 *
 * Variables de entorno requeridas (Supabase Dashboard → Settings → Edge Functions):
 *   VAPID_PUBLIC_KEY   → clave pública VAPID
 *   VAPID_PRIVATE_KEY  → clave privada VAPID
 *   VAPID_EMAIL        → mailto:valentinamr@gmail.com
 *   SUPABASE_URL       → inyectado automáticamente
 *   SUPABASE_SERVICE_ROLE_KEY → inyectado automáticamente
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore — web-push ESM via esm.sh
import webpush from "https://esm.sh/web-push@3";

const WINDOW_MIN = 15; // enviar con hasta X minutos de anticipación

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  webpush.setVapidDetails(
    Deno.env.get("VAPID_EMAIL")!,
    Deno.env.get("VAPID_PUBLIC_KEY")!,
    Deno.env.get("VAPID_PRIVATE_KEY")!,
  );

  const now = new Date();
  const timezone = "America/Argentina/Buenos_Aires"; // ajustar según usurio
  const todayStr = now.toLocaleDateString("en-CA", { timeZone: timezone }); // YYYY-MM-DD
  const currentMs = now.getTime();
  const windowMs = WINDOW_MIN * 60_000;

  // Calcular epoch para un "HH:MM" de hoy restando minutos de anticipación
  function toEpoch(timeStr: string, minutesBefore = 0): number {
    const [h, m] = timeStr.split(":").map(Number);
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    return d.getTime() - minutesBefore * 60_000;
  }

  const notifMinutes: Record<string, number> = {
    none: 0,
    "15min": 15,
    "30min": 30,
    "1h": 60,
    "2h": 120,
    "1day": 1440,
  };

  function isDue(timeStr: string, notifTime: string): boolean {
    const mins = notifMinutes[notifTime] ?? 0;
    const ts = toEpoch(timeStr, mins);
    return ts >= currentMs && ts <= currentMs + windowMs;
  }

  // ── Recopilar notificaciones pendientes por usuario ────────────────────
  const pending = new Map<string, { title: string; body: string }[]>();

  const add = (userId: string, n: { title: string; body: string }) => {
    if (!pending.has(userId)) pending.set(userId, []);
    pending.get(userId)!.push(n);
  };

  // Citas
  const { data: apts } = await supabase
    .from("appointments")
    .select(
      "user_id,dog_name,time,type,custom_type_description,notification_time",
    )
    .eq("date", todayStr)
    .neq("notification_time", "none");

  for (const a of apts ?? []) {
    if (!isDue(a.time, a.notification_time)) continue;
    add(a.user_id, {
      title: `🐾 Cita de ${a.dog_name}`,
      body: a.custom_type_description ?? a.type,
    });
  }

  // Medicamentos
  const { data: meds } = await supabase
    .from("medications")
    .select(
      "user_id,dog_name,name,dosage,scheduled_times,notification_time,is_active,start_date,end_date,duration_days",
    )
    .eq("is_active", true)
    .neq("notification_time", "none");

  for (const m of meds ?? []) {
    const start = m.start_date?.slice(0, 10);
    if (start > todayStr) continue;
    if (m.duration_days > 0 && m.end_date?.slice(0, 10) < todayStr) continue;
    for (const t of m.scheduled_times ?? []) {
      if (!isDue(t, m.notification_time)) continue;
      add(m.user_id, {
        title: `💊 Medicamento de ${m.dog_name}`,
        body: `${m.name}${m.dosage ? ` — ${m.dosage}` : ""}`,
      });
    }
  }

  // Ejercicios
  const { data: exs } = await supabase
    .from("exercises")
    .select(
      "user_id,dog_name,type,custom_type_description,duration_minutes,scheduled_times,notification_time,is_active,start_date,end_date,is_permanent",
    )
    .eq("is_active", true)
    .neq("notification_time", "none");

  for (const e of exs ?? []) {
    if (e.start_date?.slice(0, 10) > todayStr) continue;
    if (!e.is_permanent && e.end_date?.slice(0, 10) < todayStr) continue;
    for (const t of e.scheduled_times ?? []) {
      if (!isDue(t, e.notification_time)) continue;
      add(e.user_id, {
        title: `🏃 Ejercicio de ${e.dog_name}`,
        body: `${e.custom_type_description ?? e.type} — ${e.duration_minutes} min`,
      });
    }
  }

  // Cuidados
  const { data: caresList } = await supabase
    .from("cares")
    .select(
      "user_id,dog_name,type,custom_type_description,duration_minutes,scheduled_times,notification_time,is_active,start_date,end_date,is_permanent",
    )
    .eq("is_active", true)
    .neq("notification_time", "none");

  for (const c of caresList ?? []) {
    if (c.start_date?.slice(0, 10) > todayStr) continue;
    if (!c.is_permanent && c.end_date?.slice(0, 10) < todayStr) continue;
    for (const t of c.scheduled_times ?? []) {
      if (!isDue(t, c.notification_time)) continue;
      add(c.user_id, {
        title: `❤️ Cuidado de ${c.dog_name}`,
        body: `${c.custom_type_description ?? c.type} — ${c.duration_minutes} min`,
      });
    }
  }

  // ── Enviar Web Push para cada usuario ─────────────────────────────────
  const ownerIds = [...pending.keys()];
  if (ownerIds.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  // Buscar usuarios compartidos que también deben recibir estas notificaciones
  const { data: shares } = await supabase
    .from("shared_access")
    .select("owner_id,shared_with_id")
    .in("owner_id", ownerIds)
    .eq("status", "accepted")
    .not("shared_with_id", "is", null);

  // Construir mapa: userId → notificaciones (propias + de dueños compartidos)
  const notificationsFor = new Map<string, { title: string; body: string }[]>();

  // Notificaciones propias
  for (const [userId, notifs] of pending.entries()) {
    notificationsFor.set(userId, [
      ...(notificationsFor.get(userId) ?? []),
      ...notifs,
    ]);
  }

  // Notificaciones hacia usuarios compartidos
  for (const share of shares ?? []) {
    const ownerNotifs = pending.get(share.owner_id) ?? [];
    if (ownerNotifs.length === 0) continue;
    const existing = notificationsFor.get(share.shared_with_id) ?? [];
    notificationsFor.set(share.shared_with_id, [...existing, ...ownerNotifs]);
  }

  const allUserIds = [...notificationsFor.keys()];
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("user_id,endpoint,p256dh,auth")
    .in("user_id", allUserIds);

  let sent = 0;
  const errors: string[] = [];

  for (const sub of subs ?? []) {
    const notifications = notificationsFor.get(sub.user_id) ?? [];
    for (const n of notifications) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({ title: n.title, body: n.body, url: "/" }),
        );
        sent++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${sub.user_id}: ${msg}`);
        // Si el endpoint ya no es válido (410 Gone) → eliminar la suscripción
        if (msg.includes("410")) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("user_id", sub.user_id);
        }
      }
    }
  }

  return new Response(JSON.stringify({ sent, errors }), { status: 200 });
});
