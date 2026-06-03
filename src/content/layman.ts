/** Plain-language copy aligned with HQIV-LEAN papers (closure, combinatorics→mass, patch QFT). */

export type LaymanStep = {
  title: string
  headline: string
  body: string
  /** Maps to HqivPipelineCanvas scene 0–5 */
  scene: number
}

export const laymanSteps: LaymanStep[] = [
  {
    title: 'Counting on a light cone',
    headline: 'The universe grows in shells, not as a smooth blur.',
    body:
      'Picture a flash of light expanding outward. Each moment adds a new “shell” of possible events. HQIV counts how much structure fits on each shell using simple arithmetic on whole numbers—like tallying seats in a growing stadium, where each ring has more seats than the last in a fixed pattern (quadratic growth, not cubic bulk filling).',
    scene: 0,
  },
  {
    title: 'A memory that never resets',
    headline: 'Past shells leave a cumulative trace.',
    body:
      'Each new shell contributes a little more than the last, with a gentle logarithmic correction. Summing those contributions gives a running total that always grows—history has weight. That total is the backbone for every later readout: masses, phases, and couplings all refer back to this ledger.',
    scene: 1,
  },
  {
    title: 'A dial you can compare',
    headline: 'Normalize the ledger so “now” has a number.',
    body:
      'Pick a reference shell and express every later shell as a fraction of that reference. You get a monotone dial—only forward, never ambiguous—that plays the role of a phase or rapidity clock without assuming Einstein’s equations upfront. Physics readouts hang off this dial.',
    scene: 2,
  },
  {
    title: 'A fixed 60 / 40 split',
    headline: 'Two fractions are forced by counting, not fitted.',
    body:
      'When the discrete bookkeeping is closed, the natural split is α = 3/5 and γ = 2/5 (they add to one). These are rational numbers from combinatorics on the lattice—stars-and-bars style counting—not knobs turned to match the Standard Model. The same α reappears wherever curvature imprint enters.',
    scene: 3,
  },
  {
    title: 'Forces from the same book',
    headline: 'Field strength is discrete geometry, not a separate guess.',
    body:
      'On the eight-dimensional carrier used in the formal work, electromagnetic-style data is built from differences on a grid—local updates that respect an information budget (patch QFT). Variational principles on that grid tie the familiar Maxwell picture to the same phase lift that generates rotations in eight dimensions.',
    scene: 4,
  },
  {
    title: 'Gravity uses the same imprint',
    headline: 'Effective gravity strength follows G_eff ∝ φ^(3/5).',
    body:
      'In cosmological readouts, the same 3/5 exponent controls how “strong” gravity acts relative to a lapse field φ. Particle masses, electroweak scale, and Friedmann-style constraints are meant to be different faces of one discrete object—not independent theories stitched together.',
    scene: 5,
  },
]

export const outcomes = [
  {
    title: 'Electroweak scale',
    text: 'The Higgs vacuum scale is derived from lock-in temperature and outer-horizon surfaces on the shell ladder, with triality-fixed couplings—then W, Z, and Higgs masses follow without importing PDG numbers to define the geometry.',
  },
  {
    title: 'Fermion and hadron masses',
    text: 'Charged leptons, quarks, and nucleons are read from detuned horizon surfaces and binding networks on the same spine. The proton at the reference shell anchors the mass chart; other particles are predictions or comparisons, not simultaneous fit targets.',
  },
  {
    title: 'Eight-dimensional closure',
    text: 'Starting from octonion bookkeeping on the light cone, a small phase generator plus the usual G₂ symmetries closes to the full rotation algebra in eight dimensions—certified in machine-checked proofs.',
  },
  {
    title: 'Cosmology and anomalies',
    text: 'Companion work connects the imprint to baryogenesis, longitudinal EM effects, and orbital/flyby phenomenology—always as discrete readouts first, with smooth formulas as translation layers for comparison.',
  },
]

// paperTopics removed — the live publish-ordered list now lives in papers.ts
// and is rendered as rich layman cards directly on this view.

export const faq = [
  {
    q: 'Is this claiming to replace all of physics?',
    a: 'No. HQIV is a discrete patch theory: sharp statements live on shells and finite charts. Continuum QFT notation appears where it helps compare to textbooks, but the definitions are on the discrete spine.',
  },
  {
    q: 'Where do the numbers come from?',
    a: 'From counting rules on the null lattice and from closing the bookkeeping (ratios, surface areas, partition logic). The flagship split 3/5 + 2/5 is an example of a quantity fixed by that closure, not tuned afterward.',
  },
  {
    q: 'How is it checked?',
    a: 'The HQIV-LEAN project machine-checks key identities and closure claims. Preprints document the derivation chain; this site is an intuitive map, not a substitute for the proofs.',
  },
  {
    q: 'What should I read next?',
    a: 'Use the interactive technical tour on this site for equations step-by-step, or open the formal papers in the HQIV-LEAN repository for full derivations.',
  },
]
