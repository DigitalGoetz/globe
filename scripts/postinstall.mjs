import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const SKIP_COPY = String(process.env.GLOBE_SKIP_ASSET_COPY ?? '').toLowerCase();
if (SKIP_COPY === '1' || SKIP_COPY === 'true') {
  console.log('[globe] Skipping cesium-assets copy (GLOBE_SKIP_ASSET_COPY set)');
  process.exit(0);
}

const scriptDir = fileURLToPath(new URL('.', import.meta.url));
const packageRoot = resolve(scriptDir, '..');
const assetSource = join(packageRoot, 'dist', 'cesium-assets');
const require = createRequire(import.meta.url);

try {
  let copyHandler = null;
  let logSource = '';

  if (existsSync(assetSource) && readdirSync(assetSource).length > 0) {
    copyHandler = (targetDir) => {
      cpSync(assetSource, targetDir, { recursive: true });
    };
    logSource = 'package dist';
  } else {
    let cesiumBuildPath = null;
    try {
      const resolvedCesium = require.resolve('cesium/package.json');
      cesiumBuildPath = resolve(resolvedCesium, '..', 'Build', 'Cesium');
    } catch (resolveError) {
      // ignore, will fall through to warning below
    }

    if (cesiumBuildPath && existsSync(cesiumBuildPath) && readdirSync(cesiumBuildPath).length > 0) {
      copyHandler = (targetDir) => {
        mkdirSync(targetDir, { recursive: true });
        cpSync(cesiumBuildPath, join(targetDir, 'Cesium'), { recursive: true });
      };
      logSource = 'installed cesium';
    }
  }

  if (!copyHandler) {
    console.warn('[globe] No cesium-assets found in package or installed cesium, skipping copy');
    process.exit(0);
  }

  const installerRoot = resolve(process.env.INIT_CWD ?? packageRoot);
  const assetTarget = join(installerRoot, 'public', 'cesium-assets');

  rmSync(assetTarget, { recursive: true, force: true });
  mkdirSync(assetTarget, { recursive: true });

  copyHandler(assetTarget);

  console.log(`[globe] cesium-assets copied from ${logSource} to`, assetTarget);
} catch (error) {
  console.error('[globe] Failed to copy cesium-assets:', error);
  process.exitCode = 1;
}
