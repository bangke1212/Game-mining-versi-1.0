"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Html, Line, OrbitControls, Trail, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type DispatchTruck = { id: string; routeIndex: number; routeName: string; progress: number; status: "loading" | "hauling" | "dumping" | "returning" };
const routePoints: Record<string, [number, number, number][]> = {
  "HT-204": [[-5, .55, 2.5], [-1, .55, 2.5], [4, .55, 2.5], [8, .55, 1.2], [4, .55, 2.5], [-1, .55, 2.5]],
  "HT-118": [[-2, .55, 4], [0, .55, 4], [4, .55, 4], [8, .55, 4], [4, .55, 4], [0, .55, 4]],
};
const routeNames = ["Pit North → Crusher 01", "Loading face A → Dump 02"];
function makeRouteCurve(points: [number, number, number][]) { return new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)), false, "centripetal", .35); }

function GltfMine({ onSelect }: { onSelect: (id: string) => void }) {
  const { scene } = useGLTF("/models/north-ridge-mine.gltf");
  const model = useMemo(() => { const clone = scene.clone(true); clone.traverse((object) => { if (object.name === "HaulTruck_GLTF") object.visible = false; }); return clone; }, [scene]);
  return <primitive object={model} scale={.72} position={[0, -.2, 0]} onClick={(event: { stopPropagation: () => void }) => { event.stopPropagation(); onSelect("CR-01"); }} />;
}

function RouteLines({ truckId, selected }: { truckId: string; selected: boolean }) {
  const curve = useMemo(() => makeRouteCurve(routePoints[truckId]), [truckId]);
  return <Line points={curve.getPoints(80)} color={selected ? "#63e6a6" : "#79b9ff"} lineWidth={selected ? 2.4 : 1.1} transparent opacity={selected ? .78 : .28} dashed dashSize={.35} gapSize={.22} />;
}

function AnimatedTruck({ enabled, selected, truck, onSelect }: { enabled: boolean; selected: boolean; truck: DispatchTruck; onSelect: (id: string) => void }) {
  const { scene } = useGLTF("/models/north-ridge-mine.gltf");
  const ref = useRef<THREE.Group>(null);
  const progressRef = useRef(truck.progress);
  const curve = useMemo(() => makeRouteCurve(routePoints[truck.id]), [truck.id]);
  const model = useMemo(() => { const original = scene.getObjectByName("HaulTruck_GLTF"); return original ? original.clone(true) : new THREE.Group(); }, [scene]);
  useFrame((state, delta) => {
    if (!ref.current) return;
    const target = enabled ? truck.progress : progressRef.current;
    progressRef.current = THREE.MathUtils.damp(progressRef.current, target, 4.5, delta);
    const progress = Math.min(.999, progressRef.current);
    const point = curve.getPointAt(progress);
    const tangent = curve.getTangentAt(progress);
    ref.current.position.set(point.x, point.y + Math.sin(state.clock.elapsedTime * 7) * .025, point.z);
    ref.current.rotation.y = Math.atan2(tangent.x, tangent.z);
  });
  return <><RouteLines truckId={truck.id} selected={selected} /><group ref={ref} onClick={(event) => { event.stopPropagation(); onSelect(truck.id); }}><Trail width={selected ? 1.2 : .65} length={selected ? 5 : 2.5} color={selected ? "#63e6a6" : "#79b9ff"} attenuation={(t) => t * t}><primitive object={model} scale={.72} /></Trail><Html position={[0, 1.7, 0]} center distanceFactor={13}><div className={`r3f-label ${truck.status} ${selected ? "selected" : ""}`}>{truck.id}<small>{truck.status.toUpperCase()}</small></div></Html></group></>;
}

function DispatchLoop({ enabled, selectedId, onSelect, onUpdate }: { enabled: boolean; selectedId: string; onSelect: (id: string) => void; onUpdate: (trucks: DispatchTruck[]) => void }) {
  const [trucks, setTrucks] = useState<DispatchTruck[]>([
    { id: "HT-204", routeIndex: 0, routeName: routeNames[0], progress: .18, status: "hauling" },
    { id: "HT-118", routeIndex: 1, routeName: routeNames[1], progress: .47, status: "loading" },
  ]);
  useEffect(() => { const timer = window.setInterval(() => { if (!enabled) return; setTrucks((current) => current.map((truck) => { const nextProgress = truck.progress + (truck.status === "loading" ? .012 : .026); const wrapped = nextProgress >= 1 ? 0 : nextProgress; const phase = wrapped < .1 ? "loading" : wrapped < .52 ? "hauling" : wrapped < .66 ? "dumping" : "returning"; return { ...truck, progress: wrapped, status: phase }; })); }, 900); return () => window.clearInterval(timer); }, [enabled]);
  useEffect(() => onUpdate(trucks), [onUpdate, trucks]);
  return <>{trucks.map((truck) => <AnimatedTruck key={truck.id} enabled={enabled} selected={selectedId === truck.id} truck={truck} onSelect={onSelect} />)}</>;
}

export default function Mine3DScene({ enabled = true, selectedId, onSelect, onDispatchUpdate }: { enabled?: boolean; selectedId: string; onSelect: (id: string) => void; onDispatchUpdate: (trucks: DispatchTruck[]) => void }) {
  return <div className="r3f-wrap"><Canvas camera={{ position: [13, 12, 15], fov: 38 }} dpr={[1, 1.6]} shadows><color attach="background" args={["#182c2e"]} /><ambientLight intensity={1.8} /><directionalLight position={[4, 12, 5]} intensity={3} castShadow shadow-mapSize={[1024, 1024]} /><pointLight position={[-8, 6, 4]} intensity={12} color="#66e0bb" /><GltfMine onSelect={onSelect} /><DispatchLoop enabled={enabled} selectedId={selectedId} onSelect={onSelect} onUpdate={onDispatchUpdate} /><OrbitControls enablePan={false} minDistance={9} maxDistance={25} maxPolarAngle={Math.PI / 2.15} target={[0, 0, 0]} /></Canvas><div className="r3f-hud"><span><i /> {enabled ? "R3F LIVE SCENE" : "R3F VIEW PAUSED"}</span><small>Drag to orbit · Scroll to zoom</small></div><div className="r3f-selection">Selected: <b>{selectedId}</b></div></div>;
}

useGLTF.preload("/models/north-ridge-mine.gltf");
