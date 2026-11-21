import { ModelId } from '../config/constants';

export type VoiceActionType =
  | { type: 'SELECT_MODEL'; modelId: ModelId }
  | { type: 'SELECT_PLANET'; partId: string; planetName: string }
  | { type: 'TOGGLE_GRAVITY_WELL' }
  | { type: 'TOGGLE_HABITABLE_ZONE' }
  | { type: 'FIRE_LIGHT_PULSE' }
  | { type: 'TOGGLE_TOUR' }
  | { type: 'TOGGLE_QUIZ' }
  | { type: 'TOGGLE_INFRARED' }
  | { type: 'TOGGLE_RULER' }
  | { type: 'SHOW_ELEMENTS' }
  | { type: 'TOGGLE_CROSS_SECTION' }
  | { type: 'TOGGLE_SIZE_SCALE' }
  | { type: 'TOGGLE_TIMELINE' }
  | { type: 'TOGGLE_ORBITAL_AUDIO' }
  | { type: 'TOGGLE_TRAJECTORY' }
  | { type: 'INTRODUCE_JUDGES' }
  | { type: 'ZOOM_IN' }
  | { type: 'ZOOM_OUT' }
  | { type: 'RESET' }
  | { type: 'EXPLODE' }
  | { type: 'ASSEMBLE' }
  | { type: 'HOLOGRAM_MODE'; enabled?: boolean }
  | { type: 'TOGGLE_CAMERA' }
  | { type: 'THANK_YOU_EASTER_EGG' }
  | { type: 'START_HUMAN_BODY_NARRATION' }
  | { type: 'STOP_HUMAN_BODY_NARRATION' }
  | { type: 'RESUME_HUMAN_BODY_NARRATION' }
  | { type: 'NEXT_NARRATION_CHAPTER' }
  | { type: 'SET_ANATOMY_SCALE'; scaleMode: 'organism' | 'cell' }
  | { type: 'ISOLATE_ANATOMY_LAYER'; layerKey: string; label: string }
  | { type: 'APPLY_ANATOMY_PRESET'; preset: 'all' | 'organs' | 'skeleton' | 'neuro-vascular' }
  | { type: 'ADJUST_HEART_BPM'; delta: number; absolute?: number }
  | { type: 'OPEN_ANATOMY_MEDIA'; category: 'cell' | 'body' | 'skeleton' | 'brain' | 'heart' | 'lungs' | 'digestive' | 'videos' }
  | { type: 'TOGGLE_MENU'; open?: boolean }
  | { type: 'ROTATE_STEP'; direction: 'left' | 'right' }
  | { type: 'HELP_GUIDE' };

export interface ParsedVoiceCommand {
  recognized: boolean;
  wakeWordDetected: boolean;
  rawTranscript: string;
  action: VoiceActionType | null;
  jarvisReply: string;
}

export const JARVIS_REPLIES = {
  THANK_YOU: 'You are welcome.',
  ASSEMBLE: 'Pieces put back together.',
  EXPLODE: 'Explode view on.',
  RESET: 'Back to the default view.',
  ZOOM_IN: 'Zooming in.',
  ZOOM_OUT: 'Zooming out.',
  HOLOGRAM_ON: 'Hologram pyramid on.',
  HOLOGRAM_OFF: 'Hologram pyramid off.',
  HOLOGRAM_TOGGLE: 'Hologram pyramid toggled.',
  CAMERA_TOGGLE: 'Camera preview toggled.',
  HELP_GUIDE: 'Opening the guide.',
  MODEL_HEART: 'Showing the heart.',
  MODEL_SOLAR: 'Showing stage one, the solar system.',
  MODEL_HUMAN_BODY: 'Showing stage two, the complete human body anatomy atlas.',
  NARRATION_START: 'Starting complete four-minute human body explanation from cell to organism.',
  NARRATION_STOP: 'Pausing human body explanation.',
  NARRATION_RESUME: 'Resuming human body explanation.',
  MODEL_EARTH: 'Showing the earth.',
  MODEL_DNA: 'Showing the DNA helix.',
  MODEL_ATOM: 'Showing the carbon atom.',
  STANDBY: 'Listening. Try saying a command.',
} as const;

