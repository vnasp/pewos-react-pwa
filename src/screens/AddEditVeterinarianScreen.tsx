import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useVeterinarians } from "../context/VeterinariansContext";
import { useDogs } from "../context/DogsContext";

interface AddEditVeterinarianScreenProps {
  veterinarianId?: string;
  onNavigateBack: () => void;
}

export default function AddEditVeterinarianScreen({
  veterinarianId,
  onNavigateBack,
}: AddEditVeterinarianScreenProps) {
  const { addVeterinarian, updateVeterinarian, getVeterinarianById } =
    useVeterinarians();
  const { dogs } = useDogs();
  const isEditing = !!veterinarianId;
  const existing = veterinarianId
    ? getVeterinarianById(veterinarianId)
    : undefined;

  const [selectedDogId, setSelectedDogId] = useState(
    existing?.dogId ?? dogs[0]?.id ?? "",
  );
  const [name, setName] = useState(existing?.name ?? "");
  const [clinicName, setClinicName] = useState(existing?.clinicName ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [address, setAddress] = useState(existing?.address ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!selectedDogId) {
      setError("Selecciona una mascota");
      return;
    }
    if (!name.trim()) {
      setError("Ingresa el nombre del veterinario");
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
        clinicName: clinicName.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      if (isEditing && veterinarianId)
        await updateVeterinarian(veterinarianId, data);
      else await addVeterinarian(data);
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
          {isEditing ? "Editar veterinario" : "Agregar veterinario"}
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
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
                  selectedDogId === dog.id
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {dog.name}
              </button>
            ))}
          </div>
        </div>

        {/* Nombre del veterinario */}
        <div>
          <label className="text-gray-700 font-semibold text-sm block mb-2">
            Nombre del veterinario *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dr. Juan Pérez"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Nombre de la clínica */}
        <div>
          <label className="text-gray-700 font-semibold text-sm block mb-2">
            Clínica / Centro veterinario
          </label>
          <input
            type="text"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            placeholder="Clínica Veterinaria San Francisco"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="text-gray-700 font-semibold text-sm block mb-2">
            Teléfono
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+56 9 1234 5678"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Email */}
        <div>
          <label className="text-gray-700 font-semibold text-sm block mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contacto@clinica.cl"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Dirección */}
        <div>
          <label className="text-gray-700 font-semibold text-sm block mb-2">
            Dirección
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Av. Principal 123, Providencia"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Notas */}
        <div>
          <label className="text-gray-700 font-semibold text-sm block mb-2">
            Notas
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Horarios de atención, especialidad, etc."
            rows={3}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {/* Botón guardar */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-2xl active:scale-95 transition-transform disabled:opacity-60"
        >
          {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Agregar"}
        </button>
      </div>
    </div>
  );
}
