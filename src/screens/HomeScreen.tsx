import { useState, useEffect, useMemo, useCallback } from "react";
import { CheckCircle2, Circle, Calendar, Pill, Dumbbell } from "lucide-react";
import { useCalendar, appointmentTypeLabels } from "../context/CalendarContext";
import { useMedication } from "../context/MedicationContext";
import { useExercise, exerciseTypeLabels } from "../context/ExerciseContext";
import type { Completion } from "../types";

interface HomeScreenProps {
  onNavigateToMedications: () => void;
  onNavigateToCalendar: () => void;
  onNavigateToExercises: () => void;
}

export default function HomeScreen({
  onNavigateToMedications,
  onNavigateToCalendar,
  onNavigateToExercises,
}: HomeScreenProps) {
  const {
    appointments,
    markAppointmentCompleted,
    getTodayCompletions: getApptCompletions,
  } = useCalendar();
  const {
    medications,
    markMedicationCompleted,
    getTodayCompletions: getMedCompletions,
  } = useMedication();
  const {
    exercises,
    markExerciseCompleted,
    getTodayCompletions: getExCompletions,
  } = useExercise();
  const [completions, setCompletions] = useState<
    Record<string, Completion | null>
  >({});

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const todayAppointments = useMemo(
    () =>
      appointments
        .filter((a) => {
          const d = new Date(
            a.date.getFullYear(),
            a.date.getMonth(),
            a.date.getDate(),
          );
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today;
        })
        .map((a) => ({
          type: "appointment" as const,
          id: a.id,
          dogName: a.dogName,
          time: a.time,
          data: a,
        })),
    [appointments, today],
  );

  const todayMedications = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return medications
      .filter((m) => {
        if (!m.isActive) return false;
        if (m.durationDays === 0) return true;
        const end = new Date(m.endDate);
        end.setHours(0, 0, 0, 0);
        return end.getTime() >= now.getTime();
      })
      .flatMap((m) =>
        m.scheduledTimes.map((time) => ({
          type: "medication" as const,
          id: `${m.id}-${time}`,
          dogName: m.dogName,
          time,
          medicationId: m.id,
          scheduledTime: time,
          data: m,
        })),
      );
  }, [medications]);

  const todayExercises = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return exercises
      .filter((e) => {
        if (!e.isActive) return false;
        if (e.isPermanent) return true;
        if (e.endDate) {
          const end = new Date(e.endDate);
          end.setHours(0, 0, 0, 0);
          return end.getTime() >= now.getTime();
        }
        return true;
      })
      .flatMap((e) =>
        e.scheduledTimes.map((time) => ({
          type: "exercise" as const,
          id: `${e.id}-${time}`,
          dogName: e.dogName,
          time,
          exerciseId: e.id,
          scheduledTime: time,
          data: e,
        })),
      );
  }, [exercises]);

  const allEvents = useMemo(
    () =>
      [...todayAppointments, ...todayMedications, ...todayExercises].sort(
        (a, b) => a.time.localeCompare(b.time),
      ),
    [todayAppointments, todayMedications, todayExercises],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        allEvents.map(async (ev) => {
          if (ev.type === "appointment") {
            const c = await getApptCompletions(ev.data.id, "");
            return { key: `appointment-${ev.data.id}`, completion: c };
          } else if (ev.type === "medication") {
            const c = await getMedCompletions(
              ev.medicationId,
              ev.scheduledTime,
            );
            return {
              key: `medication-${ev.medicationId}-${ev.scheduledTime}`,
              completion: c,
            };
          } else {
            const c = await getExCompletions(ev.exerciseId, ev.scheduledTime);
            return {
              key: `exercise-${ev.exerciseId}-${ev.scheduledTime}`,
              completion: c,
            };
          }
        }),
      );
      if (!cancelled) {
        const map: Record<string, Completion | null> = {};
        results.forEach((r) => {
          map[r.key] = r.completion;
        });
        setCompletions(map);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [allEvents.length]);

  const handleToggle = useCallback(
    async (ev: (typeof allEvents)[0]) => {
      if (ev.type === "appointment") {
        await markAppointmentCompleted(ev.data.id, "");
        const c = await getApptCompletions(ev.data.id, "");
        setCompletions((p) => ({ ...p, [`appointment-${ev.data.id}`]: c }));
      } else if (ev.type === "medication") {
        await markMedicationCompleted(ev.medicationId, ev.scheduledTime);
        const c = await getMedCompletions(ev.medicationId, ev.scheduledTime);
        setCompletions((p) => ({
          ...p,
          [`medication-${ev.medicationId}-${ev.scheduledTime}`]: c,
        }));
      } else {
        await markExerciseCompleted(ev.exerciseId, ev.scheduledTime);
        const c = await getExCompletions(ev.exerciseId, ev.scheduledTime);
        setCompletions((p) => ({
          ...p,
          [`exercise-${ev.exerciseId}-${ev.scheduledTime}`]: c,
        }));
      }
    },
    [
      markAppointmentCompleted,
      markMedicationCompleted,
      markExerciseCompleted,
      getApptCompletions,
      getMedCompletions,
      getExCompletions,
    ],
  );

  const getKey = (ev: (typeof allEvents)[0]) => {
    if (ev.type === "appointment") return `appointment-${ev.data.id}`;
    if (ev.type === "medication")
      return `medication-${ev.medicationId}-${ev.scheduledTime}`;
    return `exercise-${ev.exerciseId}-${ev.scheduledTime}`;
  };

  const typeConfig = {
    appointment: {
      icon: Calendar,
      bg: "bg-blue-100",
      color: "text-blue-700",
      label: (ev: any) => appointmentTypeLabels[ev.data.type] ?? ev.data.type,
    },
    medication: {
      icon: Pill,
      bg: "bg-pink-100",
      color: "text-pink-700",
      label: (ev: any) => ev.data.name,
    },
    exercise: {
      icon: Dumbbell,
      bg: "bg-green-100",
      color: "text-green-700",
      label: (ev: any) => exerciseTypeLabels[ev.data.type] ?? ev.data.type,
    },
  };

  /* Quick-nav buttons */
  const quickNav = [
    {
      label: "Medicamentos",
      icon: Pill,
      bg: "bg-pink-100",
      fg: "text-pink-700",
      action: onNavigateToMedications,
    },
    {
      label: "Agenda",
      icon: Calendar,
      bg: "bg-blue-100",
      fg: "text-blue-700",
      action: onNavigateToCalendar,
    },
    {
      label: "Ejercicios",
      icon: Dumbbell,
      bg: "bg-green-100",
      fg: "text-green-700",
      action: onNavigateToExercises,
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-4">
      {/* Quick access */}
      <div className="grid grid-cols-3 gap-3 px-5 pt-6 pb-2">
        {quickNav.map(({ label, icon: Icon, bg, fg, action }) => (
          <button
            key={label}
            onClick={action}
            className={`${bg} rounded-2xl flex flex-col items-center justify-center gap-1 py-4 active:scale-95 transition-transform`}
          >
            <Icon size={24} className={fg} />
            <span className={`text-xs font-semibold ${fg}`}>{label}</span>
          </button>
        ))}
      </div>

      {/* Events */}
      <div className="px-5 pt-4">
        <h2 className="text-gray-800 font-bold text-base mb-3">
          {allEvents.length === 0
            ? "Sin recordatorios para hoy"
            : `${allEvents.length} recordatorio${allEvents.length !== 1 ? "s" : ""} hoy`}
        </h2>

        {allEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CheckCircle2 size={64} strokeWidth={1.5} />
            <p className="mt-4 text-sm text-center">¡Todo tranquilo por hoy!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {allEvents.map((ev) => {
              const cfg = typeConfig[ev.type];
              const Icon = cfg.icon;
              const key = getKey(ev);
              const isDone = !!completions[key];

              return (
                <div
                  key={ev.id}
                  className={`bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 ${isDone ? "opacity-50" : ""}`}
                >
                  <div
                    className={`w-10 h-10 ${cfg.bg} rounded-xl flex items-center justify-center shrink-0`}
                  >
                    <Icon size={20} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold text-sm text-gray-900 truncate ${isDone ? "line-through" : ""}`}
                    >
                      {cfg.label(ev)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {ev.dogName} · {ev.time}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle(ev)}
                    className="shrink-0 text-gray-400 active:scale-90 transition-transform"
                  >
                    {isDone ? (
                      <CheckCircle2 size={24} className="text-green-500" />
                    ) : (
                      <Circle size={24} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
