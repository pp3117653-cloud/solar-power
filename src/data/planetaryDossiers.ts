/**
 * ============================================================================
 * JARVIS — ASTROPHYSICS PLANETARY DOSSIERS, ELEMENTAL BREAKDOWN & QUIZ DATA
 * ============================================================================
 * Grounded in NASA Planetary Fact Sheet (nssdc.gsfc.nasa.gov) & JPL Horizons.
 * Covers Sun + Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune,
 * and Pluto (9th celestial body in 17.16° inclined elliptical orbit).
 */

export interface ElementalSlice {
  element: string;
  symbol: string;
  pct: number;
  color: string;
}

export interface InternalLayerSpec {
  name: string;
  radiusRatio: number;
  color: string;
  tempOrNote: string;
}

export interface TopologyPinSpec {
  name: string;
  detail: string;
  latDeg: number;
  lonDeg: number;
}

export interface PlanetaryDossier {
  id: string;
  partId: string;
  name: string;
  classification: string;
  distanceAu: number;
  orbitalPeriodDays: number;
  orbitalVelocityKmS: number;
  inclinationDeg: number;
  diameterKm: number;
  surfaceAreaKm2: string;
  massKg: string;
  gravityMs2: number;
  meanTempC: number;
  harmonicHz: number;
  elements: ElementalSlice[];
  internalLayers: InternalLayerSpec[];
  topologyPins: TopologyPinSpec[];
  factSummary: string;
}

