/**
 * ============================================================================
 * JARVIS — TUNING CONSTANTS, SETTINGS & EDUCATIONAL MODEL DATA
 * ============================================================================
 */

export const TUNING_CONFIG = {
  // Exponential Moving Average (EMA) smoothing factor
  HAND_SMOOTHING_ALPHA: 0.22,
  TRANSFORM_DAMPING_LAMBDA: 11.5,
  DEFAULT_TARGET_FPS: 45,

  // Dead zones to prevent micro-jitter when holding hand steady
  ROTATION_DEADZONE: 0.008,
  ZOOM_DEADZONE: 0.006,
  MOVE_DEADZONE: 0.008,

  // Base gesture sensitivities
  ROTATION_SENSITIVITY_X: 4.4,
  ROTATION_SENSITIVITY_Y: 3.4,
  PINCH_ZOOM_SENSITIVITY: 4.8,
  TWO_HAND_ZOOM_SENSITIVITY: 3.6,
  DRAG_SENSITIVITY_X: 5.5,
  DRAG_SENSITIVITY_Y: 4.0,

  // Zoom bounds
  MIN_ZOOM: 0.45,
  MAX_ZOOM: 3.4,
  DEFAULT_ZOOM: 1.0,

  // Relative hand-scale gesture classification thresholds
  MIN_HAND_SCALE: 0.02,
  PINCH_START_RATIO: 0.35, // dist(4,8) / handScale <= 0.35 starts pinch
  PINCH_END_RATIO: 0.55,   // dist(4,8) / handScale >= 0.55 ends pinch
  FINGER_EXTENDED_RATIO: 1.18, // Tip distance to wrist vs PIP distance to wrist
  EXPLODE_MIN_RATIO: 2.0,  // Two open palms spread / avgHandScale <= 2.0 -> ASSEMBLE (0)
  EXPLODE_MAX_RATIO: 4.5,  // Two open palms spread / avgHandScale >= 4.5 -> EXPLODE (1)

  // Debounce & grace timings
  POSE_DEBOUNCE_FRAMES: 3,
  SWIPE_STABLE_PALM_FRAMES: 5,
  HAND_LOSS_GRACE_MS: 300,
  ZONE_GESTURE_DEBOUNCE_MS: 300,
  POINT_SELECT_HOLD_MS: 500,

  // Timing & cooldowns (milliseconds)
  SWIPE_VELOCITY_THRESHOLD: 0.95,
  SWIPE_COOLDOWN_MS: 950,
  RESET_HOLD_DURATION_MS: 2000,
  RESET_STILLNESS_RADIUS: 0.032,
  ATTRACT_MODE_IDLE_MS: 10000,
  JUDGE_PROMPT_DURATION_MS: 6500,

  // Performance & Particle limits (Requirement 5.2: at most 260 particles)
  LOW_FPS_THRESHOLD: 25,
  HIGH_PARTICLE_COUNT: 260,
  LOW_PARTICLE_COUNT: 120,
  HAND_TRACKING_INTERVAL_MS: 55,
};

export interface JarvisSettings {
  cameraId: string;
  mirrorPreview: boolean;
  handSensitivity: number; // 0.5 to 1.5, default 1.0
  voiceMode: 'push-to-talk' | 'hands-free';
  voiceLang: 'en-IN' | 'hi-IN';
  spokenReplies: boolean; // default false
  muted: boolean;
  volume: number; // 0 to 1, default 0.6
  ambientHum: boolean; // default false
  pyramidSize: number; // 0.18 to 0.45, default 0.31
  pyramidGap: number; // 0.6 to 1.3, default 0.96
  pyramidFlip180: boolean; // default false
  showFps: boolean; // default true
  targetFps: 45 | 60; // default 45 for smooth thermal-stable rendering
  liveNasaData: boolean; // default true
  nasaApiKey: string; // default DEMO_KEY
  wsUrl: string;
}

