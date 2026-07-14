import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, OrbitControls, useTexture } from "@react-three/drei";
import { useMemo, useRef, Suspense } from "react";
import * as THREE from "three";

interface Props {
  lat: number;
  lon: number;
  altitudeKm: number;
  history?: Array<{ lat: number; lon: number }>;
}

const TEX_BASE = "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/";
const SUN_DIR = new THREE.Vector3(5, 2, 5).normalize();

/** Convert geo → cartesian on a unit sphere. */
function geoToVec3(lat: number, lon: number, r = 1): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const [dayMap, normalMap, specMap, cloudsMap, nightMap] = useTexture([
    TEX_BASE + "earth_atmos_2048.jpg",
    TEX_BASE + "earth_normal_2048.jpg",
    TEX_BASE + "earth_specular_2048.jpg",
    TEX_BASE + "earth_clouds_1024.png",
    TEX_BASE + "earth_lights_2048.png",
  ]);
  // colorSpace for correct color reproduction
  [dayMap, cloudsMap, nightMap].forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; });

  useFrame((_, dt) => {
    if (earthRef.current) earthRef.current.rotation.y += dt * 0.02;
    if (cloudsRef.current) cloudsRef.current.rotation.y += dt * 0.024;
  });

  return (
    <group>
      {/* Earth surface — day + night lights via emissive */}
      <mesh ref={earthRef} castShadow receiveShadow>
        <sphereGeometry args={[1, 96, 96]} />
        <meshPhongMaterial
          map={dayMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.8, 0.8)}
          specularMap={specMap}
          specular={new THREE.Color("#2a4d6e")}
          shininess={16}
          emissiveMap={nightMap}
          emissive={new THREE.Color("#ffd27f")}
          emissiveIntensity={0.55}
        />
      </mesh>
      {/* Cloud layer */}
      <mesh ref={cloudsRef} scale={1.008}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshLambertMaterial
          map={cloudsMap}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/** Fresnel-based atmospheric rim glow. */