/**
 * 4.1: Normalise NFC, lowercase, replace . , ! ? " ' ’ ‘ “ ” । with spaces, collapse spaces.
 */
export function normalizeTranscript(input: string): string {
  return input
    .normalize('NFC')
    .toLowerCase()
    .replace(/[.,!?"'’‘“”।]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const NORMALIZED_REPLIES_SET = new Set<string>(
  Object.values(JARVIS_REPLIES).map((r) => normalizeTranscript(r))
);

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isDevanagari(phrase: string): boolean {
  return /[\u0900-\u097F]/.test(phrase);
}

/**
 * 4.1: Do not use \b. Latin phrases match with (^|\s)phrase(\s|$); Devanagari phrases use includes().
 */
export function matchesPhrase(normalizedText: string, phrase: string): boolean {
  const normPhrase = normalizeTranscript(phrase);
  if (!normPhrase) return false;
  if (isDevanagari(normPhrase)) {
    return normalizedText.includes(normPhrase);
  }
  const pattern = new RegExp(`(^|\\s)${escapeRegex(normPhrase)}(\\s|$)`);
  return pattern.test(normalizedText);
}

export function matchesAnyPhrase(normalizedText: string, phrases: readonly string[]): boolean {
  for (const p of phrases) {
    if (matchesPhrase(normalizedText, p)) return true;
  }
  return false;
}


const PLANET_PART_ALIASES: Array<{ partId: string; name: string; aliases: readonly string[] }> = [
  { partId: 'solar-sun', name: 'Sun', aliases: ['sun', 'surya', 'suraj', 'सूर्य'] },
  { partId: 'solar-mercury', name: 'Mercury', aliases: ['mercury', 'budh', 'बुध'] },
  { partId: 'solar-venus', name: 'Venus', aliases: ['venus', 'shukra', 'शुक्र'] },
  { partId: 'solar-earth', name: 'Earth', aliases: ['earth', 'prithvi', 'dharti', 'पृथ्वी'] },
  { partId: 'solar-mars', name: 'Mars', aliases: ['mars', 'mangal', 'मंगल'] },
  { partId: 'solar-jupiter', name: 'Jupiter', aliases: ['jupiter', 'brihaspati', 'बृहस्पति'] },
  { partId: 'solar-saturn', name: 'Saturn', aliases: ['saturn', 'shani', 'शनि'] },
  { partId: 'solar-uranus', name: 'Uranus', aliases: ['uranus', 'arun', 'अरुण'] },
  { partId: 'solar-neptune', name: 'Neptune', aliases: ['neptune', 'varun', 'वरुण'] },
  { partId: 'solar-pluto', name: 'Pluto', aliases: ['pluto', 'yam', 'प्लूटो'] },
];

const OPEN_ABOUT_VERBS = ['open about', 'open', 'analyze', 'tell me about', 'about', 'show', 'dikhao', 'batao', 'दिखाओ', 'बताओ'] as const;

const WAKE_WORDS = [
  'jarvis',
  'jarvish',
  'jervis',
  'garvis',
  'javis',
  'jaarvis',
  'जार्विस',
  'जारविस',
] as const;

const SHOW_VERBS = [
  'show',
  'open',
  'display',
  'load',
  'go to',
  'dikhao',
  'dikha',
  'दिखाओ',
  'दिखा',
] as const;

const THANKS_PHRASES = [
  'thank you',
  'thanks',
  'shukriya',
  'dhanyawad',
  'thank u',
  'धन्यवाद',
  'शुक्रिया',
] as const;

const ASSEMBLE_PHRASES = [
  'wapas jodo',
  'वापस जोड़ो',
  'assemble',
  'reassemble',
  'combine',
  'join',
  'jodo',
  'जोड़ो',
] as const;

const EXPLODE_PHRASES = [
  'explode',
  'separate',
  'expand',
  'apart',
  'alag karo',
  'kholo',
  'अलग करो',
  'खोलो',
] as const;

const RESET_PHRASES = [
  'reset',
  'default',
  'center',
  'restore',
  'wapas',
  'shuru se',
  'रीसेट',
  'वापस',
] as const;

const ZOOM_IN_PHRASES = [
  'zoom in',
  'closer',
  'magnify',
  'bada karo',
  'paas lao',
  'बड़ा करो',
  'पास लाओ',
] as const;

const ZOOM_OUT_PHRASES = [
  'zoom out',
  'smaller',
  'further',
  'chota karo',
  'door karo',
  'छोटा करो',
  'दूर करो',
] as const;

const HOLOGRAM_ON_PHRASES = [
  'hologram mode on',
  'hologram on',
  'pyramid mode on',
  'pyramid on',
] as const;

const HOLOGRAM_OFF_PHRASES = [
  'hologram mode off',
  'hologram off',
  'pyramid mode off',
  'pyramid off',
  'exit hologram',
] as const;

const HOLOGRAM_TOGGLE_PHRASES = [
  'hologram mode',
  'hologram',
  'pyramid mode',
  'pyramid',
  'prism',
  'projection',
  'होलोग्राम',
] as const;

const CAMERA_PHRASES = [
  'hide camera',
  'show camera',
  'toggle camera',
  'camera band',
  'camera chalu',
  'webcam',
  'कैमरा',
] as const;

const HELP_PHRASES = [
  'help',
  'tips',
  'calibrate',
  'calibration',
  'guide',
  'madad',
  'मदद',
] as const;

const MODEL_NOUNS: Record<ModelId, readonly string[]> = {
  solar: [
    'solar system', 'solar', 'planets', 'saur mandal', 'sun', 'grah', 'सौर मंडल',
    'stage 1', 'stage one', 'first stage', 'first page',
    'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune',
  ],
  'human-body': [
    'human body', 'human anatomy', 'anatomy', 'body', 'human', 'cell', 'organs', 'skeleton',
    'stage 2', 'stage two', 'second stage', 'second page',
    'manav sharir', 'sharir', 'मानव शरीर', 'शरीर', 'कोशिका',
  ],
};

function stripWakeWords(normalized: string): string {
  let out = normalized;
  for (const w of WAKE_WORDS) {
    if (isDevanagari(w)) {
      out = out.split(w).join(' ');
    } else {
      const rx = new RegExp(`(^|\\s)${escapeRegex(w)}(\\s|$)`, 'g');
      out = out.replace(rx, ' ');
    }
  }
  return out.replace(/\s+/g, ' ').trim();
}

/**
 * Parses spoken or typed transcripts into structured Jarvis actions.
 */
export function parseVoiceTranscript(
  rawTranscript: string,
  requireWakeWord = false
): ParsedVoiceCommand {
  const cleaned = normalizeTranscript(rawTranscript);

  // Self-hearing safety: every jarvisReply string triggers no action
  if (!cleaned || NORMALIZED_REPLIES_SET.has(cleaned)) {
    return {
      recognized: false,
      wakeWordDetected: false,
      rawTranscript,
      action: null,
      jarvisReply: '',
    };
  }

  const wakeWordDetected = matchesAnyPhrase(cleaned, WAKE_WORDS);

  if (requireWakeWord && !wakeWordDetected) {
    return {
      recognized: false,
      wakeWordDetected: false,
      rawTranscript,
      action: null,
      jarvisReply: '',
    };
  }

  // (1) Thanks
  if (matchesAnyPhrase(cleaned, THANKS_PHRASES)) {
    return {
      recognized: true,
      wakeWordDetected: true,
      rawTranscript,
      action: { type: 'THANK_YOU_EASTER_EGG' },
      jarvisReply: JARVIS_REPLIES.THANK_YOU,
    };
  }

  // (1.5) 3-5 Minute Guided Human Body Explanation ("Continue explaining the human body")
  if (
    matchesAnyPhrase(cleaned, [
      'continue explaining the human body',
      'continue explaining human body',
      'explain the human body',
      'explain human body',
      'start human body explanation',
      'narrate human body',
      'explain anatomy',
      'human body samjhao',
      'मानव शरीर समझाओ',
      'शरीर समझाओ',
    ])
  ) {
    return {
      recognized: true,
      wakeWordDetected,
      rawTranscript,
      action: { type: 'START_HUMAN_BODY_NARRATION' },
      jarvisReply: JARVIS_REPLIES.NARRATION_START,
    };
  }

  if (
    matchesAnyPhrase(cleaned, [
      'stop explaining',
      'stop explanation',
      'pause explanation',
      'pause narration',
      'stop narration',
      'samjhana band karo',
    ])
  ) {
    return {
      recognized: true,
      wakeWordDetected,
      rawTranscript,
      action: { type: 'STOP_HUMAN_BODY_NARRATION' },
      jarvisReply: JARVIS_REPLIES.NARRATION_STOP,
    };
  }

  if (
    matchesAnyPhrase(cleaned, [
      'resume explanation',
      'resume narration',
      'continue explanation',
    ])
  ) {
    return {
      recognized: true,
      wakeWordDetected,
      rawTranscript,
      action: { type: 'RESUME_HUMAN_BODY_NARRATION' },
      jarvisReply: JARVIS_REPLIES.NARRATION_RESUME,
    };
  }

  if (matchesAnyPhrase(cleaned, ['next chapter', 'next part', 'skip chapter', 'agla bhag', 'अगला भाग'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'NEXT_NARRATION_CHAPTER' }, jarvisReply: 'Advancing to next anatomy chapter.' };
  }
  if (matchesAnyPhrase(cleaned, ['zoom to cell', 'show cell', 'open cell', 'eukaryotic cell', 'cell view', 'koshika', 'कोशिका'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'SET_ANATOMY_SCALE', scaleMode: 'cell' }, jarvisReply: 'Focusing on the microscopic eukaryotic human cell.' };
  }
  if (matchesAnyPhrase(cleaned, ['full body', 'whole body', 'organism view', 'show whole body', 'poora sharir', 'पूरा शरीर'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'SET_ANATOMY_SCALE', scaleMode: 'organism' }, jarvisReply: 'Returning to the complete human body view.' };
  }
  if (matchesAnyPhrase(cleaned, ['show all layers', 'all layers', 'all systems', 'sabhi layer'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'APPLY_ANATOMY_PRESET', preset: 'all' }, jarvisReply: 'Showing all eleven organ systems and cell core.' };
  }
  if (matchesAnyPhrase(cleaned, ['internal organs', 'organs only', 'show organs', 'sirf ang'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'APPLY_ANATOMY_PRESET', preset: 'organs' }, jarvisReply: 'Isolating internal human organs.' };
  }
  if (matchesAnyPhrase(cleaned, ['neuro vascular', 'nerves and blood', 'neurovascular'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'APPLY_ANATOMY_PRESET', preset: 'neuro-vascular' }, jarvisReply: 'Highlighting nervous and cardiovascular networks.' };
  }
  if (matchesAnyPhrase(cleaned, ['play anatomy video', 'show videos', 'anatomy videos', 'medical video', 'video dikhao'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'OPEN_ANATOMY_MEDIA', category: 'videos' }, jarvisReply: 'Loading real-time human anatomy videos.' };
  }
  if (matchesAnyPhrase(cleaned, ['increase heart rate', 'faster heart', 'exercise heart rate', 'dil tej karo'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'ADJUST_HEART_BPM', delta: 24 }, jarvisReply: 'Increasing heart rate.' };
  }
  if (matchesAnyPhrase(cleaned, ['decrease heart rate', 'slower heart', 'slow heart rate', 'resting heart rate', 'dil dheema karo'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'ADJUST_HEART_BPM', delta: -20 }, jarvisReply: 'Decreasing heart rate.' };
  }
  if (matchesAnyPhrase(cleaned, ['open menu', 'open atlas', 'show menu', 'menu kholo'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'TOGGLE_MENU', open: true }, jarvisReply: 'Opening the atlas menu.' };
  }
  if (matchesAnyPhrase(cleaned, ['close menu', 'hide menu', 'close atlas', 'menu band karo'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'TOGGLE_MENU', open: false }, jarvisReply: 'Closing the atlas menu.' };
  }
  if (matchesAnyPhrase(cleaned, ['rotate left', 'turn left', 'baye ghumao'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'ROTATE_STEP', direction: 'left' }, jarvisReply: 'Rotating left.' };
  }
  if (matchesAnyPhrase(cleaned, ['rotate right', 'turn right', 'daye ghumao'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'ROTATE_STEP', direction: 'right' }, jarvisReply: 'Rotating right.' };
  }

  // Individual Human Body Organ System voice isolation
  const systemVoiceMap: Array<{ key: string; label: string; phrases: string[] }> = [
    { key: 'integumentary', label: 'Integumentary System', phrases: ['integumentary', 'show skin', 'skin layer', 'twacha'] },
    { key: 'skeletal', label: 'Skeletal System', phrases: ['skeletal system', 'show skeleton', 'skeleton', '206 bones', 'haddi', 'कंकाल'] },
    { key: 'muscular', label: 'Muscular System', phrases: ['muscular system', 'show muscles', 'muscles', 'manspeshi'] },
    { key: 'nervous', label: 'Nervous System', phrases: ['nervous system', 'show brain', 'brain', 'cranial nerves', 'dimag', 'मस्तिष्क'] },
    { key: 'endocrine', label: 'Endocrine System', phrases: ['endocrine system', 'show glands', 'endocrine', 'hormones'] },
    { key: 'cardiovascular', label: 'Cardiovascular System', phrases: ['cardiovascular', 'show heart', 'heart', 'dil', 'हृदय'] },
    { key: 'lymphatic', label: 'Lymphatic & Immune System', phrases: ['lymphatic', 'immune system', 'spleen', 'thymus'] },
    { key: 'respiratory', label: 'Respiratory System', phrases: ['respiratory', 'show lungs', 'lungs', 'phephde', 'फेफड़े'] },
    { key: 'digestive', label: 'Digestive System', phrases: ['digestive', 'show stomach', 'stomach', 'liver', 'intestine', 'pachan'] },
    { key: 'urinary', label: 'Urinary System', phrases: ['urinary', 'show kidneys', 'kidneys', 'kidney', 'gurda'] },
    { key: 'reproductive', label: 'Reproductive System', phrases: ['reproductive system', 'reproductive'] },
  ];
  for (const sys of systemVoiceMap) {
    if (matchesAnyPhrase(cleaned, sys.phrases)) {
      return {
        recognized: true,
        wakeWordDetected,
        rawTranscript,
        action: { type: 'ISOLATE_ANATOMY_LAYER', layerKey: sys.key, label: sys.label },
        jarvisReply: `Highlighting the ${sys.label}.`,
      };
    }
  }

  // (2) Actions: assemble (before reset, so "wapas jodo" works), explode, reset, zoom in/out, hologram, camera, help
  if (matchesAnyPhrase(cleaned, ASSEMBLE_PHRASES)) {
    return {
      recognized: true,
      wakeWordDetected,
      rawTranscript,
      action: { type: 'ASSEMBLE' },
      jarvisReply: JARVIS_REPLIES.ASSEMBLE,
    };
  }

  if (matchesAnyPhrase(cleaned, EXPLODE_PHRASES)) {
    return {
      recognized: true,
      wakeWordDetected,
      rawTranscript,
      action: { type: 'EXPLODE' },
      jarvisReply: JARVIS_REPLIES.EXPLODE,
    };
  }

  if (matchesAnyPhrase(cleaned, RESET_PHRASES)) {
    return {
      recognized: true,
      wakeWordDetected,
      rawTranscript,
      action: { type: 'RESET' },
      jarvisReply: JARVIS_REPLIES.RESET,
    };
  }

  if (matchesAnyPhrase(cleaned, ZOOM_IN_PHRASES)) {
    return {
      recognized: true,
      wakeWordDetected,
      rawTranscript,
      action: { type: 'ZOOM_IN' },
      jarvisReply: JARVIS_REPLIES.ZOOM_IN,
    };
  }

  if (matchesAnyPhrase(cleaned, ZOOM_OUT_PHRASES)) {
    return {
      recognized: true,
      wakeWordDetected,
      rawTranscript,
      action: { type: 'ZOOM_OUT' },
      jarvisReply: JARVIS_REPLIES.ZOOM_OUT,
    };
  }

  if (matchesAnyPhrase(cleaned, HOLOGRAM_ON_PHRASES)) {
    return {
      recognized: true,
      wakeWordDetected,
      rawTranscript,
      action: { type: 'HOLOGRAM_MODE', enabled: true },
      jarvisReply: JARVIS_REPLIES.HOLOGRAM_ON,
    };
  }

  if (matchesAnyPhrase(cleaned, HOLOGRAM_OFF_PHRASES)) {
    return {
      recognized: true,
      wakeWordDetected,
      rawTranscript,
      action: { type: 'HOLOGRAM_MODE', enabled: false },
      jarvisReply: JARVIS_REPLIES.HOLOGRAM_OFF,
    };
  }

  if (matchesAnyPhrase(cleaned, HOLOGRAM_TOGGLE_PHRASES)) {
    return {
      recognized: true,
      wakeWordDetected,
      rawTranscript,
      action: { type: 'HOLOGRAM_MODE' },
      jarvisReply: JARVIS_REPLIES.HOLOGRAM_TOGGLE,
    };
  }

  if (matchesAnyPhrase(cleaned, CAMERA_PHRASES)) {
    return {
      recognized: true,
      wakeWordDetected,
      rawTranscript,
      action: { type: 'TOGGLE_CAMERA' },
      jarvisReply: JARVIS_REPLIES.CAMERA_TOGGLE,
    };
  }

  if (matchesAnyPhrase(cleaned, HELP_PHRASES)) {
    return {
      recognized: true,
      wakeWordDetected,
      rawTranscript,
      action: { type: 'HELP_GUIDE' },
      jarvisReply: JARVIS_REPLIES.HELP_GUIDE,
    };
  }

  if (matchesAnyPhrase(cleaned, ['welcome judges', 'introduce yourself', 'who are you', 'welcome teachers'])) {
    return {
      recognized: true,
      wakeWordDetected,
      rawTranscript,
      action: { type: 'INTRODUCE_JUDGES' },
      jarvisReply: 'Welcome teachers and judges. I am Jarvis, a real-time 3D Solar System powered by NASA J2000 ephemeris, 4-hand gesture tracking, and live voice control.',
    };
  }

  if (matchesAnyPhrase(cleaned, ['show elements', 'elemental composition', 'elements', 'tatva dikhao'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'SHOW_ELEMENTS' }, jarvisReply: 'Displaying elemental composition breakdown and surface topology.' };
  }
  if (matchesAnyPhrase(cleaned, ['cross section', 'internal layers', 'core view', 'andar dikhao'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'TOGGLE_CROSS_SECTION' }, jarvisReply: 'Switching to 3D planetary internal cross-section view.' };
  }
  if (matchesAnyPhrase(cleaned, ['compare sizes', 'size scale', 'line up planets', 'size comparison'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'TOGGLE_SIZE_SCALE' }, jarvisReply: 'Lining up all planets and Pluto side by side to scale.' };
  }
  if (matchesAnyPhrase(cleaned, ['historical timeline', 'time travel', 'planetary alignment', 'timeline'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'TOGGLE_TIMELINE' }, jarvisReply: 'Opening historical planetary alignment timeline.' };
  }
  if (matchesAnyPhrase(cleaned, ['orbital audio', 'orbital music', 'resonance', 'space music'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'TOGGLE_ORBITAL_AUDIO' }, jarvisReply: 'Toggling planetary orbital resonance synthesizer.' };
  }
  if (matchesAnyPhrase(cleaned, ['spacecraft', 'trajectory', 'launch planner', 'hohmann'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'TOGGLE_TRAJECTORY' }, jarvisReply: 'Opening spacecraft Hohmann transfer trajectory planner.' };
  }
  // Exhibition Showstopper Voice Commands
  if (matchesAnyPhrase(cleaned, ['gravity well', 'spacetime', 'einstein'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'TOGGLE_GRAVITY_WELL' }, jarvisReply: 'Toggling Einstein spacetime gravity well.' };
  }
  if (matchesAnyPhrase(cleaned, ['habitable zone', 'goldilocks', 'life zone'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'TOGGLE_HABITABLE_ZONE' }, jarvisReply: 'Highlighting the habitable Goldilocks zone.' };
  }
  if (matchesAnyPhrase(cleaned, ['light speed', 'photon pulse', 'photon'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'FIRE_LIGHT_PULSE' }, jarvisReply: 'Firing photon pulse at 299,792 kilometers per second.' };
  }
  if (matchesAnyPhrase(cleaned, ['start tour', 'stop tour', 'guided tour', 'tour'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'TOGGLE_TOUR' }, jarvisReply: 'Toggling guided Solar System tour.' };
  }
  if (matchesAnyPhrase(cleaned, ['quiz me', 'start quiz', 'stop quiz', 'quiz'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'TOGGLE_QUIZ' }, jarvisReply: 'Toggling exhibition judge quiz mode.' };
  }
  if (matchesAnyPhrase(cleaned, ['infrared', 'thermal view', 'thermal'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'TOGGLE_INFRARED' }, jarvisReply: 'Switching infrared thermal vision.' };
  }
  if (matchesAnyPhrase(cleaned, ['measure distance', 'laser distance', 'distance ruler'])) {
    return { recognized: true, wakeWordDetected, rawTranscript, action: { type: 'TOGGLE_RULER' }, jarvisReply: 'Activating Earth-to-planet laser distance ruler.' };
  }

  // (2.5) Individual Planet Details: "open Mars", "open about Saturn", "tell me about Jupiter"
  const cleanedNoWake = stripWakeWords(cleaned);
  const hasOpenAboutVerb = matchesAnyPhrase(cleanedNoWake, OPEN_ABOUT_VERBS);
  for (const p of PLANET_PART_ALIASES) {
    if (matchesAnyPhrase(cleanedNoWake, p.aliases)) {
      const isJustPlanet = p.aliases.some((a) => normalizeTranscript(a) === cleanedNoWake);
      if (hasOpenAboutVerb || isJustPlanet) {
        return {
          recognized: true,
          wakeWordDetected,
          rawTranscript,
          action: { type: 'SELECT_PLANET', partId: p.partId, planetName: p.name },
          jarvisReply: `Moving to ${p.name} and opening full planetary details.`,
        };
      }
    }
  }

  // (3) Model nouns: count only if the utterance has a show-verb or is just the noun (with optional wake word)
  const withoutWake = stripWakeWords(cleaned);
  const hasShowVerb = matchesAnyPhrase(withoutWake, SHOW_VERBS);

  const modelOrder: Array<{ id: ModelId; reply: string }> = [
    { id: 'human-body', reply: JARVIS_REPLIES.MODEL_HUMAN_BODY },
    { id: 'solar', reply: JARVIS_REPLIES.MODEL_SOLAR },
  ];

  for (const { id, reply } of modelOrder) {
    const nouns = MODEL_NOUNS[id];
    const hasNoun = matchesAnyPhrase(withoutWake, nouns);
    if (!hasNoun) continue;

    const isJustNoun = nouns.some((n) => normalizeTranscript(n) === withoutWake);
    if (hasShowVerb || isJustNoun) {
      return {
        recognized: true,
        wakeWordDetected,
        rawTranscript,
        action: { type: 'SELECT_MODEL', modelId: id },
        jarvisReply: reply,
      };
    }
  }

  return {
    recognized: false,
    wakeWordDetected,
    rawTranscript,
    action: null,
    jarvisReply: wakeWordDetected ? JARVIS_REPLIES.STANDBY : '',
  };
}
