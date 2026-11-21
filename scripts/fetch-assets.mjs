import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const wasmSrc = path.join(rootDir, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const wasmDest = path.join(rootDir, 'public', 'mediapipe', 'wasm');

try {
  if (fs.existsSync(wasmSrc)) {
    fs.mkdirSync(wasmDest, { recursive: true });
    fs.cpSync(wasmSrc, wasmDest, { recursive: true, force: true });
    console.log('[fetch-assets] Copied MediaPipe WASM files to public/mediapipe/wasm');
  } else {
    console.warn('[fetch-assets] Warning: MediaPipe wasm directory not found at', wasmSrc);
  }
} catch (err) {
  console.warn('[fetch-assets] Warning: Failed to copy MediaPipe WASM files:', err);
}

const modelDir = path.join(rootDir, 'public', 'models');
const modelDest = path.join(modelDir, 'hand_landmarker.task');
const modelUrl =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

async function ensureModel() {
  try {
    if (fs.existsSync(modelDest)) {
      const stat = fs.statSync(modelDest);
      if (stat.size > 100000) {
        console.log('[fetch-assets] hand_landmarker.task already present');
        return;
      }
    }

    fs.mkdirSync(modelDir, { recursive: true });
    console.log('[fetch-assets] Downloading hand_landmarker.task...');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(modelUrl, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync(modelDest, Buffer.from(arrayBuffer));
    console.log('[fetch-assets] Saved hand_landmarker.task to public/models/hand_landmarker.task');
  } catch (err) {
    console.warn(
      '[fetch-assets] Warning: Could not download hand_landmarker.task (will fall back to CDN at runtime):',
      err instanceof Error ? err.message : err
    );
  }
}

ensureModel().finally(() => {
  process.exit(0);
});
