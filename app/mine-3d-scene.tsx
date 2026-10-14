"use client";
import { Html, Line, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const mint = "#8cffd1";
const lavender = "#b69cff";
const amber = "#ffc46b";
const coral = "#ef767a";

type RigProps = { position: [number, number, number]; active: boolean; accent: string; label: string; type: string; hashrate: number; };

function Fan({ active, position, scale = 1 }: { active: boolean; position: [number, number, number]; scale?: number }) {
  const rotor = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (rotor.current && active) rotor.current.rotation.z -= delta * 11; });
  return <group position={position} scale={scale} rotation={[Math.PI / 2, 0, 0]}><mesh><cylinderGeometry args={[.27, .27, .045, 20]} /><meshStandardMaterial color="#15222a" metalness={.7} roughness={.25} /></mesh><group ref={rotor}>{[0, 1, 2, 3].map((index) => <mesh key={index} rotation={[0, 0, index * Math.PI / 2]} position={[0, 0, .035]}><boxGeometry args={[.06, .42, .025]} /><meshStandardMaterial color={active ? "#6e8a8f" : "#394a50"} metalness={.5} /></mesh>)}</group><mesh position={[0, 0, .07]}><sphereGeometry args={[.055, 10, 10]} /><meshBasicMaterial color={active ? mint : coral} /></mesh></group>;
}

