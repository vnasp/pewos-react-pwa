import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { MealTime } from "../types";
import { supabase } from "../utils/supabase";
import { useAuth } from "./AuthContext";

interface MealTimesContextType {
  mealTimes: MealTime[];
  loading: boolean;
  addMealTime: (m: Omit<MealTime, "id" | "userId">) => Promise<void>;
  updateMealTime: (
    id: string,
    m: Omit<MealTime, "id" | "userId">,
  ) => Promise<void>;
  deleteMealTime: (id: string) => Promise<void>;
  getMealTimeById: (id: string) => MealTime | undefined;
  reorderMealTimes: (reordered: MealTime[]) => Promise<void>;
}

const MealTimesContext = createContext<MealTimesContextType | undefined>(
  undefined,
);

export function MealTimesProvider({ children }: { children: ReactNode }) {
  const [mealTimes, setMealTimes] = useState<MealTime[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) loadMealTimes();
    else {
      setMealTimes([]);
      setLoading(false);
    }
  }, [user]);

  const loadMealTimes = async () => {
    try {
      setLoading(true);
      if (!user) {
        setMealTimes([]);
        return;
      }
      const { data, error } = await supabase
        .from("meal_times")
        .select("*")
        .eq("user_id", user.id)
        .order("order_index", { ascending: true });
      if (error) throw error;
      setMealTimes(
        (data ?? []).map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          name: row.name,
          time: row.time,
          order: row.order_index,
        })),
      );
    } finally {
      setLoading(false);
    }
  };

  const addMealTime = async (m: Omit<MealTime, "id" | "userId">) => {
    if (!user) return;
    const { error } = await supabase.from("meal_times").insert({
      user_id: user.id,
      name: m.name,
      time: m.time,
      order_index: m.order,
    });
    if (error) throw error;
    await loadMealTimes();
  };

  const updateMealTime = async (
    id: string,
    m: Omit<MealTime, "id" | "userId">,
  ) => {
    const { error } = await supabase
      .from("meal_times")
      .update({ name: m.name, time: m.time, order_index: m.order })
      .eq("id", id);
    if (error) throw error;
    await loadMealTimes();
  };

  const deleteMealTime = async (id: string) => {
    const { error } = await supabase.from("meal_times").delete().eq("id", id);
    if (error) throw error;
    await loadMealTimes();
  };

  const getMealTimeById = (id: string) => mealTimes.find((m) => m.id === id);

  const reorderMealTimes = async (reordered: MealTime[]) => {
    await Promise.all(
      reordered.map((m, i) =>
        supabase
          .from("meal_times")
          .update({ order_index: i + 1 })
          .eq("id", m.id),
      ),
    );
    await loadMealTimes();
  };

  return (
    <MealTimesContext.Provider
      value={{
        mealTimes,
        loading,
        addMealTime,
        updateMealTime,
        deleteMealTime,
        getMealTimeById,
        reorderMealTimes,
      }}
    >
      {children}
    </MealTimesContext.Provider>
  );
}

export function useMealTimes() {
  const ctx = useContext(MealTimesContext);
  if (!ctx)
    throw new Error("useMealTimes must be used within MealTimesProvider");
  return ctx;
}
