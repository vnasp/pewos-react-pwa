const tabs = [
  {
    id: "home",
    label: "Hoy",
    icon: (active: boolean) => (
      <svg
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12l9-9 9 9M4.5 10.5V20a.5.5 0 00.5.5h4.5v-5h5v5H19a.5.5 0 00.5-.5V10.5"
        />
      </svg>
    ),
  },
  {
    id: "pets",
    label: "Mascotas",
    icon: (active: boolean) => (
      <svg
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-6 h-6"
      >
        <circle cx="4.5" cy="9" r="1.5" fill="currentColor" />
        <circle cx="9" cy="5" r="1.5" fill="currentColor" />
        <circle cx="15" cy="5" r="1.5" fill="currentColor" />
        <circle cx="19.5" cy="9" r="1.5" fill="currentColor" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 13c-4 0-7 2.5-7 5.5 0 1.4 1.8 2 4 2 1.1 0 2.2-.3 3-.3.8 0 1.9.3 3 .3 2.2 0 4-.6 4-2C19 15.5 16 13 12 13z"
        />
      </svg>
    ),
  },
  {
    id: "appointments",
    label: "Agenda",
    icon: (active: boolean) => (
      <svg
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-6 h-6"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Ajustes",
    icon: (active: boolean) => (
      <svg
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.325 4.317a1.724 1.724 0 003.35 0 1.724 1.724 0 012.573 1.066 1.724 1.724 0 002.572 2.572 1.724 1.724 0 001.065 2.572 1.724 1.724 0 000 3.35 1.724 1.724 0 00-1.065 2.572 1.724 1.724 0 00-2.572 2.572 1.724 1.724 0 00-3.35 0 1.724 1.724 0 00-2.573-1.066 1.724 1.724 0 00-2.572-2.572 1.724 1.724 0 00-1.065-2.572 1.724 1.724 0 000-3.35 1.724 1.724 0 001.065-2.572 1.724 1.724 0 002.572-2.572A1.724 1.724 0 0010.325 4.317z"
        />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

interface TabBarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  className?: string;
}

export default function TabBar({
  currentScreen,
  onNavigate,
  className = "",
}: TabBarProps) {
  return (
    <nav
      className={`bg-indigo-600 border-t border-indigo-700 pb-safe lg:border-t-0 lg:border-r lg:pb-0 lg:w-24 lg:shrink-0 ${className}`}
    >
      <div className="flex pt-2.5 min-h-16 lg:flex-col lg:pt-8 lg:min-h-0 lg:h-full lg:gap-4">
        {tabs.map((tab) => {
          const isActive = currentScreen === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex-1 lg:flex-none flex flex-col items-center justify-center gap-1 transition-opacity lg:py-4 ${
                isActive ? "text-white" : "text-white/50 hover:text-white/70"
              }`}
            >
              {tab.icon(isActive)}
              <span className="text-[10px] font-semibold lg:text-xs">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
