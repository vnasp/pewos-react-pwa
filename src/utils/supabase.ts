import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Devuelve la fecha en formato YYYY-MM-DD usando la hora local (sin UTC shift) */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Parsea "YYYY-MM-DD" como mediodía local para evitar el UTC-shift que
 * convierte new Date("2026-02-23") en el día anterior en zonas GMT-X.
 */
export function parseLocalDate(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`);
}
