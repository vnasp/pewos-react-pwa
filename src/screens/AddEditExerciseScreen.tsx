import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import {
  useExercise,
  exerciseTypeLabels,
  exerciseTypeColors,
  calculateScheduledTimes,
} from "../context/ExerciseContext";
import { useDogs } from "../context/DogsContext";
import type { ExerciseType, NotificationTime } from "../types";

interface AddEditExerciseScreenProps {
  exerciseId?: string;
  onNavigateBack: () => void;
}

const exerciseTypes: ExerciseType[] = [
  "caminata",
  "cavaletti",
  "balanceo",
  "slalom",
  "entrenamiento",
  "otro",
];

const notificationOptions: { value: NotificationTime; label: string }[] = [
  { value: "none", label: "Sin notificación" },
  { value: "15min", label: "15 min antes" },
  { value: "30min", label: "30 min antes" },
  { value: "1h", label: "1 hora antes" },
  { value: "2h", label: "2 horas antes" },
  { value: "1day", label: "1 día antes" },
];

export default function AddEditExerciseScreen({
  exerciseId,
  onNavigateBack,
}: AddEditExerciseScreenProps) {
  const { addExercise, updateExercise, getExerciseById } = useExercise();
  const { dogs } = useDogs();
  const isEditing = !!exerciseId;
  const existing = exerciseId ? getExerciseById(exerciseId) : undefined;

  const [selectedDogId, setSelectedDogId] = useState(
    existing?.dogId ?? dogs[0]?.id ?? "",
  );
  const [type, setType] = useState<ExerciseType>(existing?.type ?? "caminata");
  const [customTypeDescription, setCustomTypeDescription] = useState(
    existing?.customTypeDescription ?? "",
  );
  const [durationMinutes, setDurationMinutes] = useState(
    existing?.durationMinutes?.toString() ?? "30",
  );
  const [timesPerDay, setTimesPerDay] = useState(
    existing?.timesPerDay?.toString() ?? "1",
  );
  const [startTime, setStartTime] = useState(existing?.startTime ?? "07:00");
  const [endTime, setEndTime] = useState(existing?.endTime ?? "21:00");
  const [startDate, setStartDate] = useState(
    existing?.startDate
      ? new Date(existing.startDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  );
  const [isPermanent, setIsPermanent] = useState(existing?.isPermanent ?? true);
  const [durationWeeks, setDurationWeeks] = useState(
    existing?.durationWeeks?.toString() ?? "4",
  );
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [notificationTime, setNotificationTime] = useState<NotificationTime>(
    existing?.notificationTime ?? "15min",
  );
  const [scheduledTimes, setScheduledTimes] = useState<string[]>(
    existing?.scheduledTimes ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const times = parseInt(timesPerDay || "1");
    if (!isNaN(times) && times > 0 && startTime && endTime) {
      setScheduledTimes(calculateScheduledTimes(startTime, endTime, times));
    }
  }, [startTime, endTime, timesPerDay]);

  const handleSave = async () => {
    if (!selectedDogId) {
      setError("Selecciona una mascota");
      return;
    }
    if (type === "otro" && !customTypeDescription.trim()) {
      setError("Especifica el tipo de ejercicio");
      return;
    }
    const dur = parseInt(durationMinutes);
    const times = parseInt(timesPerDay);
    if (isNaN(dur) || dur <= 0) {
      setError("Duración inválida");
      return;
    }
    if (isNaN(times) || times <= 0) {
      setError("Frecuencia inválida");
      return;
    }
    const weeks = parseInt(durationWeeks);
    if (!isPermanent && (isNaN(weeks) || weeks <= 0)) {
      setError("Duración en semanas inválida");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const selectedDog = dogs.find((d) => d.id === selectedDogId)!;
      let endDate: Date | undefined;
      if (!isPermanent) {
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + weeks * 7 - 1);
      }
      const data = {
        dogId: selectedDogId,
        dogName: selectedDog.name,
        type,
        customTypeDescription:
          type === "otro" ? customTypeDescription.trim() : undefined,
        durationMinutes: dur,
        timesPerDay: times,
        startTime,
        endTime,
        scheduledTimes,
        startDate: new Date(startDate),
        isPermanent,
        durationWeeks: isPermanent ? undefined : weeks,
        endDate,
        notes: notes.trim(),
        isActive: existing?.isActive ?? true,
        notificationTime,
        notificationIds: existing?.notificationIds ?? [],
      };
      if (isEditing && exerciseId) await updateExercise(exerciseId, data);
      else await addExercise(data);
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
          {isEditing ? "Editar rutina" : "Nueva rutina"}
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

        {/* Tipo de ejercicio */}
        <div>
          <label className="text-gray-700 font-semibold text-sm block mb-2">
            Tipo de ejercicio
          </label>
          <div className="grid grid-cols-2 gap-2">
            {exerciseTypes.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`py-2.5 rounded-xl font-semibold text-sm transition-colors text-center ${type === t ? "bg-indigo-600 text-white" : `${exerciseTypeColors[t] ?? "bg-gray-100"} text-gray-800`}`}
              >
                {exerciseTypeLabels[t]}
              </button>
            ))}
          </div>
          {type === "otro" && (
            <input
              value={customTypeDescription}
              onChange={(e) => setCustomTypeDescription(e.target.value)}
              placeholder="Describe el tipo de ejercicio"
              className="mt-2 w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
            />
          )}
        </div>

        {/* Duración y repeticiones */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-700 font-semibold text-sm block mb-1">
              Duración (min)
            </label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              min={1}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="text-gray-700 font-semibold text-sm block mb-1">
              Veces al día
            </label>
            <input
              type="number"
              value={timesPerDay}
              onChange={(e) => setTimesPerDay(e.target.value)}
              min={1}
              max={10}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        {/* Ventana horaria */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-700 font-semibold text-sm block mb-1">
              Inicio ventana
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="text-gray-700 font-semibold text-sm block mb-1">
              Fin ventana
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        {/* Horarios calculados */}
        {scheduledTimes.length > 0 && (
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-green-700 font-semibold text-xs mb-1">
              Horarios calculados
            </p>
            <p className="text-green-900 text-sm">
              {scheduledTimes.join(", ")}
            </p>
          </div>
        )}

        {/* Fecha inicio */}
        <div>
          <label className="text-gray-700 font-semibold text-sm block mb-1">
            Fecha de inicio
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Duración / permanente */}
        <div>
          <label className="text-gray-700 font-semibold text-sm block mb-2">
            Duración
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setIsPermanent(true)}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${isPermanent ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700"}`}
            >
              Permanente
            </button>
            <button
              onClick={() => setIsPermanent(false)}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${!isPermanent ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700"}`}
            >
              Por semanas
            </button>
          </div>
          {!isPermanent && (
            <div className="mt-2">
              <label className="text-gray-600 text-xs font-semibold block mb-1">
                Número de semanas
              </label>
              <div className="flex gap-2 mb-2">
                {[1, 2, 4, 8].map((w) => (
                  <button
                    key={w}
                    onClick={() => setDurationWeeks(w.toString())}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${durationWeeks === w.toString() ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700"}`}
                  >
                    {w}s
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(e.target.value)}
                min={1}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
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
            Notas
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
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
              : "Agregar rutina"}
        </button>
      </div>
    </div>
  );
}
