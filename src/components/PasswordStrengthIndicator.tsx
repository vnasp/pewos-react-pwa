import { Check, X } from "lucide-react";

const criteria = [
  { id: "length", regex: /^.{8,}$/, text: "Mín. 8 caracteres" },
  { id: "upper", regex: /[A-Z]/, text: "Mayúscula" },
  { id: "lower", regex: /[a-z]/, text: "Minúscula" },
  { id: "number", regex: /\d/, text: "Número" },
  { id: "special", regex: /[\W_]/, text: "Símbolo especial" },
];

const strengthColors = [
  "bg-red-500",
  "bg-red-400",
  "bg-yellow-400",
  "bg-lime-400",
  "bg-green-500",
];

const strengthLabels = ["Muy débil", "Débil", "Regular", "Buena", "Fuerte"];

export default function PasswordStrengthIndicator({
  password,
}: {
  password: string;
}) {
  if (!password) return null;

  const passed = criteria.filter((c) => c.regex.test(password)).length;
  const color = strengthColors[Math.min(passed - 1, 4)] ?? "bg-gray-200";
  const label = strengthLabels[Math.min(passed - 1, 4)] ?? "";

  return (
    <div className="mt-2 space-y-2">
      {/* Barra de fortaleza */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-white/30 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${color}`}
            style={{ width: `${(passed / criteria.length) * 100}%` }}
          />
        </div>
        <span className="text-white/80 text-xs font-medium w-16 text-right">
          {label}
        </span>
      </div>

      {/* Lista de criterios */}
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {criteria.map(({ id, regex, text }) => {
          const ok = regex.test(password);
          return (
            <li
              key={id}
              className={`flex items-center gap-1 text-xs ${ok ? "text-green-300" : "text-white/50"}`}
            >
              {ok ? <Check size={12} /> : <X size={12} />}
              {text}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Devuelve true si la contraseña cumple todos los criterios */
export function isPasswordStrong(password: string): boolean {
  return criteria.every((c) => c.regex.test(password));
}
