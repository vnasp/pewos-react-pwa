import { useState, useMemo, useCallback } from "react";
import type { Appointment } from "../types";
import {
  Calendar,
  Dog,
  List,
  CalendarDays,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useCalendar } from "../context/CalendarContext";
import { useDogs } from "../context/DogsContext";
import CalendarMonthView from "../components/calendar/CalendarMonthView";
import AppointmentCard from "../components/calendar/AppointmentCard";

interface CalendarListScreenProps {
  onNavigateToAddEdit: (appointmentId?: string) => void;
}

type Filter = "upcoming" | "past" | "all";
type ViewMode = "list" | "calendar";

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Extrae el ID base de una ocurrencia virtual (p.ej. "abc__2026-03-06" → "abc") */
function baseId(id: string): string {
  return id.includes("__") ? id.split("__")[0] : id;
}

/**
 * Expande las citas recurrentes en ocurrencias individuales dentro del rango
 * [rangeStart, rangeEnd]. Las ocurrencias virtuales tienen id = "<baseId>__<YYYY-MM-DD>".
 */
function expandAppointments(
  baseAppointments: Appointment[],
  rangeStart: Date,
  rangeEnd: Date,
): Appointment[] {
  const result: Appointment[] = [];
  for (const apt of baseAppointments) {
    if (!apt.recurrencePattern || apt.recurrencePattern === "none") {
      result.push(apt);
      continue;
    }
    const effectiveEnd = apt.recurrenceEndDate
      ? new Date(Math.min(apt.recurrenceEndDate.getTime(), rangeEnd.getTime()))
      : rangeEnd;

    const current = new Date(apt.date);
    current.setHours(0, 0, 0, 0);

    for (let i = 0; i < 1000; i++) {
      if (current > effectiveEnd) break;
      const occDate = new Date(current);
      if (occDate >= rangeStart) {
        result.push({
          ...apt,
          date: occDate,
          id: i === 0 ? apt.id : `${apt.id}__${dateKey(occDate)}`,
        });
      }
      if (apt.recurrencePattern === "daily") {
        current.setDate(current.getDate() + 1);
      } else if (apt.recurrencePattern === "weekly") {
        current.setDate(current.getDate() + 7);
      } else if (apt.recurrencePattern === "biweekly") {
        current.setDate(current.getDate() + 14);
      } else if (apt.recurrencePattern === "monthly") {
        current.setMonth(current.getMonth() + 1);
      } else {
        break;
      }
    }
  }
  return result;
}

