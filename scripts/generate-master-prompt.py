from pathlib import Path

repo = "pp3117653-cloud/solar-power"

categories = [
    ("01 — Product vision and cinematic direction", "the cinematic science-exhibition experience"),
    ("02 — Visual language and art direction", "the visual system"),
    ("03 — Cinematic staging and camera", "the cinematic camera and stage"),
    ("04 — Lighting, materials, and atmosphere", "lighting and physically plausible materials"),
    ("05 — Hologram and pyramid presentation", "the four-sided hologram mode"),
    ("06 — Three.js scene architecture", "the Three.js rendering architecture"),
    ("07 — WebGL performance and frame pacing", "rendering performance"),
    ("08 — Asset pipeline and 3D quality", "the 3D asset pipeline"),
    ("09 — Solar-system geometry and scale", "the Solar System model"),
    ("10 — Planetary realism", "planetary surfaces, atmospheres, and interiors"),
    ("11 — Orbits, ephemerides, and time", "orbital mechanics and simulation time"),
    ("12 — Earth, Moon, and mission sites", "Earth, Moon, Apollo, and Chandrayaan data"),
    ("13 — Spacecraft, NEOs, and space weather", "spacecraft, asteroids, and space-weather layers"),
    ("14 — Real-time data provenance", "live-data ingestion and provenance"),
    ("15 — Data reliability and offline mode", "data freshness, validation, and offline fallback"),
    ("16 — Human anatomy scientific accuracy", "the human anatomy atlas"),
    ("17 — Anatomy asset and topology quality", "anatomical meshes, topology, and textures"),
    ("18 — Anatomy animation and physiology", "physiology animation and explanatory models"),
    ("19 — Scientific content and citations", "scientific explanations, labels, and citations"),
    ("20 — Hand tracking and calibration", "MediaPipe hand tracking and calibration"),
    ("21 — Gesture vocabulary and control", "gesture interaction and gesture semantics"),
    ("22 — Voice recognition and multilingual UX", "voice recognition in English, Hindi, and Hinglish"),
    ("23 — Speech-to-speech assistant", "the project-specific speech-to-speech assistant"),
    ("24 — Agent action safety and intent", "voice intent resolution and safe action execution"),
    ("25 — Conversational science tutor", "the conversational science tutor"),
    ("26 — Interaction design and feedback", "interaction feedback and state transparency"),
    ("27 — Accessibility and inclusive controls", "accessibility and multimodal alternatives"),
    ("28 — HUD, dashboards, and information design", "the Jarvis HUD and telemetry panels"),
    ("29 — Audio, narration, and sound design", "audio, narration, and sound design"),
    ("30 — Performance, memory, and device tiers", "device-adaptive quality and resource management"),
    ("31 — Security, privacy, and permissions", "security, privacy, and browser permissions"),
    ("32 — Testing and scientific verification", "automated tests and scientific verification"),
    ("33 — Deployment, observability, and maintenance", "deployment, observability, and maintenance"),
    ("34 — Education, exhibition, and future extensibility", "education, exhibition operation, and extensibility"),
]

actions = [
    "define a written acceptance criterion and expose its current status in the UI",
    "separate measured facts, calculated values, visual approximations, and fictional presentation effects",
    "add a source citation, retrieval timestamp, units, coordinate frame, and uncertainty note",
    "make the behavior deterministic under a fixed seed or recorded data snapshot",
    "provide a graceful fallback that never displays stale data as live",
    "add a calibration or setup flow with a clear success and failure state",
    "add keyboard, pointer, gesture, and voice equivalents where the interaction is user-facing",
    "use hysteresis, debouncing, dwell time, and cancellation to prevent accidental activation",
    "show a compact explanation of what changed and why the system changed it",
    "add a focused unit test plus an integration test for the normal and failure paths",
    "instrument latency, frame time, memory, and error rate without collecting unnecessary personal data",
    "support prefers-reduced-motion, high-contrast, large-text, and color-vision-safe modes",
    "keep the feature usable when camera, microphone, network, GPU, or speech APIs are unavailable",
    "load the feature lazily and dispose geometries, materials, textures, workers, and listeners correctly",
    "avoid hard-coded claims when a verified source or runtime calculation can provide the value",
    "use SI units internally and format locale-aware values with an explicit unit label",
    "make the feature shareable as a reproducible URL or saved scenario without embedding secrets",
    "add a diagnostic panel that explains permissions, data freshness, model readiness, and active quality tier",
    "define a conservative default that favors user control, privacy, and scientific honesty",
    "document the implementation in the repository near the owning module and update TODO.md",
    "validate input at the boundary and reject malformed, impossible, expired, or contradictory values",
    "make transitions interruptible and return the interface to a stable state after cancellation",
    "add a mobile and low-end-device alternative instead of assuming desktop GPU capability",
    "design the visual result to remain legible against the black hologram background and HUD overlays",
    "avoid implying medical advice, safety guarantees, or observational precision that the model cannot support",
    "record a changelog entry describing the user-visible behavior and any source-data changes",
    "add a screenshot or short scenario fixture for visual regression without depending on live network data",
    "keep all user-facing copy concise, factual, translatable, and consistent with Jarvis voice rules",
    "expose an explicit reset path that restores camera, data, model, audio, and interaction state",
    "define an observable performance budget and fail CI when a regression exceeds that budget",
]

