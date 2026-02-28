import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { supabase } from "../utils/supabase";
import { useAuth } from "./AuthContext";
import type { Veterinarian } from "../types";

interface VeterinariansContextValue {
  veterinarians: Veterinarian[];
  loading: boolean;
  addVeterinarian: (data: Omit<Veterinarian, "id" | "userId">) => Promise<void>;
  updateVeterinarian: (
    id: string,
    data: Omit<Veterinarian, "id" | "userId">,
  ) => Promise<void>;
  deleteVeterinarian: (id: string) => Promise<void>;
  getVeterinarianById: (id: string) => Veterinarian | undefined;
}

const VeterinariansContext = createContext<
  VeterinariansContextValue | undefined
>(undefined);

export function useVeterinarians() {
  const ctx = useContext(VeterinariansContext);
  if (!ctx)
    throw new Error(
      "useVeterinarians must be used within VeterinariansProvider",
    );
  return ctx;
}

interface Props {
  children: ReactNode;
}

export function VeterinariansProvider({ children }: Props) {
  const { user } = useAuth();
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVeterinarians = async () => {
    if (!user) {
      setVeterinarians([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("veterinarians")
        .select("*")
        .eq("user_id", user.id)
        .order("dog_name", { ascending: true });

      if (error) throw error;
      setVeterinarians(
        (data ?? []).map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          dogId: row.dog_id,
          dogName: row.dog_name,
          name: row.name,
          clinicName: row.clinic_name,
          phone: row.phone,
          email: row.email,
          address: row.address,
          notes: row.notes,
        })),
      );
    } catch (err) {
      console.error("Error loading veterinarians:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVeterinarians();
  }, [user?.id]);

  const addVeterinarian = async (data: Omit<Veterinarian, "id" | "userId">) => {
    if (!user) return;
    const { error } = await supabase.from("veterinarians").insert({
      user_id: user.id,
      dog_id: data.dogId,
      dog_name: data.dogName,
      name: data.name,
      clinic_name: data.clinicName,
      phone: data.phone,
      email: data.email,
      address: data.address,
      notes: data.notes,
    });
    if (error) throw error;
    await loadVeterinarians();
  };

  const updateVeterinarian = async (
    id: string,
    data: Omit<Veterinarian, "id" | "userId">,
  ) => {
    if (!user) return;
    const { error } = await supabase
      .from("veterinarians")
      .update({
        dog_id: data.dogId,
        dog_name: data.dogName,
        name: data.name,
        clinic_name: data.clinicName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        notes: data.notes,
      })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    await loadVeterinarians();
  };

  const deleteVeterinarian = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("veterinarians")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    await loadVeterinarians();
  };

  const getVeterinarianById = (id: string) =>
    veterinarians.find((v) => v.id === id);

  return (
    <VeterinariansContext.Provider
      value={{
        veterinarians,
        loading,
        addVeterinarian,
        updateVeterinarian,
        deleteVeterinarian,
        getVeterinarianById,
      }}
    >
      {children}
    </VeterinariansContext.Provider>
  );
}
