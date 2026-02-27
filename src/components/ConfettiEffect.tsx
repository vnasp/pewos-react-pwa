import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ConfettiEffectProps {
  /** Coordenadas del punto de origen (centro donde ocurrió la acción) */
  originX: number;
  originY: number;
  /** Callback cuando la animación termina */
  onDone?: () => void;
}

const COLORS = [
  "#6366f1", // indigo
  "#f97316", // orange
  "#22c55e", // green
  "#ec4899", // pink
  "#facc15", // yellow
  "#38bdf8", // sky
  "#a855f7", // purple
  "#f43f5e", // rose
];

const SHAPES = ["rect", "circle", "rect", "rect"] as const; // más rectángulos que círculos

function rnd(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function ConfettiEffect({
  originX,
  originY,
  onDone,
}: ConfettiEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const PIECES = 48;
    const MAX_DURATION = 2000; // ms — duración máx de una pieza + delay
    const pieces: HTMLElement[] = [];

    for (let i = 0; i < PIECES; i++) {
      const el = document.createElement("div");
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      const size = rnd(6, 12);
      const delay = rnd(0, 300);
      const duration = rnd(1400, 2200);

      // Dispersión
      const angle = rnd(0, Math.PI * 2);
      const distance = rnd(80, 260);
      const cx = Math.cos(angle) * distance;
      const cy = Math.sin(angle) * distance;
      const cr = rnd(-720, 720);

      el.className = "confetti-piece";
      el.style.cssText = `
        left: ${originX}px;
        top: ${originY}px;
        width: ${shape === "circle" ? size : rnd(6, 14)}px;
        height: ${shape === "circle" ? size : rnd(4, 8)}px;
        background: ${color};
        border-radius: ${shape === "circle" ? "50%" : "2px"};
        --cx: ${cx}px;
        --cy: ${cy}px;
        --cr: ${cr}deg;
        --cd: ${duration}ms;
        --delay: ${delay}ms;
        z-index: 9999;
        margin-left: -${size / 2}px;
        margin-top: -${size / 2}px;
      `;

      document.body.appendChild(el);
      pieces.push(el);
    }

    // Anillo de éxito (pulse) en el origen
    const ring = document.createElement("div");
    ring.className = "success-ring";
    ring.style.cssText = `
      left: ${originX}px;
      top: ${originY}px;
      width: 48px;
      height: 48px;
      border: 3px solid #22c55e;
      background: transparent;
      z-index: 9998;
    `;
    document.body.appendChild(ring);

    // Ícono de check en el origen
    const check = document.createElement("div");
    check.className = "success-check";
    check.style.cssText = `
      left: ${originX}px;
      top: ${originY}px;
      width: 36px;
      height: 36px;
      background: #22c55e;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `;
    check.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    document.body.appendChild(check);

    const cleanupTimer = setTimeout(() => {
      pieces.forEach((p) => p.remove());
      ring.remove();
      check.remove();
      onDone?.();
    }, MAX_DURATION + 400);

    return () => {
      clearTimeout(cleanupTimer);
      pieces.forEach((p) => p.remove());
      ring.remove();
      check.remove();
    };
  }, []);

  // El componente en sí no renderiza nada visible — todo va al body
  return createPortal(<div ref={containerRef} />, document.body);
}