export const DEFAULT_SETTINGS: JarvisSettings = {
  cameraId: '',
  mirrorPreview: true,
  handSensitivity: 1.0,
  voiceMode: 'push-to-talk',
  voiceLang: 'en-IN',
  spokenReplies: true,
  muted: false,
  volume: 0.6,
  ambientHum: false,
  pyramidSize: 0.31,
  pyramidGap: 0.96,
  pyramidFlip180: false,
  showFps: true,
  targetFps: 45,
  liveNasaData: true,
  nasaApiKey: 'DEMO_KEY',
  wsUrl: 'ws://localhost:8080/jarvis-gestures',
};

const SETTINGS_STORAGE_KEY = 'jarvis.settings.v1';
const CAMERA_ID_STORAGE_KEY = 'jarvis.cameraId';

export function loadSettings(): JarvisSettings {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { ...DEFAULT_SETTINGS };
    }
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    const savedCam = window.localStorage.getItem(CAMERA_ID_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<JarvisSettings>) : {};
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      cameraId: savedCam !== null ? savedCam : parsed.cameraId ?? DEFAULT_SETTINGS.cameraId,
      handSensitivity: Math.min(1.5, Math.max(0.5, Number(parsed.handSensitivity ?? 1.0))),
      pyramidSize: Math.min(0.45, Math.max(0.18, Number(parsed.pyramidSize ?? 0.31))),
      pyramidGap: Math.min(1.4, Math.max(0.5, Number(parsed.pyramidGap ?? 0.96))),
      volume: Math.min(1, Math.max(0, Number(parsed.volume ?? 0.6))),
      targetFps: parsed.targetFps === 60 ? 60 : 45,
      liveNasaData: parsed.liveNasaData !== undefined ? Boolean(parsed.liveNasaData) : true,
      nasaApiKey: typeof parsed.nasaApiKey === 'string' && parsed.nasaApiKey.trim() ? parsed.nasaApiKey.trim() : 'DEMO_KEY',
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: JarvisSettings): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    if (settings.cameraId) {
      window.localStorage.setItem(CAMERA_ID_STORAGE_KEY, settings.cameraId);
    } else {
      window.localStorage.removeItem(CAMERA_ID_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota or private browsing errors
  }
}

export type ModelId = 'solar' | 'human-body';

export interface SubPartInfo {
  id: string;
  name: string;
  summary: string;
  metric?: string;
  explodeVector: [number, number, number];
}

export interface ScienceModelSpec {
  id: ModelId;
  keyNumber: number;
  name: string;
  shortName: string;
  subtitle: string;
  category: string;
  whatItTeaches: string;
  facts: [string, string, string];
  defaultBpm?: number;
  parts: SubPartInfo[];
}

