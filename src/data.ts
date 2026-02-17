import { Card, ExperimentDefinition } from './models';

export const experiments: ExperimentDefinition[] = [
  {
    id: 1,
    title: 'Protein-X translocates between cytoplasm and nuclei',
    stainings: ['Protein-X', 'Nuclei'],
    question: 'Quantify the extent of Protein-X translocation between cytoplasm and nuclei.',
    iconPath: '/experiments/Experiments_Exp1.png'
  },
  {
    id: 2,
    title: 'Protein-X resembles an organelle',
    stainings: ['Protein-X', 'Nuclei', 'Organelle (Golgi or Mitochondria)'],
    question: 'Does Protein-X co-localize more with Golgi or Mitochondria?',
    iconPath: '/experiments/Experiments_Exp2.png'
  },
  {
    id: 3,
    title: 'Protein-X looks like blobs',
    stainings: ['Protein-X', 'Vesicles (Lysosomes)'],
    question: 'Does Protein-X co-localize more/less with vesicles with/without Drug-Y?',
    iconPath: '/experiments/Experiments_Exp3.png'
  },
  {
    id: 4,
    title: 'Protein-X follows cytoskeleton',
    stainings: ['Protein-X', 'Cytoskeleton (F-actin or Microtubules)'],
    question: 'Does Protein-X co-localize more with F-actin or Microtubules?',
    iconPath: '/experiments/Experiments_Exp4.png'
  },
  {
    id: 5,
    title: 'Protein-X looks like blobs (Golgi)',
    stainings: ['Protein-X', 'Golgi'],
    question: 'Does Protein-X co-localize more/less with Golgi with/without Drug-Y?',
    iconPath: '/experiments/Experiments_Exp5.png'
  },
  {
    id: 6,
    title: 'Protein-X looks like blobs (Golgi + cell)',
    stainings: ['Protein-X', 'Golgi', 'Cell'],
    question: 'Same as Experiment 5, with additional cell staining.',
    iconPath: '/experiments/Experiments_Exp6.png'
  }
];

