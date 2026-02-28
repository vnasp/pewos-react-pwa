import { useState, useEffect, useMemo, useCallback } from "react";
import { useCalendar } from "../context/CalendarContext";
import { useMedication } from "../context/MedicationContext";
import { useExercise } from "../context/ExerciseContext";
import { useCare } from "../context/CareContext";
import { useDogs } from "../context/DogsContext";
import QuickAccess from "../components/home/QuickAccess";
import DogFilterTabs from "../components/home/DogFilterTabs";
import EventsList from "../components/home/EventsList";
import type { HomeEvent } from "../components/home/types";
import type { Completion } from "../types";

interface HomeScreenProps {
  onNavigateToMedications: () => void;
  onNavigateToCalendar: () => void;
  onNavigateToExercises: () => void;
  onNavigateToCares: () => void;
}

export default function HomeScreen({
  onNavigateToMedications,
  onNavigateToCalendar,
  onNavigateToExercises,
  onNavigateToCares,
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
  const {
    cares,
    markCareCompleted,
    getTodayCompletions: getCareCompletions,
  } = useCare();
  const { dogs } = useDogs();
  const [completions, setCompletions] = useState<
    Record<string, Completion | null>
  >({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null);

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
    const nowTs = now.getTime();
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    return medications
      .filter((m) => {
        if (!m.isActive) return false;
        // No mostrar si la fecha de inicio es futura
        const start = new Date(m.startDate);
        start.setHours(0, 0, 0, 0);
        if (start.getTime() > nowTs) return false;
        if (m.durationDays === 0) return true;
        const end = new Date(m.endDate);
        end.setHours(0, 0, 0, 0);
        if (end.getTime() < nowTs) return false;
        // Para medicamentos con intervalo > 24h verificar si hoy toca
        if (m.frequencyHours && m.frequencyHours > 24) {
          const daysSinceStart = Math.round(
            (nowTs - start.getTime()) / MS_PER_DAY,
          );
          const intervalDays = Math.round(m.frequencyHours / 24);
          if (daysSinceStart % intervalDays !== 0) return false;
        }
        return true;
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
        // No mostrar si la fecha de inicio es futura
        const start = new Date(e.startDate);
        start.setHours(0, 0, 0, 0);
        if (start.getTime() > now.getTime()) return false;
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

  const todayCares = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return cares
      .filter((c) => {
        if (!c.isActive) return false;
        // No mostrar si la fecha de inicio es futura
        const start = new Date(c.startDate);
        start.setHours(0, 0, 0, 0);
        if (start.getTime() > now.getTime()) return false;
        if (c.isPermanent) return true;
        if (c.endDate) {
          const end = new Date(c.endDate);
          end.setHours(0, 0, 0, 0);
          return end.getTime() >= now.getTime();
        }
        return true;
      })
      .flatMap((c) =>
        c.scheduledTimes.map((time) => ({
          type: "care" as const,
          id: `${c.id}-${time}`,
          dogName: c.dogName,
          time,
          careId: c.id,
          scheduledTime: time,
          data: c,
        })),
      );
  }, [cares]);

  const allEvents = useMemo(
    () =>
      [
        ...todayAppointments,
        ...todayMedications,
        ...todayExercises,
        ...todayCares,
      ].sort((a, b) => a.time.localeCompare(b.time)),
    [todayAppointments, todayMedications, todayExercises, todayCares],
  );

  const filteredEvents = useMemo(
    () =>
      selectedDogId
        ? allEvents.filter((ev) => ev.data.dogId === selectedDogId)
        : allEvents,
    [allEvents, selectedDogId],
  );

  // Conteo de recordatorios por perro para las pestañas
  const countByDog = useMemo(() => {
    const map: Record<string, number> = {};
    allEvents.forEach((ev) => {
      map[ev.data.dogId] = (map[ev.data.dogId] ?? 0) + 1;
    });
    return map;
  }, [allEvents]);

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
          } else if (ev.type === "care") {
            const c = await getCareCompletions(ev.careId, ev.scheduledTime);
            return {
              key: `care-${ev.careId}-${ev.scheduledTime}`,
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
    async (ev: HomeEvent) => {
      // Prevenir clicks múltiples simultáneos
      if (isProcessing) return;
      setIsProcessing(true);

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
      } else if (ev.type === "care") {
        await markCareCompleted(ev.careId, ev.scheduledTime);
        const c = await getCareCompletions(ev.careId, ev.scheduledTime);
        setCompletions((p) => ({
          ...p,
          [`care-${ev.careId}-${ev.scheduledTime}`]: c,
        }));
      } else {
        await markExerciseCompleted(ev.exerciseId, ev.scheduledTime);
        const c = await getExCompletions(ev.exerciseId, ev.scheduledTime);
        setCompletions((p) => ({
          ...p,
          [`exercise-${ev.exerciseId}-${ev.scheduledTime}`]: c,
        }));
      }

      setIsProcessing(false);
    },
    [
      isProcessing,
      markAppointmentCompleted,
      markMedicationCompleted,
      markExerciseCompleted,
      markCareCompleted,
      getApptCompletions,
      getMedCompletions,
      getExCompletions,
      getCareCompletions,
    ],
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-4">
      <QuickAccess
        onNavigateToMedications={onNavigateToMedications}
        onNavigateToCalendar={onNavigateToCalendar}
        onNavigateToExercises={onNavigateToExercises}
        onNavigateToCares={onNavigateToCares}
      />
      <DogFilterTabs
        dogs={dogs}
        selectedDogId={selectedDogId}
        onSelect={setSelectedDogId}
        totalCount={allEvents.length}
        countByDog={countByDog}
      />
      <EventsList
        events={filteredEvents}
        completions={completions}
        selectedDogId={selectedDogId}
        dogs={dogs}
        onToggle={handleToggle}
      />
    </div>
  );
}
