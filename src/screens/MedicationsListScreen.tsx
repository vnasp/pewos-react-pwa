import {
  Pill,
  Clock,
  Calendar,
  Bell,
  Infinity,
  AlertTriangle,
  CheckCircle,
  X,
  Dog,
  Pencil,
  Trash2,
} from "lucide-react";
import { useMedication } from "../context/MedicationContext";
import { useDogs } from "../context/DogsContext";

interface MedicationsListScreenProps {
  onNavigateToAddEdit: (medicationId?: string) => void;
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysRemaining(endDate: Date) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.floor((end.getTime() - now.getTime()) / 86400000);
}

export default function MedicationsListScreen({
  onNavigateToAddEdit,
}: MedicationsListScreenProps) {
  const { medications, deleteMedication, toggleMedicationActive } =
    useMedication();
  const { dogs } = useDogs();

  const handleDelete = (id: string, dogName: string, name: string) => {
    if (window.confirm(`¿Eliminar ${name} de ${dogName}?`))
      deleteMedication(id);
  };

  const byDog = dogs.map((dog) => ({
    dog,
    meds: medications.filter((m) => m.dogId === dog.id),
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
      ) : medications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Pill size={64} strokeWidth={1.5} />
          <p className="mt-4 text-base text-gray-500 text-center">
            No hay medicamentos registrados
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {byDog.map(({ dog, meds }) =>
            meds.length === 0 ? null : (
              <div key={dog.id}>
                <div className="flex items-center gap-2 mb-3">
                  <Dog size={22} className="text-gray-800" />
                  <span className="text-gray-900 text-lg font-bold">
                    {dog.name}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {meds.map((med) => {
                    const isContinuous = med.durationDays === 0;
                    const days = daysRemaining(med.endDate);
                    const isExpired = !isContinuous && days < 0;
                    const isEndingSoon =
                      !isContinuous && days >= 0 && days <= 3;

                    return (
                      <div
                        key={med.id}
                        className={`bg-white rounded-2xl p-4 shadow-sm ${!med.isActive || isExpired ? "opacity-60" : ""}`}
                      >
                        <div className="flex gap-3">
                          <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center shrink-0">
                            <Pill size={22} className="text-pink-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 text-base font-bold mb-0.5">
                              {med.name}
                            </p>
                            <p className="text-gray-700 text-sm mb-1">
                              {med.dosage}
                            </p>
                            {med.scheduleType === "hours" &&
                              med.frequencyHours && (
                                <div className="flex items-center gap-1 mb-1">
                                  <Clock size={13} className="text-gray-500" />
                                  <span className="text-gray-600 text-xs">
                                    Cada {med.frequencyHours}h ·{" "}
                                    {med.scheduledTimes.length}x al día
                                  </span>
                                </div>
                              )}
                            {med.scheduledTimes.length > 0 && (
                              <div className="flex items-center gap-1 mb-1">
                                <Clock size={13} className="text-blue-500" />
                                <span className="text-blue-600 text-xs">
                                  {med.scheduledTimes.join(", ")}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1 mb-1">
                              <Calendar size={13} className="text-gray-500" />
                              <span className="text-gray-600 text-xs">
                                {formatDate(med.startDate)}{" "}
                                {isContinuous
                                  ? "· Continuo"
                                  : `— ${formatDate(med.endDate)}`}
                              </span>
                            </div>
                            {!isContinuous && !isExpired && (
                              <div className="flex items-center gap-1">
                                {isEndingSoon ? (
                                  <AlertTriangle
                                    size={13}
                                    className="text-orange-500"
                                  />
                                ) : (
                                  <CheckCircle
                                    size={13}
                                    className="text-green-600"
                                  />
                                )}
                                <span
                                  className={`text-xs font-semibold ${isEndingSoon ? "text-orange-600" : "text-green-600"}`}
                                >
                                  {days === 0
                                    ? "Último día"
                                    : days === 1
                                      ? "1 día restante"
                                      : `${days} días restantes`}
                                </span>
                              </div>
                            )}
                            {isContinuous && (
                              <div className="flex items-center gap-1">
                                <Infinity size={13} className="text-blue-600" />
                                <span className="text-blue-600 text-xs font-semibold">
                                  Tratamiento continuo
                                </span>
                              </div>
                            )}
                            {isExpired && (
                              <div className="flex items-center gap-1">
                                <X size={13} className="text-red-600" />
                                <span className="text-red-600 text-xs font-semibold">
                                  Tratamiento finalizado
                                </span>
                              </div>
                            )}
                            {med.notificationTime &&
                              med.notificationTime !== "none" && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Bell size={13} className="text-purple-600" />
                                  <span className="text-purple-600 text-xs">
                                    {med.notificationTime}
                                  </span>
                                </div>
                              )}
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <button
                              onClick={() => onNavigateToAddEdit(med.id)}
                              className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                            >
                              <Pencil size={15} className="text-indigo-600" />
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(med.id, dog.name, med.name)
                              }
                              className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                            >
                              <Trash2 size={15} className="text-red-600" />
                            </button>
                          </div>
                        </div>
                        {/* Toggle activo */}
                        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                          <span className="text-gray-600 text-sm">Activo</span>
                          <button
                            onClick={() => toggleMedicationActive(med.id)}
                            className={`w-11 h-6 rounded-full transition-colors ${med.isActive ? "bg-green-500" : "bg-gray-300"}`}
                          >
                            <div
                              className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${med.isActive ? "translate-x-5" : "translate-x-0"}`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
