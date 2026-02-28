import { Stethoscope, Pencil, Trash2, Phone, Mail, MapPin } from "lucide-react";
import { useVeterinarians } from "../context/VeterinariansContext";
import { useDogs } from "../context/DogsContext";
import { useState } from "react";

interface VeterinariansListScreenProps {
  onNavigateToAddEdit: (vetId?: string) => void;
}

export default function VeterinariansListScreen({
  onNavigateToAddEdit,
}: VeterinariansListScreenProps) {
  const { veterinarians, deleteVeterinarian } = useVeterinarians();
  const { dogs } = useDogs();
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`¿Eliminar veterinario ${name}?`))
      deleteVeterinarian(id);
  };

  const filteredVets = selectedDogId
    ? veterinarians.filter((v) => v.dogId === selectedDogId)
    : veterinarians;

  // Agrupar por perro
  const byDog = dogs.map((dog) => ({
    dog,
    vets: filteredVets.filter((v) => v.dogId === dog.id),
  }));

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-6 px-5 pt-6">
      {/* Tabs por perro */}
      {dogs.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedDogId(null)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-colors ${
              selectedDogId === null
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Todos ({veterinarians.length})
          </button>
          {dogs.map((dog) => {
            const count = veterinarians.filter(
              (v) => v.dogId === dog.id,
            ).length;
            return (
              <button
                key={dog.id}
                onClick={() => setSelectedDogId(dog.id)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-colors ${
                  selectedDogId === dog.id
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {dog.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {veterinarians.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Stethoscope size={64} strokeWidth={1.5} />
          <p className="mt-4 text-lg text-gray-500 text-center mb-1">
            No hay veterinarios registrados
          </p>
          <p className="text-sm text-center">
            Toca + para agregar un veterinario
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {byDog.map(({ dog, vets }) =>
            vets.length === 0 ? null : (
              <div key={dog.id}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-gray-900 text-lg font-bold">
                    {dog.name}
                  </span>
                </div>
                <div className="flex flex-col gap-3 md:grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {vets.map((vet) => (
                    <div
                      key={vet.id}
                      className="bg-white rounded-2xl p-4 shadow-sm"
                    >
                      <div className="flex gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                          <Stethoscope size={22} className="text-blue-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 text-base font-bold mb-0.5 truncate">
                            {vet.name}
                          </p>
                          {vet.clinicName && (
                            <p className="text-gray-600 text-sm truncate">
                              {vet.clinicName}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => onNavigateToAddEdit(vet.id)}
                            className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                          >
                            <Pencil size={16} className="text-indigo-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(vet.id, vet.name)}
                            className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </div>

                      {/* Información de contacto */}
                      <div className="space-y-2">
                        {vet.phone && (
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Phone size={14} className="shrink-0" />
                            <a
                              href={`tel:${vet.phone}`}
                              className="truncate hover:text-indigo-600"
                            >
                              {vet.phone}
                            </a>
                          </div>
                        )}
                        {vet.email && (
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Mail size={14} className="shrink-0" />
                            <a
                              href={`mailto:${vet.email}`}
                              className="truncate hover:text-indigo-600"
                            >
                              {vet.email}
                            </a>
                          </div>
                        )}
                        {vet.address && (
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <MapPin size={14} className="shrink-0" />
                            <span className="truncate">{vet.address}</span>
                          </div>
                        )}
                      </div>

                      {vet.notes && (
                        <p className="text-gray-500 text-xs mt-3 italic">
                          {vet.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