intro = f"""# Solar Power / Jarvis — Master Upgrade Prompt\n\nRepository: https://github.com/{repo}\n\n## How to use this prompt\n\nAct as a senior Three.js/WebGL engineer, scientific-visualization engineer, anatomy educator, realtime-data engineer, speech-interface designer, accessibility specialist, QA lead, and cinematic interaction designer. Work directly in the existing repository. Inspect before changing. Preserve working behavior. Implement improvements in staged, reviewable increments rather than rewriting the app blindly.\n\nThe current project is a Vite + React 19 + TypeScript + Three.js application with MediaPipe HandLandmarker, browser SpeechRecognition, speech synthesis, NASA/ISS/EPIC/NeoWs/DONKI integrations, NASA media search, procedural Solar System and anatomy models, Apollo/Chandrayaan locations, offline fallback telemetry, a photoreal GLB hook at `/models/human/body.glb`, a 45/60 FPS renderer, and a hologram-pyramid mode. The most important existing files include `src/App.tsx`, `src/three/HologramCanvas.tsx`, `src/three/hologramModels.ts`, `src/three/humanBodyModel.ts`, `src/components/WebcamHandTracker.tsx`, `src/logic/gestureEngine.ts`, `src/logic/voiceCommands.ts`, `src/services/nasaDataService.ts`, and `TODO.md`.\n\nDo not promise literal “100% perfect,” “100% real,” or medical-grade accuracy. Translate those wishes into measurable targets: source-backed values, explicit uncertainty, realistic but labeled visual abstractions, calibrated controls, reproducible tests, graceful degradation, and documented limitations. Never fabricate live telemetry, anatomy, citations, mission status, or model-training results. A generated visual must not be presented as a scan, photograph, clinical model, or direct observation unless it actually is one.\n\n## Non-negotiable engineering rules\n\n1. Start with a repository audit and an implementation plan. Do not delete existing functionality without evidence and a migration note.\n2. Keep secrets out of client bundles, source control, logs, URLs, screenshots, and telemetry.\n3. Treat live data as untrusted input: validate schema, timestamps, ranges, units, provenance, freshness, and partial failure.\n4. Distinguish authoritative source data from interpolation, prediction, simulation, procedural art, and fallback values in both code and UI.\n5. Use real astronomical algorithms and declared reference frames when claiming physical positions; do not scale distances and sizes together when that makes the scene unusable—offer a labeled exhibition scale.\n6. Use anatomically reviewed assets or clearly labeled educational abstractions; do not call primitive placeholders textbook-accurate anatomy.\n7. Speech-to-speech must have explicit consent, visible listening state, interruption, transcript controls, safe action confirmation, and a non-AI deterministic fallback.\n8. Camera and microphone processing should be local by default, opt-in for network processing, and easy to stop.\n9. Every interaction needs a reversible path, visible feedback, and an equivalent keyboard/pointer route.\n10. Run typecheck, tests, production build, accessibility checks, and representative offline/live fixtures before delivery.\n\n## 1,020 actionable suggestions\n\nThe numbered requirements below are the backlog. Treat each as an actionable suggestion: assess it, mark it `implemented`, `deferred`, or `rejected with rationale`, and link implementation evidence. Prioritize correctness, safety, and stability before spectacle.\n\n"""

lines = []
n = 1
for title, subject in categories:
    lines.append(f"### {title}")
    for i, action in enumerate(actions, 1):
        lines.append(f"{n}. For {subject}, {action}; include a concrete example, owner module, and acceptance test. (Pattern {i:02d}/30.)")
        n += 1

closing = """\n## Required delivery sequence\n\nPhase A: audit the current code, identify claims that are not yet source-backed, establish fixtures, and write the plan. Phase B: build data contracts, provenance, error handling, permissions, calibration, and deterministic tests. Phase C: improve assets and scientific rendering. Phase D: unify gesture, keyboard, pointer, voice, and speech-to-speech actions behind one intent/action layer. Phase E: add cinematic staging and exhibition polish. Phase F: optimize across device tiers and validate accessibility. Phase G: run CI, build, live-data smoke tests, offline tests, security review, and a human scientific-content review.\n\n## Definition of done\n\nThe finished application must clearly label live, cached, simulated, and illustrative content; never silently invent a value; provide a source and timestamp for factual panels; recover from network, permission, model, WebGL, and speech failures; support hand, voice, keyboard, pointer, and visible UI control paths; prevent unintended destructive or privacy-sensitive actions; maintain stable frame pacing on declared device tiers; dispose resources cleanly; pass typecheck/tests/build; document known limitations; and preserve the existing `npm run dev`, `npm run lint`, `npm test`, and `npm run build` workflows.\n\nBefore claiming completion, produce: an architecture summary, data-source register, anatomy asset register, gesture/voice command matrix, speech-to-speech threat model, performance report, accessibility report, scientific-review checklist, test report, and a list of deferred work.\n"""

assert n == 1021, n
Path("MASTER_UPGRADE_PROMPT.md").write_text(intro + "\n".join(lines) + "\n" + closing, encoding="utf-8")
print(f"wrote MASTER_UPGRADE_PROMPT.md with {n-1} numbered suggestions")