export const SCIENCE_MODELS: ScienceModelSpec[] = [
  {
    id: 'solar',
    keyNumber: 1,
    name: 'Heliocentric Solar System',
    shortName: 'Stage 1 · Solar System',
    subtitle: 'G-Type Main-Sequence Star & 8 Planetary Orbits',
    category: 'Astrophysics & orbital mechanics',
    whatItTeaches:
      'Illustrates Kepler’s Laws of Planetary Motion: inner rocky terrestrial worlds orbit rapidly while outer gas and ice giants sweep wide, slower orbits.',
    facts: [
      'The Sun contains 99.86% of all mass in the Solar System, fusing 600 million tons of hydrogen every second.',
      'Venus is hotter than Mercury (464 °C) due to a runaway carbon dioxide greenhouse atmosphere.',
      'Jupiter’s magnetosphere is so immense that if visible from Earth, it would appear larger than the full Moon.',
    ],
    parts: [
      {
        id: 'solar-sun',
        name: 'The Sun (Sol)',
        summary: 'G2V main-sequence fusion reactor anchoring the gravitational well of all 8 planets.',
        metric: 'Dist: 0 AU · Surface: 5,500 °C',
        explodeVector: [0, 0, 0],
      },
      {
        id: 'solar-mercury',
        name: 'Mercury',
        summary: 'Closest cratered iron-core world with extreme day-to-night thermal swings.',
        metric: 'Dist: 57.9M km · Temp: 167 °C',
        explodeVector: [-0.8, 0.9, 0.4],
      },
      {
        id: 'solar-venus',
        name: 'Venus',
        summary: 'Super-greenhouse terrestrial planet veiled in reflective sulfuric acid clouds.',
        metric: 'Dist: 108.2M km · Temp: 464 °C',
        explodeVector: [0.9, 1.1, -0.3],
      },
      {
        id: 'solar-earth',
        name: 'Earth',
        summary: 'Temperate ocean world in the circumstellar habitable zone with an active biosphere.',
        metric: 'Dist: 149.6M km · Temp: 15 °C',
        explodeVector: [-1.3, 0.6, 0.8],
      },
      {
        id: 'solar-mars',
        name: 'Mars',
        summary: 'Iron-oxide desert planet home to Olympus Mons, the tallest volcano in the Solar System.',
        metric: 'Dist: 227.9M km · Temp: -65 °C',
        explodeVector: [1.4, 0.5, 0.9],
      },
      {
        id: 'solar-jupiter',
        name: 'Jupiter',
        summary: 'Colossal hydrogen-helium gas giant with the centuries-old Great Red Spot anticyclone.',
        metric: 'Dist: 778.5M km · Temp: -110 °C',
        explodeVector: [-1.8, -0.7, 0.5],
      },
      {
        id: 'solar-saturn',
        name: 'Saturn',
        summary: 'Low-density gas giant encircled by a 282,000 km ring system of crystalline water ice.',
        metric: 'Dist: 1.43B km · Temp: -140 °C',
        explodeVector: [1.9, -0.8, -0.5],
      },
      {
        id: 'solar-uranus',
        name: 'Uranus',
        summary: 'Methane-tinted ice giant rotating on its side at an extreme 97.7° axial tilt.',
        metric: 'Dist: 2.87B km · Temp: -195 °C',
        explodeVector: [-2.1, -1.3, -0.7],
      },
      {
        id: 'solar-neptune',
        name: 'Neptune',
        summary: 'Outermost ice giant swept by supersonic 2,100 km/h methane-ammonia winds.',
        metric: 'Dist: 4.50B km · Temp: -200 °C',
        explodeVector: [2.2, -1.4, 0.7],
      },
      {
        id: 'solar-pluto',
        name: 'Pluto (9th Body · Dwarf Planet)',
        summary: 'Icy Kuiper Belt world in a 17.16° inclined elliptical orbit featuring Sputnik Planitia nitrogen-ice heart and moon Charon.',
        metric: '2,377 km Dia · 17.7M km² Area · 39.5 AU',
        explodeVector: [3.2, 1.35, -1.8],
      },
    ],
  },
  {
    id: 'human-body',
    keyNumber: 2,
    name: 'Complete Human Body Atlas',
    shortName: 'Stage 2 · Human Body',
    subtitle: 'Cell to Whole Organism · 6 Structural Levels & All 11 Organ Systems',
    category: 'Human Anatomy & Physiology (OpenStax A&P 2e)',
    whatItTeaches:
      'Maps the complete human body in exact structural order—from chemical building blocks and eukaryotic cell organelles to 4 primary tissues, 206 bones, ~600+ muscles, 12 cranial & 31 spinal nerve pairs, and all 11 organ systems.',
    facts: [
      'The adult human skeleton contains 206 bones: 80 in the axial skeleton (skull, spine, ribcage) and 126 in the appendicular skeleton (limbs and girdles).',
      'The human alimentary canal is ~7.62 meters (25 feet) long during life and coordinates with 6 accessory organs including the liver, pancreas, and gallbladder.',
      'Twelve pairs of cranial nerves and 31 pairs of spinal nerves connect the brain and spinal cord to every organ, sensory receptor, and muscle in the body.',
    ],
    defaultBpm: 72,
    parts: [
      {
        id: 'body-cell-core',
        name: 'Eukaryotic Human Cell (Level 2)',
        summary: 'Plasma membrane, nucleus, nucleolus, DNA chromatin, mitochondria (ATP), rough/smooth ER, Golgi apparatus, lysosomes, and cytoskeleton.',
        metric: '5–100 µm · 12 Core Organelles',
        explodeVector: [-1.4, 0.9, 0.4],
      },
      {
        id: 'body-integumentary',
        name: '1. Integumentary System (Skin)',
        summary: 'Epidermis (5 strata), dermis (papillary & reticular), hypodermis, hair follicles, nails, sweat & sebaceous glands.',
        metric: 'Barrier · Thermoregulation',
        explodeVector: [0, 0, 1.35],
      },
      {
        id: 'body-skeletal',
        name: '2. Skeletal System (206 Bones)',
        summary: '80 axial bones (cranium, face, hyoid, ossicles, 26 spine, sternum, 24 ribs) + 126 appendicular bones (girdles & limbs).',
        metric: '206 Adult Bones',
        explodeVector: [-1.35, 0, -0.35],
      },
      {
        id: 'body-muscular',
        name: '3. Muscular System (~600+ Muscles)',
        summary: 'Skeletal muscle agonist/antagonist pairs (pectorals, deltoids, biceps/triceps, abs, quads, hamstrings, calves) + diaphragm.',
        metric: '~600+ Skeletal Muscles',
        explodeVector: [1.35, 0, -0.25],
      },
      {
        id: 'body-nervous',
        name: '4. Nervous System (CNS & PNS)',
        summary: 'Cerebrum (4 lobes), diencephalon, cerebellum, brainstem, spinal cord, 12 cranial nerves (CN I–XII), and 31 spinal nerve pairs.',
        metric: '12 Cranial · 31 Spinal Pairs',
        explodeVector: [0, 1.05, -0.45],
      },
      {
        id: 'body-endocrine',
        name: '5. Endocrine System (Hormone Glands)',
        summary: 'Hypothalamus, pituitary, pineal, thyroid, 4 parathyroids, adrenal cortex/medulla, and pancreatic islets.',
        metric: '9 Major Ductless Glands',
        explodeVector: [0.85, 0.85, 0.55],
      },
      {
        id: 'body-heart',
        name: '6a. Cardiovascular — 4-Chamber Heart',
        summary: 'Right/left atria, right/left ventricles, 4 one-way valves (tricuspid, pulmonary, mitral, aortic), and SA/AV conduction system.',
        metric: '72 BPM · Dual Circuits',
        explodeVector: [0.65, 0.35, 0.95],
      },
      {
        id: 'body-vessels',
        name: '6b. Cardiovascular — Arteries & Veins',
        summary: 'Aorta, venae cavae, pulmonary trunk, carotid, subclavian, renal, iliac, and femoral systemic vascular trees.',
        metric: '~5 L Blood Volume',
        explodeVector: [-0.85, -0.15, 0.8],
      },
      {
        id: 'body-lymphatic',
        name: '7. Lymphatic & Immune System',
        summary: 'Thymus (T-cells), red bone marrow (B-cells), spleen, tonsils, Peyer’s patches, thoracic duct, and 500–600 lymph nodes.',
        metric: 'Immune & Fluid Recovery',
        explodeVector: [1.15, 0.2, 0.65],
      },
      {
        id: 'body-lungs',
        name: '8. Respiratory System (Airways & Lungs)',
        summary: 'Nasal cavity, pharynx, larynx, trachea (16–20 C-rings), bronchial tree, right lung (3 lobes), left lung (2 lobes), and alveoli.',
        metric: '5 Lung Lobes · 0.5 µm Barrier',
        explodeVector: [-0.75, 0.55, 0.85],
      },
      {
        id: 'body-liver',
        name: '9a. Digestive — Liver & Gallbladder',
        summary: 'Largest internal organ; receives hepatic portal blood, detoxifies metabolites, and synthesizes bile stored in the gallbladder.',
        metric: '4 Lobes · Hepatic Portal',
        explodeVector: [-1.05, -0.05, 0.75],
      },
      {
        id: 'body-digestive',
        name: '9b. Digestive — GI Tract & Pancreas',
        summary: 'Esophagus, stomach, duodenum/jejunum/ileum (small intestine), colon/rectum (large intestine), pancreas, and mesentery.',
        metric: '~7.62 m Alimentary Canal',
        explodeVector: [0.45, -0.35, 0.95],
      },
      {
        id: 'body-urinary',
        name: '10. Urinary System (Kidneys & Bladder)',
        summary: 'Paired retroperitoneal kidneys (~1M nephrons each), ureters, urinary bladder, and urethra regulating water, pH, and wastes.',
        metric: '2 Kidneys · ~2M Nephrons',
        explodeVector: [-0.75, -0.45, -0.85],
      },
      {
        id: 'body-reproductive',
        name: '11. Reproductive System',
        summary: 'Primary gonads (testes/ovaries) producing haploid gametes & sex hormones, plus reproductive ducts and accessory glands.',
        metric: 'Gametogenesis & Continuity',
        explodeVector: [0, -0.95, 0.55],
      },
    ],
  },
];

