import { cp, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourceDir = resolve(__dirname, "../public/cesium-assets");
const targetDir = resolve(__dirname, "../dist/cesium-assets");

async function copyCesiumAssets() {
  try {
    await mkdir(targetDir, { recursive: true });
    await cp(sourceDir, targetDir, { recursive: true });
    console.log("Copied cesium assets to dist/cesium-assets");
  } catch (error) {
    if ((error)?.code === "ENOENT") {
      console.warn("cesium-assets source directory not found; skipping copy step.");
      return;
    }
    throw error;
  }
}

await copyCesiumAssets();
