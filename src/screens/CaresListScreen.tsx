import {
  HeartPulse,
  Clock,
  Bell,
  Timer,
  Dog,
  Pencil,
  Trash2,
  Repeat,
} from "lucide-react";
import {
  useCare,
  careTypeLabels,
  careTypeColors,
} from "../context/CareContext";
import { notificationTimeLabels } from "../components/calendar/AppointmentCard";
import { useDogs } from "../context/DogsContext";

interface CaresListScreenProps {
  onNavigateToAddEdit: (careId?: string) => void;
}

export default function CaresListScreen({
  onNavigateToAddEdit,
}: CaresListScreenProps) {
  const { cares, deleteCare, toggleCareActive } = useCare();
  const { dogs } = useDogs();

  const handleDelete = (id: string, dogName: string) => {
    if (window.confirm(`¿Eliminar este cuidado de ${dogName}?`)) deleteCare(id);
  };

  const byDog = dogs.map((dog) => ({
    dog,
    items: cares.filter((c) => c.dogId === dog.id),
  }));

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-6 px-5 pt-5">
      {dogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Dog size={64} strokeWidth={1.5} />
          <p className="mt-4 text-base text-gray-500 text-center">
            Primero agrega una mascota
          </p>
        </div>
      ) : cares.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <HeartPulse size={64} strokeWidth={1.5} />
          <p className="mt-4 text-base text-gray-500 text-center">
            No hay cuidados post-operatorios
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {byDog.map(({ dog, items }) =>
            items.length === 0 ? null : (
              <div key={dog.id}>
                <div className="flex items-center gap-2 mb-3">
                  <Dog size={22} className="text-gray-800" />
                  <span className="text-gray-900 text-lg font-bold">
                    {dog.name}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {items.map((care) => (
                    <div
                      key={care.id}
                      className={`bg-white rounded-2xl p-4 shadow-sm ${!care.isActive ? "opacity-60" : ""}`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`w-12 h-12 ${careTypeColors[care.type] ?? "bg-gray-100"} rounded-xl flex items-center justify-center shrink-0`}
                        >
                          <HeartPulse size={22} className="text-gray-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 text-base font-bold mb-1">
                            {care.type === "otro" && care.customTypeDescription
                              ? care.customTypeDescription
                              : careTypeLabels[care.type]}
                          </p>
                          <div className="flex items-center gap-1 mb-1">
                            <Timer size={13} className="text-gray-500" />
                            <span className="text-gray-700 text-sm">
                              {care.durationMinutes} minutos
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mb-1">
                            <Repeat size={13} className="text-gray-500" />
                            <span className="text-gray-600 text-xs">
                              {care.timesPerDay}{" "}
                              {care.timesPerDay === 1 ? "vez" : "veces"} al día
                            </span>
                          </div>
                          {care.scheduledTimes.length > 0 && (
                            <div className="flex items-center gap-1 mb-1">
                              <Clock size={13} className="text-blue-500" />
                              <span className="text-blue-600 text-xs">
                                {care.scheduledTimes.join(", ")}
                              </span>
                            </div>
                          )}
                          {!care.isPermanent && care.durationDays && (
                            <div className="flex items-center gap-1 mb-1">
                              <Timer size={13} className="text-amber-500" />
                              <span className="text-amber-700 text-xs">
                                {care.durationDays} días
                              </span>
                            </div>
                          )}
                          {care.notificationTime &&
                            care.notificationTime !== "none" && (
                              <div className="flex items-center gap-1">
                                <Bell size={13} className="text-purple-600" />
                                <span className="text-purple-600 text-xs">
                                  {
                                    notificationTimeLabels[
                                      care.notificationTime
                                    ]
                                  }
                                </span>
                              </div>
                            )}
                          {care.notes && (
                            <p className="text-gray-500 text-xs mt-2">
                              {care.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <button
                            onClick={() => onNavigateToAddEdit(care.id)}
                            className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                          >
                            <Pencil size={15} className="text-indigo-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(care.id, dog.name)}
                            className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                          >
                            <Trash2 size={15} className="text-red-600" />
                          </button>
                          <button
                            onClick={() => toggleCareActive(care.id)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform text-xs font-bold ${care.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                          >
                            {care.isActive ? "ON" : "OFF"}
                          </button>
                        </div>
                      </div>
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
