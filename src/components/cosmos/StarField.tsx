import { useMemo } from "react";

/** Layered starfield + drifting nebula + auroras + shooting stars. Fixed to viewport. */
export function StarField() {
  const stars = useMemo(() => {
    return Array.from({ length: 140 }).map((_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 5,
    }));
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* nebula blobs */}
      <div className="absolute -top-40 -left-40 h-[60vw] w-[60vw] rounded-full blur-3xl opacity-40"
        style={{ background: "radial-gradient(circle, oklch(0.55 0.20 285 / 0.55), transparent 60%)" }} />
      <div className="absolute top-1/3 -right-40 h-[55vw] w-[55vw] rounded-full blur-3xl opacity-30"
        style={{ background: "radial-gradient(circle, oklch(0.65 0.18 210 / 0.55), transparent 60%)" }} />
      <div className="absolute -bottom-40 left-1/4 h-[50vw] w-[50vw] rounded-full blur-3xl opacity-25"
        style={{ background: "radial-gradient(circle, oklch(0.60 0.22 320 / 0.5), transparent 60%)" }} />

      {/* aurora ribbons */}
      <div className="absolute inset-0 animate-aurora"
        style={{ background: "linear-gradient(120deg, transparent 40%, oklch(0.70 0.20 180 / 0.18) 55%, transparent 70%)" }} />

      {/* stars */}
      {stars.map((s) => (
        <span key={s.id}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            top: `${s.top}%`, left: `${s.left}%`,
            width: s.size, height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}

      {/* shooting stars */}
      <span className="absolute h-px w-24 bg-gradient-to-r from-transparent via-white to-transparent animate-shoot"
        style={{ top: "10%", left: "20%", animationDelay: "2s" }} />
      <span className="absolute h-px w-32 bg-gradient-to-r from-transparent via-cyan-glow to-transparent animate-shoot"
        style={{ top: "40%", left: "60%", animationDelay: "8s" }} />
    </div>
  );
}