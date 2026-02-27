import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import type { Care, Completion } from "../types";
import { supabase, formatLocalDate, parseLocalDate } from "../utils/supabase";
import { useAuth } from "./AuthContext";

export const careTypeLabels: Record<string, string> = {
  limpieza_herida: "Limpiar herida",
  frio: "Aplicar frío",
  calor: "Aplicar calor",
  infrarrojo: "Luz infrarroja",
  laser: "Láser",
  otro: "Otro",
};

export const careTypeColors: Record<string, string> = {
  limpieza_herida: "bg-red-100",
  frio: "bg-blue-100",
  calor: "bg-orange-100",
  infrarrojo: "bg-amber-100",
  laser: "bg-purple-100",
  otro: "bg-gray-100",
};

interface CareContextType {
  cares: Care[];
  loading: boolean;
  addCare: (c: Omit<Care, "id">) => Promise<void>;
  updateCare: (id: string, c: Omit<Care, "id">) => Promise<void>;
  deleteCare: (id: string) => Promise<void>;
  getCareById: (id: string) => Care | undefined;
  getCaresByDogId: (dogId: string) => Care[];
  toggleCareActive: (id: string) => Promise<void>;
  markCareCompleted: (id: string, scheduledTime: string) => Promise<void>;
  getTodayCompletions: (
    id: string,
    scheduledTime: string,
  ) => Promise<Completion | null>;
}

const CareContext = createContext<CareContextType | undefined>(undefined);

function mapCare(row: any): Care {
  return {
    id: row.id,
    dogId: row.dog_id,
    dogName: row.dog_name ?? "",
    type: row.type,
    customTypeDescription: row.custom_type_description ?? undefined,
    durationMinutes: row.duration_minutes ?? 0,
    timesPerDay: row.times_per_day ?? 1,
    startTime: row.start_time,
    endTime: row.end_time,
    scheduledTimes: row.scheduled_times ?? [],
    startDate: parseLocalDate(row.start_date),
    isPermanent: row.is_permanent ?? true,
    durationDays: row.duration_days ?? undefined,
    endDate: row.end_date ? parseLocalDate(row.end_date) : undefined,
    notes: row.notes ?? undefined,
    isActive: row.is_active ?? true,
    notificationTime: row.notification_time ?? "none",
  };
}

export function CareProvider({ children }: { children: ReactNode }) {
  const [cares, setCares] = useState<Care[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) loadCares();
    else {
      setCares([]);
      setLoading(false);
    }
  }, [user]);

  const loadCares = async () => {
    try {
      setLoading(true);
      if (!user) {
        setCares([]);
        return;
      }
      const { data, error } = await supabase
        .from("cares")
        .select("*, dogs(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCares(
        (data ?? []).map((row: any) =>
          mapCare({ ...row, dog_name: row.dogs?.name }),
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const addCare = async (c: Omit<Care, "id">) => {
    if (!user) return;
    const { error } = await supabase.from("cares").insert({
      user_id: user.id,
      dog_id: c.dogId,
      type: c.type,
      custom_type_description: c.customTypeDescription ?? null,
      duration_minutes: c.durationMinutes,
      times_per_day: c.timesPerDay,
      start_time: c.startTime,
      end_time: c.endTime,
      scheduled_times: c.scheduledTimes,
      start_date: formatLocalDate(c.startDate),
      is_permanent: c.isPermanent,
      duration_days: c.durationDays ?? null,
      end_date: c.endDate ? formatLocalDate(c.endDate) : null,
      notes: c.notes ?? null,
      is_active: c.isActive,
      notification_time: c.notificationTime,
    });
    if (error) throw error;
    await loadCares();
  };

  const updateCare = async (id: string, c: Omit<Care, "id">) => {
    if (!user) return;
    const { error } = await supabase
      .from("cares")
      .update({
        dog_id: c.dogId,
        type: c.type,
        custom_type_description: c.customTypeDescription ?? null,
        duration_minutes: c.durationMinutes,
        times_per_day: c.timesPerDay,
        start_time: c.startTime,
        end_time: c.endTime,
        scheduled_times: c.scheduledTimes,
        start_date: formatLocalDate(c.startDate),
        is_permanent: c.isPermanent,
        duration_days: c.durationDays ?? null,
        end_date: c.endDate ? formatLocalDate(c.endDate) : null,
        notes: c.notes ?? null,
        is_active: c.isActive,
        notification_time: c.notificationTime,
      })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    await loadCares();
  };

  const deleteCare = async (id: string) => {
    const { error } = await supabase.from("cares").delete().eq("id", id);
    if (error) throw error;
    await loadCares();
  };

  const getCareById = (id: string) => cares.find((c) => c.id === id);
  const getCaresByDogId = (dogId: string) =>
    cares.filter((c) => c.dogId === dogId);

  const toggleCareActive = async (id: string) => {
    const care = cares.find((c) => c.id === id);
    if (!care) return;
    await supabase
      .from("cares")
      .update({ is_active: !care.isActive })
      .eq("id", id);
    await loadCares();
  };

  const markCareCompleted = async (id: string, scheduledTime: string) => {
    if (!user) return;
    await supabase.from("completions").upsert({
      user_id: user.id,
      item_type: "care",
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
        .eq("item_type", "care")
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
    <CareContext.Provider
      value={{
        cares,
        loading,
        addCare,
        updateCare,
        deleteCare,
        getCareById,
        getCaresByDogId,
        toggleCareActive,
        markCareCompleted,
        getTodayCompletions,
      }}
    >
      {children}
    </CareContext.Provider>
  );
}

export function useCare() {
  const ctx = useContext(CareContext);
  if (!ctx) throw new Error("useCare must be used within CareProvider");
  return ctx;
}
