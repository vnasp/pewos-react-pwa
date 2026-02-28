import { useState, useEffect } from "react";
import { ArrowLeft, Clock, Utensils } from "lucide-react";
import { useMedication } from "../context/MedicationContext";
import { useMealTimes } from "../context/MealTimesContext";
import { useDogs } from "../context/DogsContext";
import { formatLocalDate, parseLocalDate } from "../utils/supabase";
import type { ScheduleType, NotificationTime } from "../types";

interface AddEditMedicationScreenProps {
  medicationId?: string;
  onNavigateBack: () => void;
}

/** Calcula tiempos cada N horas desde startTime.
 * Si freqHours >= 24 (ej: 48h = cada 2 días) solo devuelve el horario de inicio,
 * ya que el filtrado por día se hace en HomeScreen. */
function calcTimesFromHours(startTime: string, freqHours: number): string[] {
  if (freqHours >= 24) return [startTime];
  const [h, m] = startTime.split(":").map(Number);
  const times: string[] = [];
  let cur = h * 60 + m;
  while (cur < 24 * 60) {
    const hh = Math.floor(cur / 60)
      .toString()
      .padStart(2, "0");
    const mm = (cur % 60).toString().padStart(2, "0");
    times.push(`${hh}:${mm}`);
    cur += freqHours * 60;
  }
  return times;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days - 1);
  return d;
}

const notificationOptions: { value: NotificationTime; label: string }[] = [
  { value: "none", label: "Sin notificación" },
  { value: "15min", label: "15 min antes" },
  { value: "30min", label: "30 min antes" },
  { value: "1h", label: "1 hora antes" },
  { value: "2h", label: "2 horas antes" },
  { value: "1day", label: "1 día antes" },
];