export const PLANETARY_DOSSIERS: PlanetaryDossier[] = [
  {
    id: 'sun',
    partId: 'solar-sun',
    name: 'The Sun (Sol)',
    classification: 'G2V Main-Sequence Star',
    distanceAu: 0,
    orbitalPeriodDays: 1,
    orbitalVelocityKmS: 220,
    inclinationDeg: 0,
    diameterKm: 1392700,
    surfaceAreaKm2: '6.09 × 10¹² km²',
    massKg: '1.989 × 10³⁰ kg',
    gravityMs2: 274.0,
    meanTempC: 5500,
    harmonicHz: 126.22,
    elements: [
      { element: 'Hydrogen', symbol: 'H', pct: 73.0, color: '#f59e0b' },
      { element: 'Helium', symbol: 'He', pct: 25.0, color: '#fbbf24' },
      { element: 'Oxygen / Carbon / Iron', symbol: 'O/C/Fe', pct: 2.0, color: '#f97316' },
    ],
    internalLayers: [
      { name: 'Fusion Core (15M °C)', radiusRatio: 0.25, color: '#ffffff', tempOrNote: '600M tons H → He/sec' },
      { name: 'Radiative Zone', radiusRatio: 0.7, color: '#fde047', tempOrNote: 'Photon diffusion' },
      { name: 'Convective Zone & Photosphere', radiusRatio: 1.0, color: '#f97316', tempOrNote: '5,500 °C plasma' },
    ],
    topologyPins: [
      { name: 'Active Sunspot Group', detail: 'Intense magnetic flux regions (~3,500 °C)', latDeg: 18, lonDeg: 35 },
      { name: 'Coronal Magnetic Loops', detail: 'Superheated plasma arches (>1M °C)', latDeg: -14, lonDeg: -42 },
    ],
    factSummary: 'Holds 99.86% of the Solar System’s mass, powering planetary climates via proton–proton nuclear fusion.',
  },
  {
    id: 'mercury',
    partId: 'solar-mercury',
    name: 'Mercury',
    classification: 'Terrestrial Planet',
    distanceAu: 0.387,
    orbitalPeriodDays: 87.97,
    orbitalVelocityKmS: 47.36,
    inclinationDeg: 7.0,
    diameterKm: 4879,
    surfaceAreaKm2: '7.48 × 10⁷ km²',
    massKg: '3.30 × 10²³ kg',
    gravityMs2: 3.7,
    meanTempC: 167,
    harmonicHz: 282.54,
    elements: [
      { element: 'Metallic Iron Core', symbol: 'Fe', pct: 70.0, color: '#94a3b8' },
      { element: 'Silicate Mantle/Crust', symbol: 'SiO₂', pct: 29.0, color: '#cbd5e1' },
      { element: 'Exosphere (O₂/Na/H₂)', symbol: 'O/Na', pct: 1.0, color: '#38bdf8' },
    ],
    internalLayers: [
      { name: 'Solid/Molten Iron Core', radiusRatio: 0.82, color: '#cbd5e1', tempOrNote: '~85% of radius' },
      { name: 'Silicate Mantle', radiusRatio: 0.93, color: '#9a3412', tempOrNote: 'Thin rocky shell' },
      { name: 'Cratered Crust', radiusRatio: 1.0, color: '#78716c', tempOrNote: '-180 °C to +430 °C' },
    ],
    topologyPins: [
      { name: 'Caloris Basin', detail: '1,550 km wide ancient impact crater', latDeg: 30, lonDeg: -170 },
      { name: 'Discovery Rupes', detail: '650 km tectonic lobate scarp cliff', latDeg: -56, lonDeg: -38 },
    ],
    factSummary: 'Fastest-orbiting planet (47.4 km/s) with an oversized iron core spanning roughly 85% of its radius.',
  },
  {
    id: 'venus',
    partId: 'solar-venus',
    name: 'Venus',
    classification: 'Terrestrial Planet',
    distanceAu: 0.723,
    orbitalPeriodDays: 224.7,
    orbitalVelocityKmS: 35.02,
    inclinationDeg: 3.39,
    diameterKm: 12104,
    surfaceAreaKm2: '4.60 × 10⁸ km²',
    massKg: '4.87 × 10²⁴ kg',
    gravityMs2: 8.87,
    meanTempC: 464,
    harmonicHz: 221.23,
    elements: [
      { element: 'Carbon Dioxide', symbol: 'CO₂', pct: 96.5, color: '#f59e0b' },
      { element: 'Nitrogen', symbol: 'N₂', pct: 3.5, color: '#60a5fa' },
    ],
    internalLayers: [
      { name: 'Iron–Nickel Core', radiusRatio: 0.52, color: '#fde047', tempOrNote: 'No global dynamo' },
      { name: 'Rocky Silicate Mantle', radiusRatio: 0.94, color: '#dc2626', tempOrNote: 'Volcanic convection' },
      { name: 'Basalt Crust & H₂SO₄ Clouds', radiusRatio: 1.0, color: '#e7c888', tempOrNote: '92 bar · 464 °C' },
    ],
    topologyPins: [
      { name: 'Maxwell Montes', detail: '11 km tall mountain peak on Ishtar Terra', latDeg: 65, lonDeg: 3 },
      { name: 'Aphrodite Terra', detail: 'Equatorial volcanic highland continent', latDeg: -6, lonDeg: 104 },
    ],
    factSummary: 'Hottest planet (464 °C) due to a crushing 96.5% CO₂ greenhouse atmosphere and retrograde rotation.',
  },
  {
    id: 'earth',
    partId: 'solar-earth',
    name: 'Earth',
    classification: 'Terrestrial Ocean World',
    distanceAu: 1.0,
    orbitalPeriodDays: 365.25,
    orbitalVelocityKmS: 29.78,
    inclinationDeg: 0.0,
    diameterKm: 12756,
    surfaceAreaKm2: '5.10 × 10⁸ km²',
    massKg: '5.97 × 10²⁴ kg',
    gravityMs2: 9.8,
    meanTempC: 15,
    harmonicHz: 194.18,
    elements: [
      { element: 'Nitrogen', symbol: 'N₂', pct: 78.1, color: '#38bdf8' },
      { element: 'Oxygen', symbol: 'O₂', pct: 20.9, color: '#22c55e' },
      { element: 'Argon / CO₂ / Trace', symbol: 'Ar/CO₂', pct: 1.0, color: '#94a3b8' },
    ],
    internalLayers: [
      { name: 'Solid Inner Iron Core', radiusRatio: 0.2, color: '#fef08a', tempOrNote: '~5,400 °C' },
      { name: 'Liquid Outer Core', radiusRatio: 0.55, color: '#f97316', tempOrNote: 'Generates magnetosphere' },
      { name: 'Silicate Mantle & Crust', radiusRatio: 1.0, color: '#0284c7', tempOrNote: 'Plate tectonics & oceans' },
    ],
    topologyPins: [
      { name: 'Mount Everest', detail: '8,849 m highest subaerial peak (Himalayas)', latDeg: 28, lonDeg: 87 },
      { name: 'Mariana Trench', detail: '10,984 m deepest oceanic trench', latDeg: 11, lonDeg: 142 },
    ],
    factSummary: 'Only known world with liquid surface oceans, active plate tectonics, and a protective magnetic dipole.',
  },
  {
    id: 'mars',
    partId: 'solar-mars',
    name: 'Mars',
    classification: 'Terrestrial Planet',
    distanceAu: 1.524,
    orbitalPeriodDays: 686.98,
    orbitalVelocityKmS: 24.07,
    inclinationDeg: 1.85,
    diameterKm: 6792,
    surfaceAreaKm2: '1.45 × 10⁸ km²',
    massKg: '6.42 × 10²³ kg',
    gravityMs2: 3.71,
    meanTempC: -65,
    harmonicHz: 144.72,
    elements: [
      { element: 'Carbon Dioxide', symbol: 'CO₂', pct: 95.3, color: '#f97316' },
      { element: 'Nitrogen', symbol: 'N₂', pct: 2.6, color: '#60a5fa' },
      { element: 'Argon / O₂', symbol: 'Ar/O₂', pct: 2.1, color: '#94a3b8' },
    ],
    internalLayers: [
      { name: 'Liquid Iron–Nickel–Sulfur Core', radiusRatio: 0.54, color: '#fbbf24', tempOrNote: 'Measured by NASA InSight' },
      { name: 'Silicate Mantle', radiusRatio: 0.96, color: '#b45309', tempOrNote: 'Dormant volcanism' },
      { name: 'Iron-Oxide Basalt Crust', radiusRatio: 1.0, color: '#c2410c', tempOrNote: 'Thin 0.006 bar air' },
    ],
    topologyPins: [
      { name: 'Olympus Mons', detail: '21.9 km tall shield volcano (tallest in Solar System)', latDeg: 19, lonDeg: -134 },
      { name: 'Valles Marineris', detail: '4,000 km canyon system up to 7 km deep', latDeg: -14, lonDeg: -59 },
    ],
    factSummary: 'Iron-oxide desert world preserving ancient river deltas, polar water-ice caps, and giant shield volcanoes.',
  },
  {
    id: 'jupiter',
    partId: 'solar-jupiter',
    name: 'Jupiter',
    classification: 'Gas Giant',
    distanceAu: 5.204,
    orbitalPeriodDays: 4332.6,
    orbitalVelocityKmS: 13.07,
    inclinationDeg: 1.31,
    diameterKm: 142984,
    surfaceAreaKm2: '6.14 × 10¹⁰ km²',
    massKg: '1.898 × 10²⁷ kg',
    gravityMs2: 24.79,
    meanTempC: -110,
    harmonicHz: 183.58,
    elements: [
      { element: 'Molecular Hydrogen', symbol: 'H₂', pct: 89.8, color: '#fbbf24' },
      { element: 'Helium', symbol: 'He', pct: 10.2, color: '#fdba74' },
    ],
    internalLayers: [
      { name: 'Dilute Rocky/Icy Core', radiusRatio: 0.22, color: '#e2e8f0', tempOrNote: '~24,000 °C' },
      { name: 'Liquid Metallic Hydrogen', radiusRatio: 0.78, color: '#38bdf8', tempOrNote: 'Immense magnetosphere' },
      { name: 'Molecular H₂ / Ammonia Clouds', radiusRatio: 1.0, color: '#d6b08a', tempOrNote: 'Zonal jet streams' },
    ],
    topologyPins: [
      { name: 'Great Red Spot', detail: 'Centuries-old anticyclonic storm wider than Earth', latDeg: -22, lonDeg: 45 },
      { name: 'North Equatorial Belt', detail: 'High-speed ammonia cloud jet band', latDeg: 12, lonDeg: -60 },
    ],
    factSummary: 'More than twice as massive as all other planets combined, orbited by 95+ moons including Io, Europa, Ganymede, and Callisto.',
  },
  {
    id: 'saturn',
    partId: 'solar-saturn',
    name: 'Saturn',
    classification: 'Ringed Gas Giant',
    distanceAu: 9.582,
    orbitalPeriodDays: 10759.2,
    orbitalVelocityKmS: 9.68,
    inclinationDeg: 2.49,
    diameterKm: 120536,
    surfaceAreaKm2: '4.27 × 10¹⁰ km²',
    massKg: '5.68 × 10²⁶ kg',
    gravityMs2: 10.44,
    meanTempC: -140,
    harmonicHz: 147.85,
    elements: [
      { element: 'Molecular Hydrogen', symbol: 'H₂', pct: 96.3, color: '#fde68a' },
      { element: 'Helium', symbol: 'He', pct: 3.25, color: '#f59e0b' },
      { element: 'Methane & Ammonia', symbol: 'CH₄/NH₃', pct: 0.45, color: '#94a3b8' },
    ],
    internalLayers: [
      { name: 'Dense Rock–Ice Core', radiusRatio: 0.25, color: '#cbd5e1', tempOrNote: '~11,700 °C' },
      { name: 'Liquid Metallic Hydrogen', radiusRatio: 0.62, color: '#60a5fa', tempOrNote: 'Conductive dynamo' },
      { name: 'Liquid H₂ & Ice Ring System', radiusRatio: 1.0, color: '#e6cfa2', tempOrNote: 'Mean density 0.69 g/cm³' },
    ],
    topologyPins: [
      { name: 'North Polar Hexagon', detail: '29,000 km wide hexagonal jet-stream wave', latDeg: 78, lonDeg: 0 },
      { name: 'Cassini Division', detail: '4,800 km gap sculpted by moon Mimas resonance', latDeg: 0, lonDeg: 90 },
    ],
    factSummary: 'Lowest mean density of any planet (0.69 g/cm³), encircled by 282,000 km of crystalline water-ice rings.',
  },
  {
    id: 'uranus',
    partId: 'solar-uranus',
    name: 'Uranus',
    classification: 'Ice Giant',
    distanceAu: 19.201,
    orbitalPeriodDays: 30688.5,
    orbitalVelocityKmS: 6.8,
    inclinationDeg: 0.77,
    diameterKm: 51118,
    surfaceAreaKm2: '8.12 × 10⁹ km²',
    massKg: '8.68 × 10²⁵ kg',
    gravityMs2: 8.69,
    meanTempC: -195,
    harmonicHz: 207.36,
    elements: [
      { element: 'Hydrogen', symbol: 'H₂', pct: 82.5, color: '#7dd3fc' },
      { element: 'Helium', symbol: 'He', pct: 15.2, color: '#bae6fd' },
      { element: 'Methane (Cyan Tint)', symbol: 'CH₄', pct: 2.3, color: '#0284c7' },
    ],
    internalLayers: [
      { name: 'Silicate/Iron–Nickel Core', radiusRatio: 0.24, color: '#94a3b8', tempOrNote: '~5,000 °C' },
      { name: 'Superionic Water–Ammonia–Methane Mantle', radiusRatio: 0.8, color: '#0ea5e9', tempOrNote: 'Ionic fluid ice' },
      { name: 'H₂/He/CH₄ Atmosphere', radiusRatio: 1.0, color: '#7dd3fc', tempOrNote: '97.7° sideways tilt' },
    ],
    topologyPins: [
      { name: 'Polar Hood Haze', detail: 'Seasonal photochemical methane haze', latDeg: 80, lonDeg: 20 },
      { name: 'Epsilon Ring', detail: 'Brightest of 13 narrow dark rings', latDeg: 0, lonDeg: -75 },
    ],
    factSummary: 'Rotates sideways at a 97.77° axial tilt, creating 42-year continuous polar summers and winters.',
  },
  {
    id: 'neptune',
    partId: 'solar-neptune',
    name: 'Neptune',
    classification: 'Ice Giant',
    distanceAu: 30.047,
    orbitalPeriodDays: 60195.0,
    orbitalVelocityKmS: 5.43,
    inclinationDeg: 1.77,
    diameterKm: 49528,
    surfaceAreaKm2: '7.62 × 10⁹ km²',
    massKg: '1.02 × 10²⁶ kg',
    gravityMs2: 11.15,
    meanTempC: -200,
    harmonicHz: 211.44,
    elements: [
      { element: 'Hydrogen', symbol: 'H₂', pct: 80.0, color: '#3b82f6' },
      { element: 'Helium', symbol: 'He', pct: 19.0, color: '#60a5fa' },
      { element: 'Methane', symbol: 'CH₄', pct: 1.0, color: '#1d4ed8' },
    ],
    internalLayers: [
      { name: 'Rocky–Iron Core', radiusRatio: 0.26, color: '#cbd5e1', tempOrNote: '~5,400 °C' },
      { name: 'Water–Ammonia–Methane Ice Mantle', radiusRatio: 0.82, color: '#1d4ed8', tempOrNote: 'High internal heat' },
      { name: 'Supersonic Methane Cloud Deck', radiusRatio: 1.0, color: '#3b82f6', tempOrNote: '2,100 km/h winds' },
    ],
    topologyPins: [
      { name: 'Great Dark Spot Region', detail: 'High-pressure anticyclonic vortex zone', latDeg: -20, lonDeg: 30 },
      { name: 'Scooter Cloud', detail: 'Fast-moving bright methane cirrus plume', latDeg: -42, lonDeg: -50 },
    ],
    factSummary: 'First planet discovered via mathematical prediction (1846), swept by the fastest sustained winds in the Solar System.',
  },
  {
    id: 'pluto',
    partId: 'solar-pluto',
    name: 'Pluto (9th Body)',
    classification: 'Kuiper Belt Dwarf Planet',
    distanceAu: 39.48,
    orbitalPeriodDays: 90560.0,
    orbitalVelocityKmS: 4.67,
    inclinationDeg: 17.16,
    diameterKm: 2377,
    surfaceAreaKm2: '1.77 × 10⁷ km²',
    massKg: '1.30 × 10²² kg',
    gravityMs2: 0.62,
    meanTempC: -229,
    harmonicHz: 140.25,
    elements: [
      { element: 'Nitrogen Ice & Gas', symbol: 'N₂', pct: 98.0, color: '#cbd5e1' },
      { element: 'Methane Ice', symbol: 'CH₄', pct: 1.5, color: '#93c5fd' },
      { element: 'Carbon Monoxide', symbol: 'CO', pct: 0.5, color: '#f59e0b' },
    ],
    internalLayers: [
      { name: 'Silicate Rocky Core', radiusRatio: 0.7, color: '#78716c', tempOrNote: '~70% of diameter' },
      { name: 'Subsurface Water-Ice Mantle', radiusRatio: 0.95, color: '#38bdf8', tempOrNote: 'Possible liquid ocean' },
      { name: 'Nitrogen/Methane Cryo-Crust', radiusRatio: 1.0, color: '#e2e8f0', tempOrNote: '-229 °C glaciers' },
    ],
    topologyPins: [
      { name: 'Sputnik Planitia', detail: '1,000 km convecting nitrogen-ice glacier heart', latDeg: 25, lonDeg: 175 },
      { name: 'Wright Mons', detail: '4 km tall suspected cryovolcano', latDeg: -21, lonDeg: 173 },
    ],
    factSummary: 'Orbits in a 17.16° inclined elliptical Kuiper Belt path in 2:3 resonance with Neptune, explored by NASA New Horizons (2015).',
  },
];

