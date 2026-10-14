"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function Rig({ x, active, color }: { x: number; active: boolean; color: string }) {
  const fan = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => { if (fan.current && active) fan.current.rotation.z += delta * 9; });
  return <group position={[x, 0, 0]}><mesh position={[0, 0, 0]}><boxGeometry args={[2.4, 1.05, 1.1]} /><meshStandardMaterial color="#1d2934" metalness={.7} roughness={.35} /></mesh><mesh position={[0, .58, 0]}><boxGeometry args={[2.1, .08, .8]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 1.5 : .1} /></mesh><mesh ref={fan} position={[0, -.02, .57]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.34, .34, .04, 16]} /><meshStandardMaterial color="#94a3b8" /></mesh><mesh position={[-.8, .18, .58]}><sphereGeometry args={[.06, 8, 8]} /><meshBasicMaterial color={active ? "#8cffd1" : "#ef767a"} /></mesh></group>;
}
function Room({ online }: { online: number }) { return <><color attach="background" args={["#0d151c"]} /><ambientLight intensity={1.4} /><pointLight position={[0, 6, 4]} intensity={20} color="#8cffd1" /><gridHelper args={[18, 18, "#1f3940", "#16252d"]} position={[0, -.6, 0]} /><Rig x={-3.2} active={online > 0} color="#8cffd1" /><Rig x={0} active={online > 1} color="#b69cff" /><Rig x={3.2} active={online > 2} color="#ffc46b" /><mesh position={[0, 2.25, -1]}><boxGeometry args={[9.5, .08, .08]} /><meshBasicMaterial color="#8cffd1" /></mesh></>; }
export default function Mine3DScene({ online }: { online: number }) { return <div className="room-canvas"><Canvas camera={{ position: [8, 5.5, 9], fov: 40 }} dpr={[1, 1.5]}><Room online={online} /><OrbitControls enablePan={false} minDistance={7} maxDistance={17} maxPolarAngle={Math.PI / 2.1} /></Canvas><div className="room-hud"><span><i /> LIVE RIG TELEMETRY</span><small>Drag to orbit · Scroll to zoom</small></div></div>; }
