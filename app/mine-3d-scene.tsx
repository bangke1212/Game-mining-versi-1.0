"use client";
import { Html, Line, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const mint = "#8cffd1";
const lavender = "#b69cff";
const amber = "#ffc46b";
const coral = "#ef767a";

type MinerProps = { position: [number, number, number]; active: boolean; accent: string; label: string; type: string; hashrate: number; };

function Fan({ active, accent, scale = 1 }: { active: boolean; accent: string; scale?: number }) {
  const rotor = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (rotor.current && active) rotor.current.rotation.z -= delta * 10; });
  return <group scale={scale} rotation={[Math.PI / 2, 0, 0]}><mesh><cylinderGeometry args={[.38, .38, .055, 24]} /><meshBasicMaterial color="#10232b" /></mesh><mesh rotation={[0, 0, 0]}><torusGeometry args={[.31, .055, 10, 24]} /><meshBasicMaterial color={accent} /></mesh><group ref={rotor}>{[0, 1, 2, 3, 4].map((index) => <mesh key={index} rotation={[0, 0, index * Math.PI / 2.5]} position={[0, 0, .04]}><boxGeometry args={[.07, .48, .025]} /><meshBasicMaterial color={active ? "#d8e5df" : "#60737a"} /></mesh>)}</group><mesh position={[0, 0, .08]}><sphereGeometry args={[.07, 12, 12]} /><meshBasicMaterial color={active ? accent : coral} /></mesh></group>;
}

function PowerSupply({ active }: { active: boolean }) { return <group position={[.82, 0, .02]}><mesh><boxGeometry args={[.48, .58, .78]} /><meshBasicMaterial color="#d3d9d4" /></mesh><mesh position={[0, 0, .4]}><boxGeometry args={[.34, .3, .025]} /><meshBasicMaterial color="#20343a" /></mesh><Fan active={active} accent={mint} scale={.35} /></group>; }

function CuteMiner({ position, active, accent, label, type, hashrate }: MinerProps) {
  const status = active ? mint : coral;
  return <group position={position}><mesh castShadow><boxGeometry args={[2.35, .88, 1.35]} /><meshBasicMaterial color="#405c63" /></mesh><mesh position={[0, 0, .69]}><boxGeometry args={[2.18, .74, .035]} /><meshBasicMaterial color="#23404a" /></mesh><mesh position={[-.72, 0, .72]}><boxGeometry args={[.68, .6, .04]} /><meshBasicMaterial color="#142a34" /></mesh><Fan active={active} accent={accent} scale={.78} /><PowerSupply active={active} /><mesh position={[-.24, .25, .74]}><sphereGeometry args={[.06, 10, 10]} /><meshBasicMaterial color={status} /></mesh><mesh position={[.24, .25, .74]}><sphereGeometry args={[.06, 10, 10]} /><meshBasicMaterial color={status} /></mesh><mesh position={[0, -.24, .74]}><boxGeometry args={[.32, .035, .025]} /><meshBasicMaterial color={active ? accent : "#71373e"} /></mesh><mesh position={[0, .48, -.2]}><boxGeometry args={[1.85, .06, .9]} /><meshBasicMaterial color="#6d8588" /></mesh><Line points={[[-.7, .49, -.45], [-.45, .8, -.45], [-.2, .49, -.45]]} color={accent} lineWidth={2} /><Line points={[[.05, .49, -.45], [.3, .8, -.45], [.55, .49, -.45]]} color={accent} lineWidth={2} /><Html position={[0, .93, .05]} center distanceFactor={10}><div className={`rig-label ${active ? "active" : "fault"}`}><b>{label}</b><small>{type} · {hashrate} TH/s</small></div></Html></group>;
}

function Rack({ online }: { online: number }) {
  const miners = useMemo(() => [
    { x: -1.65, y: 1.15, label: "ASIC-07", type: "ATLAS S9", rate: 94, accent: mint },
    { x: 1.65, y: 1.15, label: "GPU-12", type: "RIG NEBULA", rate: 42, accent: lavender },
    { x: -1.65, y: -.25, label: "ASIC-03", type: "FORGE MINI", rate: 28, accent: amber },
    { x: 1.65, y: -.25, label: "CPU-01", type: "BOOTSTRAP", rate: 4.8, accent: mint },
  ], []);
  return <group>{[-3.25, 3.25].map((x) => <group key={x}><mesh position={[x, .1, 0]}><boxGeometry args={[.1, 4.6, .1]} /><meshBasicMaterial color="#8aa3a5" /></mesh><mesh position={[x, 2.3, 0]}><boxGeometry args={[.1, .1, 2.5]} /><meshBasicMaterial color="#8aa3a5" /></mesh><mesh position={[x, -2.2, 0]}><boxGeometry args={[.1, .1, 2.5]} /><meshBasicMaterial color="#8aa3a5" /></mesh></group>)}{[.55, -.85].map((y) => <mesh key={y} position={[0, y, 0]}><boxGeometry args={[6.6, .09, 2.35]} /><meshBasicMaterial color="#4b686e" /></mesh>)}{miners.map((miner, index) => <CuteMiner key={miner.label} position={[miner.x, miner.y, 0]} active={index < online} accent={miner.accent} label={miner.label} type={miner.type} hashrate={miner.rate} />)}</group>;
}

function Room({ online }: { online: number }) { return <><fog attach="fog" args={["#244c55", 14, 28]} /><ambientLight intensity={2.6} /><hemisphereLight args={["#e3fff4", "#244650", 2.3]} /><pointLight position={[0, 5, 5]} intensity={35} color="#d9fff3" /><pointLight position={[-5, 1, 3]} intensity={18} color={lavender} /><mesh position={[0, 2.5, -2]}><planeGeometry args={[12, 5.5]} /><meshBasicMaterial color="#1d3b44" transparent opacity={.18} /></mesh><mesh position={[0, 3.6, -1.7]}><boxGeometry args={[8, .035, .035]} /><meshBasicMaterial color={mint} /></mesh><Rack online={online} /><Html position={[0, 3.15, .1]} center distanceFactor={9}><div className="room-holo"><div><span>MINING RACK A</span><b>{online} / 4 ONLINE</b></div><div className="holo-bar"><i style={{ width: `${online / 4 * 100}%` }} /></div><small>OPEN-FRAME ASIC BAY · COOLING OK</small></div></Html></>; }

export default function Mine3DScene({ online }: { online: number }) { return <div className="room-canvas"><Canvas shadows camera={{ position: [0, 2.8, 12], fov: 38 }} dpr={[1, 1.6]}><Room online={online} /><OrbitControls enablePan={false} minDistance={7} maxDistance={16} maxPolarAngle={Math.PI / 2.02} target={[0, .3, 0]} /></Canvas><div className="room-hud"><span><i /> LIVE RIG TELEMETRY</span><small>Drag to orbit · Scroll to zoom</small><div className="hud-card"><b>CUTE ASIC BAY</b><small>Fans, PSU and hashboards online</small></div></div><div className="room-corner">OPEN FRAME RACK · 3D SCENE<br /><span>CAMERA ORBIT READY</span></div></div>; }
