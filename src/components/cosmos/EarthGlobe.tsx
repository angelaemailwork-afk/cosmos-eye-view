import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface Props {
  lat: number;
  lon: number;
  altitudeKm: number;
  history?: Array<{ lat: number; lon: number }>;
}

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
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => { if (mesh.current) mesh.current.rotation.y += dt * 0.03; });
  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial
        color="#1e3a5f"
        emissive="#0a1628"
        emissiveIntensity={0.4}
        roughness={0.85}
        metalness={0.1}
        wireframe={false}
      />
    </mesh>
  );
}

function Atmosphere() {
  return (
    <mesh scale={1.08}>
      <sphereGeometry args={[1, 48, 48]} />
      <meshBasicMaterial color="#00B4D8" transparent opacity={0.08} side={THREE.BackSide} />
    </mesh>
  );
}

function IssMarker({ lat, lon, altitudeKm }: { lat: number; lon: number; altitudeKm: number }) {
  const r = 1 + altitudeKm / 6371; // scale altitude
  const pos = geoToVec3(lat, lon, r);
  return (
    <group position={pos}>
      <mesh>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshBasicMaterial color="#00E5FF" />
      </mesh>
      <pointLight color="#00E5FF" intensity={0.8} distance={0.4} />
    </group>
  );
}

function OrbitTrail({ history }: { history: Array<{ lat: number; lon: number }> }) {
  const points = useMemo(
    () => history.map((p) => geoToVec3(p.lat, p.lon, 1.02)),
    [history],
  );
  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  if (points.length < 2) return null;
  return (
    <primitive object={new THREE.Line(geo, new THREE.LineBasicMaterial({ color: "#00B4D8", transparent: true, opacity: 0.6 }))} />
  );
}

export function EarthGlobe({ lat, lon, altitudeKm, history = [] }: Props) {
  return (
    <Canvas camera={{ position: [0, 0, 3.2], fov: 45 }} dpr={[1, 2]}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} color="#ffffff" />
      <Stars radius={100} depth={50} count={3000} factor={4} fade speed={0.5} />
      <Earth />
      <Atmosphere />
      <OrbitTrail history={history} />
      <IssMarker lat={lat} lon={lon} altitudeKm={altitudeKm} />
      <OrbitControls enablePan={false} enableZoom minDistance={1.8} maxDistance={6} autoRotate={false} />
    </Canvas>
  );
}