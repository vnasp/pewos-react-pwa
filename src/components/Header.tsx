import type { ReactNode } from "react";

interface HeaderProps {
  title1: string;
  title2: string;
  showAddButton?: boolean;
  onAddPress?: () => void;
  rightContent?: ReactNode;
}

export default function Header({
  title1,
  title2,
  showAddButton = false,
  onAddPress,
  rightContent,
}: HeaderProps) {
  return (
    <header className="bg-indigo-600 pb-10 pt-safe">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Texto */}
        <div className="flex-1">
          <p className="text-[22px] font-normal text-white opacity-90 mb-1 leading-tight">
            {title1}
          </p>
          <p className="text-[42px] font-bold text-white tracking-wide leading-none">
            {title2}
          </p>
        </div>

        {/* Derecha */}
        <div className="flex items-center gap-3">
          <img
            src="/assets/vet-icon.png"
            alt="Pewos Agenda"
            className="w-auto h-7.25 brightness-0 invert"
          />
          {showAddButton && onAddPress && (
            <button
              onClick={onAddPress}
              className="p-1 text-white text-3xl leading-none"
              aria-label="Agregar"
            >
              ＋
            </button>
          )}
          {rightContent}
        </div>
      </div>
    </header>
  );
}