export const GESTURE_GUIDE_ITEMS = [
  {
    gesture: 'Open hand move',
    badge: 'Rotate',
    howTo: 'Hold one open palm up and glide left, right, up, or down.',
    effect: 'Smooth 360° 3D rotation following your palm movement.',
    shortcut: 'Arrow keys / Mouse drag',
  },
  {
    gesture: 'Pinch and slide vertically',
    badge: 'Zoom',
    howTo: 'Pinch thumb and index finger together, then move your hand up to zoom in or down to zoom out.',
    effect: 'Zooms smoothly without losing the pinch; rotation is locked while pinching.',
    shortcut: '+ / - keys or Scroll wheel',
  },
  {
    gesture: 'Two-hand control',
    badge: 'Dual sync',
    howTo: 'Left hand open rotates while right hand pinches and slides vertically to zoom, or pinch both hands and move apart.',
    effect: 'Simultaneous rotation and zoom control.',
    shortcut: 'Drag + Scroll',
  },
  {
    gesture: 'Closed fist drag',
    badge: 'Move / pan',
    howTo: 'Close your hand into a fist and move across the frame.',
    effect: 'Repositions the model in 3D space.',
    shortcut: 'Shift + Mouse drag',
  },
  {
    gesture: 'Two open hands apart',
    badge: 'Explode view',
    howTo: 'Hold both open palms up and spread them apart to explode continuously; bring palms closer to reassemble.',
    effect: 'Separates the model proportionally into internal sub-parts.',
    shortcut: 'Key E',
  },
  {
    gesture: 'Fast horizontal swipe',
    badge: 'Switch model',
    howTo: 'Hold an open hand steady for a moment, then swipe briskly left or right.',
    effect: 'Switches to the next or previous 3D model.',
    shortcut: 'Keys 1 – 5',
  },
  {
    gesture: 'Index finger point',
    badge: 'Inspect part',
    howTo: 'Extend only your index finger to move the pointer over the model.',
    effect: 'Highlights internal parts with a floating metric callout.',
    shortcut: 'Hover / Click model',
  },
  {
    gesture: 'Still open palm (2 s)',
    badge: 'Reset',
    howTo: 'Hold a clear open palm steady for 2 seconds until the progress ring completes.',
    effect: 'Resets position, rotation, zoom, and reassembles parts.',
    shortcut: 'Key R',
  },
  {
    gesture: 'Peace sign ✌️ (hold 0.6 s)',
    badge: '4-Min Explain',
    howTo: 'Hold up index and middle fingers (V-sign) for half a second.',
    effect: 'Starts or pauses the 4-minute synchronized Human Body explanation from Cell to Organism.',
    shortcut: 'Voice: "Continue explaining the human body"',
  },
  {
    gesture: 'Three fingers 3️⃣ (hold 0.6 s)',
    badge: 'Cycle layers',
    howTo: 'Extend index, middle, and ring fingers together for half a second.',
    effect: 'Cycles Human Body layers: All Systems → Internal Organs → 206-Bone Skeleton → Neuro-Vascular.',
    shortcut: 'Voice: "Show skeleton" / "Internal organs"',
  },
  {
    gesture: 'Shaka sign 🤙 (hold 0.6 s)',
    badge: 'Cell ↔ Body',
    howTo: 'Extend thumb and pinky finger while curling the middle three fingers.',
    effect: 'Switches between Full Human Body view and Microscopic Eukaryotic Cell view.',
    shortcut: 'Voice: "Zoom to cell" / "Full body"',
  },
  {
    gesture: 'Two closed fists ✊✊ (hold 0.7 s)',
    badge: 'Hologram',
    howTo: 'Hold both hands in closed fists for 0.7 seconds.',
    effect: 'Toggles 4-sided Hologram Pyramid projection mode on or off.',
    shortcut: 'Key M / Voice: "Hologram mode"',
  },
];