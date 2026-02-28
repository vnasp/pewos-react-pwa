import { useEffect } from "react";

interface Props {
  onContinue: () => void;
}

export default function OnboardingScreen({ onContinue }: Props) {
  // Prevent text selection on the screen
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener("selectstart", prevent);
    return () => document.removeEventListener("selectstart", prevent);
  }, []);

  return (
    <div className="relative w-full h-svh overflow-hidden flex flex-col">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-linear-to-b from-indigo-800 to-indigo-600" />

      {/* Floating circle top-right */}
      <div className="absolute rounded-full bg-indigo-600 opacity-40 animate-float-up w-75 h-75 -top-37.5 -right-25" />

      {/* Floating circle bottom-left */}
      <div className="absolute rounded-full bg-indigo-700 opacity-40 animate-float-down w-62.5 h-62.5 -bottom-25 -left-12.5" />

      {/* Pulsing ring 1 */}
      <div className="absolute rounded-full animate-pulse-ring w-100 h-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500/25 z-6" />

      {/* Pulsing ring 2 */}
      <div
        className="absolute rounded-full animate-pulse-ring-slow w-100 h-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500/20 z-6"
        style={{ animationDelay: "1.5s" }}
      />

      {/* Background image */}
      <img
        src="/assets/onboarding.webp"
        alt=""
        className="absolute inset-0 w-full h-full object-cover z-10"
        fetchPriority="high"
        draggable={false}
      />

      {/* Content */}
      <div className="relative flex flex-col flex-1 px-5 pt-5 z-10">
        {/* Title */}
        <div className="flex-1 flex flex-col justify-start pt-28 text-center">
          <h1 className="text-4xl font-medium text-white leading-tight">
            Todo la agenda de <br />
            <span className="font-black text-white">tu mascota</span>
            <br />
            en un solo lugar
          </h1>
        </div>

        {/* Button */}
        <div className="pb-10 px-5">
          <button
            onClick={onContinue}
            className="w-full lg:max-w-md lg:mx-auto h-16 rounded-full bg-[#f97316] text-white text-base font-semibold active:opacity-80 transition-opacity lg:block"
          >
            Comenzar
          </button>
        </div>
      </div>
    </div>
  );
}
