import type { Dog } from "../../types";

interface DogFilterTabsProps {
  dogs: Dog[];
  selectedDogId: string | null;
  onSelect: (id: string | null) => void;
  totalCount: number;
  countByDog: Record<string, number>;
}

export default function DogFilterTabs({
  dogs,
  selectedDogId,
  onSelect,
  totalCount,
  countByDog,
}: DogFilterTabsProps) {
  if (dogs.length <= 1) return null;

  return (
    <div className="px-5 mb-1">
      <div className="flex gap-2 overflow-x-auto py-3 scrollbar-none">
        {/* Todas */}
        <button
          onClick={() => onSelect(null)}
          className={`shrink-0 flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
            selectedDogId === null
              ? "bg-indigo-600 text-white"
              : "bg-indigo-100 text-indigo-700"
          }`}
        >
          Todas
          {totalCount > 0 && (
            <span
              className={`ml-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                selectedDogId === null
                  ? "bg-white/30 text-white"
                  : "bg-indigo-200 text-indigo-800"
              }`}
            >
              {totalCount}
            </span>
          )}
        </button>

        {dogs.map((dog) => {
          const count = countByDog[dog.id] ?? 0;
          if (count === 0) return null;
          const active = selectedDogId === dog.id;
          return (
            <button
              key={dog.id}
              onClick={() => onSelect(dog.id)}
              className={`shrink-0 flex items-center gap-1.5 h-7 pe-2 rounded-full text-sm font-semibold transition-colors ${
                active
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-100 text-indigo-700"
              }`}
            >
              {dog.photo ? (
                <img
                  src={dog.photo}
                  alt={dog.name}
                  className={`w-8 h-8 rounded-full object-cover shrink-0 ring-2 ${active ? "ring-indigo-600" : "ring-indigo-100"}`}
                />
              ) : (
                <span className="text-base leading-none">🐕</span>
              )}
              {dog.name}
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  active
                    ? "bg-white/30 text-white"
                    : "bg-indigo-200 text-indigo-800"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
