import { useEffect } from "react";
import { useCalendar } from "../context/CalendarContext";
import { useMedication } from "../context/MedicationContext";
import { useExercise } from "../context/ExerciseContext";
import { useCare } from "../context/CareContext";
import {
  type ScheduledNotification,
  notificationsGranted,
  sendScheduleToSW,
  timeStringToTimestamp,
  notificationMinutesFor,
} from "../utils/notifications";
import { careTypeLabels } from "../context/CareContext";
import { exerciseTypeLabels } from "../context/ExerciseContext";

// Utilidad para saber si una fecha string (YYYY-MM-DD) es hoy
function isToday(dateVal: Date | string): boolean {
  const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

function todayTs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function useNotificationScheduler() {
  const { appointments } = useCalendar();
  const { medications } = useMedication();
  const { exercises } = useExercise();
  const { cares } = useCare();

  useEffect(() => {
    if (!notificationsGranted()) return;

    const now = todayTs();
    const MS_PER_DAY = 86_400_000;
    const notifications: ScheduledNotification[] = [];

    // ── Citas de hoy ──────────────────────────────────────────────────────
    for (const apt of appointments) {
      if (apt.notificationTime === "none") continue;

      const dates: Date[] = [];

      if (isToday(apt.date)) {
        dates.push(new Date(apt.date));
      } else if (apt.recurrencePattern && apt.recurrencePattern !== "none") {
        // Verificar si la recurrencia cae hoy
        const base = new Date(apt.date);
        base.setHours(0, 0, 0, 0);
        const diffDays = Math.round((now - base.getTime()) / MS_PER_DAY);
        let matches = false;
        if (apt.recurrencePattern === "daily" && diffDays >= 0) matches = true;
        if (
          apt.recurrencePattern === "weekly" &&
          diffDays >= 0 &&
          diffDays % 7 === 0
        )
          matches = true;
        if (
          apt.recurrencePattern === "biweekly" &&
          diffDays >= 0 &&
          diffDays % 14 === 0
        )
          matches = true;
        if (apt.recurrencePattern === "monthly") {
          const today = new Date();
          matches = diffDays >= 0 && base.getDate() === today.getDate();
        }
        if (matches) dates.push(new Date(apt.date));
      }

      for (const _ of dates) {
        const mins = notificationMinutesFor(apt.notificationTime);
        const ts = timeStringToTimestamp(apt.time, mins);
        notifications.push({
          id: `apt-${apt.id}-${apt.time}`,
          title: `🐾 Cita de ${apt.dogName}`,
          body: apt.customTypeDescription ?? apt.type,
          timestamp: ts,
        });
      }
    }

    // ── Medicamentos de hoy ───────────────────────────────────────────────
    for (const med of medications) {
      if (!med.isActive || med.notificationTime === "none") continue;
      const start = new Date(med.startDate);
      start.setHours(0, 0, 0, 0);
      if (start.getTime() > now) continue;
      if (med.durationDays > 0) {
        const end = new Date(med.endDate);
        end.setHours(0, 0, 0, 0);
        if (end.getTime() < now) continue;
      }
      if (med.frequencyHours && med.frequencyHours > 24) {
        const days = Math.round((now - start.getTime()) / MS_PER_DAY);
        const interval = Math.round(med.frequencyHours / 24);
        if (days % interval !== 0) continue;
      }

      const mins = notificationMinutesFor(med.notificationTime);
      for (const time of med.scheduledTimes) {
        notifications.push({
          id: `med-${med.id}-${time}`,
          title: `💊 Medicamento de ${med.dogName}`,
          body: `${med.name}${med.dosage ? ` — ${med.dosage}` : ""}`,
          timestamp: timeStringToTimestamp(time, mins),
        });
      }
    }

    // ── Ejercicios de hoy ─────────────────────────────────────────────────
    for (const ex of exercises) {
      if (!ex.isActive || ex.notificationTime === "none") continue;
      const start = new Date(ex.startDate);
      start.setHours(0, 0, 0, 0);
      if (start.getTime() > now) continue;
      if (!ex.isPermanent && ex.endDate) {
        const end = new Date(ex.endDate);
        end.setHours(0, 0, 0, 0);
        if (end.getTime() < now) continue;
      }

      const label =
        ex.type === "otro" && ex.customTypeDescription
          ? ex.customTypeDescription
          : (exerciseTypeLabels[ex.type] ?? ex.type);
      const mins = notificationMinutesFor(ex.notificationTime);
      for (const time of ex.scheduledTimes) {
        notifications.push({
          id: `ex-${ex.id}-${time}`,
          title: `🏃 Ejercicio de ${ex.dogName}`,
          body: `${label} — ${ex.durationMinutes} min`,
          timestamp: timeStringToTimestamp(time, mins),
        });
      }
    }

    // ── Cuidados post-op de hoy ───────────────────────────────────────────
    for (const care of cares) {
      if (!care.isActive || care.notificationTime === "none") continue;
      const start = new Date(care.startDate);
      start.setHours(0, 0, 0, 0);
      if (start.getTime() > now) continue;
      if (!care.isPermanent && care.endDate) {
        const end = new Date(care.endDate);
        end.setHours(0, 0, 0, 0);
        if (end.getTime() < now) continue;
      }

      const label =
        care.type === "otro" && care.customTypeDescription
          ? care.customTypeDescription
          : careTypeLabels[care.type];
      const mins = notificationMinutesFor(care.notificationTime);
      for (const time of care.scheduledTimes) {
        notifications.push({
          id: `care-${care.id}-${time}`,
          title: `❤️ Cuidado de ${care.dogName}`,
          body: `${label} — ${care.durationMinutes} min`,
          timestamp: timeStringToTimestamp(time, mins),
        });
      }
    }

    sendScheduleToSW(notifications);
  }, [appointments, medications, exercises, cares]);
}
