import {
  Dumbbell,
  Clock,
  Repeat,
  Bell,
  Timer,
  Dog,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState } from "react";
import {
  useExercise,
  exerciseTypeLabels,
  exerciseTypeColors,
} from "../context/ExerciseContext";
import { useDogs } from "../context/DogsContext";

interface ExercisesListScreenProps {
  onNavigateToAddEdit: (exerciseId?: string) => void;
}

export default function ExercisesListScreen({
  onNavigateToAddEdit,
}: ExercisesListScreenProps) {
  const { exercises, deleteExercise, toggleExerciseActive } = useExercise();
  const { dogs } = useDogs();
  const [showFinished, setShowFinished] = useState(false);

  const handleDelete = (id: string, dogName: string) => {
    if (window.confirm(`¿Eliminar esta rutina de ${dogName}?`))
      deleteExercise(id);
  };

  const finishedCount = exercises.filter((e) => {
    if (e.isPermanent) return false;
    if (!e.endDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(e.endDate);
    end.setHours(0, 0, 0, 0);
    return end.getTime() < today.getTime();
  }).length;

  const visibleExercises = showFinished
    ? exercises
    : exercises.filter((e) => {
        if (e.isPermanent) return true;
        if (!e.endDate) return true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const end = new Date(e.endDate);
        end.setHours(0, 0, 0, 0);
        return end.getTime() >= today.getTime();
      });

  const byDog = dogs.map((dog) => ({
    dog,
    exs: visibleExercises.filter((e) => e.dogId === dog.id),
  }));

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-6">
      {finishedCount > 0 && (
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-gray-800 font-bold text-base">
            {visibleExercises.length} rutina
            {visibleExercises.length !== 1 ? "s" : ""}
          </h2>
          <button
            onClick={() => setShowFinished((v) => !v)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showFinished ? (
              <>
                <EyeOff size={14} />
                <span>Ocultar finalizados</span>
              </>
            ) : (
              <>
                <Eye size={14} />
                <span>
                  {finishedCount} finalizado{finishedCount !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </button>
        </div>
      )}
      <div className="px-5 pt-5">
        {dogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Dog size={64} strokeWidth={1.5} />
            <p className="mt-4 text-base text-gray-500 text-center">
              Primero agrega una mascota
            </p>
          </div>
        ) : exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Dumbbell size={64} strokeWidth={1.5} />
            <p className="mt-4 text-base text-gray-500 text-center">
              No hay rutinas de ejercicio
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {byDog.map(({ dog, exs }) =>
              exs.length === 0 ? null : (
                <div key={dog.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <Dog size={22} className="text-gray-800" />
                    <span className="text-gray-900 text-lg font-bold">
                      {dog.name}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {exs.map((ex) => (
                      <div
                        key={ex.id}
                        className={`bg-white rounded-2xl p-4 shadow-sm ${!ex.isActive ? "opacity-60" : ""}`}
                      >
                        <div className="flex gap-3">
                          <div
                            className={`w-12 h-12 ${exerciseTypeColors[ex.type] ?? "bg-gray-100"} rounded-xl flex items-center justify-center shrink-0`}
                          >
                            <Dumbbell size={22} className="text-gray-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 text-base font-bold mb-1">
                              {ex.type === "otro" && ex.customTypeDescription
                                ? ex.customTypeDescription
                                : exerciseTypeLabels[ex.type]}
                            </p>
                            <div className="flex items-center gap-1 mb-1">
                              <Timer size={13} className="text-gray-500" />
                              <span className="text-gray-700 text-sm">
                                {ex.durationMinutes} minutos
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mb-1">
                              <Repeat size={13} className="text-gray-500" />
                              <span className="text-gray-600 text-xs">
                                {ex.timesPerDay}{" "}
                                {ex.timesPerDay === 1 ? "vez" : "veces"} al día
                              </span>
                            </div>
                            {ex.scheduledTimes.length > 0 && (
                              <div className="flex items-center gap-1 mb-1">
                                <Clock size={13} className="text-blue-500" />
                                <span className="text-blue-600 text-xs">
                                  {ex.scheduledTimes.join(", ")}
                                </span>
                              </div>
                            )}
                            {ex.notificationTime &&
                              ex.notificationTime !== "none" && (
                                <div className="flex items-center gap-1">
                                  <Bell size={13} className="text-purple-600" />
                                  <span className="text-purple-600 text-xs">
                                    {ex.notificationTime}
                                  </span>
                                </div>
                              )}
                            {ex.notes && (
                              <p className="text-gray-500 text-xs mt-2">
                                {ex.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <button
                              onClick={() => onNavigateToAddEdit(ex.id)}
                              className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                            >
                              <Pencil size={15} className="text-indigo-600" />
                            </button>
                            <button
                              onClick={() => handleDelete(ex.id, dog.name)}
                              className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                            >
                              <Trash2 size={15} className="text-red-600" />
                            </button>
                          </div>
                        </div>
                        {/* Toggle */}
                        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                          <span className="text-gray-600 text-sm">Activo</span>
                          <button
                            onClick={() => toggleExerciseActive(ex.id)}
                            className={`w-11 h-6 rounded-full transition-colors ${ex.isActive ? "bg-green-500" : "bg-gray-300"}`}
                          >
                            <div
                              className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${ex.isActive ? "translate-x-5" : "translate-x-0"}`}
                            />
                          </button>
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
    </div>
  );
}
