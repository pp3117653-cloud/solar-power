/**
 * ============================================================================
 * JARVIS — STAGE 2: COMPLETE HUMAN ANATOMY BOOK DATASET (CELL TO HUMAN BODY)
 * ============================================================================
 * Structured hierarchically from OpenStax Anatomy and Physiology 2e (2022):
 *   Level 1: Chemical Level (Atoms & Biomolecules)
 *   Level 2: Cellular Level (Eukaryotic Human Cell & Organelles)
 *   Level 3: Tissue Level (4 Primary Tissue Types)
 *   Level 4: Organ Level
 *   Level 5: Organ System Level (All 11 Human Organ Systems in Anatomical Order)
 *   Level 6: Organismal Level (Complete Integrated Human Body)
 */

export type AnatomyLayerKey =
  | 'cell'
  | 'integumentary'
  | 'skeletal'
  | 'muscular'
  | 'nervous'
  | 'endocrine'
  | 'cardiovascular'
  | 'lymphatic'
  | 'respiratory'
  | 'digestive'
  | 'urinary'
  | 'reproductive';

export type AnatomyScaleMode = 'organism' | 'cell';

export interface StructuralLevelEntry {
  level: number;
  id: string;
  name: string;
  scaleRange: string;
  summary: string;
  examples: string[];
  sourceTitle: string;
  sourceUrl: string;
}

export interface AnatomicalStructureItem {
  id: string;
  name: string;
  latinOrAlt?: string;
  region: string;
  countOrMetric?: string;
  summary: string;
  part3dId: string;
}

export interface AnatomySystemChapter {
  id: string;
  order: number;
  chapterCode: string;
  name: string;
  shortName: string;
  layerKey: AnatomyLayerKey;
  accentColor: string;
  scaleTier: 'Microscopic (Cell & Tissue)' | 'Macroscopic (Organ System)';
  summary: string;
  primaryFunctions: string[];
  keyMetric: string;
  sourceTitle: string;
  sourceUrl: string;
  structures: AnatomicalStructureItem[];
}

export const DEFAULT_ANATOMY_LAYERS: Record<AnatomyLayerKey, boolean> = {
  cell: true,
  integumentary: true,
  skeletal: true,
  muscular: true,
  nervous: true,
  endocrine: true,
  cardiovascular: true,
  lymphatic: true,
  respiratory: true,
  digestive: true,
  urinary: true,
  reproductive: true,
};

export const STRUCTURAL_LEVELS: StructuralLevelEntry[] = [
  {
    level: 1,
    id: 'level-chemical',
    name: '1. Chemical Level',
    scaleRange: '0.1 nm – 10 nm',
    summary:
      'Subatomic particles and atoms (C, H, O, N, Ca, P) bond to form water, electrolytes, ATP, DNA, proteins, lipids, and carbohydrates.',
    examples: ['Carbon, Hydrogen, Oxygen, Nitrogen', 'Water (H₂O)', 'DNA & RNA', 'ATP & Phospholipids'],
    sourceTitle: 'OpenStax Anatomy & Physiology 2e — 1.2 Structural Organization',
    sourceUrl: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/1-2-structural-organization-of-the-human-body',
  },
  {
    level: 2,
    id: 'level-cellular',
    name: '2. Cellular Level',
    scaleRange: '5 µm – 100 µm',
    summary:
      'The smallest independently functioning unit of life. Membrane-bound organelles work inside the cytosol to generate ATP, replicate DNA, and synthesize proteins.',
    examples: ['Nucleus & Nucleolus', 'Mitochondria', 'Rough & Smooth ER', 'Golgi Apparatus & Lysosomes'],
    sourceTitle: 'OpenStax Anatomy & Physiology 2e — 3.2 Cytoplasm & Cellular Organelles',
    sourceUrl: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/3-2-the-cytoplasm-and-cellular-organelles',
  },
  {
    level: 3,
    id: 'level-tissue',
    name: '3. Tissue Level',
    scaleRange: '0.1 mm – 10 mm',
    summary:
      'Groups of similar cells sharing a common embryonic origin (ectoderm, mesoderm, endoderm) organized into exactly four primary tissue families.',
    examples: ['Epithelial Tissue', 'Connective Tissue', 'Muscle Tissue (Skeletal, Cardiac, Smooth)', 'Nervous Tissue'],
    sourceTitle: 'OpenStax Anatomy & Physiology 2e — 4.1 Types of Tissues',
    sourceUrl: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/4-1-types-of-tissues',
  },
  {
    level: 4,
    id: 'level-organ',
    name: '4. Organ Level',
    scaleRange: '1 cm – 30 cm',
    summary:
      'Anatomically distinct structures composed of two or more tissue types performing specialized physiological functions.',
    examples: ['Brain', 'Heart', 'Lungs', 'Liver', 'Stomach', 'Kidneys', 'Skin'],
    sourceTitle: 'OpenStax Anatomy & Physiology 2e — 1.2 Structural Organization',
    sourceUrl: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/1-2-structural-organization-of-the-human-body',
  },
  {
    level: 5,
    id: 'level-system',
    name: '5. Organ System Level',
    scaleRange: '30 cm – 180 cm',
    summary:
      'Eleven coordinated multi-organ networks that execute major physiological functions and maintain dynamic homeostasis.',
    examples: ['Integumentary, Skeletal, Muscular', 'Nervous & Endocrine', 'Cardiovascular, Lymphatic, Respiratory', 'Digestive, Urinary, Reproductive'],
    sourceTitle: 'OpenStax Anatomy & Physiology 2e — 1.2 Structural Organization',
    sourceUrl: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/1-2-structural-organization-of-the-human-body',
  },
  {
    level: 6,
    id: 'level-organism',
    name: '6. Organismal Level (Human Body)',
    scaleRange: 'Complete Living Human',
    summary:
      'All cells, 4 primary tissues, organs, and 11 organ systems integrated into a single living human organism maintaining metabolism, responsiveness, movement, growth, differentiation, and reproduction.',
    examples: ['206 Adult Bones', '~600+ Skeletal Muscles', '12 Cranial & 31 Spinal Nerve Pairs', 'Homeostatic Feedback Loops'],
    sourceTitle: 'OpenStax Anatomy & Physiology 2e — 1.2 Structural Organization',
    sourceUrl: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/1-2-structural-organization-of-the-human-body',
  },
];

