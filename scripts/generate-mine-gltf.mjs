import fs from "node:fs/promises";
import { BoxGeometry, Color, CylinderGeometry, Group, Mesh, MeshStandardMaterial } from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

globalThis.FileReader = class FileReader {
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = `data:application/octet-stream;base64,${Buffer.from(buffer).toString("base64")}`;
      this.onloadend?.();
    });
  }
};

const mat = (color, roughness = 0.9, metalness = 0) => new MeshStandardMaterial({ color: new Color(color), roughness, metalness });
const box = (name, size, position, material) => { const mesh = new Mesh(new BoxGeometry(...size), material); mesh.name = name; mesh.position.set(...position); return mesh; };
const site = new Group(); site.name = "NorthRidgeMine";
site.add(box("TerrainBase", [30, 0.4, 20], [0, -0.45, 0], mat("#263b35")));
site.add(box("PitFloor", [14, 0.25, 9], [-1, -0.18, 1], mat("#57452f")));
site.add(box("CrusherPlant", [2.6, 2.4, 2.2], [10, 1.1, -5], mat("#71828c", .5, .25)));
site.add(box("CrusherHopper", [1.4, 1.8, 1.5], [8.7, .8, -5], mat("#9b7943", .7, .1)));
site.add(box("Workshop", [3.8, 1.5, 2.6], [-10, .6, -5], mat("#70464d")));
site.add(box("Stockpile", [4.5, 1.4, 3.3], [9, .8, 5], mat("#829453")));
const road = mat("#a17a46"); site.add(box("HaulRoadEast", [22, .12, 1.3], [0, .02, 0], road));
site.add(box("HaulRoadNorth", [1.3, .13, 11], [4, .03, -1], road));
const truck = new Group(); truck.name = "HaulTruck_GLTF";
truck.add(box("TruckBody", [1.6, .55, .9], [0, .55, 0], mat("#3c8990", .55, .1)));
truck.add(box("TruckCab", [.62, .65, .78], [-.48, 1.02, 0], mat("#62b8b5", .45, .15)));
truck.add(box("TruckBed", [.78, .26, .82], [.45, .92, 0], mat("#b88948", .8, .05)));
for (const x of [-.55, .55]) for (const z of [-.47, .47]) { const wheel = new Mesh(new CylinderGeometry(.22, .22, .16, 16), mat("#182124")); wheel.rotation.x = Math.PI / 2; wheel.position.set(x, .28, z); truck.add(wheel); }
site.add(truck);
const exporter = new GLTFExporter();
const json = await new Promise((resolve, reject) => exporter.parse(site, resolve, reject, { binary: false, trs: false, onlyVisible: true }));
await fs.mkdir("public/models", { recursive: true });
await fs.writeFile("public/models/north-ridge-mine.gltf", JSON.stringify(json, null, 2));
console.log("Wrote public/models/north-ridge-mine.gltf");
