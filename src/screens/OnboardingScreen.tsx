import { useEffect, useRef, useState } from "react";

interface Props {
  onContinue: () => void;
}

export default function OnboardingScreen({ onContinue }: Props) {
  const [slideX, setSlideX] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);
  const sliderTrackRef = useRef<HTMLDivElement>(null);

  // Max distance the thumb can travel (track width - thumb width - padding)
  const maxSlide = () => {
    if (!sliderTrackRef.current) return 240;
    return sliderTrackRef.current.offsetWidth - 60 - 10; // track - thumb - padding
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    startX.current = e.clientX - slideX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const newX = e.clientX - startX.current;
    setSlideX(Math.max(0, Math.min(newX, maxSlide())));
  };

  const handlePointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (slideX >= maxSlide() * 0.7) {
      setSlideX(maxSlide());
      setTimeout(onContinue, 300);
    } else {
      setSlideX(0);
    }
  };

  // Prevent text selection while dragging
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener("selectstart", prevent);
    return () => document.removeEventListener("selectstart", prevent);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col">
      {/* Gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, #3730a3, #4f46e5, #f97316)",
        }}
      />

      {/* Floating circle top-right */}
      <div
        className="absolute rounded-full bg-indigo-600 opacity-40 animate-float-up"
        style={{ width: 300, height: 300, top: -150, right: -100 }}
      />

      {/* Floating circle bottom-left */}
      <div
        className="absolute rounded-full bg-indigo-700 opacity-40 animate-float-down"
        style={{ width: 250, height: 250, bottom: -100, left: -50 }}
      />

      {/* Pulsing ring 1 */}
      <div
        className="absolute rounded-full animate-pulse-ring"
        style={{
          width: 400,
          height: 400,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(99, 102, 241, 0.25)",
          zIndex: 6,
        }}
      />

      {/* Pulsing ring 2 */}
      <div
        className="absolute rounded-full animate-pulse-ring-slow"
        style={{
          width: 400,
          height: 400,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(99, 102, 241, 0.2)",
          zIndex: 6,
          animationDelay: "1.5s",
        }}
      />

      {/* Background image */}
      <img
        src="/assets/onboarding.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 5 }}
        draggable={false}
      />

      {/* Content */}
      <div
        className="relative flex flex-col flex-1 px-5 pt-10"
        style={{ zIndex: 10 }}
      >
        {/* Title */}
        <div className="flex-1 flex flex-col justify-start pt-28 text-center">
          <h1 className="text-4xl font-semibold text-white leading-tight">
            Todo la agenda de <br />
            <span className="font-black text-white">tu mascota</span>
            <br />
            en un solo lugar
          </h1>
        </div>

        {/* Slide-to-start button */}
        <div className="pb-10 px-5">
          <div
            ref={sliderTrackRef}
            className="relative h-16 rounded-full flex items-center overflow-hidden select-none bg-[#f97316]"
          >
            {/* Thumb */}
            <div
              className="absolute left-[5px] w-[50px] h-[50px] rounded-full bg-white flex items-center justify-center cursor-grab active:cursor-grabbing"
              style={{
                zIndex: 2,
                transform: `translateX(${slideX}px)`,
                transition: dragging.current ? "none" : "transform 0.3s ease",
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <span className="text-2xl font-bold text-orange-500">→</span>
            </div>

            {/* Label */}
            <span
              className="w-full text-center text-base font-semibold text-white pointer-events-none"
              style={{ opacity: 1 - slideX / (maxSlide() || 1) }}
            >
              Comenzar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