export const HUMAN_ANATOMY_BOOK: AnatomySystemChapter[] = [
  // ==========================================================================
  // CHAPTER 0: CELLULAR & TISSUE FOUNDATION (FROM CELL TO TISSUES)
  // ==========================================================================
  {
    id: 'chapter-cell-tissues',
    order: 0,
    chapterCode: 'Ch. 3–4',
    name: 'Cellular & Tissue Architecture',
    shortName: 'Cell & Tissues',
    layerKey: 'cell',
    accentColor: '#38bdf8',
    scaleTier: 'Microscopic (Cell & Tissue)',
    summary:
      'The microscopic foundation of the human body: a prototypical eukaryotic cell with its phospholipid bilayer, nucleus, endomembrane system, mitochondria, cytoskeleton, and the 4 primary tissues formed by specialized cells.',
    primaryFunctions: [
      'Selective membrane transport (diffusion, osmosis, active pumps)',
      'DNA replication, transcription, and protein synthesis',
      'Cellular respiration generating ATP inside mitochondria',
      'Organization into epithelial, connective, muscle, and nervous tissues',
    ],
    keyMetric: '12 Core Organelles · 4 Primary Tissues',
    sourceTitle: 'OpenStax Anatomy & Physiology 2e — Ch. 3 & Ch. 4',
    sourceUrl: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/3-2-the-cytoplasm-and-cellular-organelles',
    structures: [
      { id: 'cell-membrane', name: 'Plasma Membrane (Cell Membrane)', latinOrAlt: 'Phospholipid Bilayer', region: 'Cell Boundary', countOrMetric: '7–10 nm thick', summary: 'Selectively permeable phospholipid bilayer with embedded channel proteins, receptors, and cholesterol.', part3dId: 'body-cell-core' },
      { id: 'cell-cytoplasm', name: 'Cytoplasm & Cytosol', latinOrAlt: 'Intracellular Fluid', region: 'Cell Interior', countOrMetric: '~70–80% water', summary: 'Jelly-like fluid medium housing organelles and enzymatic metabolic pathways.', part3dId: 'body-cell-core' },
      { id: 'cell-nucleus', name: 'Nucleus & Nuclear Envelope', latinOrAlt: 'Double Membrane + Pores', region: 'Cell Center', countOrMetric: '46 Chromosomes (23 pairs)', summary: 'Central control organelle storing human genomic DNA wound around histones as chromatin.', part3dId: 'body-cell-core' },
      { id: 'cell-nucleolus', name: 'Nucleolus', latinOrAlt: 'Ribosome Factory', region: 'Inside Nucleus', countOrMetric: '1–2 per nucleus', summary: 'Dense nuclear sub-region synthesizing ribosomal RNA (rRNA) and assembling ribosome subunits.', part3dId: 'body-cell-core' },
      { id: 'cell-mitochondria', name: 'Mitochondria', latinOrAlt: 'Cristae & Matrix', region: 'Cytoplasm', countOrMetric: '100s–1,000+ per cell', summary: 'Double-membrane organelles converting glucose and oxygen into usable ATP via cellular respiration.', part3dId: 'body-cell-core' },
      { id: 'cell-rer', name: 'Rough Endoplasmic Reticulum (RER)', latinOrAlt: 'Ribosome-studded ER', region: 'Perinuclear', countOrMetric: 'Endomembrane System', summary: 'Membranous channels studded with ribosomes for synthesis, folding, and glycosylation of exported proteins.', part3dId: 'body-cell-core' },
      { id: 'cell-ser', name: 'Smooth Endoplasmic Reticulum (SER)', latinOrAlt: 'Agranular ER', region: 'Cytoplasm', countOrMetric: 'Lipid & Ca²⁺ Hub', summary: 'Synthesizes phospholipids and steroid hormones, stores Ca²⁺ ions, and detoxifies metabolites.', part3dId: 'body-cell-core' },
      { id: 'cell-ribosomes', name: 'Ribosomes (Free & Bound)', latinOrAlt: '80S Eukaryotic', region: 'Cytosol & RER', countOrMetric: 'Millions per cell', summary: 'Translates messenger RNA (mRNA) codons into polypeptide chains using transfer RNA (tRNA).', part3dId: 'body-cell-core' },
      { id: 'cell-golgi', name: 'Golgi Apparatus', latinOrAlt: 'Cisternae Stacks', region: 'Cytoplasm', countOrMetric: 'Sorting & Packaging', summary: 'Flattened membranous discs that modify, sort, tag, and package ER proteins into transport vesicles and lysosomes.', part3dId: 'body-cell-core' },
      { id: 'cell-lysosomes', name: 'Lysosomes', latinOrAlt: 'Digestive Vesicles', region: 'Cytoplasm', countOrMetric: 'Hydrolytic Enzymes', summary: 'Break down worn-out organelles (autophagy), phagocytized pathogens, and mediate programmed cell death (apoptosis).', part3dId: 'body-cell-core' },
      { id: 'cell-peroxisomes', name: 'Peroxisomes', latinOrAlt: 'Detox Vesicles', region: 'Cytoplasm', countOrMetric: 'Catalase & Oxidase', summary: 'Neutralize reactive oxygen species (free radicals) and detoxify harmful chemicals into water and oxygen.', part3dId: 'body-cell-core' },
      { id: 'cell-cytoskeleton', name: 'Cytoskeleton & Centrosome', latinOrAlt: 'Microfilaments, Intermediate Filaments, Microtubules', region: 'Cell Scaffold', countOrMetric: '3 Filament Classes', summary: 'Structural protein network maintaining cell shape, organelle transport, cilia/flagella motion, and mitotic spindle formation.', part3dId: 'body-cell-core' },
      { id: 'tissue-epithelial', name: 'Epithelial Tissue', latinOrAlt: 'Squamous, Cuboidal, Columnar', region: 'Surfaces & Glands', countOrMetric: 'Primary Tissue 1/4', summary: 'Tightly packed sheets lining exterior skin, body cavities, respiratory/GI tracts, and forming secretory glands.', part3dId: 'body-integumentary' },
      { id: 'tissue-connective', name: 'Connective Tissue', latinOrAlt: 'Proper, Cartilage, Bone, Blood', region: 'Body-Wide', countOrMetric: 'Primary Tissue 2/4', summary: 'Cells suspended in extracellular matrix providing structural support, binding, adipose storage, and vascular transport.', part3dId: 'body-skeletal' },
      { id: 'tissue-muscle', name: 'Muscle Tissue', latinOrAlt: 'Skeletal, Cardiac, Smooth', region: 'Locomotor & Viscera', countOrMetric: 'Primary Tissue 3/4', summary: 'Excitable contractile tissue generating voluntary movement, heartbeat pumping, and involuntary visceral peristalsis.', part3dId: 'body-muscular' },
      { id: 'tissue-nervous', name: 'Nervous Tissue', latinOrAlt: 'Neurons & Neuroglia', region: 'CNS & PNS', countOrMetric: 'Primary Tissue 4/4', summary: 'Electrochemical signaling cells (neurons) and supporting glial cells (astrocytes, oligodendrocytes, Schwann cells, microglia).', part3dId: 'body-nervous' },
    ],
  },

  // ==========================================================================
  // SYSTEM 1: INTEGUMENTARY SYSTEM
  // ==========================================================================
  {
    id: 'sys-integumentary',
    order: 1,
    chapterCode: 'Ch. 5',
    name: '1. Integumentary System',
    shortName: 'Integumentary',
    layerKey: 'integumentary',
    accentColor: '#67e8f9',
    scaleTier: 'Macroscopic (Organ System)',
    summary:
      'The body’s outer protective envelope composed of the epidermis, dermis, underlying hypodermis, hair follicles, nails, and exocrine sweat/sebaceous glands.',
    primaryFunctions: [
      'Physical, chemical, and immune barrier against dehydration and pathogens',
      'Thermoregulation via eccrine sweat secretion and dermal vasodilation/constriction',
      'Cutaneous sensory perception (touch, pressure, temperature, pain)',
      'UV-mediated synthesis of Vitamin D₃ (cholecalciferol)',
    ],
    keyMetric: '2 Skin Layers + Hypodermis · 5 Epidermal Strata',
    sourceTitle: 'OpenStax Anatomy & Physiology 2e — 5.1 Layers of the Skin',
    sourceUrl: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/5-1-layers-of-the-skin',
    structures: [
      { id: 'integ-epidermis', name: 'Epidermis (5 Strata)', latinOrAlt: 'Stratum Basale → Spinosum → Granulosum → Lucidum → Corneum', region: 'Superficial Skin', countOrMetric: '4 layers (thin) / 5 (thick)', summary: 'Avascular stratified squamous keratinized epithelium housing keratinocytes, melanocytes, Merkel cells, and Langerhans cells.', part3dId: 'body-integumentary' },
      { id: 'integ-dermis', name: 'Dermis (Papillary & Reticular Layers)', latinOrAlt: 'Corium', region: 'Deep Skin Core', countOrMetric: 'Collagen & Elastin Mesh', summary: 'Vascularized connective tissue housing capillaries, lymphatic vessels, Meissner & Pacinian corpuscles, follicles, and glands.', part3dId: 'body-integumentary' },
      { id: 'integ-hypodermis', name: 'Hypodermis (Subcutaneous Tissue)', latinOrAlt: 'Superficial Fascia', region: 'Sub-Dermal', countOrMetric: 'Adipose & Areolar', summary: 'Connects dermis to underlying muscle/bone fascia; provides thermal insulation, cushioning, and lipid energy storage.', part3dId: 'body-integumentary' },
      { id: 'integ-hair', name: 'Hair Follicles & Arrector Pili', latinOrAlt: 'Pili', region: 'Scalp & Body', countOrMetric: 'Keratin Filaments', summary: 'Keratinized filaments emerging from dermal follicles with sensory root plexuses and smooth arrector pili muscles.', part3dId: 'body-integumentary' },
      { id: 'integ-nails', name: 'Nails (Nail Plate, Bed & Matrix)', latinOrAlt: 'Ungues', region: 'Distal Digits', countOrMetric: '20 Nails', summary: 'Dense keratin plates protecting distal phalanges and enhancing fine tactile manipulation.', part3dId: 'body-integumentary' },
      { id: 'integ-glands', name: 'Sweat & Sebaceous Glands', latinOrAlt: 'Eccrine, Apocrine & Sebaceous', region: 'Dermis', countOrMetric: 'Exocrine Glands', summary: 'Eccrine glands regulate temperature via sweat; sebaceous glands secrete lipid-rich sebum lubricating skin and hair.', part3dId: 'body-integumentary' },
    ],
  },

  // ==========================================================================
  // SYSTEM 2: SKELETAL SYSTEM (ALL 206 ADULT BONES ACCOUNTED FOR)
  // ==========================================================================
  {
    id: 'sys-skeletal',
    order: 2,
    chapterCode: 'Ch. 6–9',
    name: '2. Skeletal System',
    shortName: 'Skeletal',
    layerKey: 'skeletal',
    accentColor: '#e2e8f0',
    scaleTier: 'Macroscopic (Organ System)',
    summary:
      'Rigid internal osseous framework of 206 adult bones divided into the Axial Skeleton (80 bones) and Appendicular Skeleton (126 bones), linked by cartilage, joints, and ligaments.',
    primaryFunctions: [
      'Structural support against gravity and lever attachment for skeletal muscles',
      'Protection of brain, spinal cord, heart, lungs, and pelvic viscera',
      'Mineral homeostasis (calcium & phosphate reservoir)',
      'Hematopoiesis (blood cell production) inside red bone marrow',
    ],
    keyMetric: '206 Adult Bones (80 Axial · 126 Appendicular)',
    sourceTitle: 'OpenStax Anatomy & Physiology 2e — 7.1 Divisions of the Skeletal System',
    sourceUrl: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/7-1-divisions-of-the-skeletal-system',
    structures: [
      { id: 'skel-cranium', name: 'Cranial Bones (Neurocranium)', latinOrAlt: 'Frontal (1), Parietal (2), Temporal (2), Occipital (1), Sphenoid (1), Ethmoid (1)', region: 'Axial — Skull', countOrMetric: '8 bones', summary: 'Interlocking cranial vault and base enclosing and protecting the brain.', part3dId: 'body-skeletal' },
      { id: 'skel-facial', name: 'Facial Bones (Viscerocranium)', latinOrAlt: 'Maxillae (2), Palatine (2), Zygomatic (2), Nasal (2), Lacrimal (2), Inferior Nasal Conchae (2), Vomer (1), Mandible (1)', region: 'Axial — Skull', countOrMetric: '14 bones', summary: 'Forms facial architecture, orbits, nasal cavity, hard palate, and mobile lower jaw (mandible).', part3dId: 'body-skeletal' },
      { id: 'skel-ossicles-hyoid', name: 'Auditory Ossicles & Hyoid Bone', latinOrAlt: 'Malleus (2), Incus (2), Stapes (2) + Hyoid (1)', region: 'Axial — Head & Neck', countOrMetric: '7 bones', summary: 'Three tiny middle-ear bones per side transmitting sound vibrations, plus the U-shaped hyoid anchoring tongue and larynx.', part3dId: 'body-skeletal' },
      { id: 'skel-vertebrae', name: 'Vertebral Column (Spine)', latinOrAlt: 'Cervical C1–C7 (7), Thoracic T1–T12 (12), Lumbar L1–L5 (5), Sacrum (1), Coccyx (1)', region: 'Axial — Back', countOrMetric: '26 bones (24 vertebrae + sacrum + coccyx)', summary: 'Flexible S-curved axial column supporting weight and housing the spinal cord within the vertebral canal.', part3dId: 'body-skeletal' },
      { id: 'skel-thorax', name: 'Thoracic Cage (Sternum & Ribs)', latinOrAlt: 'Sternum (1: Manubrium, Body, Xiphoid) + 12 Pairs of Ribs (24)', region: 'Axial — Chest', countOrMetric: '25 bones', summary: 'True ribs (1–7), false ribs (8–10), and floating ribs (11–12) articulating with thoracic vertebrae and sternum to shield heart and lungs.', part3dId: 'body-skeletal' },
      { id: 'skel-pectoral', name: 'Pectoral (Shoulder) Girdle', latinOrAlt: 'Clavicles (2) & Scapulae (2)', region: 'Appendicular — Upper', countOrMetric: '4 bones', summary: 'Links upper limbs to axial skeleton via sternoclavicular and glenohumeral joints for wide arm mobility.', part3dId: 'body-skeletal' },
      { id: 'skel-upper-limb', name: 'Upper Limb Bones', latinOrAlt: 'Humerus (2), Radius (2), Ulna (2), Carpals (16), Metacarpals (10), Phalanges (28)', region: 'Appendicular — Arms & Hands', countOrMetric: '60 bones (30 per side)', summary: 'Arm, forearm, wrist (8 carpals/side), palm (5 metacarpals/side), and digits (14 phalanges/side).', part3dId: 'body-skeletal' },
      { id: 'skel-pelvic', name: 'Pelvic (Hip) Girdle', latinOrAlt: 'Right & Left Coxal Bones (Ilium, Ischium, Pubis fused)', region: 'Appendicular — Pelvis', countOrMetric: '2 hip bones', summary: 'Robust weight-bearing ring transferring axial trunk load to lower limbs and shielding pelvic organs.', part3dId: 'body-skeletal' },
      { id: 'skel-lower-limb', name: 'Lower Limb Bones', latinOrAlt: 'Femur (2), Patella (2), Tibia (2), Fibula (2), Tarsals (14), Metatarsals (10), Phalanges (28)', region: 'Appendicular — Legs & Feet', countOrMetric: '60 bones (30 per side)', summary: 'Thigh (femur, longest bone), kneecap (patella), shin (tibia/fibula), ankle (7 tarsals/side), and foot arches.', part3dId: 'body-skeletal' },
      { id: 'skel-joints', name: 'Joints, Cartilage & Ligaments', latinOrAlt: 'Fibrous, Cartilaginous & Synovial Joints', region: 'Articulations', countOrMetric: 'Hyaline, Elastic, Fibrocartilage', summary: 'Articulations enabling movement (hinge, ball-and-socket, pivot, saddle, condyloid, plane) lubricated by synovial fluid.', part3dId: 'body-skeletal' },
    ],
  },

  // ==========================================================================
  // SYSTEM 3: MUSCULAR SYSTEM
  // ==========================================================================
  {
    id: 'sys-muscular',
    order: 3,
    chapterCode: 'Ch. 10–11',
    name: '3. Muscular System',
    shortName: 'Muscular',
    layerKey: 'muscular',
    accentColor: '#fb7185',
    scaleTier: 'Macroscopic (Organ System)',
    summary:
      'Approximately 600+ named skeletal muscles attached to bones via tendons, operating in agonist/antagonist/synergist lever pairs alongside involuntary cardiac and smooth muscle.',
    primaryFunctions: [
      'Voluntary locomotion, facial expression, speech, and fine manipulation',
      'Postural stabilization and joint integrity',
      'Thermogenesis (heat production from ATP-driven actin–myosin cross-bridges)',
      'Respiratory ventilation (diaphragm & intercostals)',
    ],
    keyMetric: '~600+ Skeletal Muscles · Sarcomere Units',
    sourceTitle: 'OpenStax Anatomy & Physiology 2e — 11.1 Interactions of Skeletal Muscles',
    sourceUrl: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-1-interactions-of-skeletal-muscles-their-fascicle-arrangement-and-their-lever-systems',
    structures: [
      { id: 'musc-head-neck', name: 'Head, Facial & Neck Muscles', latinOrAlt: 'Frontalis, Orbicularis Oculi/Oris, Masseter, Temporalis, Sternocleidomastoid', region: 'Head & Neck', countOrMetric: 'Expression & Mastication', summary: 'Controls facial expressions, chewing (mastication), swallowing, eye movement (6 extraocular muscles), and head rotation.', part3dId: 'body-muscular' },
      { id: 'musc-thorax-resp', name: 'Thoracic & Respiratory Muscles', latinOrAlt: 'Pectoralis Major/Minor, Serratus Anterior, Intercostals, Diaphragm', region: 'Thorax', countOrMetric: 'Breathing & Arm Adduction', summary: 'Dome-shaped diaphragm drives ~75% of quiet inhalation; pectorals adduct and flex the humerus.', part3dId: 'body-muscular' },
      { id: 'musc-abdomen', name: 'Abdominal Wall & Core Muscles', latinOrAlt: 'Rectus Abdominis, External/Internal Obliques, Transversus Abdominis', region: 'Abdomen', countOrMetric: '4 Paired Layers', summary: 'Flexes and rotates the vertebral column while compressing and protecting abdominal viscera.', part3dId: 'body-muscular' },
      { id: 'musc-back', name: 'Back & Shoulder Stabilizers', latinOrAlt: 'Trapezius, Latissimus Dorsi, Rhomboids, Erector Spinae, Deltoid, Rotator Cuff', region: 'Posterior Trunk', countOrMetric: 'Posture & Shoulder', summary: 'Maintains upright spinal extension, elevates/retracts scapula, and stabilizes the glenohumeral joint (supraspinatus, infraspinatus, teres minor, subscapularis).', part3dId: 'body-muscular' },
      { id: 'musc-upper-limb', name: 'Upper Limb Muscles', latinOrAlt: 'Biceps Brachii, Brachialis, Triceps Brachii, Brachioradialis, Flexor/Extensor Digitorum', region: 'Arms & Forearms', countOrMetric: 'Agonist/Antagonist Pairs', summary: 'Biceps brachii & brachialis flex the forearm; triceps brachii extends it; forearm flexors/extensors power wrist and finger grip.', part3dId: 'body-muscular' },
      { id: 'musc-lower-limb', name: 'Gluteal, Thigh & Leg Muscles', latinOrAlt: 'Gluteus Maximus/Medius, Quadriceps Femoris (4), Hamstrings (3), Sartorius, Gastrocnemius, Soleus, Tibialis Anterior', region: 'Pelvis & Lower Limbs', countOrMetric: 'Locomotion Powerhouse', summary: 'Quadriceps extend the knee, hamstrings flex the knee/extend the hip, and gastrocnemius/soleus plantarflex the ankle via the Achilles tendon.', part3dId: 'body-muscular' },
    ],
  },

  // ==========================================================================
  // SYSTEM 4: NERVOUS SYSTEM (CNS + PNS + 12 CRANIAL + 31 SPINAL NERVE PAIRS)
  // ==========================================================================
  {
    id: 'sys-nervous',
    order: 4,
    chapterCode: 'Ch. 12–16',
    name: '4. Nervous System',
    shortName: 'Nervous',
    layerKey: 'nervous',
    accentColor: '#fbbf24',
    scaleTier: 'Macroscopic (Organ System)',
    summary:
      'Rapid electrochemical command and sensory integration network comprising the Central Nervous System (Brain & Spinal Cord) and Peripheral Nervous System (12 Cranial Nerves, 31 pairs of Spinal Nerves, and Autonomic divisions).',
    primaryFunctions: [
      'Sensory detection (vision, hearing, equilibrium, olfaction, gustation, somatosensation)',
      'Central cognitive integration, memory, language, and consciousness',
      'Voluntary somatic motor output and involuntary autonomic regulation (sympathetic & parasympathetic)',
    ],
    keyMetric: 'Brain + Spinal Cord · 12 Cranial · 31 Spinal Pairs',
    sourceTitle: 'OpenStax Anatomy & Physiology 2e — 13.4 Peripheral Nervous System',
    sourceUrl: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/13-4-the-peripheral-nervous-system',
    structures: [
      { id: 'nerv-cerebrum', name: 'Cerebrum (4 Paired Lobes + Insula)', latinOrAlt: 'Frontal, Parietal, Temporal, Occipital Lobes + Corpus Callosum', region: 'CNS — Forebrain', countOrMetric: '2 Hemispheres', summary: 'Seat of executive planning (frontal), somatosensation (parietal), hearing/memory (temporal), and vision (occipital).', part3dId: 'body-nervous' },
      { id: 'nerv-diencephalon', name: 'Diencephalon & Limbic System', latinOrAlt: 'Thalamus, Hypothalamus, Epithalamus, Hippocampus, Amygdala', region: 'CNS — Deep Brain', countOrMetric: 'Sensory Relay & Emotion', summary: 'Thalamus relays sensory tracts to cortex; hypothalamus governs homeostasis; hippocampus/amygdala process memory and emotion.', part3dId: 'body-nervous' },
      { id: 'nerv-cerebellum', name: 'Cerebellum', latinOrAlt: 'Little Brain (Arbor Vitae)', region: 'CNS — Posterior Fossa', countOrMetric: 'Motor Coordination', summary: 'Compares motor commands with proprioceptive feedback to fine-tune balance, posture, and smooth gait.', part3dId: 'body-nervous' },
      { id: 'nerv-brainstem', name: 'Brainstem (Midbrain, Pons, Medulla Oblongata)', latinOrAlt: 'Truncus Encephali', region: 'CNS — Brain Base', countOrMetric: 'Vital Autonomic Hub', summary: 'Houses cranial nerve nuclei and vital cardiovascular and respiratory rhythm centers.', part3dId: 'body-nervous' },
      { id: 'nerv-spinal-cord', name: 'Spinal Cord & Meninges', latinOrAlt: 'Dura, Arachnoid & Pia Mater + CSF', region: 'CNS — Vertebral Canal', countOrMetric: '31 Segments', summary: 'Conducts ascending sensory and descending motor tracts and executes rapid spinal reflexes.', part3dId: 'body-nervous' },
      { id: 'nerv-cranial', name: '12 Pairs of Cranial Nerves (CN I – XII)', latinOrAlt: 'I Olfactory, II Optic, III Oculomotor, IV Trochlear, V Trigeminal, VI Abducens, VII Facial, VIII Vestibulocochlear, IX Glossopharyngeal, X Vagus, XI Accessory, XII Hypoglossal', region: 'PNS — Head, Neck & Viscera', countOrMetric: '12 Pairs', summary: 'Purely sensory (I, II, VIII), purely motor (III, IV, VI, XI, XII), and mixed (V, VII, IX, X); vagus nerve (X) regulates thoracic and abdominal organs.', part3dId: 'body-nervous' },
      { id: 'nerv-spinal-plexuses', name: '31 Pairs of Spinal Nerves & 4 Nerve Plexuses', latinOrAlt: '8 Cervical, 12 Thoracic, 5 Lumbar, 5 Sacral, 1 Coccygeal · Cervical, Brachial, Lumbar, Sacral Plexuses', region: 'PNS — Trunk & Limbs', countOrMetric: '31 Pairs (62 Nerves)', summary: 'Mixed sensory/motor nerves branching into phrenic, radial, median, ulnar, femoral, and sciatic peripheral nerves.', part3dId: 'body-nervous' },
      { id: 'nerv-special-senses', name: 'Special Sense Organs (Eyes & Inner Ears)', latinOrAlt: 'Retina, Cornea, Lens · Cochlea & Semicircular Canals', region: 'Head — Sensory', countOrMetric: 'Vision, Hearing, Balance', summary: 'Photoreceptors (rods & cones) transduce light; cochlear hair cells transduce sound; vestibular canals detect head rotation.', part3dId: 'body-nervous' },
    ],
  },

  // ==========================================================================
  // SYSTEM 5: ENDOCRINE SYSTEM
  // ==========================================================================
  {
    id: 'sys-endocrine',
    order: 5,
    chapterCode: 'Ch. 17',
    name: '5. Endocrine System',
    shortName: 'Endocrine',
    layerKey: 'endocrine',
    accentColor: '#c084fc',
    scaleTier: 'Macroscopic (Organ System)',
    summary:
      'Network of ductless glands secreting chemical hormones directly into the bloodstream to coordinate metabolism, growth, stress response, fluid balance, and reproduction.',
    primaryFunctions: [
      'Long-term homeostatic regulation via blood-borne hormones',
      'Metabolic rate, blood glucose, and calcium homeostasis',
      'Growth, development, circadian rhythm, and fight-or-flight stress response',
    ],
    keyMetric: '9 Major Endocrine Glands',
    sourceTitle: 'OpenStax Anatomy & Physiology 2e — 17.1 Overview of the Endocrine System',
    sourceUrl: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/17-1-an-overview-of-the-endocrine-system',
    structures: [
      { id: 'endo-hypothalamus', name: 'Hypothalamus', latinOrAlt: 'Neuroendocrine Bridge', region: 'Brain — Diencephalon', countOrMetric: 'Releasing/Inhibiting Hormones', summary: 'Links nervous and endocrine systems; produces oxytocin, ADH, and pituitary-regulating hormones.', part3dId: 'body-endocrine' },
      { id: 'endo-pituitary', name: 'Pituitary Gland (Hypophysis)', latinOrAlt: 'Anterior & Posterior Lobes', region: 'Brain — Sella Turcica', countOrMetric: 'Master Gland', summary: 'Secretes GH, TSH, ACTH, FSH, LH, prolactin (anterior) and stores/releases ADH and oxytocin (posterior).', part3dId: 'body-endocrine' },
      { id: 'endo-pineal', name: 'Pineal Gland', latinOrAlt: 'Epithalamus', region: 'Brain — Posterior', countOrMetric: 'Melatonin', summary: 'Secretes melatonin in response to darkness to synchronize human circadian sleep-wake cycles.', part3dId: 'body-endocrine' },
      { id: 'endo-thyroid', name: 'Thyroid & Parathyroid Glands', latinOrAlt: 'T₃, T₄, Calcitonin & PTH', region: 'Anterior Neck', countOrMetric: '1 Thyroid + 4 Parathyroids', summary: 'Butterfly-shaped thyroid governs basal metabolic rate; posterior parathyroids regulate blood Ca²⁺ via PTH.', part3dId: 'body-endocrine' },
      { id: 'endo-adrenals', name: 'Adrenal (Suprarenal) Glands', latinOrAlt: 'Cortex & Medulla', region: 'Superior to Kidneys', countOrMetric: '2 Glands', summary: 'Adrenal cortex produces aldosterone, cortisol, and androgens; adrenal medulla releases epinephrine and norepinephrine.', part3dId: 'body-endocrine' },
      { id: 'endo-pancreas', name: 'Pancreatic Islets (Islets of Langerhans)', latinOrAlt: 'Alpha & Beta Cells', region: 'Abdomen — Retroperitoneal', countOrMetric: 'Insulin & Glucagon', summary: 'Endocrine clusters within the pancreas maintaining tight blood glucose homeostasis.', part3dId: 'body-endocrine' },
    ],
  },

  // ==========================================================================
  // SYSTEM 6: CARDIOVASCULAR SYSTEM
  // ==========================================================================
  {
    id: 'sys-cardiovascular',
    order: 6,
    chapterCode: 'Ch. 18–20',
    name: '6. Cardiovascular System',
    shortName: 'Cardiovascular',
    layerKey: 'cardiovascular',
    accentColor: '#ef4444',
    scaleTier: 'Macroscopic (Organ System)',
    summary:
      'Closed dual-circuit transport system powered by the four-chambered muscular heart, driving oxygenated and deoxygenated blood through pulmonary and systemic arteries, capillaries, and veins.',
    primaryFunctions: [
      'Continuous delivery of O₂, glucose, amino acids, lipids, and hormones to all cells',
      'Removal of CO₂ and metabolic wastes to lungs and kidneys',
      'Blood pressure, pH buffering, and thermoregulatory heat distribution',
    ],
    keyMetric: '4 Chambers · 4 Valves · Dual Circuits',
    sourceTitle: 'OpenStax Anatomy & Physiology 2e — 19.1 Heart Anatomy',
    sourceUrl: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy',
    structures: [
      { id: 'cv-heart-chambers', name: 'Four Chambers of the Heart', latinOrAlt: 'Right Atrium, Right Ventricle, Left Atrium, Left Ventricle', region: 'Thorax — Mediastinum', countOrMetric: '4 Chambers', summary: 'Atria receive venous blood; right ventricle pumps to lungs (pulmonary circuit); thick-walled left ventricle pumps to entire body (systemic circuit).', part3dId: 'body-heart' },
      { id: 'cv-heart-valves', name: 'Four Heart Valves', latinOrAlt: 'Tricuspid, Pulmonary Semilunar, Mitral (Bicuspid), Aortic Semilunar', region: 'Heart — Cardiac Skeleton', countOrMetric: '4 One-Way Valves', summary: 'Enforce unidirectional blood flow; AV valves are anchored by chordae tendineae and papillary muscles.', part3dId: 'body-heart' },
      { id: 'cv-conduction', name: 'Cardiac Conduction & Coronary Vessels', latinOrAlt: 'SA Node, AV Node, Bundle of His, Purkinje Fibers · Left/Right Coronary Arteries', region: 'Myocardium & Sulci', countOrMetric: 'Intrinsic Pacemaker', summary: 'Autorhythmic electrical network coordinating atrial and ventricular systole, nourished by coronary circulation.', part3dId: 'body-heart' },
      { id: 'cv-aorta', name: 'Aorta & Major Systemic Arteries', latinOrAlt: 'Ascending Aorta, Aortic Arch, Carotid, Subclavian, Thoracic/Abdominal Aorta, Iliac, Femoral', region: 'Systemic Arterial Tree', countOrMetric: 'High-Pressure Oxygenated', summary: 'Distributes oxygen-rich blood from the left ventricle to brain, upper limbs, viscera, and lower limbs.', part3dId: 'body-vessels' },
      { id: 'cv-venae-cavae', name: 'Superior & Inferior Venae Cavae & Systemic Veins', latinOrAlt: 'Jugular, Subclavian, Hepatic Portal, Renal, Iliac, Femoral Veins', region: 'Systemic Venous Tree', countOrMetric: 'Venous Return', summary: 'Returns deoxygenated blood from head, limbs, and trunk to the right atrium.', part3dId: 'body-vessels' },
      { id: 'cv-pulmonary', name: 'Pulmonary Trunk, Arteries & Veins', latinOrAlt: 'Pulmonary Circuit', region: 'Thorax — Heart ↔ Lungs', countOrMetric: 'Gas Exchange Loop', summary: 'Carries deoxygenated blood from right ventricle to alveolar capillaries and returns oxygenated blood via 4 pulmonary veins to left atrium.', part3dId: 'body-vessels' },
      { id: 'cv-blood', name: 'Blood (Plasma & Formed Elements)', latinOrAlt: 'Erythrocytes (RBCs), Leukocytes (WBCs), Platelets (Thrombocytes)', region: 'Intravascular', countOrMetric: '~5 L Adult Volume', summary: 'Fluid connective tissue transporting hemoglobin-bound O₂, immune defenders, and clotting factors.', part3dId: 'body-vessels' },
    ],
  },

  // ==========================================================================
  // SYSTEM 7: LYMPHATIC & IMMUNE SYSTEM
  // ==========================================================================
  {
    id: 'sys-lymphatic',
    order: 7,
    chapterCode: 'Ch. 21',
    name: '7. Lymphatic & Immune System',
    shortName: 'Lymphatic',
    layerKey: 'lymphatic',
    accentColor: '#34d399',
    scaleTier: 'Macroscopic (Organ System)',
    summary:
      'Vascular drainage and adaptive/innate defense network recovering interstitial fluid, absorbing dietary lipids via lacteals, and housing B-cells, T-cells, and macrophages.',
    primaryFunctions: [
      'Recovers excess interstitial fluid and returns lymph to venous circulation',
      'Absorbs dietary fats and fat-soluble vitamins via intestinal lacteals',
      'Maturation, activation, and deployment of B lymphocytes, T lymphocytes, and NK cells',
    ],
    keyMetric: 'Primary & Secondary Lymphoid Organs',
    sourceTitle: 'OpenStax Anatomy & Physiology 2e — 21.1 Lymphatic and Immune Systems',
    sourceUrl: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/21-1-anatomy-of-the-lymphatic-and-immune-systems',
    structures: [
      { id: 'lymph-thymus', name: 'Thymus Gland', latinOrAlt: 'Primary Lymphoid Organ', region: 'Superior Mediastinum', countOrMetric: 'T-Cell Maturation', summary: 'Bilobed organ behind the sternum where T lymphocytes mature and learn self-tolerance.', part3dId: 'body-lymphatic' },
      { id: 'lymph-marrow', name: 'Red Bone Marrow', latinOrAlt: 'Hematopoietic Tissue', region: 'Axial & Proximal Bones', countOrMetric: 'B-Cell Maturation', summary: 'Produces all blood cell lineages and serves as the maturation site for B lymphocytes.', part3dId: 'body-skeletal' },
      { id: 'lymph-spleen', name: 'Spleen', latinOrAlt: 'Red Pulp & White Pulp', region: 'Left Upper Abdomen', countOrMetric: 'Largest Lymphoid Organ', summary: 'Filters blood-borne pathogens in white pulp and recycles aged red blood cells in red pulp.', part3dId: 'body-lymphatic' },
      { id: 'lymph-nodes', name: 'Lymph Nodes & Lymphatic Vessels', latinOrAlt: 'Cervical, Axillary, Thoracic, Inguinal Nodes · Thoracic Duct', region: 'Body-Wide Network', countOrMetric: '500–600 Nodes', summary: 'Bean-shaped filtration stations screening lymph fluid for antigens before returning it via the thoracic and right lymphatic ducts.', part3dId: 'body-lymphatic' },
      { id: 'lymph-malt', name: 'Tonsils & MALT (Peyer’s Patches)', latinOrAlt: 'Pharyngeal, Palatine, Lingual Tonsils', region: 'Pharynx & Small Intestine', countOrMetric: 'Mucosal Immunity', summary: 'Guards oral, nasal, and gastrointestinal mucosal entryways against inhaled or ingested pathogens.', part3dId: 'body-lymphatic' },
    ],
  },

  // ==========================================================================
  // SYSTEM 8: RESPIRATORY SYSTEM
  // ==========================================================================
  {
    id: 'sys-respiratory',
    order: 8,
    chapterCode: 'Ch. 22',
    name: '8. Respiratory System',
    shortName: 'Respiratory',
    layerKey: 'respiratory',
    accentColor: '#38bdf8',
    scaleTier: 'Macroscopic (Organ System)',
    summary:
      'Conducting and gas-exchange airway architecture spanning the nasal cavity, pharynx, larynx, trachea, bronchial tree, paired lungs, and ~0.5 µm alveolar-capillary respiratory membrane.',
    primaryFunctions: [
      'Pulmonary ventilation and external gas exchange (O₂ uptake, CO₂ elimination)',
      'Blood pH (acid–base) regulation via CO₂ control',
      'Olfaction and vocalization (phonation via vocal folds)',
    ],
    keyMetric: 'Right Lung (3 Lobes) · Left Lung (2 Lobes)',
    sourceTitle: 'OpenStax Anatomy & Physiology 2e — 22.1 Organs and Structures of the Respiratory System',
    sourceUrl: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/22-1-organs-and-structures-of-the-respiratory-system',
    structures: [
      { id: 'resp-nose-pharynx', name: 'Nasal Cavity, Sinuses & Pharynx', latinOrAlt: 'Nasopharynx, Oropharynx, Laryngopharynx', region: 'Upper Airway', countOrMetric: 'Conducting Zone', summary: 'Warms, humidifies, and filters incoming air via ciliated pseudostratified epithelium and goblet cells.', part3dId: 'body-lungs' },
      { id: 'resp-larynx', name: 'Larynx (Voice Box)', latinOrAlt: 'Thyroid, Cricoid & Epiglottis Cartilages', region: 'Anterior Neck', countOrMetric: 'Phonation & Airway Guard', summary: 'Connects pharynx to trachea; epiglottis seals airway during swallowing while vocal folds generate speech.', part3dId: 'body-lungs' },
      { id: 'resp-trachea', name: 'Trachea (Windpipe)', latinOrAlt: '16–20 C-Shaped Hyaline Cartilage Rings', region: 'Neck → Thorax', countOrMetric: '16–20 Cartilage Rings', summary: 'Reinforced flexible conduit descending anterior to the esophagus and bifurcating at the carina.', part3dId: 'body-lungs' },
      { id: 'resp-bronchi', name: 'Bronchial Tree (Bronchi & Bronchioles)', latinOrAlt: 'Primary → Secondary → Tertiary Bronchi → Terminal Bronchioles', region: 'Lungs', countOrMetric: '>1,000 Terminal Bronchioles/Lung', summary: 'Branching airway tree regulating airflow resistance via smooth muscle walls.', part3dId: 'body-lungs' },
      { id: 'resp-lungs', name: 'Right & Left Lungs + Pleurae', latinOrAlt: 'Right: Superior/Middle/Inferior Lobes · Left: Superior/Inferior Lobes + Cardiac Notch', region: 'Thoracic Cavity', countOrMetric: '5 Total Lobes', summary: 'Paired spongy organs enclosed in serous pleural membranes; left lung is smaller to accommodate the heart.', part3dId: 'body-lungs' },
      { id: 'resp-alveoli', name: 'Alveoli & Respiratory Membrane', latinOrAlt: 'Type I & Type II Alveolar Cells + Macrophages', region: 'Respiratory Zone', countOrMetric: '0.5 µm Diffusion Barrier', summary: 'Microscopic air sacs coated in surfactant where O₂ diffuses into pulmonary capillaries and CO₂ diffuses out.', part3dId: 'body-lungs' },
    ],
  },

  // ==========================================================================
  // SYSTEM 9: DIGESTIVE SYSTEM
  // ==========================================================================
  {
    id: 'sys-digestive',
    order: 9,
    chapterCode: 'Ch. 23',
    name: '9. Digestive System',
    shortName: 'Digestive',
    layerKey: 'digestive',
    accentColor: '#f59e0b',
    scaleTier: 'Macroscopic (Organ System)',
    summary:
      'Continuous ~7.62-meter alimentary canal (GI tract) with 4 histological layers (mucosa, submucosa, muscularis, serosa) plus vital accessory organs (salivary glands, liver, gallbladder, pancreas).',
    primaryFunctions: [
      'Ingestion, mechanical breakdown, and enzymatic chemical digestion of food',
      'Absorption of carbohydrates, amino acids, lipids, vitamins, minerals, and water',
      'Hepatic portal metabolic processing and elimination of solid waste',
    ],
    keyMetric: '~7.62 m (25 ft) GI Tract · 6 Accessory Organs',
    sourceTitle: 'OpenStax Anatomy & Physiology 2e — 23.1 Overview of the Digestive System',
    sourceUrl: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/23-1-overview-of-the-digestive-system',
    structures: [
      { id: 'dig-oral', name: 'Oral Cavity, Teeth, Tongue & Salivary Glands', latinOrAlt: 'Parotid, Submandibular & Sublingual Glands · 32 Adult Teeth', region: 'Head — Ingestion', countOrMetric: '3 Paired Salivary Glands', summary: 'Initiates mechanical mastication and enzymatic starch digestion via salivary amylase.', part3dId: 'body-digestive' },
      { id: 'dig-esophagus', name: 'Esophagus', latinOrAlt: 'Upper & Lower Esophageal Sphincters', region: 'Thorax (Posterior to Trachea)', countOrMetric: '~25 cm Muscular Tube', summary: 'Propels food bolus from pharynx through the diaphragm to the stomach via coordinated peristalsis.', part3dId: 'body-digestive' },
      { id: 'dig-stomach', name: 'Stomach', latinOrAlt: 'Cardia, Fundus, Body, Pylorus & Rugae', region: 'Left Upper Abdomen', countOrMetric: 'HCl & Pepsin Digestion', summary: 'J-shaped muscular sac churning food with acidic gastric juice into chyme.', part3dId: 'body-digestive' },
      { id: 'dig-liver-gb', name: 'Liver & Gallbladder', latinOrAlt: 'Right/Left/Caudate/Quadrate Lobes · Hepatic Portal System', region: 'Right Upper Abdomen', countOrMetric: 'Largest Internal Organ', summary: 'Hepatocytes produce bile (stored/concentrated in gallbladder), detoxify blood, and process absorbed nutrients.', part3dId: 'body-liver' },
      { id: 'dig-pancreas', name: 'Pancreas (Exocrine Acini & Ducts)', latinOrAlt: 'Head, Body & Tail', region: 'Retroperitoneal Abdomen', countOrMetric: 'Bicarbonate & Digestive Enzymes', summary: 'Secretes alkaline pancreatic juice (amylase, lipase, proteases) into the duodenum.', part3dId: 'body-digestive' },
      { id: 'dig-small-intestine', name: 'Small Intestine', latinOrAlt: 'Duodenum, Jejunum & Ileum (Villi & Microvilli)', region: 'Central Abdomen', countOrMetric: 'Primary Nutrient Absorption', summary: 'Three-segment coiled tube lined with circular folds, villi, and microvilli absorbing >90% of nutrients.', part3dId: 'body-digestive' },
      { id: 'dig-large-intestine', name: 'Large Intestine, Appendix & Peritoneum', latinOrAlt: 'Cecum, Appendix, Ascending/Transverse/Descending/Sigmoid Colon, Rectum, Anal Canal · Mesentery', region: 'Peripheral Abdomen & Pelvis', countOrMetric: 'Water & Electrolyte Recovery', summary: 'Reclaims water and electrolytes, hosts gut microbiota synthesizing vitamin K/B, and compacts feces.', part3dId: 'body-digestive' },
    ],
  },

  // ==========================================================================
  // SYSTEM 10: URINARY SYSTEM
  // ==========================================================================
  {
    id: 'sys-urinary',
    order: 10,
    chapterCode: 'Ch. 25',
    name: '10. Urinary System',
    shortName: 'Urinary',
    layerKey: 'urinary',
    accentColor: '#a78bfa',
    scaleTier: 'Macroscopic (Organ System)',
    summary:
      'Retroperitoneal blood-filtration and osmoregulatory apparatus centered on the paired kidneys and their millions of microscopic nephrons, draining through ureters to the bladder and urethra.',
    primaryFunctions: [
      'Glomerular filtration, tubular reabsorption, and secretion to excrete nitrogenous wastes (urea, uric acid, creatinine)',
      'Blood volume, blood pressure (renin–angiotensin), and electrolyte homeostasis',
      'Acid–base (pH) balance, erythropoietin release, and calcitriol activation',
    ],
    keyMetric: '2 Kidneys · ~1M Nephrons Each · pH 4.5–8.0',
    sourceTitle: 'OpenStax Anatomy & Physiology 2e — 25.1 Physical Characteristics of Urine',
    sourceUrl: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/25-1-physical-characteristics-of-urine',
    structures: [
      { id: 'urin-kidneys', name: 'Right & Left Kidneys', latinOrAlt: 'Renal Cortex, Medulla, Pyramids & Pelvis', region: 'Retroperitoneal Posterior Abdomen', countOrMetric: '2 Bean-Shaped Organs', summary: 'Filter blood plasma continuously to produce urine; right kidney sits slightly lower due to the liver.', part3dId: 'body-urinary' },
      { id: 'urin-nephrons', name: 'Nephrons (Functional Filtration Units)', latinOrAlt: 'Glomerulus, Bowman’s Capsule, PCT, Loop of Henle, DCT, Collecting Duct', region: 'Renal Cortex & Medulla', countOrMetric: '~1 Million per Kidney', summary: 'Microscopic tubules filtering water/solutes while reclaiming essential glucose, amino acids, and electrolytes.', part3dId: 'body-urinary' },
      { id: 'urin-ureters', name: 'Ureters', latinOrAlt: 'Right & Left Ureters', region: 'Abdomen → Pelvis', countOrMetric: '2 Peristaltic Ducts', summary: 'Transitional-epithelium muscular tubes propelling urine from renal pelvis to the urinary bladder.', part3dId: 'body-urinary' },
      { id: 'urin-bladder', name: 'Urinary Bladder & Urethra', latinOrAlt: 'Detrusor Muscle, Trigone & Internal/External Sphincters', region: 'Pelvic Cavity', countOrMetric: 'Storage & Micturition', summary: 'Expandable muscular reservoir storing urine until voluntary micturition through the urethra.', part3dId: 'body-urinary' },
    ],
  },

  // ==========================================================================
  // SYSTEM 11: REPRODUCTIVE SYSTEM
  // ==========================================================================
  {
    id: 'sys-reproductive',
    order: 11,
    chapterCode: 'Ch. 27',
    name: '11. Reproductive System',
    shortName: 'Reproductive',
    layerKey: 'reproductive',
    accentColor: '#f472b6',
    scaleTier: 'Macroscopic (Organ System)',
    summary:
      'Anatomical organs specialized for gametogenesis (meiosis producing haploid sperm and oocytes), sex hormone secretion, fertilization, and embryonic/fetal development.',
    primaryFunctions: [
      'Production of haploid gametes (spermatozoa and ova) via meiosis',
      'Secretion of sex steroid hormones (testosterone, estrogens, progesterone)',
      'Support of fertilization, gestation, and human species continuity',
    ],
    keyMetric: 'Gonads, Ducts & Accessory Glands',
    sourceTitle: 'OpenStax Anatomy & Physiology 2e — 1.2 Structural Organization',
    sourceUrl: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/1-2-structural-organization-of-the-human-body',
    structures: [
      { id: 'repro-gonads', name: 'Primary Gonads (Testes / Ovaries)', latinOrAlt: 'Gametogenesis & Steroidogenesis', region: 'Pelvic / Inguinal Region', countOrMetric: 'Paired Gonads', summary: 'Generate haploid gametes (23 chromosomes) and secrete primary sex hormones regulating secondary sex traits.', part3dId: 'body-reproductive' },
      { id: 'repro-ducts', name: 'Reproductive Tracts & Accessory Organs', latinOrAlt: 'Epididymis, Vas Deferens, Prostate / Uterine Tubes, Uterus, Cervix', region: 'Pelvic Cavity', countOrMetric: 'Transport & Nourishment', summary: 'Specialized ductal and muscular structures transporting gametes and supporting embryonic development.', part3dId: 'body-reproductive' },
    ],
  },
];

export const TOTAL_ANATOMY_STRUCTURES = HUMAN_ANATOMY_BOOK.reduce(
  (sum, ch) => sum + ch.structures.length,
  0
);
