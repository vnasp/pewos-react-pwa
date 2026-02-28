import { Pencil, Trash2, Clock } from "lucide-react";
import { useDogs } from "../context/DogsContext";

interface DogsListScreenProps {
  onNavigateToAddEdit: (dogId?: string) => void;
  onNavigateToMealTimes: () => void;
}

function calcAge(birthDate: Date) {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

export default function DogsListScreen({
  onNavigateToAddEdit,
  onNavigateToMealTimes,
}: DogsListScreenProps) {
  const { dogs, deleteDog } = useDogs();

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de eliminar a ${name}?`)) deleteDog(id);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-6 px-5 pt-6">
      {dogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-6xl mb-4">🐕</span>
          <p className="text-lg text-gray-500 text-center mb-1">
            No tienes mascotas registradas
          </p>
          <p className="text-sm text-center">
            Toca + para agregar tu primera mascota
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {dogs.map((dog) => (
            <div key={dog.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex gap-4">
                {/* Foto */}
                <div className="w-20 h-20 bg-gray-200 rounded-xl overflow-hidden shrink-0">
                  {dog.photo ? (
                    <img
                      src={dog.photo}
                      alt={dog.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      🐕
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-xl font-bold mb-0.5 truncate">
                    {dog.name}
                  </p>
                  <p className="text-gray-600 text-sm mb-1">{dog.breed}</p>
                  <div className="flex items-center gap-2 text-gray-500 text-sm flex-wrap">
                    <span>{calcAge(dog.birthDate)} años</span>
                    <span>•</span>
                    <span>{dog.gender === "male" ? "Macho" : "Hembra"}</span>
                    {dog.isNeutered && (
                      <>
                        <span>•</span>
                        <span>
                          {dog.gender === "male" ? "Castrado" : "Esterilizada"}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => onNavigateToAddEdit(dog.id)}
                    className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Pencil size={16} className="text-indigo-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(dog.id, dog.name)}
                    className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </div>
              </div>

              {/* Opciones */}
              <div className="mt-4">
                <p className="text-gray-500 text-xs font-semibold uppercase mb-2">
                  Opciones
                </p>
                <button
                  onClick={onNavigateToMealTimes}
                  className="w-full border-2 border-indigo-600 rounded-xl py-2 flex items-center justify-center gap-2 active:bg-indigo-50 transition-colors"
                >
                  <Clock size={18} className="text-indigo-600" />
                  <span className="text-indigo-600 font-semibold text-sm">
                    Horarios de Comida
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
