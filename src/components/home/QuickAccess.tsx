import { Pill, Calendar, Dumbbell, HeartPulse } from "lucide-react";

interface QuickAccessProps {
  onNavigateToMedications: () => void;
  onNavigateToCalendar: () => void;
  onNavigateToExercises: () => void;
  onNavigateToCares: () => void;
}

const items = [
  {
    label: "Medicamentos",
    icon: Pill,
    bg: "bg-pink-100",
    fg: "text-pink-700",
    key: "medications" as const,
  },
  {
    label: "Agenda",
    icon: Calendar,
    bg: "bg-blue-100",
    fg: "text-blue-700",
    key: "calendar" as const,
  },
  {
    label: "Ejercicios",
    icon: Dumbbell,
    bg: "bg-green-100",
    fg: "text-green-700",
    key: "exercises" as const,
  },
  {
    label: "Cuidados",
    icon: HeartPulse,
    bg: "bg-rose-100",
    fg: "text-rose-700",
    key: "cares" as const,
  },
];

export default function QuickAccess({
  onNavigateToMedications,
  onNavigateToCalendar,
  onNavigateToExercises,
  onNavigateToCares,
}: QuickAccessProps) {
  const actions = {
    medications: onNavigateToMedications,
    calendar: onNavigateToCalendar,
    exercises: onNavigateToExercises,
    cares: onNavigateToCares,
  };

  return (
    <div className="grid grid-cols-4 gap-3 px-5 pt-6 pb-4">
      {items.map(({ label, icon: Icon, bg, fg, key }) => (
        <button
          key={key}
          onClick={actions[key]}
          className={`${bg} rounded-xl flex flex-col items-center justify-center gap-1.5 py-3 active:scale-95 transition-transform`}
        >
          <Icon size={22} className={fg} />
          <span
            className={`text-[10px] font-semibold ${fg} leading-tight text-center`}
          >
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}
