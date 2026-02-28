import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import type { Exercise, Completion } from "../types";
import { supabase, formatLocalDate, parseLocalDate } from "../utils/supabase";
import { useAuth } from "./AuthContext";

export const exerciseTypeLabels: Record<string, string> = {
  caminata: "Caminata",
  cavaletti: "Cavaletti",
  balanceo: "Balanceo",
  slalom: "Slalom",
  entrenamiento: "Entrenamiento",
  otro: "Otro",
};

export const exerciseTypeColors: Record<string, string> = {
  caminata: "bg-green-100",
  cavaletti: "bg-blue-100",
  balanceo: "bg-amber-100",
  slalom: "bg-purple-100",
  entrenamiento: "bg-orange-100",
  otro: "bg-gray-100",
};

interface ExerciseContextType {
  exercises: Exercise[];
  loading: boolean;
  addExercise: (e: Omit<Exercise, "id">) => Promise<void>;
  updateExercise: (id: string, e: Omit<Exercise, "id">) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  getExerciseById: (id: string) => Exercise | undefined;
  getExercisesByDogId: (dogId: string) => Exercise[];
  toggleExerciseActive: (id: string) => Promise<void>;
  markExerciseCompleted: (id: string, scheduledTime: string) => Promise<void>;
  getTodayCompletions: (
    id: string,
    scheduledTime: string,
  ) => Promise<Completion | null>;
}

const ExerciseContext = createContext<ExerciseContextType | undefined>(
  undefined,
);

/** Calcula horarios distribuidos entre startTime y endTime */
export function calculateScheduledTimes(
  startTime: string,
  endTime: string,
  timesPerDay: number,
): string[] {
  if (!startTime || !endTime || timesPerDay < 1) return [];
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  if (endMin <= startMin || timesPerDay === 0) return [];
  const interval = (endMin - startMin) / (timesPerDay - 1 || 1);
  return Array.from({ length: timesPerDay }, (_, i) => {
    const total = Math.round(startMin + interval * i);
    const h = Math.floor(total / 60) % 24;
    const m = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  });
}

function mapExercise(row: any): Exercise {
  return {
    id: row.id,
    dogId: row.dog_id,
    dogName: row.dog_name ?? "",
    type: row.type,
    customTypeDescription: row.custom_type_description ?? undefined,
    durationMinutes: row.duration_minutes ?? 0,
    timesPerDay: row.times_per_day,
    startTime: row.start_time,
    endTime: row.end_time,
    scheduledTimes: row.scheduled_times ?? [],
    startDate: parseLocalDate(row.start_date),
    isPermanent: row.is_permanent ?? true,
    durationWeeks: row.duration_weeks ?? undefined,
    endDate: row.end_date ? parseLocalDate(row.end_date) : undefined,
    notes: row.notes ?? undefined,
    isActive: row.is_active ?? true,
    notificationTime: row.notification_time ?? "none",
    notificationIds: row.notification_ids ?? [],
  };
}

export function ExerciseProvider({ children }: { children: ReactNode }) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) loadExercises();
    else {
      setExercises([]);
      setLoading(false);
    }
  }, [user]);

  const loadExercises = async () => {
    try {
      setLoading(true);
      if (!user) {
        setExercises([]);
        return;
      }
      const { data, error } = await supabase
        .from("exercises")
        .select("*, dogs(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setExercises(
        (data ?? []).map((row: any) =>
          mapExercise({ ...row, dog_name: row.dogs?.name }),
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const addExercise = async (e: Omit<Exercise, "id">) => {
    if (!user) return;
    const { error } = await supabase.from("exercises").insert({
      user_id: user.id,
      dog_id: e.dogId,
      type: e.type,
      custom_type_description: e.customTypeDescription ?? null,
      duration_minutes: e.durationMinutes,
      times_per_day: e.timesPerDay,
      start_time: e.startTime,
      end_time: e.endTime,
      scheduled_times: e.scheduledTimes,
      start_date: formatLocalDate(e.startDate),
      is_permanent: e.isPermanent,
      duration_weeks: e.durationWeeks ?? null,
      end_date: e.endDate ? formatLocalDate(e.endDate) : null,
      notes: e.notes ?? null,
      is_active: e.isActive,
      notification_time: e.notificationTime,
    });
    if (error) throw error;
    await loadExercises();
  };

  const updateExercise = async (id: string, e: Omit<Exercise, "id">) => {
    if (!user) return;
    const { error } = await supabase
      .from("exercises")
      .update({
        dog_id: e.dogId,
        type: e.type,
        custom_type_description: e.customTypeDescription ?? null,
        duration_minutes: e.durationMinutes,
        times_per_day: e.timesPerDay,
        start_time: e.startTime,
        end_time: e.endTime,
        scheduled_times: e.scheduledTimes,
        start_date: formatLocalDate(e.startDate),
        is_permanent: e.isPermanent,
        duration_weeks: e.durationWeeks ?? null,
        end_date: e.endDate ? formatLocalDate(e.endDate) : null,
        notes: e.notes ?? null,
        is_active: e.isActive,
        notification_time: e.notificationTime,
      })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    await loadExercises();
  };

  const deleteExercise = async (id: string) => {
    const { error } = await supabase.from("exercises").delete().eq("id", id);
    if (error) throw error;
    await loadExercises();
  };

  const getExerciseById = (id: string) => exercises.find((e) => e.id === id);
  const getExercisesByDogId = (dogId: string) =>
    exercises.filter((e) => e.dogId === dogId);

  const toggleExerciseActive = async (id: string) => {
    const ex = exercises.find((e) => e.id === id);
    if (!ex) return;
    await supabase
      .from("exercises")
      .update({ is_active: !ex.isActive })
      .eq("id", id);
    await loadExercises();
  };

  const markExerciseCompleted = async (id: string, scheduledTime: string) => {
    if (!user) return;
    await supabase.from("completions").upsert({
      user_id: user.id,
      item_type: "exercise",
      item_id: id,
      scheduled_time: scheduledTime || "",
      completed_date: formatLocalDate(new Date()),
    });
  };

  const getTodayCompletions = useCallback(
    async (id: string, scheduledTime: string): Promise<Completion | null> => {
      if (!user) return null;
      const today = formatLocalDate(new Date());
      const { data } = await supabase
        .from("completions")
        .select("*")
        .eq("item_id", id)
        .eq("item_type", "exercise")
        .eq("completed_date", today)
        .eq("scheduled_time", scheduledTime || "")
        .maybeSingle();
      if (!data) return null;
      return {
        id: data.id,
        userId: data.user_id,
        itemType: data.item_type,
        itemId: data.item_id,
        scheduledTime: data.scheduled_time ?? undefined,
        completedDate: data.completed_date,
        completedAt: new Date(data.completed_at),
      };
    },
    [user],
  );

  return (
    <ExerciseContext.Provider
      value={{
        exercises,
        loading,
        addExercise,
        updateExercise,
        deleteExercise,
        getExerciseById,
        getExercisesByDogId,
        toggleExerciseActive,
        markExerciseCompleted,
        getTodayCompletions,
      }}
    >
      {children}
    </ExerciseContext.Provider>
  );
}

export function useExercise() {
  const ctx = useContext(ExerciseContext);
  if (!ctx) throw new Error("useExercise must be used within ExerciseProvider");
  return ctx;
}
