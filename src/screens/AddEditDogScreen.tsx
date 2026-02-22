import { useState, useRef } from "react";
import { ArrowLeft, Camera } from "lucide-react";
import { useDogs } from "../context/DogsContext";
import { formatLocalDate, parseLocalDate } from "../utils/supabase";

interface AddEditDogScreenProps {
  dogId?: string;
  onNavigateBack: () => void;
}

export default function AddEditDogScreen({
  dogId,
  onNavigateBack,
}: AddEditDogScreenProps) {
  const { addDog, updateDog, getDogById } = useDogs();
  const isEditing = !!dogId;
  const existing = dogId ? getDogById(dogId) : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [photo, setPhoto] = useState(existing?.photo ?? "");
  const [breed, setBreed] = useState(existing?.breed ?? "");
  const [birthDate, setBirthDate] = useState(
    existing?.birthDate
      ? formatLocalDate(new Date(existing.birthDate))
      : formatLocalDate(new Date()),
  );
  const [gender, setGender] = useState<"male" | "female">(
    existing?.gender ?? "male",
  );
  const [isNeutered, setIsNeutered] = useState(existing?.isNeutered ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Ingresa el nombre del perro");
      return;
    }
    if (!breed.trim()) {
      setError("Ingresa la raza");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const dogData = {
        name: name.trim(),
        photo,
        breed: breed.trim(),
        birthDate: parseLocalDate(birthDate),
        gender,
        isNeutered,
      };
      if (isEditing && dogId) await updateDog(dogId, dogData);
      else await addDog(dogData);
      onNavigateBack();
    } catch {
      setError("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-6">
      {/* Back row */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-2">
        <button
          onClick={onNavigateBack}
          className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center active:scale-90 transition-transform shrink-0"
        >
          <ArrowLeft size={18} className="text-gray-800" />
        </button>
        <h2 className="text-gray-900 font-bold text-lg">
          {isEditing ? "Editar mascota" : "Agregar mascota"}
        </h2>
      </div>

      <div className="px-5 flex flex-col gap-4">
        {/* Foto */}
        <div className="flex flex-col items-center py-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="active:scale-95 transition-transform"
          >
            <div className="w-28 h-28 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
              {photo ? (
                <img
                  src={photo}
                  alt="foto"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera size={36} className="text-gray-400" />
              )}
            </div>
            <p className="text-indigo-600 text-sm font-semibold text-center mt-2">
              {photo ? "Cambiar foto" : "Agregar foto"}
            </p>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handlePickImage}
            className="hidden"
          />
        </div>

        {/* Nombre */}
        <div>
          <label className="text-gray-700 font-semibold text-sm block mb-1">
            Nombre *
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Max, Luna..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Raza */}
        <div>
          <label className="text-gray-700 font-semibold text-sm block mb-1">
            Raza *
          </label>
          <input
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            placeholder="Ej: Labrador, Mestizo..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Fecha nacimiento */}
        <div>
          <label className="text-gray-700 font-semibold text-sm block mb-1">
            Fecha de nacimiento
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Género */}
        <div>
          <label className="text-gray-700 font-semibold text-sm block mb-2">
            Género
          </label>
          <div className="flex gap-2">
            {(["male", "female"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${gender === g ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700"}`}
              >
                {g === "male" ? "Macho" : "Hembra"}
              </button>
            ))}
          </div>
        </div>

        {/* Castrado / Esterilizada */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3">
          <span className="text-gray-700 font-semibold text-sm">
            {gender === "male" ? "Castrado" : "Esterilizada"}
          </span>
          <button
            onClick={() => setIsNeutered(!isNeutered)}
            className={`w-11 h-6 rounded-full transition-colors ${isNeutered ? "bg-green-500" : "bg-gray-300"}`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${isNeutered ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl text-base disabled:opacity-60 active:scale-95 transition-transform mt-2"
        >
          {saving
            ? "Guardando..."
            : isEditing
              ? "Guardar cambios"
              : "Agregar mascota"}
        </button>
      </div>
    </div>
  );
}
