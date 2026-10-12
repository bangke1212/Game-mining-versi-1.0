import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const outputDir = join(process.cwd(), "out");
const html = await readFile(join(outputDir, "index.html"), "utf8");
const assets = [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^" ]+)"/g)].map((match) => match[1]);
const uniqueAssets = [...new Set(assets)];

if (uniqueAssets.length === 0) {
  throw new Error("Tidak menemukan chunk JavaScript/CSS Next.js untuk precache offline.");
}

await writeFile(join(outputDir, "precache-manifest.json"), JSON.stringify({ assets: uniqueAssets }, null, 2) + "\n");
console.log(`Offline precache manifest ditulis untuk ${uniqueAssets.length} file build.`);