export interface JudgeQuizQuestion {
  id: string;
  question: string;
  options: [string, string, string];
  correctIndex: number;
  explanation: string;
}

export const JUDGE_QUIZ_QUESTIONS: JudgeQuizQuestion[] = [
  {
    id: 'q1',
    question: 'Which planet has a 96.5% CO₂ atmosphere making it hotter than Mercury?',
    options: ['Venus (464 °C)', 'Mars (-65 °C)', 'Jupiter (-110 °C)'],
    correctIndex: 0,
    explanation: 'Venus traps thermal radiation under 92 bars of 96.5% CO₂, reaching 464 °C.',
  },
  {
    id: 'q2',
    question: 'What is the tallest volcano in the entire Solar System?',
    options: ['Maxwell Montes (Venus)', 'Olympus Mons (Mars)', 'Wright Mons (Pluto)'],
    correctIndex: 1,
    explanation: 'Olympus Mons on Mars rises ~21.9 km—nearly 2.5× the height of Mount Everest.',
  },
  {
    id: 'q3',
    question: 'Approximately what percentage of the Solar System’s total mass is inside the Sun?',
    options: ['82.5%', '95.3%', '99.86%'],
    correctIndex: 2,
    explanation: 'The Sun contains 99.86% of the Solar System’s mass, composed of ~73% Hydrogen and ~25% Helium.',
  },
  {
    id: 'q4',
    question: 'What is Pluto’s orbital inclination angle relative to the ecliptic plane?',
    options: ['1.85°', '7.00°', '17.16°'],
    correctIndex: 2,
    explanation: 'Pluto orbits on a steep 17.16° inclined elliptical Kuiper Belt trajectory.',
  },
  {
    id: 'q5',
    question: 'Which planet’s mean density (0.69 g/cm³) is lower than liquid water?',
    options: ['Saturn', 'Uranus', 'Neptune'],
    correctIndex: 0,
    explanation: 'Saturn is composed of 96.3% Hydrogen and 3.25% Helium with a mean density of 0.69 g/cm³.',
  },
];