function Atmosphere() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uColor: { value: new THREE.Color("#4aa8ff") },
          uIntensity: { value: 1.15 },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vView = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          varying vec3 vView;
          uniform vec3 uColor;
          uniform float uIntensity;
          void main() {
            float rim = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.5);
            gl_FragColor = vec4(uColor, rim * uIntensity);
          }
        `,
      }),
    [],
  );
  return (
    <mesh scale={1.09}>
      <sphereGeometry args={[1, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

/**
 * Detailed ISS built from primitives:
 * - central pressurized modules (Zvezda / Zarya / Destiny stack)
 * - long ITS truss with 4 pairs of solar array wings (blue)
 * - white thermal radiator panels
 * - Canadarm-style boom
 * Oriented so the truss runs east-west along orbit tangent.
 */
function IssModel() {
  const arrayMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0a2a6b",
        emissive: "#1a3a8a",
        emissiveIntensity: 0.25,
        roughness: 0.35,
        metalness: 0.6,
      }),
    [],
  );
  const moduleMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#e8ecef",
        roughness: 0.55,
        metalness: 0.4,
      }),
    [],
  );
  const trussMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#b8bcc4",
        roughness: 0.65,
        metalness: 0.7,
      }),
    [],
  );
  const radiatorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#f4f6f8",
        roughness: 0.9,
        metalness: 0.1,
      }),
    [],
  );

  // Truss offsets (X axis) for the 4 solar-array pairs
  const wingOffsets = [-0.42, -0.28, 0.28, 0.42];

  return (
    <group>
      {/* --- Central truss (long thin box on X) --- */}
      <mesh material={trussMat}>
        <boxGeometry args={[1.0, 0.03, 0.03]} />
      </mesh>

      {/* --- Pressurized module stack (perpendicular, along Z) --- */}
      <mesh material={moduleMat} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.34, 16]} />
      </mesh>
      {/* Node modules (cubes) */}
      <mesh material={moduleMat} position={[0, 0, 0.19]}>
        <boxGeometry args={[0.08, 0.08, 0.06]} />
      </mesh>
      <mesh material={moduleMat} position={[0, 0, -0.19]}>
        <boxGeometry args={[0.08, 0.08, 0.06]} />
      </mesh>
      {/* Side module (Columbus-ish) */}
      <mesh material={moduleMat} position={[0.09, 0, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.14, 12]} />
      </mesh>
      <mesh material={moduleMat} position={[-0.09, 0, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.14, 12]} />
      </mesh>

      {/* --- Solar array wings — 4 pairs along truss, extending on ±Z --- */}
      {wingOffsets.map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          {/* +Z wing */}
          <mesh material={arrayMat} position={[0, 0, 0.28]}>
            <boxGeometry args={[0.09, 0.005, 0.36]} />
          </mesh>
          {/* -Z wing */}
          <mesh material={arrayMat} position={[0, 0, -0.28]}>
            <boxGeometry args={[0.09, 0.005, 0.36]} />
          </mesh>
          {/* connecting mast to truss */}
          <mesh material={trussMat}>
            <boxGeometry args={[0.012, 0.012, 0.18]} />
          </mesh>
        </group>
      ))}

      {/* --- Thermal radiator panels (white, on Y axis) --- */}
      <mesh material={radiatorMat} position={[0, 0.11, 0]}>
        <boxGeometry args={[0.28, 0.004, 0.14]} />
      </mesh>
      <mesh material={radiatorMat} position={[0, -0.11, 0]}>
        <boxGeometry args={[0.28, 0.004, 0.14]} />
      </mesh>

      {/* --- Canadarm2 boom (small) --- */}
      <mesh material={trussMat} position={[0.06, 0.04, 0.05]} rotation={[0, 0, Math.PI / 5]}>
        <cylinderGeometry args={[0.006, 0.006, 0.12, 8]} />
      </mesh>

      {/* subtle running light */}
      <pointLight color="#7ff4ff" intensity={0.4} distance={0.5} />
    </group>
  );
}

function Iss({ lat, lon, altitudeKm }: { lat: number; lon: number; altitudeKm: number }) {
  const r = 1 + (altitudeKm / 6371) * 6; // exaggerate altitude for visibility
  const pos = geoToVec3(lat, lon, r);
  const groupRef = useRef<THREE.Group>(null);

  // Orient so "up" (+Y) points away from Earth centre; the truss (X) roughly
  // lies along the local east-west tangent.
  const quaternion = useMemo(() => {
    const up = pos.clone().normalize();
    const north = new THREE.Vector3(0, 1, 0);
    const east = new THREE.Vector3().crossVectors(north, up).normalize();
    if (east.lengthSq() < 1e-6) east.set(1, 0, 0);
    const localNorth = new THREE.Vector3().crossVectors(up, east).normalize();
    const m = new THREE.Matrix4().makeBasis(east, up, localNorth);
    return new THREE.Quaternion().setFromRotationMatrix(m);
  }, [pos.x, pos.y, pos.z]);

  useFrame((_, dt) => {
    if (groupRef.current) {
      // gentle attitude wobble
      groupRef.current.rotation.y += dt * 0.05;
    }
  });

  return (
    <group position={pos} quaternion={quaternion}>
      <group ref={groupRef} scale={0.11}>
        <IssModel />
      </group>
    </group>
  );
}

function OrbitTrail({ history }: { history: Array<{ lat: number; lon: number }> }) {
  const points = useMemo(
    () => history.map((p) => geoToVec3(p.lat, p.lon, 1.035)),
    [history],
  );
  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  if (points.length < 2) return null;
  return (
    <primitive object={new THREE.Line(geo, new THREE.LineBasicMaterial({ color: "#7ff4ff", transparent: true, opacity: 0.7 }))} />
  );
}

export function EarthGlobe({ lat, lon, altitudeKm, history = [] }: Props) {
  return (
    <Canvas camera={{ position: [0, 0, 3.2], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true }}>
      <color attach="background" args={["#00000000"]} />
      <ambientLight intensity={0.12} />
      <directionalLight
        position={[SUN_DIR.x * 5, SUN_DIR.y * 5, SUN_DIR.z * 5]}
        intensity={1.6}
        color="#fff5e6"
      />
      <Stars radius={100} depth={50} count={4000} factor={4} fade speed={0.4} />
      <Suspense fallback={null}>
        <Earth />
      </Suspense>
      <Atmosphere />
      <OrbitTrail history={history} />
      <Iss lat={lat} lon={lon} altitudeKm={altitudeKm} />
      <OrbitControls enablePan={false} enableZoom minDistance={1.6} maxDistance={6} autoRotate={false} />
    </Canvas>
  );
}