export default function CalendarListScreen({
  onNavigateToAddEdit,
}: CalendarListScreenProps) {
  const { appointments, deleteAppointment } = useCalendar();
  const { dogs } = useDogs();

  // Expande las recurrencias en un rango de ±6/+12 meses
  const expandedAppointments = useMemo(() => {
    const rangeStart = new Date();
    rangeStart.setMonth(rangeStart.getMonth() - 6);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date();
    rangeEnd.setMonth(rangeEnd.getMonth() + 12);
    rangeEnd.setHours(23, 59, 59, 999);
    return expandAppointments(appointments, rangeStart, rangeEnd);
  }, [appointments]);

  const [filter, setFilter] = useState<Filter>("upcoming");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Mes actual como clave (YYYY-MM) → expandido por defecto
  const currentMonthKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);
  const [openMonths, setOpenMonths] = useState<Set<string>>(
    () => new Set([currentMonthKey]),
  );
  const toggleMonth = useCallback((key: string) => {
    setOpenMonths((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const [selectedCalDate, setSelectedCalDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const selectedDayAppointments = useMemo(() => {
    if (!selectedCalDate) return [];
    return [...expandedAppointments]
      .filter((a) => {
        const d = new Date(a.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === selectedCalDate.getTime();
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [expandedAppointments, selectedCalDate]);

  // Agrupación por mes para la vista "próximas"
  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar esta cita?"))
      await deleteAppointment(id);
  };

  const filtered = (() => {
    const todayTs = (() => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })();
    const sorted = [...expandedAppointments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    if (filter === "upcoming")
      return sorted.filter((a) => {
        const d = new Date(a.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() >= todayTs;
      });
    if (filter === "past")
      return sorted
        .filter((a) => {
          const d = new Date(a.date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() < todayTs;
        })
        .reverse();
    return sorted;
  })();

  const groupedUpcoming = useMemo(() => {
    if (filter !== "upcoming") return [];
    const groups: { key: string; label: string; items: typeof filtered }[] = [];
    filtered.forEach((apt) => {
      const d = new Date(apt.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d
        .toLocaleDateString("es-ES", { month: "long", year: "numeric" })
        .replace(/^\w/, (c) => c.toUpperCase());
      const last = groups[groups.length - 1];
      if (last?.key === key) {
        last.items.push(apt);
      } else {
        groups.push({ key, label, items: [apt] });
      }
    });
    return groups;
  }, [filter, filtered]);

  const filterBtns: { key: Filter; label: string }[] = [
    { key: "upcoming", label: "Próximas" },
    { key: "past", label: "Pasadas" },
    { key: "all", label: "Todas" },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-6">
      {/* Toggle de vista */}
      <div className="px-5 pt-5 pb-3 flex gap-2">
        <button
          onClick={() => setViewMode("list")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-semibold text-sm transition-colors ${
            viewMode === "list"
              ? "bg-indigo-600 text-white"
              : "bg-indigo-100 text-indigo-700"
          }`}
        >
          <List size={16} />
          Lista
        </button>
        <button
          onClick={() => setViewMode("calendar")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-semibold text-sm transition-colors ${
            viewMode === "calendar"
              ? "bg-indigo-600 text-white"
              : "bg-indigo-100 text-indigo-700"
          }`}
        >
          <CalendarDays size={16} />
          Calendario
        </button>
      </div>

      {/* Vista Calendario */}
      {viewMode === "calendar" && (
        <div className="flex flex-col gap-4">
          <CalendarMonthView
            appointments={expandedAppointments}
            selectedDate={selectedCalDate}
            onDaySelect={setSelectedCalDate}
          />

          {/* Citas del día seleccionado */}
          <div className="px-5">
            <h3 className="text-gray-700 font-bold text-sm mb-3">
              {selectedCalDate
                ? selectedCalDate
                    .toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })
                    .replace(/^\w/, (c) => c.toUpperCase())
                : "Selecciona un día"}
            </h3>
            {selectedDayAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Calendar size={40} strokeWidth={1.5} />
                <p className="mt-3 text-sm text-center">Sin citas este día</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {selectedDayAppointments.map((apt) => (
                  <AppointmentCard
                    key={apt.id}
                    apt={apt}
                    onEdit={() => onNavigateToAddEdit(baseId(apt.id))}
                    onDelete={() => handleDelete(baseId(apt.id))}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vista Lista */}
      {viewMode === "list" && (
        <>
          <div className="px-5 pb-3">
            <div className="flex gap-2">
              {filterBtns.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-colors ${
                    filter === key
                      ? "bg-indigo-600 text-white"
                      : "bg-indigo-100 text-indigo-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5">
            {dogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Dog size={64} strokeWidth={1.5} />
                <p className="mt-4 text-base text-gray-500 text-center">
                  Primero agrega una mascota
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Calendar size={64} strokeWidth={1.5} />
                <p className="mt-4 text-base text-gray-500 text-center">
                  No hay citas{" "}
                  {filter === "upcoming"
                    ? "próximas"
                    : filter === "past"
                      ? "pasadas"
                      : ""}
                </p>
              </div>
            ) : filter === "upcoming" ? (
              <div className="flex flex-col gap-2">
                {groupedUpcoming.map(({ key, label, items }) => {
                  const open = openMonths.has(key);
                  return (
                    <div key={key}>
                      <button
                        onClick={() => toggleMonth(key)}
                        className="w-full flex items-center justify-between py-2.5 px-1 mb-1"
                      >
                        <span className="text-indigo-700 font-bold text-sm capitalize">
                          {label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-indigo-400 font-semibold">
                            {items.length} cita{items.length !== 1 ? "s" : ""}
                          </span>
                          {open ? (
                            <ChevronDown
                              size={15}
                              className="text-indigo-400"
                            />
                          ) : (
                            <ChevronRight
                              size={15}
                              className="text-indigo-400"
                            />
                          )}
                        </div>
                      </button>
                      {open && (
                        <div className="flex flex-col gap-3 mb-3">
                          {items.map((apt) => (
                            <AppointmentCard
                              key={apt.id}
                              apt={apt}
                              onEdit={() => onNavigateToAddEdit(baseId(apt.id))}
                              onDelete={() => handleDelete(baseId(apt.id))}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filtered.map((apt) => (
                  <AppointmentCard
                    key={apt.id}
                    apt={apt}
                    onEdit={() => onNavigateToAddEdit(baseId(apt.id))}
                    onDelete={() => handleDelete(baseId(apt.id))}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tarjeta reutilizable → ver src/components/calendar/AppointmentCard.tsx ──
