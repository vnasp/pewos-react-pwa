import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import type { Appointment, Completion } from "../types";
import { supabase, formatLocalDate } from "../utils/supabase";
import { useAuth } from "./AuthContext";

export const appointmentTypeLabels: Record<string, string> = {
  control: "Control",
  examenes: "Exámenes",
  operacion: "Operación",
  fisioterapia: "Fisioterapia",
  vacuna: "Vacuna",
  desparasitacion: "Desparasitación",
  otro: "Otro",
};

export const appointmentTypeColors: Record<string, string> = {
  control: "bg-blue-100",
  examenes: "bg-amber-100",
  operacion: "bg-red-100",
  fisioterapia: "bg-green-100",
  vacuna: "bg-indigo-100",
  desparasitacion: "bg-purple-100",
  otro: "bg-gray-100",
};

export const recurrenceLabels: Record<string, string> = {
  daily: "Diario",
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
  none: "Sin recurrencia",
};

interface CalendarContextType {
  appointments: Appointment[];
  loading: boolean;
  addAppointment: (a: Omit<Appointment, "id">) => Promise<void>;
  updateAppointment: (id: string, a: Omit<Appointment, "id">) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  getAppointmentById: (id: string) => Appointment | undefined;
  getAppointmentsByDogId: (dogId: string) => Appointment[];
  getUpcomingAppointments: () => Appointment[];
  markAppointmentCompleted: (
    id: string,
    scheduledTime: string,
  ) => Promise<void>;
  getTodayCompletions: (
    id: string,
    scheduledTime: string,
  ) => Promise<Completion | null>;
}

const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined,
);

function mapAppointment(row: any): Appointment {
  return {
    id: row.id,
    dogId: row.dog_id,
    dogName: row.dog_name ?? "",
    date: new Date(row.date),
    time: row.time,
    type: row.type,
    customTypeDescription: row.custom_type_description ?? undefined,
    notes: row.notes ?? undefined,
    notificationTime: row.notification_time ?? "none",
    recurrencePattern: row.recurrence_pattern ?? undefined,
    recurrenceEndDate: row.recurrence_end_date
      ? new Date(row.recurrence_end_date)
      : undefined,
    recurrenceParentId: row.recurrence_parent_id ?? undefined,
  };
}

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) loadAppointments();
    else {
      setAppointments([]);
      setLoading(false);
    }
  }, [user]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      if (!user) {
        setAppointments([]);
        return;
      }

      const { data, error } = await supabase
        .from("appointments")
        .select("*, dogs(name)")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (error) throw error;
      setAppointments(
        (data ?? []).map((row: any) =>
          mapAppointment({ ...row, dog_name: row.dogs?.name }),
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const addAppointment = async (a: Omit<Appointment, "id">) => {
    if (!user) return;
    const { error } = await supabase.from("appointments").insert({
      user_id: user.id,
      dog_id: a.dogId,
      type: a.type,
      title: appointmentTypeLabels[a.type] ?? a.type,
      date: formatLocalDate(a.date),
      time: a.time,
      notes: a.notes ?? null,
      notification_time: a.notificationTime,
      custom_type_description: a.customTypeDescription ?? null,
      recurrence_pattern: a.recurrencePattern ?? "none",
      recurrence_end_date: a.recurrenceEndDate
        ? formatLocalDate(a.recurrenceEndDate)
        : null,
    });
    if (error) throw error;
    await loadAppointments();
  };

  const updateAppointment = async (id: string, a: Omit<Appointment, "id">) => {
    const { error } = await supabase
      .from("appointments")
      .update({
        dog_id: a.dogId,
        type: a.type,
        title: appointmentTypeLabels[a.type] ?? a.type,
        date: formatLocalDate(a.date),
        time: a.time,
        notes: a.notes ?? null,
        notification_time: a.notificationTime,
        custom_type_description: a.customTypeDescription ?? null,
        recurrence_pattern: a.recurrencePattern ?? "none",
        recurrence_end_date: a.recurrenceEndDate
          ? formatLocalDate(a.recurrenceEndDate)
          : null,
      })
      .eq("id", id);
    if (error) throw error;
    await loadAppointments();
  };

  const deleteAppointment = async (id: string) => {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) throw error;
    await loadAppointments();
  };

  const getAppointmentById = (id: string) =>
    appointments.find((a) => a.id === id);
  const getAppointmentsByDogId = (dogId: string) =>
    appointments.filter((a) => a.dogId === dogId);
  const getUpcomingAppointments = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return appointments.filter((a) => new Date(a.date) >= now);
  };

  const markAppointmentCompleted = async (
    id: string,
    scheduledTime: string,
  ) => {
    if (!user) return;
    await supabase.from("completions").upsert({
      user_id: user.id,
      item_type: "appointment",
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
        .eq("item_type", "appointment")
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
    <CalendarContext.Provider
      value={{
        appointments,
        loading,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        getAppointmentById,
        getAppointmentsByDogId,
        getUpcomingAppointments,
        markAppointmentCompleted,
        getTodayCompletions,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error("useCalendar must be used within CalendarProvider");
  return ctx;
}
