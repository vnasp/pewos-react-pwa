import { useState } from "react";
import { Clock, Pencil, Trash2, Plus, Save, X } from "lucide-react";
import { useMealTimes } from "../context/MealTimesContext";
import type { MealTime } from "../types";

export default function MealTimesSettingsScreen() {
  const { mealTimes, addMealTime, updateMealTime, deleteMealTime } =
    useMealTimes();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTime, setEditTime] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTime, setNewTime] = useState("12:00");
  const [error, setError] = useState<string | null>(null);

  const handleEdit = (meal: MealTime) => {
    setEditingId(meal.id);
    setEditName(meal.name);
    setEditTime(meal.time);
    setError(null);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      setError("El nombre no puede estar vacío");
      return;
    }
    const meal = mealTimes.find((m) => m.id === editingId);
    if (!meal) return;
    await updateMealTime(editingId!, {
      name: editName.trim(),
      time: editTime,
      order: meal.order,
    });
    setEditingId(null);
    setError(null);
  };

  const handleAdd = async () => {
    if (!newName.trim()) {
      setError("El nombre no puede estar vacío");
      return;
    }
    await addMealTime({
      name: newName.trim(),
      time: newTime,
      order: mealTimes.length + 1,
    });
    setNewName("");
    setNewTime("12:00");
    setIsAdding(false);
    setError(null);
  };

  const handleDelete = (meal: MealTime) => {
    if (mealTimes.length <= 1) {
      setError("Debe haber al menos una comida");
      return;
    }
    if (window.confirm(`¿Eliminar "${meal.name}"?`)) deleteMealTime(meal.id);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-6 px-5 pt-5 lg:max-w-3xl lg:mx-auto lg:w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-900 font-bold text-lg">Horarios de Comida</h2>
        {!isAdding && (
          <button
            onClick={() => {
              setIsAdding(true);
              setError(null);
            }}
            className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
          >
            <Plus size={16} />
            Agregar
          </button>
        )}
      </div>

      {error && (
        <p className="text-red-600 text-sm mb-3 bg-red-50 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {/* Form nueva comida */}
      {isAdding && (
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 border-2 border-indigo-200">
          <p className="text-gray-700 font-semibold mb-3">Nueva comida</p>
          <label className="text-gray-600 text-xs font-semibold block mb-1">
            Nombre
          </label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ej: Merienda"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm mb-3 outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <label className="text-gray-600 text-xs font-semibold block mb-1">
            Hora
          </label>
          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm mb-4 outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 bg-green-500 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1 active:scale-95 transition-transform"
            >
              <Save size={16} /> Guardar
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setError(null);
              }}
              className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1"
            >
              <X size={16} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="flex flex-col gap-3">
        {mealTimes.map((meal) => (
          <div key={meal.id} className="bg-white rounded-2xl shadow-sm p-4">
            {editingId === meal.id ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm mb-2 outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm mb-3 outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 bg-green-500 text-white py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-1 active:scale-95 transition-transform"
                  >
                    <Save size={15} /> Guardar
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setError(null);
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-1"
                  >
                    <X size={15} /> Cancelar
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <Clock size={20} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-semibold">{meal.name}</p>
                  <p className="text-gray-500 text-sm">{meal.time}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(meal)}
                    className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Pencil size={15} className="text-indigo-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(meal)}
                    className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Trash2 size={15} className="text-red-600" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
