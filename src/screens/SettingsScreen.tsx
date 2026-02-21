import { LogOut, Users, Clock, Pill, Dumbbell } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface SettingsScreenProps {
  onNavigateToMealTimes: () => void;
  onNavigateToSharedAccess: () => void;
  onNavigateToMedications: () => void;
  onNavigateToExercises: () => void;
}

export default function SettingsScreen({
  onNavigateToMealTimes,
  onNavigateToSharedAccess,
  onNavigateToMedications,
  onNavigateToExercises,
}: SettingsScreenProps) {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    if (window.confirm("¿Cerrar sesión?")) await signOut();
  };

  const sections = [
    {
      title: "Gestión",
      items: [
        {
          label: "Medicamentos",
          icon: Pill,
          action: onNavigateToMedications,
          color: "bg-pink-100",
          fg: "text-pink-600",
        },
        {
          label: "Rutinas de ejercicio",
          icon: Dumbbell,
          action: onNavigateToExercises,
          color: "bg-green-100",
          fg: "text-green-600",
        },
        {
          label: "Horarios de comida",
          icon: Clock,
          action: onNavigateToMealTimes,
          color: "bg-amber-100",
          fg: "text-amber-600",
        },
        {
          label: "Acceso compartido",
          icon: Users,
          action: onNavigateToSharedAccess,
          color: "bg-indigo-100",
          fg: "text-indigo-600",
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-6">
      {/* User info */}
      <div className="px-5 pt-6 pb-4">
        <div className="bg-indigo-50 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-200 rounded-full flex items-center justify-center">
            <span className="text-indigo-700 font-bold text-lg uppercase">
              {user?.email?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 font-semibold truncate">
              {user?.email}
            </p>
            <p className="text-gray-500 text-xs">Cuenta activa</p>
          </div>
        </div>
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <div key={section.title} className="px-5 mb-5">
          <p className="text-gray-500 text-xs font-semibold uppercase mb-3">
            {section.title}
          </p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
            {section.items.map(({ label, icon: Icon, action, color, fg }) => (
              <button
                key={label}
                onClick={action}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
              >
                <div
                  className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center shrink-0`}
                >
                  <Icon size={18} className={fg} />
                </div>
                <span className="text-gray-800 font-medium text-sm flex-1">
                  {label}
                </span>
                <span className="text-gray-300 text-lg">›</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Sign out */}
      <div className="px-5">
        <button
          onClick={handleSignOut}
          className="w-full bg-red-50 text-red-600 font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
