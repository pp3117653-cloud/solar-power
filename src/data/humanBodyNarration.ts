/**
 * ============================================================================
 * JARVIS — 3 TO 5 MINUTE SYNCHRONIZED HUMAN BODY VOICE NARRATION SCRIPT
 * ============================================================================
 * Triggered by speaking "Continue explaining the human body" (or clicking Start).
 * 14 chapters (~620 words ≈ 4 minutes 05 seconds at natural 150 WPM cadence),
 * choreographing the 3D Human Body + Eukaryotic Cell model, layer visibility,
 * radial explode view, and live anatomical media gallery in real time.
 */

import { AnatomyLayerKey, AnatomyScaleMode } from './humanAnatomyBook';
import { AnatomyMediaCategory } from '../services/anatomyMediaService';

export interface NarrationChapter {
  index: number;
  id: string;
  title: string;
  durationSec: number;
  scaleMode: AnatomyScaleMode;
  explodeTarget: number;
  part3dId: string;
  mediaCategory: AnatomyMediaCategory;
  activeLayers: AnatomyLayerKey[];
  speechText: string;
}

export const HUMAN_BODY_NARRATION_CHAPTERS: NarrationChapter[] = [
  {
    index: 1,
    id: 'narr-01-chemical',
    title: '1. Chemical & Atomic Foundation',
    durationSec: 16,
    scaleMode: 'cell',
    explodeTarget: 0,
    part3dId: 'body-cell-core',
    mediaCategory: 'cell',
    activeLayers: ['cell'],
    speechText:
      'Welcome to Stage Two of Project Jarvis: the complete human body, from a single cell to the living organism. Everything begins at the chemical level, where atoms of carbon, hydrogen, oxygen, nitrogen, calcium, and phosphorus bond into water, adenosine triphosphate, proteins, lipids, and the DNA double helix.',
  },
  {
    index: 2,
    id: 'narr-02-cell',
    title: '2. The Eukaryotic Human Cell',
    durationSec: 22,
    scaleMode: 'cell',
    explodeTarget: 0.15,
    part3dId: 'body-cell-core',
    mediaCategory: 'cell',
    activeLayers: ['cell'],
    speechText:
      'Zooming into the cellular level, our three-dimensional eukaryotic cell is enclosed by a selectively permeable phospholipid bilayer. At its center sits the nucleus holding forty-six chromosomes and the nucleolus that builds ribosomes. Surrounding it, the rough endoplasmic reticulum folds proteins, the Golgi apparatus packages vesicles, lysosomes recycle waste, peroxisomes detoxify free radicals, and hundreds of mitochondria convert glucose and oxygen into usable ATP energy.',
  },
  {
    index: 3,
    id: 'narr-03-tissues',
    title: '3. Four Primary Tissue Families',
    durationSec: 16,
    scaleMode: 'organism',
    explodeTarget: 0.1,
    part3dId: 'body-integumentary',
    mediaCategory: 'body',
    activeLayers: ['cell', 'integumentary', 'skeletal', 'muscular', 'nervous'],
    speechText:
      'Specialized cells sharing embryonic origins unite into exactly four primary tissue types: epithelial tissue lining surfaces and glands, connective tissue including bone, cartilage, and blood, contractile muscle tissue, and electrochemical nervous tissue. Together, these tissues assemble into organs and eleven coordinated organ systems.',
  },
  {
    index: 4,
    id: 'narr-04-integumentary',
    title: '4. Integumentary System (Skin)',
    durationSec: 16,
    scaleMode: 'organism',
    explodeTarget: 0.25,
    part3dId: 'body-integumentary',
    mediaCategory: 'body',
    activeLayers: ['integumentary', 'skeletal'],
    speechText:
      'System one is the integumentary system. Your skin consists of an outer avascular epidermis with up to five strata, a vascularized collagen-rich dermis housing hair follicles, nails, touch receptors, and sweat glands, and an insulating hypodermis beneath. It shields against pathogens, regulates body temperature, and synthesizes vitamin D.',
  },
  {
    index: 5,
    id: 'narr-05-skeletal',
    title: '5. Skeletal System (206 Adult Bones)',
    durationSec: 20,
    scaleMode: 'organism',
    explodeTarget: 0.2,
    part3dId: 'body-skeletal',
    mediaCategory: 'skeleton',
    activeLayers: ['integumentary', 'skeletal'],
    speechText:
      'System two is the skeletal system, composed of two hundred and six adult bones. Eighty axial bones form the twenty-two-bone skull, middle-ear ossicles, hyoid, twenty-six-bone vertebral column, sternum, and twelve pairs of ribs. One hundred and twenty-six appendicular bones form the shoulder and pelvic girdles plus the arms and legs, storing calcium and producing blood cells in red bone marrow.',
  },
  {
    index: 6,
    id: 'narr-06-muscular',
    title: '6. Muscular System (~600+ Muscles)',
    durationSec: 17,
    scaleMode: 'organism',
    explodeTarget: 0.25,
    part3dId: 'body-muscular',
    mediaCategory: 'body',
    activeLayers: ['skeletal', 'muscular'],
    speechText:
      'System three is the muscular system, with over six hundred skeletal muscles anchored to bone by tendons. Acting in opposing agonist and antagonist lever pairs—from the pectorals, deltoids, biceps, and abdominals to the quadriceps, hamstrings, and calves—muscles generate movement, posture, body heat, and breathing via the dome-shaped diaphragm.',
  },
  {
    index: 7,
    id: 'narr-07-nervous',
    title: '7. Nervous System (Brain, Cord & Nerves)',
    durationSec: 22,
    scaleMode: 'organism',
    explodeTarget: 0.35,
    part3dId: 'body-nervous',
    mediaCategory: 'brain',
    activeLayers: ['integumentary', 'nervous', 'skeletal'],
    speechText:
      'System four is the nervous system, the body’s high-speed command network. The central nervous system pairs the cerebrum—with its frontal, parietal, temporal, and occipital lobes—with the diencephalon, motor-coordinating cerebellum, vital brainstem, and spinal cord. In the peripheral nervous system, twelve pairs of cranial nerves and thirty-one pairs of spinal nerves carry sensory perception and motor commands across the entire body.',
  },
  {
    index: 8,
    id: 'narr-08-endocrine',
    title: '8. Endocrine System (Hormonal Control)',
    durationSec: 16,
    scaleMode: 'organism',
    explodeTarget: 0.45,
    part3dId: 'body-endocrine',
    mediaCategory: 'body',
    activeLayers: ['integumentary', 'endocrine', 'nervous'],
    speechText:
      'System five is the endocrine system. Working alongside the nervous system, ductless glands—including the hypothalamus, master pituitary, pineal gland, thyroid, parathyroids, adrenals, and pancreatic islets—release hormones directly into the bloodstream to govern metabolism, growth, stress response, sleep rhythms, and blood sugar.',
  },
  {
    index: 9,
    id: 'narr-09-cardiovascular',
    title: '9. Cardiovascular System (Beating Heart)',
    durationSec: 22,
    scaleMode: 'organism',
    explodeTarget: 0.55,
    part3dId: 'body-heart',
    mediaCategory: 'heart',
    activeLayers: ['integumentary', 'cardiovascular'],
    speechText:
      'System six is the cardiovascular system. Watch the four-chambered heart beating in real time. Deoxygenated blood returns through the superior and inferior venae cavae into the right atrium and right ventricle, which pumps it to the lungs. Oxygen-rich blood returns to the left atrium and thick-walled left ventricle, which ejects roughly seventy milliliters per beat—about five point two five liters every minute—through four one-way valves into the aorta.',
  },
  {
    index: 10,
    id: 'narr-10-lymphatic',
    title: '10. Lymphatic & Immune System',
    durationSec: 15,
    scaleMode: 'organism',
    explodeTarget: 0.45,
    part3dId: 'body-lymphatic',
    mediaCategory: 'body',
    activeLayers: ['integumentary', 'lymphatic', 'cardiovascular'],
    speechText:
      'System seven is the lymphatic and immune system. The thymus matures T lymphocytes, red bone marrow matures B lymphocytes, the spleen filters blood, and five to six hundred lymph nodes screen returning interstitial fluid, defending every tissue against viruses and bacteria.',
  },
  {
    index: 11,
    id: 'narr-11-respiratory',
    title: '11. Respiratory System (Airways & Lungs)',
    durationSec: 18,
    scaleMode: 'organism',
    explodeTarget: 0.5,
    part3dId: 'body-lungs',
    mediaCategory: 'lungs',
    activeLayers: ['integumentary', 'respiratory', 'cardiovascular'],
    speechText:
      'System eight is the respiratory system. Air travels through the nasal cavity, pharynx, voice-producing larynx, and the C-ring reinforced trachea into the branching bronchial tree. Inside the three-lobed right lung and two-lobed left lung, millions of alveoli form a half-micrometer membrane where oxygen diffuses into blood and carbon dioxide exits.',
  },
  {
    index: 12,
    id: 'narr-12-digestive',
    title: '12. Digestive System (~7.62 m GI Tract)',
    durationSec: 20,
    scaleMode: 'organism',
    explodeTarget: 0.55,
    part3dId: 'body-digestive',
    mediaCategory: 'digestive',
    activeLayers: ['integumentary', 'digestive'],
    speechText:
      'System nine is the digestive system, a seven-point-six-two meter alimentary canal spanning the mouth, esophagus, acid-churning stomach, coiled small intestine, and framing large intestine. Accessory organs—the salivary glands, bile-producing liver, gallbladder, and enzyme-secreting pancreas—break food into absorbable nutrients routed through the hepatic portal vein for metabolic processing.',
  },
  {
    index: 13,
    id: 'narr-13-urinary-repro',
    title: '13. Urinary & Reproductive Systems',
    durationSec: 18,
    scaleMode: 'organism',
    explodeTarget: 0.5,
    part3dId: 'body-urinary',
    mediaCategory: 'body',
    activeLayers: ['integumentary', 'urinary', 'reproductive'],
    speechText:
      'System ten is the urinary system: paired retroperitoneal kidneys containing around one million nephrons each filter roughly one hundred and ten milliliters of plasma per minute, excreting urea via the ureters and urinary bladder. System eleven is the reproductive system, whose gonads and ducts produce haploid gametes and sex hormones to continue human life.',
  },
  {
    index: 14,
    id: 'narr-14-organism',
    title: '14. The Complete Living Human Organism',
    durationSec: 15,
    scaleMode: 'organism',
    explodeTarget: 0,
    part3dId: 'body-integumentary',
    mediaCategory: 'body',
    activeLayers: [
      'cell',
      'integumentary',
      'skeletal',
      'muscular',
      'nervous',
      'endocrine',
      'cardiovascular',
      'lymphatic',
      'respiratory',
      'digestive',
      'urinary',
      'reproductive',
    ],
    speechText:
      'Bringing every layer back together completes the sixth structural level: the living human organism. Trillions of cells, four tissues, and eleven interdependent organ systems operating in continuous homeostatic harmony. Thank you for exploring Stage Two of Project Jarvis.',
  },
];

export const TOTAL_NARRATION_SECONDS = HUMAN_BODY_NARRATION_CHAPTERS.reduce(
  (sum, c) => sum + c.durationSec,
  0
);
