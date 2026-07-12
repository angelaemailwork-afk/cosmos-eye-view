import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

/**
 * Deep-space ambient drone, synthesized with the WebAudio API.
 * Zero network cost, ~0kb of assets. Toggle stored in localStorage.
 * Autoplay is gated behind the user's first gesture per browser policy.
 */
export function AmbientSound() {
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);

  // Read stored preference on mount
  useEffect(() => {
    setReady(true);
    const saved = typeof window !== "undefined" && localStorage.getItem("cosmos:ambient");
    if (saved === "on") setOn(true);
  }, []);

  useEffect(() => {
    if (!on) {
      // fade out & suspend
      const ctx = ctxRef.current;
      const master = masterRef.current;
      if (ctx && master) {
        const now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.linearRampToValueAtTime(0.0001, now + 0.8);
        setTimeout(() => { void ctx.suspend(); }, 850);
      }
      return;
    }

    // Build graph lazily on first enable
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = 0.0001;
      master.connect(ctx.destination);

      // Two detuned low oscillators → deep pad
      const freqs = [55, 82.5, 110];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = i === 0 ? "sine" : "triangle";
        osc.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = 0.18 / (i + 1);

        // Slow LFO for shimmer
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.05 + i * 0.03;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.06;
        lfo.connect(lfoGain).connect(g.gain);

        osc.connect(g).connect(master);
        osc.start();
        lfo.start();
      });

      // Filtered pink-ish noise for cosmic wind
      const bufSize = 2 * ctx.sampleRate;
      const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + 0.0555 * white;
        b1 = 0.96 * b1 + 0.2965 * white;
        b2 = 0.57 * b2 + 1.0526 * white;
        data[i] = (b0 + b1 + b2) * 0.15;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;
      noise.loop = true;
      const nFilter = ctx.createBiquadFilter();
      nFilter.type = "lowpass";
      nFilter.frequency.value = 400;
      const nGain = ctx.createGain();
      nGain.gain.value = 0.12;
      noise.connect(nFilter).connect(nGain).connect(master);
      noise.start();

      ctxRef.current = ctx;
      masterRef.current = master;
    }

    const ctx = ctxRef.current;
    const master = masterRef.current!;
    void ctx.resume().then(() => {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0.35, now + 1.5);
    });

    // Pause when tab hidden to save CPU
    const onVis = () => {
      if (!ctxRef.current) return;
      if (document.hidden) void ctxRef.current.suspend();
      else void ctxRef.current.resume();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [on]);

  const toggle = () => {
    const next = !on;
    setOn(next);
    try { localStorage.setItem("cosmos:ambient", next ? "on" : "off"); } catch { /* ignore */ }
  };

  if (!ready) return null;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={on ? "Mute ambient space audio" : "Play ambient space audio"}
      title={on ? "Mute ambient space audio" : "Play ambient space audio"}
      className="fixed bottom-4 right-4 z-40 h-11 w-11 rounded-full glass shadow-glow grid place-items-center text-foreground/80 hover:text-foreground transition"
    >
      {on ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4" />}
    </button>
  );
}