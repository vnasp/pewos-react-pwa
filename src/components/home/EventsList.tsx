import { useState } from "react";
import {
  Calendar,
  Pill,
  Dumbbell,
  HeartPulse,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
} from "lucide-react";
import { appointmentTypeLabels } from "../../context/CalendarContext";
import { exerciseTypeLabels } from "../../context/ExerciseContext";
import { careTypeLabels } from "../../context/CareContext";
import type { Dog, Completion } from "../../types";
import type { HomeEvent } from "./types";

interface EventsListProps {
  events: HomeEvent[];
  completions: Record<string, Completion | null>;
  selectedDogId: string | null;
  dogs: Dog[];
  onToggle: (ev: HomeEvent, x: number, y: number) => void;
}

function getKey(ev: HomeEvent): string {
  if (ev.type === "appointment") return `appointment-${ev.data.id}`;
  if (ev.type === "medication")
    return `medication-${ev.medicationId}-${ev.scheduledTime}`;
  if (ev.type === "care") return `care-${ev.careId}-${ev.scheduledTime}`;
  return `exercise-${ev.exerciseId}-${ev.scheduledTime}`;
}

function getLabel(ev: HomeEvent): string {
  if (ev.type === "appointment")
    return appointmentTypeLabels[ev.data.type] ?? ev.data.type;
  if (ev.type === "medication") return ev.data.name;
  if (ev.type === "care") {
    if (ev.data.type === "otro" && ev.data.customTypeDescription)
      return ev.data.customTypeDescription;
    return careTypeLabels[ev.data.type] ?? ev.data.type;
  }
  // exercise
  if (ev.data.type === "otro" && ev.data.customTypeDescription)
    return ev.data.customTypeDescription;
  return exerciseTypeLabels[ev.data.type] ?? ev.data.type;
}

function getExtraInfo(ev: HomeEvent): string | null {
  if (ev.type === "medication") return ev.data.dosage ?? null;
  if (ev.type === "exercise") return `${ev.data.durationMinutes} min`;
  if (ev.type === "care") return `${ev.data.durationMinutes} min`;
  return null;
}

const typeConfig = {
  appointment: { icon: Calendar, bg: "bg-blue-100", color: "text-blue-700" },
  medication: { icon: Pill, bg: "bg-pink-100", color: "text-pink-700" },
  exercise: { icon: Dumbbell, bg: "bg-green-100", color: "text-green-700" },
  care: { icon: HeartPulse, bg: "bg-rose-100", color: "text-rose-700" },
};

export default function EventsList({
  events,
  completions,
  selectedDogId,
  dogs,
  onToggle,
}: EventsListProps) {
  const [showCompleted, setShowCompleted] = useState(false);

  const dogName = selectedDogId
    ? (dogs.find((d) => d.id === selectedDogId)?.name ?? "")
    : null;

  const doneCount = events.filter((ev) => !!completions[getKey(ev)]).length;
  const pendingCount = events.length - doneCount;
  const visibleEvents = showCompleted
    ? events
    : events.filter((ev) => !completions[getKey(ev)]);

  const heading =
    events.length === 0
      ? dogName
        ? `Sin recordatorios para ${dogName}`
        : "Sin recordatorios para hoy"
      : `${pendingCount} pendiente${pendingCount !== 1 ? "s" : ""}${
          dogName ? ` · ${dogName}` : " hoy"
        }`;

  return (
    <div className="px-5 pt-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-gray-800 font-bold text-base">{heading}</h2>
        {doneCount > 0 && (
          <button
            onClick={() => setShowCompleted((v) => !v)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showCompleted ? (
              <>
                <EyeOff size={14} />
                <span>Ocultar completados</span>
              </>
            ) : (
              <>
                <Eye size={14} />
                <span>
                  {doneCount} completado{doneCount !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <CheckCircle2 size={64} strokeWidth={1.5} />
          <p className="mt-4 text-sm text-center">¡Todo tranquilo por hoy!</p>
        </div>
      ) : visibleEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <CheckCircle2
            size={48}
            strokeWidth={1.5}
            className="text-green-400"
          />
          <p className="mt-3 text-sm text-center font-medium text-green-600">
            ¡Todo completado!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleEvents.map((ev) => {
            const cfg = typeConfig[ev.type];
            const Icon = cfg.icon;
            const key = getKey(ev);
            const isDone = !!completions[key];
            const extraInfo = getExtraInfo(ev);
            const notes = ev.data.notes ?? null;

            return (
              <div
                key={ev.id}
                className={`bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 ${isDone ? "opacity-50" : ""}`}
              >
                <div
                  className={`w-10 h-10 ${cfg.bg} rounded-xl flex items-center justify-center shrink-0`}
                >
                  <Icon size={20} className={cfg.color} />
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`font-semibold text-sm text-gray-900 truncate ${isDone ? "line-through" : ""}`}
                  >
                    {getLabel(ev)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedDogId ? ev.time : `${ev.dogName} · ${ev.time}`}
                    {extraInfo && ` · ${extraInfo}`}
                  </p>
                  {notes && (
                    <p className="text-xs text-gray-400 truncate mt-0.5 italic">
                      {notes}
                    </p>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    const rect = (
                      e.currentTarget as HTMLButtonElement
                    ).getBoundingClientRect();
                    onToggle(
                      ev,
                      rect.left + rect.width / 2,
                      rect.top + rect.height / 2,
                    );
                  }}
                  className="shrink-0 text-gray-400 active:scale-90 transition-transform"
                >
                  {isDone ? (
                    <CheckCircle2 size={24} className="text-green-500" />
                  ) : (
                    <Circle size={24} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
