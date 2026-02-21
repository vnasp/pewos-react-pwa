import { useState } from "react";
import {
  Calendar,
  Clock,
  Bell,
  Repeat,
  Dog,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  useCalendar,
  appointmentTypeLabels,
  appointmentTypeColors,
  recurrenceLabels,
} from "../context/CalendarContext";
import { useDogs } from "../context/DogsContext";

interface CalendarListScreenProps {
  onNavigateToAddEdit: (appointmentId?: string) => void;
}

type Filter = "upcoming" | "past" | "all";

function formatDate(date: Date) {
  const d = new Date(date);
  const weekday = d.toLocaleDateString("es-ES", { weekday: "long" });
  const day = d.getDate();
  const month = d.toLocaleDateString("es-ES", { month: "long" });
  const year = d.getFullYear();
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${day} ${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
}

export default function CalendarListScreen({
  onNavigateToAddEdit,
}: CalendarListScreenProps) {
  const { appointments, deleteAppointment } = useCalendar();
  const { dogs } = useDogs();
  const [filter, setFilter] = useState<Filter>("upcoming");

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar esta cita?"))
      await deleteAppointment(id);
  };

  const filtered = (() => {
    const todayTs = (() => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })();
    const sorted = [...appointments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    if (filter === "upcoming")
      return sorted.filter((a) => {
        const d = new Date(a.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() >= todayTs;
      });
    if (filter === "past")
      return sorted
        .filter((a) => {
          const d = new Date(a.date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() < todayTs;
        })
        .reverse();
    return sorted;
  })();

  const filterBtns: { key: Filter; label: string }[] = [
    { key: "upcoming", label: "Próximas" },
    { key: "past", label: "Pasadas" },
    { key: "all", label: "Todas" },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-6">
      {/* Filtros */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex gap-2">
          {filterBtns.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-colors ${
                filter === key
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-100 text-indigo-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5">
        {dogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Dog size={64} strokeWidth={1.5} />
            <p className="mt-4 text-base text-gray-500 text-center">
              Primero agrega una mascota
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Calendar size={64} strokeWidth={1.5} />
            <p className="mt-4 text-base text-gray-500 text-center">
              No hay citas{" "}
              {filter === "upcoming"
                ? "próximas"
                : filter === "past"
                  ? "pasadas"
                  : ""}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((apt) => (
              <div key={apt.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  {/* Icono tipo */}
                  <div
                    className={`w-12 h-12 ${appointmentTypeColors[apt.type]} rounded-xl flex items-center justify-center shrink-0`}
                  >
                    <Calendar size={22} className="text-gray-700" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-base font-bold mb-1">
                      {apt.type === "otro" && apt.customTypeDescription
                        ? apt.customTypeDescription
                        : appointmentTypeLabels[apt.type]}
                    </p>
                    <div className="flex items-center gap-1 mb-1">
                      <Dog size={13} className="text-gray-600 shrink-0" />
                      <span className="text-gray-700 text-sm">
                        {apt.dogName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <div className="flex items-center gap-1">
                        <Calendar size={13} className="text-gray-500" />
                        <span className="text-gray-600 text-xs">
                          {formatDate(apt.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={13} className="text-gray-500" />
                        <span className="text-gray-600 text-xs">
                          {apt.time}
                        </span>
                      </div>
                    </div>
                    {apt.recurrencePattern &&
                      apt.recurrencePattern !== "none" && (
                        <div className="flex items-center gap-1 mb-1">
                          <Repeat size={13} className="text-purple-600" />
                          <span className="text-purple-600 text-xs">
                            {recurrenceLabels[apt.recurrencePattern]}
                          </span>
                        </div>
                      )}
                    {apt.notificationTime &&
                      apt.notificationTime !== "none" && (
                        <div className="flex items-center gap-1 mt-1">
                          <Bell size={13} className="text-blue-600" />
                          <span className="text-blue-600 text-xs">
                            {apt.notificationTime}
                          </span>
                        </div>
                      )}
                    {apt.notes && (
                      <p className="text-gray-500 text-xs mt-1">{apt.notes}</p>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => onNavigateToAddEdit(apt.id)}
                      className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <Pencil size={15} className="text-indigo-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(apt.id)}
                      className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <Trash2 size={15} className="text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
