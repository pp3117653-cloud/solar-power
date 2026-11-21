# Jarvis — 3D Science Viewer (NASA & Apollo 45 FPS Edition)

Interactive 3D science viewer controlled by hand gestures, multilingual voice commands (English, Hinglish, Hindi), or keyboard and mouse. Designed for desktop screens and 4-sided acrylic hologram pyramids.

## What's New in This Upgraded Build

- **Real-Time NASA & ISS Telemetry (`src/services/nasaDataService.ts`)**:
  - Live **ISS orbital position** (`api.wheretheiss.at/v1/satellites/25544`) mapped directly to a 3D miniature ISS orbiting Earth.
  - **NASA DSCOVR EPIC** natural-color Earth metadata (`epic.gsfc.nasa.gov/api/natural`).
  - **NASA NeoWs** daily Near-Earth Object asteroid counts & closest flyby (`api.nasa.gov/neo/rest/v1/feed`).
  - **NASA DONKI** solar flare space-weather telemetry (`api.nasa.gov/DONKI/FLR`).
  - Uses `DEMO_KEY` by default (configurable in Settings) with automatic offline fallback.
- **NASA Apollo 11–17 Lunar Landing Sites**:
  - Exact NASA NSSDC / LROC landing coordinates for **Apollo 11, 12, 14, 15, 16, and 17** rendered as glowing surface beacons on a procedural cratered Moon and listed in the Info drawer.
- **Realistic True-Color PBR Models & Deeper Internal Structures (`src/three/hologramModels.ts`)**:
  - **Earth**: Procedural true-color continents/oceans, bump & roughness maps, night-side city lights, animated cloud deck, Fresnel Rayleigh blue atmosphere, magnetosphere field lines, and dual-layer molten core + silicate mantle.
  - **Solar System**: Granulated photospheric Sun with corona, 8 true-color planets with axial tilts, multi-band Cassini-division Saturn rings, and a GPU-instanced 320-asteroid belt.
  - **Human Heart**: Realistic oxygenated crimson vs. venous blue-plum myocardium texture, LAD coronary artery, 3 aortic arch branches, and internal mitral/tricuspid valves.
  - **DNA Double Helix**: CPK-colored nucleobases, accurate ~142° B-DNA major/minor groove offset, and 2 (A-T) vs. 3 (G-C) hydrogen-bond markers.
  - **Carbon-12 Atom**: Ruby protons, silver neutrons, strong-force nuclear halo, and volumetric 1s/2p quantum orbital clouds.
- **Smooth 45 FPS Frame-Paced Rendering (`src/three/HologramCanvas.tsx`)**:
  - Default **45 FPS** frame-paced render loop (switchable between 45 FPS and 60 FPS in Settings) with smooth exponential damping (`lambda = 9.2`) to prevent thermal throttling while MediaPipe hand tracking runs.

## Setup & Offline Usage

1. Install dependencies (Node.js 20+, pnpm, or Bun):
   ```bash
   npm install
   ```
2. Start the local dev server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in Chrome or Edge and allow camera/microphone permissions. Pre-bundled MediaPipe WASM and `hand_landmarker.task` files are already included in `public/`.

## Keyboard Shortcuts

- `1` – `5`: Switch models (1: Earth & Apollo Moon, 2: Solar system, 3: Heart, 4: DNA, 5: Atom)
- `Arrow keys` / Mouse drag: Rotate model (`Shift + drag` to pan)
- `+` / `-` or Scroll wheel: Zoom in / out
- `E`: Toggle explode view
- `R`: Reset view to default
- `M`: Toggle hologram pyramid mode (`[` and `]` adjust pyramid size, `Esc` exits)
- `H`: Toggle camera preview
- `S`: Mute / unmute sound
- `V`: Push-to-talk voice command
- `F`: Toggle fullscreen
- `,`: Open settings drawer (45/60 FPS pace, NASA API key, live telemetry toggle)
- `?` or `T`: Open help & gesture guide