function GpuBank({ active, accent }: { active: boolean; accent: string }) { return <group position={[0, -.03, .06]}>{[-.56, -.19, .19, .56].map((x, i) => <group key={i} position={[x, 0, 0]}><mesh><boxGeometry args={[.27, .22, .72]} /><meshStandardMaterial color="#263640" metalness={.65} roughness={.3} /></mesh><mesh position={[0, 0, .37]}><boxGeometry args={[.2, .12, .03]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={active ? 1.4 : .05} /></mesh><Fan active={active} position={[0, 0, .4]} scale={.42} /></group>)}</group>; }

function MiningRig({ position, active, accent, label, type, hashrate }: RigProps) {
  const beacon = useRef<THREE.Mesh>(null);
  useFrame((state) => { if (beacon.current) { const pulse = active ? 1.2 + Math.sin(state.clock.elapsedTime * 4) * .45 : .08; (beacon.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse; } });
  return <group position={position}><mesh position={[0, 0, 0]} castShadow><boxGeometry args={[2.5, .12, 1.22]} /><meshStandardMaterial color="#1b2933" metalness={.7} roughness={.28} /></mesh><mesh position={[0, .66, 0]} castShadow><boxGeometry args={[2.45, 1.15, 1.16]} /><meshStandardMaterial color="#17242d" metalness={.72} roughness={.3} /></mesh><mesh position={[0, .66, .59]}><boxGeometry args={[2.08, .72, .025]} /><meshStandardMaterial color="#0a1218" metalness={.3} roughness={.5} /></mesh><GpuBank active={active} accent={accent} /><Fan active={active} position={[-.73, .66, .635]} /><Fan active={active} position={[.73, .66, .635]} /><mesh ref={beacon} position={[-.94, 1.17, .64]}><sphereGeometry args={[.055, 12, 12]} /><meshStandardMaterial color={active ? accent : coral} emissive={active ? accent : coral} /></mesh><mesh position={[.86, 1.12, .64]}><boxGeometry args={[.26, .04, .025]} /><meshBasicMaterial color={active ? mint : coral} /></mesh><Html position={[0, 1.48, .05]} center distanceFactor={10}><div className={`rig-label ${active ? "active" : "fault"}`}><b>{label}</b><small>{type} · {hashrate} TH/s</small></div></Html></group>;
}

function Rack({ online }: { online: number }) {
  const rigs = useMemo(() => [
    { x: -3.4, y: .9, label: "ASIC-07", type: "ATLAS S9", rate: 94, accent: mint },
    { x: 0, y: .9, label: "GPU-12", type: "RIG NEBULA", rate: 42, accent: lavender },
    { x: 3.4, y: .9, label: "ASIC-03", type: "FORGE MINI", rate: 28, accent: amber },
    { x: -1.7, y: -1.0, label: "CPU-01", type: "BOOTSTRAP", rate: 4.8, accent: mint },
  ], []);
  return <group>{[-1, 1].map((x) => <group key={x} position={[x * 4.7, .5, -.35]}><mesh position={[0, 0, 0]}><boxGeometry args={[.1, 4.3, .1]} /><meshStandardMaterial color="#31464e" metalness={.8} /></mesh><mesh position={[0, 2.1, 0]}><boxGeometry args={[.1, .1, 2.9]} /><meshStandardMaterial color="#31464e" metalness={.8} /></mesh><mesh position={[0, -2.1, 0]}><boxGeometry args={[.1, .1, 2.9]} /><meshStandardMaterial color="#31464e" metalness={.8} /></mesh></group>)}<mesh position={[0, 2.6, -.35]}><boxGeometry args={[10, .09, 2.9]} /><meshStandardMaterial color="#1c2d36" metalness={.8} roughness={.25} /></mesh>{rigs.map((rig, index) => <MiningRig key={rig.label} position={[rig.x, rig.y, 0]} active={index < online} accent={rig.accent} label={rig.label} type={rig.type} hashrate={rig.rate} />)}<mesh position={[0, -1.9, -.35]}><boxGeometry args={[10, .09, 2.9]} /><meshStandardMaterial color="#1c2d36" metalness={.8} roughness={.25} /></mesh></group>;
}

function CableBus() { const cables = [[-4.5, 0, .72, -3.2, .15, .65], [-2.7, 0, .72, -1.4, .15, .65], [-.8, 0, .72, .6, .15, .65], [1.1, 0, .72, 2.9, .15, .65], [3, 0, .72, 4.4, .15, .65]] as [number, number, number, number, number, number][]; return <group>{cables.map((c, i) => <Line key={i} points={[[c[0], c[1], c[2]], [(c[0] + c[3]) / 2, .45, .9], [c[3], c[4], c[5]]]} color={i % 2 ? lavender : mint} lineWidth={1.4} transparent opacity={.7} />)}</group>; }

function HoloPanel({ online }: { online: number }) { return <Html position={[0, 3.25, .1]} center distanceFactor={9}><div className="room-holo"><div><span>MISSION RACK A</span><b>{online} / 4 ONLINE</b></div><div className="holo-bar"><i style={{ width: `${online / 4 * 100}%` }} /></div><small>HASH BUS · STABLE · LOCAL SIMULATION</small></div></Html>; }

function Room({ online }: { online: number }) { return <><color attach="background" args={["#091117"]} /><fog attach="fog" args={["#091117", 12, 27]} /><ambientLight intensity={1.2} /><hemisphereLight args={["#b9e8da", "#091117", 1.2]} /><pointLight position={[0, 5, 3]} intensity={18} color={mint} /><pointLight position={[-5, 1, 4]} intensity={10} color={lavender} /><spotLight position={[0, 8, 4]} angle={.5} penumbra={.8} intensity={30} color="#d6fff2" castShadow /><gridHelper args={[22, 22, "#244047", "#12252d"]} position={[0, -2.08, 0]} /><mesh position={[0, 2.65, -1.8]}><boxGeometry args={[12, 5.8, .08]} /><meshStandardMaterial color="#0d1b23" metalness={.2} roughness={.9} /></mesh><mesh position={[0, .4, -1.7]}><boxGeometry args={[11.5, .04, .04]} /><meshBasicMaterial color="#27565a" /></mesh><Rack online={online} /><CableBus /><HoloPanel online={online} /></>; }

export default function Mine3DScene({ online }: { online: number }) { return <div className="room-canvas"><Canvas shadows camera={{ position: [0, 4.8, 14], fov: 38 }} dpr={[1, 1.6]}><Room online={online} /><OrbitControls enablePan={false} minDistance={7} maxDistance={18} maxPolarAngle={Math.PI / 2.03} target={[0, 0, 0]} /></Canvas><div className="room-hud"><span><i /> LIVE RIG TELEMETRY</span><small>Drag to orbit · Scroll to zoom</small><div className="hud-card"><b>RACK A / COOLING LOOP</b><small>Fans synchronized to worker status</small></div></div><div className="room-corner">3D SCENE · RENDER 01<br /><span>CAMERA ORBIT READY</span></div></div>; }