// Card deck. All labels/descriptions are editable by hand.
export const cards: Card[] = [
  // 1- Microscopy cards (Acquisition phase – microscope settings)
  {
    id: 'mic-100x',
    name: '100x objective',
    description: '100x objective, NA: 1,49',
    category: 'microscopy',
    timeCost: 0,
    incompatibleWith: [],
    requires: [],
    tags: ['objective'],
    iconPath: '/cards/1-Microscopy_cards_100x-recto.png'
  },
  {
    id: 'mic-20x',
    name: '20x objective',
    description: '20x objective, NA: 0,8',
    category: 'microscopy',
    timeCost: 0,
    incompatibleWith: [],
    requires: [],
    tags: ['objective'],
    iconPath: '/cards/1-Microscopy_cards_20x-recto.png'
  },
  {
    id: 'mic-60x',
    name: '60x objective',
    description: '60x objective, NA: 1,3',
    category: 'microscopy',
    timeCost: 0,
    incompatibleWith: [],
    requires: [],
    tags: ['objective'],
    iconPath: '/cards/1-Microscopy_cards_60x-recto.png'
  },
  {
    id: 'mic-camera',
    name: 'Camera',
    description: 'Camera (CCD or sCMOS) for Widefield and Spinning Disk confocal',
    category: 'microscopy',
    timeCost: 1,
    incompatibleWith: [],
    requires: [],
    tags: ['detector'],
    iconPath: '/cards/1-Microscopy_cards_Camera-r.png'
  },
  {
    id: 'mic-confocal-pmt',
    name: 'PMT',
    description: 'Photomultiplier detector (PMT) for point scanning confocal',
    category: 'microscopy',
    timeCost: 2,
    incompatibleWith: [],
    requires: [],
    tags: ['detector'],
    iconPath: '/cards/1-Microscopy_cards_PMT-r.png'
  },
  {
    id: 'mic-confocal-cf',
    name: 'Point scanning confocal',
    description: 'Point scanning confocal microscopy. Requires PMT detector',
    category: 'microscopy',
    timeCost: 2,
    incompatibleWith: [],
    requires: [],
    tags: ['modality'],
    iconPath: '/cards/1-Microscopy_cards_CF-recto.png'
  },
  {
    id: 'mic-spinning-disk',
    name: 'Spinning disk confocal',
    description: 'Spinning disk confocal microscopy. Requires camera detector',
    category: 'microscopy',
    timeCost: 1,
    incompatibleWith: [],
    requires: [],
    tags: ['modality'],
    iconPath: '/cards/1-Microscopy_cards_SpD-recto.png'
  },
  {
    id: 'mic-superres',
    name: 'Super-resolution',
    description: 'Super-resolution microscopy (e.g. STED, SIM, PALM/STORM). Requires point scanning of widefield modality',
    category: 'microscopy',
    timeCost: 3,
    incompatibleWith: [],
    requires: [],
    tags: ['modality', 'super-resolution'],
    iconPath: '/cards/1-Microscopy_cards_SR-recto.png'
  },
  {
    id: 'mic-widefield',
    name: 'Widefield',
    description: 'Widefield microscopy. Requires camera detector',
    category: 'microscopy',
    timeCost: 1,
    incompatibleWith: [],
    requires: [],
    tags: ['modality'],
    iconPath: '/cards/1-Microscopy_cards_WF-recto.png'
  },

  // 2- Image cards (Acquisition phase – image settings)
  {
    id: 'img-px10',
    name: 'Pixel size 10',
    description: 'Pixel size 10. Requires Super-res',
    category: 'microscopy',
    timeCost: 5,
    incompatibleWith: [],
    requires: [],
    tags: ['pixel-size'],
    iconPath: '/cards/2-Image_cards_px10-r.png'
  },
  {
    id: 'img-px100',
    name: 'Pixel size 100',
    description: 'Pixel size 100',
    category: 'microscopy',
    timeCost: 3,
    incompatibleWith: [],
    requires: [],
    tags: ['pixel-size'],
    iconPath: '/cards/2-Image_cards_px100-r.png'
  },
  {
    id: 'img-px1000',
    name: 'Pixel size 1000',
    description: 'Pixel size 1000',
    category: 'microscopy',
    timeCost: 1,
    incompatibleWith: [],
    requires: [],
    tags: ['pixel-size'],
    iconPath: '/cards/2-Image_cards_px1000-r.png'
  },
  {
    id: 'img-sampling-few',
    name: 'Sampling – few planes',
    description: 'Sample a few Z planes',
    category: 'microscopy',
    timeCost: 3,
    incompatibleWith: [],
    requires: [],
    tags: ['sampling'],
    iconPath: '/cards/2-Image_cards_samplingFew-r.png'
  },
  {
    id: 'img-sampling-single',
    name: 'Sampling – single plane',
    description: 'Sample a single Z plane',
    category: 'microscopy',
    timeCost: 1,
    incompatibleWith: [],
    requires: [],
    tags: ['sampling'],
    iconPath: '/cards/2-Image_cards_samplingSingle-r.png'
  },
  {
    id: 'img-sampling-whole',
    name: 'Sampling – whole volume',
    description: 'Sample the whole Z volume',
    category: 'microscopy',
    timeCost: 5,
    incompatibleWith: [],
    requires: [],
    tags: ['sampling'],
    iconPath: '/cards/2-Image_cards_samplingWhole-r.png'
  },
  {
    id: 'img-sequential',
    name: 'Sequential acquisition',
    description: 'Sequential channel acquisition',
    category: 'microscopy',
    timeCost: 2,
    incompatibleWith: ['img-simultaneous'],
    requires: [],
    tags: ['acquisition-mode'],
    iconPath: '/cards/2-Image_cards_seq-r.png'
  },
  {
    id: 'img-simultaneous',
    name: 'Simultaneous acquisition',
    description: 'Simultaneous channel acquisition. Cannot use camera detector',
    category: 'microscopy',
    timeCost: 1,
    incompatibleWith: ['img-sequential'],
    requires: [],
    tags: ['acquisition-mode'],
    iconPath: '/cards/2-Image_cards_simul-r.png'
  },
  {
    id: 'img-snr1',
    name: 'SNR 1',
    description: 'Signal-to-noise ratio of 1',
    category: 'microscopy',
    timeCost: 1,
    incompatibleWith: [],
    requires: [],
    tags: ['snr'],
    iconPath: '/cards/2-Image_cards_SNR1-r.png'
  },
  {
    id: 'img-snr5',
    name: 'SNR 5',
    description: 'Signal-to-noise ratio of 5',
    category: 'microscopy',
    timeCost: 3,
    incompatibleWith: [],
    requires: [],
    tags: ['snr'],
    iconPath: '/cards/2-Image_cards_SNR5-r.png'
  },
  {
    id: 'img-snr30',
    name: 'SNR 30',
    description: 'Signal-to-noise ratio of 30',
    category: 'microscopy',
    timeCost: 5,
    incompatibleWith: [],
    requires: [],
    tags: ['snr'],
    iconPath: '/cards/2-Image_cards_SNR30-r.png'
  },
  {
    id: 'img-tiling',
    name: 'Tiling',
    description: 'Perform tiling to acquire a larger field of view',
    category: 'microscopy',
    timeCost: 0,
    incompatibleWith: [],
    requires: [],
    tags: ['tiling'],
    iconPath: '/cards/2-Image_cards_tiling-r.png'
  },
  {
    id: 'img-z50',
    name: 'Z-stack 50',
    description: '50nm Z step size',
    category: 'microscopy',
    timeCost: 5,
    incompatibleWith: [],
    requires: [],
    tags: ['z-stack'],
    iconPath: '/cards/2-Image_cards_z50-r.png'
  },
  {
    id: 'img-z150',
    name: 'Z-stack 150',
    description: '150nm Z step size',
    category: 'microscopy',
    timeCost: 3,
    incompatibleWith: [],
    requires: [],
    tags: ['z-stack'],
    iconPath: '/cards/2-Image_cards_z150-r.png'
  },
  {
    id: 'img-z500',
    name: 'Z-stack 500',
    description: '500nm Z step size',
    category: 'microscopy',
    timeCost: 1,
    incompatibleWith: [],
    requires: [],
    tags: ['z-stack'],
    iconPath: '/cards/2-Image_cards_z500-r.png'
  },

  // 3- Analysis cards (Analysis phase – analysis methods & segmentation)
  {
    id: 'ana-whole-image',
    name: 'Whole image',
    description: 'Perform analysis on the whole image',
    category: 'analysis',
    timeCost: 1,
    incompatibleWith: [],
    requires: [],
    tags: ['scope'],
    iconPath: '/cards/3-Analysis_cards_WholeImage-r.png'
  },
  {
    id: 'ana-cell-by-cell',
    name: 'Cell by cell',
    description: 'Perform analysis on a cell-by-cell basis. Requires segmentation',
    category: 'analysis',
    timeCost: 2,
    incompatibleWith: [],
    requires: [],
    tags: ['scope'],
    iconPath: '/cards/3-Analysis_cards_CellByCell-r.png'
  },
  {
    id: 'ana-cell-classes',
    name: 'Cell classes',
    description: 'Classify cells into different classes. Requires segmentation',
    category: 'analysis',
    timeCost: 1,
    incompatibleWith: [],
    requires: [],
    tags: ['scope'],
    iconPath: '/cards/3-Analysis_cards_CellClasses-r.png'
  },
  {
    id: 'ana-center-to-center',
    name: 'Center-to-center distance',
    description: 'Co-distribution analysis, center-to-center. Requires blob segmentation',
    category: 'analysis',
    timeCost: 2,
    incompatibleWith: [],
    requires: [],
    tags: ['distance'],
    iconPath: '/cards/3-Analysis_cards_CenterToCenter_Dist-r.png'
  },
  {
    id: 'ana-edge-to-edge',
    name: 'Edge-to-edge distance',
    description: 'Co-distribution analysis, edge-to-edge. Requires complex segmentation',
    category: 'analysis',
    timeCost: 2,
    incompatibleWith: [],
    requires: [],
    tags: ['distance'],
    iconPath: '/cards/3-Analysis_cards_EdgeToEdge_Dist-r.png'
  },
  {
    id: 'ana-clustering',
    name: 'Clustering',
    description: 'Co-distribution analysis, clustering. Requires segmentation',
    category: 'analysis',
    timeCost: 1,
    incompatibleWith: [],
    requires: [],
    tags: ['statistics'],
    iconPath: '/cards/3-Analysis_cards_Clustering-r.png'
  },
  {
    id: 'ana-deconv',
    name: 'Deconvolution',
    description: 'Perform deconvolution as a pre-processing step before analysis',
    category: 'analysis',
    timeCost: 1,
    incompatibleWith: [],
    requires: [],
    tags: ['pre-processing'],
    iconPath: '/cards/3-Analysis_cards_Deconv-r.png'
  },
  {
    id: 'ana-int-correlation',
    name: 'Intensity correlation',
    description: 'Perform intensity correlation analysis (Pearson, Spearmnan)',
    category: 'analysis',
    timeCost: 1,
    incompatibleWith: [],
    requires: [],
    tags: ['metrics'],
    iconPath: '/cards/3-Analysis_cards_IntCorrelation-r.png'
  },
  {
    id: 'ana-overlap',
    name: 'Overlap',
    description: 'Perform co-occurrence analysis (Manders, Overlap coefficient)',
    category: 'analysis',
    timeCost: 1,
    incompatibleWith: [],
    requires: [],
    tags: ['metrics'],
    iconPath: '/cards/3-Analysis_cards_Overlap-r.png'
  },
  {
    id: 'ana-projections',
    name: 'Projections',
    description: 'Perform Z-projections (e.g. max, sum) as a pre-processing step before analysis',
    category: 'analysis',
    timeCost: 0,
    incompatibleWith: [],
    requires: [],
    tags: ['projection'],
    iconPath: '/cards/3-Analysis_cards_projections-r.png'
  },
  {
    id: 'ana-seg-bob',
    name: 'Segment blobs',
    description: 'Segment blob-like shapes',
    category: 'analysis',
    timeCost: 1,
    incompatibleWith: [],
    requires: [],
    tags: ['segmentation'],
    iconPath: '/cards/3-Analysis_cards_Seg_Bob-r.png'
  },
  {
    id: 'ana-seg-complex',
    name: 'Segment complex',
    description: 'Segment complex shapes',
    category: 'analysis',
    timeCost: 1,
    incompatibleWith: [],
    requires: [],
    tags: ['segmentation'],
    iconPath: '/cards/3-Analysis_cards_Seg_Complex-r.png'
  },
  {
    id: 'ana-seg-cyto',
    name: 'Segment cytoplasm',
    description: 'Segment cell cytoplasm',
    category: 'analysis',
    timeCost: 1,
    incompatibleWith: [],
    requires: [],
    tags: ['segmentation'],
    iconPath: '/cards/3-Analysis_cards_Seg_cyto-r.png'
  },
  {
    id: 'ana-seg-nuc',
    name: 'Segment nuclei',
    description: 'Segment cell nuclei',
    category: 'analysis',
    timeCost: 1,
    incompatibleWith: [],
    requires: [],
    tags: ['segmentation'],
    iconPath: '/cards/3-Analysis_cards_Seg_nuc-r.png'
  },
  {
    id: 'ana-seg-nuc-cyto',
    name: 'Segment nuclei + cyto',
    description: 'Segment both cell nuclei and cytoplasm',
    category: 'analysis',
    timeCost: 2,
    incompatibleWith: [],
    requires: [],
    tags: ['segmentation'],
    iconPath: '/cards/3-Analysis_cards_Seg_nuc+cyto-r.png'
  },
  {
    id: 'ana-seg-point',
    name: 'Segment points',
    description: 'Segment single points',
    category: 'analysis',
    timeCost: 1,
    incompatibleWith: [],
    requires: [],
    tags: ['segmentation'],
    iconPath: '/cards/3-Analysis_cards_Seg_Point-r.png'
  },
  {
    id: 'ana-signal-random',
    name: 'Randomized signal',
    description: 'Perform signal randomnization (Costes randomization) as a control analysis',
    category: 'analysis',
    timeCost: 1,
    incompatibleWith: [],
    requires: [],
    tags: ['control'],
    iconPath: '/cards/3-Analysis_cards_SignalRdm-r.png'
  }
];

