import { cp, mkdir, rm, stat } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageRoot = resolve(__dirname, "..");
const cesiumSource = resolve(packageRoot, "node_modules/cesium/Build/Cesium");
const assetTargets = [
  {
    label: "public",
    baseDir: resolve(packageRoot, "public/cesium-assets"),
  },
  {
    label: "dist",
    baseDir: resolve(packageRoot, "dist/cesium-assets"),
  },
];

async function syncCesiumAssets() {
  try {
    await stat(cesiumSource);
  } catch {
    console.warn(
      "Cesium assets were not found in node_modules; skipping asset sync."
    );
    return;
  }

  for (const { label, baseDir } of assetTargets) {
    const targetDir = resolve(baseDir, "Cesium");

    await rm(baseDir, { recursive: true, force: true });
    await mkdir(baseDir, { recursive: true });
    await cp(cesiumSource, targetDir, { recursive: true });

    console.log(`Copied Cesium assets from node_modules to ${label}/cesium-assets`);
  }
}

await syncCesiumAssets();
