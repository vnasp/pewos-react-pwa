import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { Dog } from "../types";
import { supabase } from "../utils/supabase";
import { useAuth } from "./AuthContext";

interface DogsContextType {
  dogs: Dog[];
  loading: boolean;
  addDog: (dog: Omit<Dog, "id">) => Promise<void>;
  updateDog: (id: string, dog: Omit<Dog, "id">) => Promise<void>;
  deleteDog: (id: string) => Promise<void>;
  getDogById: (id: string) => Dog | undefined;
}

const DogsContext = createContext<DogsContextType | undefined>(undefined);

function mapDog(row: any): Dog {
  return {
    id: row.id,
    name: row.name,
    photo: row.photo_uri ?? undefined,
    breed: row.breed ?? "",
    birthDate: new Date(row.birth_date),
    gender: row.gender,
    isNeutered: row.neutered ?? false,
  };
}

export function DogsProvider({ children }: { children: ReactNode }) {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) loadDogs();
    else {
      setDogs([]);
      setLoading(false);
    }
  }, [user]);

  const loadDogs = async () => {
    try {
      setLoading(true);
      if (!user) {
        setDogs([]);
        return;
      }

      const { data: sharedAccess } = await supabase
        .from("shared_access")
        .select("owner_id")
        .eq("shared_with_email", user.email)
        .eq("status", "accepted");

      const sharedOwnerIds = (sharedAccess ?? []).map((s: any) => s.owner_id);
      let query = supabase.from("dogs").select("*");

      if (sharedOwnerIds.length > 0) {
        query = query.or(
          `user_id.eq.${user.id},user_id.in.(${sharedOwnerIds.join(",")})`,
        );
      } else {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query.order("created_at", {
        ascending: true,
      });
      if (error) throw error;
      setDogs((data ?? []).map(mapDog));
    } finally {
      setLoading(false);
    }
  };

  const addDog = async (dog: Omit<Dog, "id">) => {
    if (!user) return;
    const { error } = await supabase.from("dogs").insert({
      user_id: user.id,
      name: dog.name,
      breed: dog.breed,
      birth_date: dog.birthDate.toISOString().split("T")[0],
      gender: dog.gender,
      neutered: dog.isNeutered,
      photo_uri: dog.photo ?? null,
    });
    if (error) throw error;
    await loadDogs();
  };

  const updateDog = async (id: string, dog: Omit<Dog, "id">) => {
    const { error } = await supabase
      .from("dogs")
      .update({
        name: dog.name,
        breed: dog.breed,
        birth_date: dog.birthDate.toISOString().split("T")[0],
        gender: dog.gender,
        neutered: dog.isNeutered,
        photo_uri: dog.photo ?? null,
      })
      .eq("id", id);
    if (error) throw error;
    await loadDogs();
  };

  const deleteDog = async (id: string) => {
    const { error } = await supabase.from("dogs").delete().eq("id", id);
    if (error) throw error;
    await loadDogs();
  };

  const getDogById = (id: string) => dogs.find((d) => d.id === id);

  return (
    <DogsContext.Provider
      value={{ dogs, loading, addDog, updateDog, deleteDog, getDogById }}
    >
      {children}
    </DogsContext.Provider>
  );
}

export function useDogs() {
  const ctx = useContext(DogsContext);
  if (!ctx) throw new Error("useDogs must be used within DogsProvider");
  return ctx;
}
