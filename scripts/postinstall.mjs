import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKIP_COPY = String(process.env.GLOBE_SKIP_ASSET_COPY ?? '').toLowerCase();
if (SKIP_COPY === '1' || SKIP_COPY === 'true') {
  console.log('[globe] Skipping cesium-assets copy (GLOBE_SKIP_ASSET_COPY set)');
  process.exit(0);
}

const scriptDir = fileURLToPath(new URL('.', import.meta.url));
const packageRoot = resolve(scriptDir, '..');
const assetSource = join(packageRoot, 'dist', 'cesium-assets');

try {
  if (!existsSync(assetSource) || readdirSync(assetSource).length === 0) {
    console.warn('[globe] No cesium-assets found in package, skipping copy');
    process.exit(0);
  }

  const installerRoot = resolve(process.env.INIT_CWD ?? packageRoot);
  const assetTarget = join(installerRoot, 'public', 'cesium-assets');

  if (!existsSync(assetTarget)) {
    mkdirSync(assetTarget, { recursive: true });
  }

  cpSync(assetSource, assetTarget, { recursive: true });
  console.log('[globe] cesium-assets copied to', assetTarget);
} catch (error) {
  console.error('[globe] Failed to copy cesium-assets:', error);
  process.exitCode = 1;
}