// Review phase: issue cards (Reviewer's concerns) – GM assigns to teams; add timeCost to team total.
export const reviewIssueCards: Card[] = [
  { id: 'rev-bleaching', name: 'Bleaching', description: '', category: 'review', timeCost: 3, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_Bleaching_issue-R.png' },
  { id: 'rev-cell-var', name: 'Cell variability', description: '', category: 'review', timeCost: 5, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_CellVariability_issue-R.png' },
  { id: 'rev-cross-em', name: 'Cross-emission', description: '', category: 'review', timeCost: 3, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_CrossEm_issue-R.png' },
  { id: 'rev-cross-ex', name: 'Cross-excitation', description: '', category: 'review', timeCost: 3, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_CrossEx_issue-R.png' },
  { id: 'rev-crowded', name: 'Crowded', description: '', category: 'review', timeCost: 3, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_Crowded_issue-R.png' },
  { id: 'rev-deconv-art', name: 'Deconvolution artefact', description: '', category: 'review', timeCost: 3, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_DeconvArtefact_issue-R.png' },
  { id: 'rev-diff-area', name: 'Different signal areas', description: '', category: 'review', timeCost: 5, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_DiffArea_issue-R.png' },
  { id: 'rev-intra-var', name: 'Intra-cellular variability', description: '', category: 'review', timeCost: 3, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_IntraCellVar_issue-R.png' },
  { id: 'rev-low-snr', name: 'Low SNR', description: '', category: 'review', timeCost: 3, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_LowSNR_issue-R.png' },
  { id: 'rev-oof-blur', name: 'Out-of-focus blur', description: '', category: 'review', timeCost: 3, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_OOFBlur_issue-R.png' },
  { id: 'rev-proj-art', name: 'Projection artefact', description: '', category: 'review', timeCost: 3, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_ProjArtefact_issue-R.png' },
  { id: 'rev-ri-mismatch', name: 'RI mismatch', description: '', category: 'review', timeCost: 3, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_RIMismatch_issue-R.png' },
  { id: 'rev-saturation', name: 'Saturation', description: '', category: 'review', timeCost: 3, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_saturation_issue-R.png' },
  { id: 'rev-slow', name: 'Slow', description: '', category: 'review', timeCost: 3, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_Slow_issue-R.png' },
  { id: 'rev-threq', name: 'Threshold', description: '', category: 'review', timeCost: 3, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_Threq_issue-R.png' }
];

// Review phase: details cards (Experimental details) – GM assigns to teams; add timeCost to team total. Team rolls dice (4–6) to use.
export const reviewDetailsCards: Card[] = [
  { id: 'rev-cell-hom', name: 'Cell homogeneity', description: '', category: 'review', timeCost: 0, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_CellHom_details-R.png' },
  { id: 'rev-dif-area', name: 'Different areas', description: '', category: 'review', timeCost: 0, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_DifArea_details-R.png' },
  { id: 'rev-live', name: 'Live', description: '', category: 'review', timeCost: 0, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_Live_details-R.png' },
  { id: 'rev-opt-fluo', name: 'Optimized fluorophores', description: '', category: 'review', timeCost: 1, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_OptFluo_details-R.png' },
  { id: 'rev-opt-window', name: 'Optimized emission window', description: '', category: 'review', timeCost: 1, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_OptWindow_details-R.png' },
  { id: 'rev-preserved', name: 'Preserved', description: '', category: 'review', timeCost: 0, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_Preserved_details-R.png' },
  { id: 'rev-range', name: 'Range', description: '', category: 'review', timeCost: 0, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_range_details-R.png' },
  { id: 'rev-ri-match', name: 'RI match', description: '', category: 'review', timeCost: 0, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_RIMatch_details-R.png' },
  { id: 'rev-sim-area', name: 'Similar areas', description: '', category: 'review', timeCost: 0, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_SimArea_details-R.png' },
  { id: 'rev-sim-area', name: 'Optimized deconvolution', description: '', category: 'review', timeCost: 1, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_template_details-R copy 2.png' },
  { id: 'rev-single-stain', name: 'Single stain', description: '', category: 'review', timeCost: 0, incompatibleWith: [], requires: [], tags: [], iconPath: '/cards/review/4-Details_Issues_cards_SingleStain_details-R.png' }
];