export default function AddEditMedicationScreen({
  medicationId,
  onNavigateBack,
}: AddEditMedicationScreenProps) {
  const { addMedication, updateMedication, getMedicationById } =
    useMedication();
  const { mealTimes } = useMealTimes();
  const { dogs } = useDogs();
  const isEditing = !!medicationId;
  const existing = medicationId ? getMedicationById(medicationId) : undefined;

  const [selectedDogId, setSelectedDogId] = useState(
    existing?.dogId ?? dogs[0]?.id ?? "",
  );
  const [name, setName] = useState(existing?.name ?? "");
  const [dosage, setDosage] = useState(existing?.dosage ?? "");
  const [scheduleType, setScheduleType] = useState<ScheduleType>(
    existing?.scheduleType ?? "hours",
  );
  const [frequencyHours, setFrequencyHours] = useState(
    existing?.frequencyHours?.toString() ?? "8",
  );
  const [startTime, setStartTime] = useState(existing?.startTime ?? "08:00");
  const [selectedMealIds, setSelectedMealIds] = useState<string[]>(
    existing?.mealIds ?? [],
  );
  const [durationDays, setDurationDays] = useState(
    existing?.durationDays.toString() ?? "30",
  );
  const [startDate, setStartDate] = useState(
    existing?.startDate
      ? formatLocalDate(new Date(existing.startDate))
      : formatLocalDate(new Date()),
  );
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [notificationTime, setNotificationTime] = useState<NotificationTime>(
    existing?.notificationTime ?? "15min",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calcular scheduled times y end date
  const [scheduledTimes, setScheduledTimes] = useState<string[]>(
    existing?.scheduledTimes ?? [],
  );
  const [endDate, setEndDate] = useState<Date>(new Date());

  useEffect(() => {
    const dur = parseInt(durationDays);
    if (!isNaN(dur) && dur >= 0) {
      setEndDate(addDays(parseLocalDate(startDate), dur > 0 ? dur : 1));
    }
    if (scheduleType === "hours") {
      const freq = parseInt(frequencyHours);
      if (!isNaN(freq) && freq > 0)
        setScheduledTimes(calcTimesFromHours(startTime, freq));
    } else {
      const times = mealTimes
        .filter((m) => selectedMealIds.includes(m.id))
        .map((m) => m.time)
        .sort();
      setScheduledTimes(times);
    }
  }, [
    scheduleType,
    frequencyHours,
    startTime,
    selectedMealIds,
    durationDays,
    startDate,
    mealTimes,
  ]);

  const toggleMeal = (id: string) => {
    setSelectedMealIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  };

  const handleSave = async () => {
    if (!selectedDogId) {
      setError("Selecciona una mascota");
      return;
    }
    if (!name.trim()) {
      setError("Ingresa el nombre del medicamento");
      return;
    }
    if (!dosage.trim()) {
      setError("Ingresa la dosis");
      return;
    }
    if (scheduleType === "hours") {
      const freq = parseInt(frequencyHours);
      if (isNaN(freq) || freq <= 0 || freq > 24) {
        setError("Frecuencia inválida (1-24h)");
        return;
      }
    } else if (selectedMealIds.length === 0) {
      setError("Selecciona al menos una comida");
      return;
    }
    const dur = parseInt(durationDays);
    if (isNaN(dur) || dur < 0) {
      setError("Duración inválida");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const selectedDog = dogs.find((d) => d.id === selectedDogId)!;
      const data = {
        dogId: selectedDogId,
        dogName: selectedDog.name,
        name: name.trim(),
        dosage: dosage.trim(),
        scheduleType,
        frequencyHours:
          scheduleType === "hours" ? parseInt(frequencyHours) : undefined,
        startTime: scheduleType === "hours" ? startTime : undefined,
        mealIds: scheduleType === "meals" ? selectedMealIds : [],
        scheduledTimes,
        durationDays: dur,
        startDate: parseLocalDate(startDate),
        endDate,
        notes: notes.trim(),
        notificationTime,
        notificationIds: existing?.notificationIds ?? [],
        isActive: existing?.isActive ?? true,
      };
      if (isEditing && medicationId) await updateMedication(medicationId, data);
      else await addMedication(data);
      onNavigateBack();
    } catch {
      setError("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-6">
      <div className="px-5 pt-5 pb-3 flex items-center gap-2 lg:max-w-3xl lg:mx-auto lg:w-full">
        <button
          onClick={onNavigateBack}
          className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center active:scale-90 transition-transform shrink-0"
        >
          <ArrowLeft size={18} className="text-gray-800" />
        </button>
        <h2 className="text-gray-900 font-bold text-lg">
          {isEditing ? "Editar medicamento" : "Nuevo medicamento"}
        </h2>
      </div>

      <div className="px-5 flex flex-col gap-4 lg:max-w-3xl lg:mx-auto lg:w-full">
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

        {/* Nombre + Dosis */}
        <div>
          <label className="text-gray-700 font-semibold text-sm block mb-1">
            Nombre del medicamento *
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Ibuprofeno, Amoxicilina..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="text-gray-700 font-semibold text-sm block mb-1">
            Dosis *
          </label>
          <input
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            placeholder="Ej: 1 pastilla, 5ml..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Tipo de programación */}
        <div>
          <label className="text-gray-700 font-semibold text-sm block mb-2">
            Programar por
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setScheduleType("hours")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors ${scheduleType === "hours" ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700"}`}
            >
              <Clock size={16} /> Horas
            </button>
            <button
              onClick={() => setScheduleType("meals")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors ${scheduleType === "meals" ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700"}`}
            >
              <Utensils size={16} /> Comidas
            </button>
          </div>
        </div>

        {scheduleType === "hours" ? (
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-gray-700 font-semibold text-sm block mb-1">
                Cada cuántas horas
              </label>
              <div className="flex gap-2 mb-2">
                {[6, 8, 12, 24].map((h) => (
                  <button
                    key={h}
                    onClick={() => setFrequencyHours(h.toString())}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${frequencyHours === h.toString() ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700"}`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={frequencyHours}
                onChange={(e) => setFrequencyHours(e.target.value)}
                min={1}
                max={24}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-gray-700 font-semibold text-sm block mb-1">
                Primera dosis
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="text-gray-700 font-semibold text-sm block mb-2">
              Con cuáles comidas
            </label>
            {mealTimes.map((meal) => (
              <button
                key={meal.id}
                onClick={() => toggleMeal(meal.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 border-2 transition-colors ${selectedMealIds.includes(meal.id) ? "border-indigo-600 bg-indigo-50" : "border-gray-200"}`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMealIds.includes(meal.id) ? "bg-indigo-600 border-indigo-600" : "border-gray-300"}`}
                >
                  {selectedMealIds.includes(meal.id) && (
                    <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  )}
                </div>
                <span className="text-gray-800 font-semibold text-sm">
                  {meal.name}
                </span>
                <span className="ml-auto text-gray-500 text-xs">
                  {meal.time}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Horarios calculados */}
        {scheduledTimes.length > 0 && (
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-blue-700 font-semibold text-xs mb-1">
              Horarios calculados
            </p>
            <p className="text-blue-900 text-sm">{scheduledTimes.join(", ")}</p>
          </div>
        )}

        {/* Duración y fecha inicio */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-700 font-semibold text-sm block mb-1">
              Inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="text-gray-700 font-semibold text-sm block mb-1">
              Duración (días)
            </label>
            <input
              type="number"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              min={0}
              placeholder="0=continuo"
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[3, 7, 20, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDurationDays(d.toString())}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${durationDays === d.toString() ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700"}`}
            >
              {d} días
            </button>
          ))}
          <button
            onClick={() => setDurationDays("0")}
            className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${durationDays === "0" ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700"}`}
          >
            Continuo
          </button>
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
              : "Agregar medicamento"}
        </button>
      </div>
    </div>
  );
}
