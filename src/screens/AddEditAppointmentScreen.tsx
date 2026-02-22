import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { formatLocalDate, parseLocalDate } from "../utils/supabase";
import {
  useCalendar,
  appointmentTypeLabels,
  recurrenceLabels,
} from "../context/CalendarContext";
import { useDogs } from "../context/DogsContext";
import type {
  AppointmentType,
  RecurrencePattern,
  NotificationTime,
} from "../types";

interface AddEditAppointmentScreenProps {
  appointmentId?: string;
  onNavigateBack: () => void;
}

const appointmentTypes: AppointmentType[] = [
  "control",
  "examenes",
  "operacion",
  "fisioterapia",
  "vacuna",
  "desparasitacion",
  "otro",
];
const recurrenceOptions: RecurrencePattern[] = [
  "none",
  "daily",
  "weekly",
  "biweekly",
  "monthly",
];
const notificationOptions: { value: NotificationTime; label: string }[] = [
  { value: "none", label: "Sin notificación" },
  { value: "15min", label: "15 minutos antes" },
  { value: "30min", label: "30 minutos antes" },
  { value: "1h", label: "1 hora antes" },
  { value: "2h", label: "2 horas antes" },
  { value: "1day", label: "1 día antes" },
];

export default function AddEditAppointmentScreen({
  appointmentId,
  onNavigateBack,
}: AddEditAppointmentScreenProps) {
  const { addAppointment, updateAppointment, getAppointmentById } =
    useCalendar();
  const { dogs } = useDogs();
  const isEditing = !!appointmentId;
  const existing = appointmentId
    ? getAppointmentById(appointmentId)
    : undefined;

  const [selectedDogId, setSelectedDogId] = useState(
    existing?.dogId ?? dogs[0]?.id ?? "",
  );
  const [date, setDate] = useState(
    existing?.date
      ? formatLocalDate(new Date(existing.date))
      : formatLocalDate(new Date()),
  );
  const [time, setTime] = useState(existing?.time ?? "09:00");
  const [type, setType] = useState<AppointmentType>(
    existing?.type ?? "control",
  );
  const [customTypeDescription, setCustomTypeDescription] = useState(
    existing?.customTypeDescription ?? "",
  );
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [notificationTime, setNotificationTime] = useState<NotificationTime>(
    existing?.notificationTime ?? "1day",
  );
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>(
    existing?.recurrencePattern ?? "none",
  );
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(
    existing?.recurrenceEndDate
      ? formatLocalDate(new Date(existing.recurrenceEndDate))
      : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!selectedDogId) {
      setError("Selecciona una mascota");
      return;
    }
    if (type === "otro" && !customTypeDescription.trim()) {
      setError("Especifica el tipo de cita");
      return;
    }
    if (recurrencePattern !== "none" && !recurrenceEndDate) {
      setError("Especifica la fecha fin de repetición");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const selectedDog = dogs.find((d) => d.id === selectedDogId)!;
      const data = {
        dogId: selectedDogId,
        dogName: selectedDog.name,
        date: parseLocalDate(date),
        time,
        type,
        customTypeDescription:
          type === "otro" ? customTypeDescription.trim() : undefined,
        notes: notes.trim(),
        notificationTime,
        recurrencePattern,
        recurrenceEndDate:
          recurrencePattern !== "none" && recurrenceEndDate
            ? parseLocalDate(recurrenceEndDate)
            : undefined,
      };
      if (isEditing && appointmentId)
        await updateAppointment(appointmentId, data);
      else await addAppointment(data);
      onNavigateBack();
    } catch {
      setError("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-6">
      <div className="px-5 pt-5 pb-3 flex items-center gap-2">
        <button
          onClick={onNavigateBack}
          className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center active:scale-90 transition-transform shrink-0"
        >
          <ArrowLeft size={18} className="text-gray-800" />
        </button>
        <h2 className="text-gray-900 font-bold text-lg">
          {isEditing ? "Editar cita" : "Nueva cita"}
        </h2>
      </div>

      <div className="px-5 flex flex-col gap-4">
        {/* Mascota */}
        <div>
          <label className="text-gray-700 font-semibold text-sm block mb-2">
            Mascota
          </label>
          <div className="flex flex-wrap gap-2">
            {dogs.map((dog) => (
              <button
                key={dog.id}
                onClick={() => setSelectedDogId(dog.id)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${selectedDogId === dog.id ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700"}`}
              >
                {dog.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tipo de cita */}
        <div>
          <label className="text-gray-700 font-semibold text-sm block mb-2">
            Tipo de cita
          </label>
          <div className="grid grid-cols-2 gap-2">
            {appointmentTypes.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`py-2.5 rounded-xl font-semibold text-sm transition-colors text-center ${type === t ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700"}`}
              >
                {appointmentTypeLabels[t]}
              </button>
            ))}
          </div>
          {type === "otro" && (
            <input
              value={customTypeDescription}
              onChange={(e) => setCustomTypeDescription(e.target.value)}
              placeholder="Describe el tipo de cita"
              className="mt-2 w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
            />
          )}
        </div>

        {/* Fecha y hora */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-700 font-semibold text-sm block mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="text-gray-700 font-semibold text-sm block mb-1">
              Hora
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        {/* Recurrencia */}
        <div>
          <label className="text-gray-700 font-semibold text-sm block mb-2">
            Repetición
          </label>
          <select
            value={recurrencePattern}
            onChange={(e) =>
              setRecurrencePattern(e.target.value as RecurrencePattern)
            }
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {recurrenceOptions.map((r) => (
              <option key={r} value={r}>
                {recurrenceLabels[r]}
              </option>
            ))}
          </select>
          {recurrencePattern !== "none" && (
            <div className="mt-2">
              <label className="text-gray-600 text-xs font-semibold block mb-1">
                Fecha fin de repetición
              </label>
              <input
                type="date"
                value={recurrenceEndDate}
                onChange={(e) => setRecurrenceEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          )}
        </div>

        {/* Notificación */}
        <div>
          <label className="text-gray-700 font-semibold text-sm block mb-2">
            Notificación
          </label>
          <select
            value={notificationTime}
            onChange={(e) =>
              setNotificationTime(e.target.value as NotificationTime)
            }
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {notificationOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notas */}
        <div>
          <label className="text-gray-700 font-semibold text-sm block mb-1">
            Notas (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Instrucciones, preparaciones..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl text-base disabled:opacity-60 active:scale-95 transition-transform"
        >
          {saving
            ? "Guardando..."
            : isEditing
              ? "Guardar cambios"
              : "Agregar cita"}
        </button>
      </div>
    </div>
  );
}
