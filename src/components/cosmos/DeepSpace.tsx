import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Layer 1 — realistic animated deep-space environment.
 * Renders behind the Earth/ISS (no depth write, huge radius, back-side safe).
 * Cheap: 3 Points draw calls + one additive band mesh.
 */

function usePrefersReducedMotion() {
  return useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
}

/** deterministic-ish pseudo random so SSR/first frame is stable */
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Star colours: mostly white, subtle blue and yellow (stellar classes). */
function starColor(r: number, out: THREE.Color) {
  if (r < 0.1) out.setRGB(0.72, 0.80, 1.0);        // blue-white
  else if (r < 0.22) out.setRGB(0.85, 0.90, 1.0);  // white-blue
  else if (r < 0.72) out.setRGB(1.0, 1.0, 0.98);   // white
  else if (r < 0.9) out.setRGB(1.0, 0.95, 0.82);   // yellow-white
  else out.setRGB(1.0, 0.86, 0.72);                // warm
  return out;
}

const STAR_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aTwinkle;
  varying vec3 vColor;
  varying float vBright;
  uniform float uTime;
  uniform float uPixelRatio;
  void main() {
    vColor = color;
    float tw = 1.0 + aTwinkle * sin(uTime * 0.6 + aPhase * 6.2831);
    vBright = tw;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (300.0 / -mv.z);
  }
`;

const STAR_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vBright;
  uniform float uOpacity;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float core = smoothstep(0.5, 0.0, d);
    float halo = smoothstep(0.5, 0.15, d) * 0.35;
    float a = (core * core + halo) * uOpacity * vBright;
    if (a < 0.005) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

function StarShell({
  count,
  radius,
  sizeRange,
  seed,
  twinkle,
  opacity,
}: {
  count: number;
  radius: number;
  sizeRange: [number, number];
  seed: number;
  twinkle: number;
  opacity: number;
}) {
  const geometry = useMemo(() => {
    const rnd = mulberry32(seed);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const phase = new Float32Array(count);
    const tw = new Float32Array(count);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      // uniform on sphere
      const u = rnd() * 2 - 1;
      const t = rnd() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const r = radius * (0.9 + rnd() * 0.2);
      pos[i * 3] = r * s * Math.cos(t);
      pos[i * 3 + 1] = r * u;
      pos[i * 3 + 2] = r * s * Math.sin(t);
      // brightness distribution: many faint, few bright
      const mag = Math.pow(rnd(), 2.6);
      starColor(rnd(), c);
      const b = 0.28 + mag * 0.72;
      col[i * 3] = c.r * b;
      col[i * 3 + 1] = c.g * b;
      col[i * 3 + 2] = c.b * b;
      size[i] = sizeRange[0] + mag * (sizeRange[1] - sizeRange[0]);
      phase[i] = rnd();
      tw[i] = twinkle * (0.4 + rnd() * 0.6);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    g.setAttribute("aTwinkle", new THREE.BufferAttribute(tw, 1));
    return g;
  }, [count, radius, seed, twinkle, sizeRange[0], sizeRange[1]]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: STAR_VERT,
        fragmentShader: STAR_FRAG,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: opacity },
          uPixelRatio: { value: 1 },
        },
      }),
    [opacity],
  );

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

/** Faint Milky Way band — a wide, very low-opacity additive ring of dust. */
function MilkyWay({ radius }: { radius: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uOpacity: { value: 0.16 } },
        vertexShader: /* glsl */ `
          varying vec3 vPos;
          void main() {
            vPos = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec3 vPos;
          uniform float uOpacity;
          float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
          float noise(vec3 p){
            vec3 i = floor(p); vec3 f = fract(p); f = f*f*(3.0-2.0*f);
            float n = mix(mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
                              mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
                          mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
                              mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
            return n;
          }
          void main() {
            // band concentrated around the local equator (y ~ 0)
            float band = exp(-pow(vPos.y * 3.4, 2.0));
            float n = noise(vPos * 6.0) * 0.6 + noise(vPos * 14.0) * 0.4;
            float a = band * smoothstep(0.35, 0.95, n) * uOpacity;
            // extremely faint, slightly warm-grey galactic light
            vec3 col = mix(vec3(0.55,0.60,0.72), vec3(0.72,0.68,0.62), n);
            gl_FragColor = vec4(col, a);
          }
        `,
      }),
    [],
  );
  return (
    <mesh rotation={[0.42, 0.9, 0.35]} frustumCulled={false}>
      <sphereGeometry args={[radius, 32, 24]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

/** Tiny drifting foreground dust — gives parallax depth cues. */
function SpaceDust({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const rnd = mulberry32(99);
    const n = 220;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (rnd() - 0.5) * 18;
      pos[i * 3 + 1] = (rnd() - 0.5) * 18;
      pos[i * 3 + 2] = (rnd() - 0.5) * 18;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: new THREE.Color("#cfd8e6"),
        size: 0.012,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  useFrame((_, dt) => {
    if (reduced || typeof document !== "undefined" && document.hidden) return;
    if (ref.current) {
      ref.current.rotation.y += dt * 0.004;
      ref.current.rotation.x += dt * 0.0015;
    }
  });
  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />;
}

export function DeepSpace({ nightSide = true }: { nightSide?: boolean }) {
  const reduced = usePrefersReducedMotion();
  const group = useRef<THREE.Group>(null);
  const target = nightSide ? 1 : 0.62;
  const current = useRef(target);

  useFrame((state, dt) => {
    if (typeof document !== "undefined" && document.hidden) return;
    const t = state.clock.elapsedTime;
    // orbital motion: distant sky drifts almost imperceptibly
    if (group.current && !reduced) {
      group.current.rotation.y = t * 0.0035;
      group.current.rotation.x = Math.sin(t * 0.02) * 0.012;
    }
    // day/night star visibility easing
    current.current += (target - current.current) * Math.min(1, dt * 0.6);
    group.current?.traverse((o) => {
      const m = (o as THREE.Points).material as THREE.ShaderMaterial | undefined;
      if (m?.uniforms?.uTime) {
        if (!reduced) m.uniforms.uTime.value = t;
        m.uniforms.uOpacity.value = (m.userData.baseOpacity ?? 1) * current.current;
        m.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
      }
    });
  });

  return (
    <group ref={group}>
      {/* far, dense faint field */}
      <StarShell count={5000} radius={90} sizeRange={[0.7, 2.2]} seed={7} twinkle={0.06} opacity={0.9} />
      {/* nearer, brighter stars with a touch more twinkle */}
      <StarShell count={900} radius={70} sizeRange={[1.4, 4.2]} seed={21} twinkle={0.14} opacity={1} />
      <MilkyWay radius={95} />
      <SpaceDust reduced={reduced} />
    </group>
  );
}
