import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import type { Medication, Completion } from "../types";
import { supabase, formatLocalDate } from "../utils/supabase";
import { useAuth } from "./AuthContext";

interface MedicationContextType {
  medications: Medication[];
  loading: boolean;
  addMedication: (m: Omit<Medication, "id">) => Promise<void>;
  updateMedication: (id: string, m: Omit<Medication, "id">) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  getMedicationById: (id: string) => Medication | undefined;
  getMedicationsByDogId: (dogId: string) => Medication[];
  getActiveMedications: () => Medication[];
  toggleMedicationActive: (id: string) => Promise<void>;
  markMedicationCompleted: (id: string, scheduledTime: string) => Promise<void>;
  getTodayCompletions: (
    id: string,
    scheduledTime: string,
  ) => Promise<Completion | null>;
}

const MedicationContext = createContext<MedicationContextType | undefined>(
  undefined,
);

function mapMedication(row: any): Medication {
  return {
    id: row.id,
    dogId: row.dog_id,
    dogName: row.dog_name ?? "",
    name: row.name,
    dosage: row.dosage ?? "",
    scheduleType: row.schedule_type ?? "hours",
    frequencyHours: row.frequency_hours ?? undefined,
    startTime: row.start_time ?? undefined,
    mealIds: row.meal_ids ?? undefined,
    durationDays: row.duration_days,
    startDate: new Date(row.start_date),
    scheduledTimes: row.times ?? [],
    endDate: new Date(row.end_date),
    notes: row.notes ?? undefined,
    isActive: row.is_active ?? true,
    notificationTime: row.notification_time ?? "none",
    notificationIds: row.notification_ids ?? [],
  };
}

export function MedicationProvider({ children }: { children: ReactNode }) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) loadMedications();
    else {
      setMedications([]);
      setLoading(false);
    }
  }, [user]);

  const loadMedications = async () => {
    try {
      setLoading(true);
      if (!user) {
        setMedications([]);
        return;
      }
      const { data, error } = await supabase
        .from("medications")
        .select("*, dogs(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setMedications(
        (data ?? []).map((row: any) =>
          mapMedication({ ...row, dog_name: row.dogs?.name }),
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const addMedication = async (m: Omit<Medication, "id">) => {
    if (!user) return;
    const { error } = await supabase.from("medications").insert({
      user_id: user.id,
      dog_id: m.dogId,
      name: m.name,
      dosage: m.dosage,
      schedule_type: m.scheduleType,
      frequency_hours: m.frequencyHours ?? null,
      start_time: m.startTime ?? null,
      meal_ids: m.mealIds ?? null,
      duration_days: m.durationDays,
      start_date: formatLocalDate(m.startDate),
      end_date: formatLocalDate(m.endDate),
      times: m.scheduledTimes,
      notes: m.notes ?? null,
      is_active: m.isActive,
      notification_time: m.notificationTime,
    });
    if (error) throw error;
    await loadMedications();
  };

  const updateMedication = async (id: string, m: Omit<Medication, "id">) => {
    const { error } = await supabase
      .from("medications")
      .update({
        name: m.name,
        dosage: m.dosage,
        schedule_type: m.scheduleType,
        frequency_hours: m.frequencyHours ?? null,
        start_time: m.startTime ?? null,
        meal_ids: m.mealIds ?? null,
        duration_days: m.durationDays,
        start_date: formatLocalDate(m.startDate),
        end_date: formatLocalDate(m.endDate),
        times: m.scheduledTimes,
        notes: m.notes ?? null,
        is_active: m.isActive,
        notification_time: m.notificationTime,
      })
      .eq("id", id);
    if (error) throw error;
    await loadMedications();
  };

  const deleteMedication = async (id: string) => {
    const { error } = await supabase.from("medications").delete().eq("id", id);
    if (error) throw error;
    await loadMedications();
  };

  const getMedicationById = (id: string) =>
    medications.find((m) => m.id === id);
  const getMedicationsByDogId = (dogId: string) =>
    medications.filter((m) => m.dogId === dogId);
  const getActiveMedications = () => medications.filter((m) => m.isActive);

  const toggleMedicationActive = async (id: string) => {
    const med = medications.find((m) => m.id === id);
    if (!med) return;
    await supabase
      .from("medications")
      .update({ is_active: !med.isActive })
      .eq("id", id);
    await loadMedications();
  };

  const markMedicationCompleted = async (id: string, scheduledTime: string) => {
    if (!user) return;
    await supabase.from("completions").upsert({
      user_id: user.id,
      item_type: "medication",
      item_id: id,
      scheduled_time: scheduledTime || null,
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
        .eq("item_type", "medication")
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
    <MedicationContext.Provider
      value={{
        medications,
        loading,
        addMedication,
        updateMedication,
        deleteMedication,
        getMedicationById,
        getMedicationsByDogId,
        getActiveMedications,
        toggleMedicationActive,
        markMedicationCompleted,
        getTodayCompletions,
      }}
    >
      {children}
    </MedicationContext.Provider>
  );
}

export function useMedication() {
  const ctx = useContext(MedicationContext);
  if (!ctx)
    throw new Error("useMedication must be used within MedicationProvider");
  return ctx;
}
