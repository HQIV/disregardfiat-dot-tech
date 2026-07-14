/**
 * Paper index for the Technical Tour + Layman cards, mirroring records
 * in the Zenodo HQIV community (https://zenodo.org/communities/hqiv)
 * and the publish order declared in HQIV/papers/README.md.
 *
 * Papers appear in publication order (Tier 0 foundation, then Tier 1
 * foundation-extension quartet, Tier-2 mass closure, etc.). Each exposes:
 *   - Permanent identifiers (Zenodo DOI + record URL).
 *   - A short hook + trimmed abstract for the index card.
 *   - Key formal claims (what is proven / certified / measured).
 *   - Which derivation-pipeline steps (HomeView 0–12) the paper covers.
 *   - An optional `layArticle` slot — null means the slot is open for
 *     a community contribution (see the contribution template on the
 *     technical tour page).
 *
 * To add a paper or a lay summary, open a pull request against this
 * file in the website repository. The Zenodo community curators
 * approve the underlying paper; the website maintainers merge the
 * matching index / lay-summary update.
 */

export type LayArticle = {
  /** URL-safe slug, used for deep linking and PR file names. */
  slug: string
  /** Author of the lay summary (not necessarily the paper author). */
  contributor: {
    name: string
    /** Optional ORCID iD, e.g. "0000-0002-0609-9836". */
    orcid?: string
    /** Personal page, Mastodon handle, etc. */
    url?: string
  }
  /** ISO date (YYYY-MM-DD) when the summary was merged. */
  contributedAt: string
  /** One-line teaser shown above the body. */
  hook: string
  /** Body paragraphs (aim for 4–6 paragraphs, ~400–800 words total). */
  paragraphs: string[]
  /** 1–2 sentence "so what" closing line. */
  takeaway: string
  /** Recommended licence for new contributions. */
  licence?: 'CC-BY-4.0' | string
}

export type PaperTier = 0 | 1 | 2

export type Paper = {
  id: string
  title: string
  shortTitle: string
  kind: 'preprint' | 'technical-note' | 'review'
  tier: PaperTier
  version: string
  date: string
  /** Zenodo DOI without the https://doi.org/ prefix. */
  doi: string
  zenodoUrl: string
  /** One-line index-card hook. */
  hook: string
  /** Where this paper lands on the shared first-principles HQIV spine. */
  spineFocus: string
  /** Trimmed abstract (≈ 3 sentences). */
  abstract: string
  /** Short headline for the home-page Lean resolution carousel. */
  leanResolution: string
  /** What this paper proves / certifies / predicts. */
  keyClaims: string[]
  /** Concrete artifacts the paper ships. */
  artifacts?: string[]
  /** Which derivation-pipeline steps (0–12) on the technical tour this paper covers. */
  pipelineSteps: number[]
  layArticle: LayArticle | null
}

export type FirstPrinciplesStep = {
  label: string
  body: string
}

export const firstPrinciplesDerivationChain: FirstPrinciplesStep[] = [
  {
    label: 'Postulate',
    body:
      'Three extended spatial dimensions undergo monotone discrete growth. The load-bearing count is the new null-shell surface structure, not a smooth bulk continuum.',
  },
  {
    label: 'Shell Spine',
    body:
      'Stars-and-bars counting on the 3D light cone gives the quadratic HQIV spine A(m)=4(m+2)(m+1), cumulative ledgers, and the forward shell index used by every later readout.',
  },
  {
    label: 'Monogamy Split',
    body:
      'Closing the horizon ledger under informational monogamy forces the unit split α=3/5 and γ=2/5; these are rational outputs of the 3D growth spine, not fitted constants.',
  },
  {
    label: 'Octonions Arrive',
    body:
      'The same 3D null-lattice bookkeeping needs an eight-channel normed carrier for phase, triality, and gauge closure. The Fano octonion table supplies that carrier; G2 plus one phase-lift Δ closes to so(8).',
  },
  {
    label: 'Readouts',
    body:
      'Gauge, gravity, mass, thermal, baryogenesis, binding, BBN, decay, and chemistry papers then read from the same spine: finite shell ledgers first, continuum notation only as a comparison layer.',
  },
]

export type LeanResolutionSlide = {
  paperId: string
  paperShortTitle: string
  resolution: string
  doi: string
}

export function tierLabel(tier: PaperTier): string {
  if (tier === 0) return 'Tier 0'
  if (tier === 1) return 'Tier 1'
  return 'Tier 2'
}

export const papers: Paper[] = [
  {
    id: 'unified-framework',
    title:
      'Horizon-Quantized Informational Vacuum (HQIV): A Unified Framework from Causal Horizon Monogamy and Discrete Null-Lattice Combinatorics',
    shortTitle: 'Unified framework (HQIV)',
    kind: 'preprint',
    tier: 0,
    version: 'v2',
    date: '2026-03-07',
    doi: '10.5281/zenodo.18899939',
    zenodoUrl: 'https://zenodo.org/records/18899939',
    hook: 'The foundational paper: two independent routes converge on one auxiliary field and one modified inertia.',
    spineFocus:
      'Sets the whole chain: 3D discrete growth plus horizon monogamy produce the auxiliary field, the curvature imprint, and the first octonionic carrier route.',
    abstract:
      'HQIV is presented as a relativistic completion of Jacobson’s thermodynamic gravity that enforces entanglement monogamy on overlapping causal horizons together with an informational-energy conservation axiom. A geometric route (phase-horizon-corrected Maxwell equations satisfying Schüller’s hyperbolicity criterion) and a combinatorial route (integer mode counting on the discrete Planck-scale null lattice extended to octonions) converge on identical auxiliary-field and modified-inertia structures. The Standard Model is embedded inside Spin(8) with triality generations, the black-hole information paradox is resolved via a soft dynamical firewall, and a 51.2 Gyr wall-clock cosmic age is predicted with the observed 13.8 Gyr appearance following from observer-centric ADM lapse compression.',
    leanResolution:
      'the black-hole information paradox — via a soft dynamical firewall on the discrete null lattice',
    keyClaims: [
      'Geometric and combinatorial routes converge on the same auxiliary field and modified inertia (Lean 4 verified).',
      'Standard Model embedded inside Spin(8) with triality-organized generations.',
      'Baryon asymmetry, true spatial curvature, and QCD string tension derived from first principles, with the observed CMB temperature selecting the present "now" hypersurface.',
      'Soft dynamical firewall as a geometric resolution of the black-hole information paradox.',
      '51.2 Gyr wall-clock cosmic age compressed to 13.8 Gyr appearance via observer-centric ADM lapse.',
    ],
    artifacts: [
      'Python lattice evolution + CLASS patch',
      'Octonion Lie-algebra calculator (browser)',
      'N-body simulation code',
      'Lean 4 verification modules',
    ],
    pipelineSteps: [0, 1, 2, 3, 4, 7, 8, 9, 10, 11, 12],
    layArticle: {
      slug: 'unified-framework',
      contributor: {
        name: 'HQIV project (high-school level starter summaries)',
        url: 'https://disregardfiat.tech',
      },
      contributedAt: '2026-05-28',
      hook: 'Two completely different ways of looking at the universe — one from horizons and lost-information rules, one from counting whole numbers on a grid — arrive at exactly the same extra "helper field" and the same new rule for how inertia works.',
      paragraphs: [
        'Physics is full of numbers that feel arbitrary: the mass of the electron, the exact strength of gravity compared with the other forces, why there is a little more matter than antimatter, and even why the universe appears to be 13.8 billion years old. Most textbooks simply list these numbers as "measured constants" and move on. The foundational HQIV paper asks a different question: what if almost all of them are forced by one simple, unbreakable rule about how information travels outward on light rays?',
        'The rule is that the universe grows in discrete expanding shells, like the layers of an onion or the rings you see when you cut down a tree. At each new shell, only a precise, countable number of new possible light paths become available. When you keep a running total of everything that happened on all the earlier shells (with a gentle "memory" correction that grows very slowly), you get a single number that acts like a universal dimmer switch. This switch — called the auxiliary field — changes how much inertia everything has and how strongly gravity pulls. The surprising discovery is that you get exactly the same dimmer switch whether you start from Einstein-style horizon thermodynamics plus the rule that information can never be cloned or lost, or whether you start from pure integer counting on a special eight-direction grid (octonions). The two routes meet in the middle with no leftover freedom.',
        'This meeting is not hand-waved. Large parts of the mathematics have been written as computer-checked proofs in a system called Lean 4, so any mathematician can inspect the logic the same way you would audit a bank\'s books. The framework also claims that the entire Standard Model of particles (quarks, electrons, forces, three generations) can live inside the natural rotation rules of eight-dimensional space. It further predicts that the real "wall-clock" age of the cosmos is roughly 51 billion years, but because the dimmer switch affects how fast time appears to run for observers inside the system, it looks like only 13.8 billion years to us. Black holes do not destroy information; they have a soft, slowly changing "firewall" region that eventually lets the information out in a controlled way.',
        'Several concrete results are derived rather than assumed: the slight excess of matter over antimatter, the strength of the strong force that holds quarks together, and the way gravity\'s effective strength depends on the auxiliary field. The bookkeeping is strictly local — every measurement has to balance its energy accounts through the auxiliary channel and a few others — which rules out simple pictures in which the universe constantly splits into many parallel branches with no overall conservation. Some of these derivations are fully rigorous; others (especially the exact masses of the heavier particles) are strong, testable predictions rather than finished proofs.',
        'The picture is still a "patch" theory: it describes what happens on finite, well-defined regions rather than claiming one smooth continuum everywhere at once. It has not yet replaced every everyday calculation that working physicists perform. The complete proof that only the octonions work for the internal bookkeeping, and the full detailed match to every known particle mass, are still partly open. The next steps are for more people to read the Lean code, run the companion simulations, and check whether the new numbers the theory predicts actually appear in fresh telescope and collider data.',
      ],
      takeaway: 'The strange-looking numbers in physics may not be random inputs at all — they may be the unavoidable result of demanding that information on expanding light shells is never lost, double-counted, or created from nothing.',
      licence: 'CC-BY-4.0',
    },
  },
  {
    id: 'auxiliary-fields',
    title:
      'Light-Cone-Derived Auxiliary Fields Supply an Explicit Derived Interpretation of Quantum Superposition',
    shortTitle: 'Auxiliary fields & superposition',
    kind: 'preprint',
    tier: 0,
    version: 'v2',
    date: '2026-03-30',
    doi: '10.5281/zenodo.19336553',
    zenodoUrl: 'https://zenodo.org/records/19336553',
    hook: 'Born-rule statistics without dynamical collapse: a derived, pilot-wave-aligned reading of superposition on an octonionic ℝ⁸ carrier.',
    spineFocus:
      'Shows how the shell ledger becomes an auxiliary carrier for superposition, with α=3/5 and γ=2/5 fixed before measurement statistics are read out.',
    abstract:
      'A Lean-formalised discrete null-lattice light-cone construction derives an auxiliary field and rapidity ladder directly from combinatorial structure, supplying an explicit, lossless interpretation of quantum superposition on an octonionic ℝ⁸ carrier that exactly reproduces the inner-product invariants of standard quantum mechanics. Lattice combinatorics force the shell-wise curvature-imprint ratio α = 3/5 and the complementary unit-horizon fraction γ = 2/5 exactly. A finite measurement layer implements Born-rule normalisation together with closed energy accounting through auxiliary, birefringence and redshift channels — deterministic local accounting that rules out globally branching many-worlds interpretations and instead aligns the model with a pilot-wave ontology.',
    leanResolution:
      'quantum superposition — Born-rule statistics without dynamical collapse, on an explicit auxiliary-field carrier',
    keyClaims: [
      'α = 3/5 and γ = 2/5 forced exactly by lattice combinatorics.',
      'Born-rule statistics emerge from an explicit, calibrated measurement layer — no dynamical collapse.',
      'Deterministic local bookkeeping; many-worlds branching is explicitly ruled out.',
      'Exact sparse, horizon-causal update rule enables efficient classical simulation in structured regimes.',
      'Polarisation-rotation observables predict CMB birefringence signatures at large scales.',
    ],
    artifacts: [
      'Lean 4 proofs (light-cone construction, α/γ extraction, Born-rule layer)',
      'Sparse horizon-causal update rule (reference implementation)',
      'Quantum-chemistry / protein-folding refinement-algebra demos',
    ],
    pipelineSteps: [2, 3, 4, 5, 6, 7],
    layArticle: {
      slug: 'auxiliary-fields',
      contributor: {
        name: 'HQIV project (high-school level starter summaries)',
        url: 'https://disregardfiat.tech',
      },
      contributedAt: '2026-05-28',
      hook: 'Quantum weirdness — particles seeming to be in many places at once until you look — might not require magic, collapsing waves, or the universe constantly splitting. It could be ordinary, local bookkeeping on a hidden extra layer that travels with every light ray.',
      paragraphs: [
        'In ordinary quantum mechanics, the math says a particle can be in many states at the same time, and only when you measure it does the probability "choose" one outcome. Textbooks disagree on what this really means. Some say the wavefunction collapses mysteriously; others say every possibility branches into its own separate universe. Both pictures leave many people uneasy because they seem to break ordinary conservation or require the universe to do something dramatic at every measurement.',
        'This paper starts from the same discrete light-cone shells as the foundational work and shows that a natural extra "pilot" or auxiliary layer appears automatically from the counting. This layer carries the information that ordinary quantum mechanics encodes in the wavefunction. Because the shells fill according to strict integer rules, the famous 3/5 and 2/5 split between the auxiliary part and the part we normally see emerges exactly — no tuning required. When a measurement happens, the books are closed locally through several channels at once (the auxiliary layer, a birefringence channel, and redshift). The probabilities you actually observe match the Born rule perfectly, but the accounting stays local and deterministic.',
        'The Lean 4 proofs confirm that the 3/5 : 2/5 ratio is forced by the lattice combinatorics at every shell, not fitted after the fact. The picture that results is closest to the older "pilot-wave" ideas (sometimes called Bohmian mechanics): there is always a definite reality, but we only see part of the full ledger. Globally branching many-worlds pictures are explicitly ruled out because the auxiliary channel would have nowhere to hide the missing energy and information. The same layer also predicts that light traveling across the universe should show tiny polarization rotations (birefringence) at the largest scales.',
        'The practical payoff is that many quantum calculations that normally require enormous computing power become much simpler in structured situations, because the update rule is sparse and local. Chemists and biologists interested in protein folding or molecular behavior might one day use these shortcuts. The theory also gives a concrete, measurable signature in the cosmic microwave background that future polarization experiments can check.',
        'The work is still early for full many-body simulations of real chemistry, and the exact mapping to every experimental quantum setup needs more detailed translation. It does not yet claim to solve the measurement problem for every possible observer or every possible apparatus — only for the clean cases already studied in the Lean modules. The next milestones are tighter numerical predictions and independent reproduction of the sparse-update simulations by other groups.',
      ],
      takeaway: 'The spooky, many-possibilities nature of quantum mechanics may simply be what it looks like when you can only read one page of a larger, perfectly ordinary set of books the universe is keeping on every light cone.',
      licence: 'CC-BY-4.0',
    },
  },
  {
    id: 'so8-closure',
    title:
      'From Discrete Null-Lattice Growth to so(8): Concrete Realization and Exact Lie Closure',
    shortTitle: 'so(8) closure',
    kind: 'technical-note',
    tier: 0,
    version: 'v2',
    date: '2026-07-12',
    doi: '10.5281/zenodo.21328050',
    zenodoUrl: 'https://zenodo.org/records/21328050',
    hook: 'One combinatorial postulate (3D null-shell growth) forces the carrier 8, Fano incidence, octonions, and 𝔤₂ + Δ → 𝔰𝔬(8) — not an independently postulated octonion factor.',
    spineFocus:
      'Supplies the audited arrival of the octonions on the HQIV Spine: transverse dim 3 → quadratic ledger → (α,γ)=(3/5,2/5) → carrier 8 → Cayley–Dickson 𝕆 → 𝔤₂ ∪ {Δ} = 𝔰𝔬(8).',
    abstract:
      'From one meaningful combinatorial postulate — transverse spatial dimension three together with discrete null-shell growth — quadratic mode counting forces (α,γ)=(3/5,2/5), the orientation carrier 2³=8, seven imaginary directions and Fano incidence, then the octonions 𝕆=CayleyDickson³ ℝ and 𝔤₂ ∪ {Δ} ⇒ 𝔰𝔬(8) as gauge completion, not an independently postulated octonion factor. A closed machine-checked spine takes growth to carrier, Hopf maximality, Cayley–Dickson completion, and genuine so(8) with phase-lift Δ on span{e₁,e₇}. Separately, in the concrete Fano-basis matrix realisation, 𝔤₂ ∪ {Δ} generates the full 28-dimensional algebra, certified by an exact-ℚ certificate and companion-code.zip on the record.',
    leanResolution:
      'Standard Model gauge structure — 𝔤₂ + Δ generating the full 𝔰𝔬(8) algebra on the octonion carrier',
    keyClaims: [
      'Spine primary: transverse dim 3 + discrete growth forces carrier 8, Fano incidence, and octonions (not an independent postulate).',
      '𝔤₂ + Δ generates 𝔰𝔬(8) on the Fano-basis octonion carrier (iterated Lie brackets).',
      'Symbolic proof object over ℚ with rational structure constants; companion-code.zip on Zenodo.',
      'Lean 4 verification: HQIVCleanSpine + HQIVSO8Closure (heavyweight matrix closure).',
      'Construction is realisation-specific: full Lie generation tied to the printed Fano generator list.',
    ],
    artifacts: [
      'companion-code.zip (HQIVCleanSpine, generators, paper bundle)',
      'so8_closure_full_appendix.pdf (symbolic pipeline + generator listings)',
      'closure.pdf (v2 main text)',
      'Lean modules: HQIVCleanSpine, HQIVSO8Closure',
    ],
    pipelineSteps: [0, 1, 5, 6, 7],
    layArticle: {
      slug: 'so8-closure',
      contributor: {
        name: 'HQIV project (high-school level starter summaries)',
        url: 'https://disregardfiat.tech',
      },
      contributedAt: '2026-05-28',
      hook: 'Start with three spatial dimensions and expanding shells of light, keep careful integer books, and the mathematics automatically closes into the complete set of rotations possible in eight dimensions — with a computer proof checking every single step.',
      paragraphs: [
        'Most people have heard of quarks and the strong force, or electrons and electromagnetism. These forces and particles are described by mathematical objects called symmetry groups — basically the allowed ways you can rotate or transform the system without changing the underlying rules. The Standard Model uses several such groups. One of the deepest open questions in physics is why these particular groups, and why they fit together the way they do.',
        'This paper works forward from one simple combinatorial seed: three spatial dimensions with discrete null-shell growth. That counting forces the famous 3/5 and 2/5 split, an eight-channel orientation carrier, seven imaginary directions arranged as on the Fano plane, and only then the octonions via the Cayley–Dickson construction. When a small natural "phase lift" generator is added to the already-known 14-dimensional symmetry of the octonions (called G₂), the Lie brackets generate, step by step, the full 28-dimensional rotation algebra of eight-dimensional space, called so(8).',
        'The construction is not assumed; it is exhibited explicitly using the concrete Fano-plane multiplication table for the octonions, and it is certified by an exact symbolic proof object with rational numbers plus a full Lean 4 verification on the HQIV Spine. The octonions are not put in by hand — they arrive as the forced completion of the three-dimensional growth story.',
        'The payoff is that so(8) with its triality property gives exactly the right bookkeeping slots for color (the strong force), weak isospin, and the three generations of matter in a single unified structure. This is why the earlier foundational paper could claim that the Standard Model embeds inside Spin(8). The closure paper supplies the audited algebraic engine that makes that embedding possible.',
        'What is not yet proven is that no other internal symmetry could complete the same discrete growth story. The paper presents the octonionic route as the natural and certified one given the 3D null-lattice starting point, but full Lie generation remains realisation-specific to the printed Fano generators. The next work in the series uses this so(8) closure as a fixed, trusted foundation rather than re-deriving it each time.',
      ],
      takeaway: 'The rich symmetry that describes quarks, leptons, and all the forces may not have been chosen by accident or by hand — it may be the automatic completion of a much simpler rule about how many new light-path possibilities appear on each successive shell.',
      licence: 'CC-BY-4.0',
    },
  },
  // Tier 1 — Foundation extension (published 2026-05-27 on Zenodo)
  {
    id: '3d-causal-growth',
    title:
      'Three-Dimensional Causal Growth and the Octonionic Gauge Sector: Conditional Forcing and a Uniqueness Conjecture',
    shortTitle: '3D causal growth & gauge',
    kind: 'preprint',
    tier: 1,
    version: 'v1',
    date: '2026-05-27',
    doi: '10.5281/zenodo.20415586',
    zenodoUrl: 'https://zenodo.org/records/20415586',
    hook: 'The dimensional hinge: quadratic null-shell growth (not cubic bulk) plus a shared rapidity bridge conditionally forces the octonionic gauge layer in Lean-checked steps.',
    spineFocus:
      'Makes the minimal postulate explicit: three spatial dimensions with discrete null-shell growth, then conditional forcing toward the octonionic gauge layer.',
    abstract:
      'Mathematical sequel to the so(8) closure paper. Isolates the quadratic-vs-cubic signature of HQIV 3+1 null-lattice causal growth. Packages a machine-checked conditional forcing theorem (shared-manifold rapidity bridge + so(8) witness) and derives the curvature-imprint pair (α,γ)=(3/5,2/5) as the d=3 case of a closed family from unit-split plus minimal spanning-tree overlap. States the uniqueness conjecture for the octonionic gauge sector explicitly. All cited Lean theorems are sorry-free; full audit graph in appendix.',
    leanResolution:
      'why three spatial dimensions — quadratic null-shell growth (not cubic bulk) conditionally forces the octonionic gauge layer',
    keyClaims: [
      'HQIV shell law is quadratic A(m)=4(m+2)(m+1) — null modes on the light cone, not cubic bulk volume of classical causal sets.',
      'Conditional forcing theorem (Lean-certified, zero sorry): shared-manifold rapidity bridge + imported so(8) span witness entails common rapidity, curvature-channel positivity/divergence, and reference normalization.',
      '(α,γ)=(3/5,2/5) derived as the d=3 row of the dimension-indexed family α_d = d/(2d−1), γ_d=(d−1)/(2d−1) from unit split + spanning-tree balance model.',
      'Octonions + Spin(8) are the natural internal completion for a 3D spatial backbone (Hurwitz rigidity + Fano combinatorics); full uniqueness from poset axioms alone remains a stated conjecture.',
    ],
    artifacts: [
      'Lean 4 conditional forcing theorem (SATSharedManifoldSmoothBridge + so(8) witness)',
      'Full module index + clickable audit graph in appendix',
    ],
    pipelineSteps: [0, 1, 2, 3, 4, 5, 6, 7],
    layArticle: {
      slug: '3d-causal-growth',
      contributor: {
        name: 'HQIV project (high-school level starter summaries)',
        url: 'https://disregardfiat.tech',
      },
      contributedAt: '2026-05-28',
      hook: 'Not every way of counting "how much space" you have produces the same physics. Counting only the new light-ray possibilities on the surface of an expanding shell — instead of filling the entire ball — turns out to be the signature of three-dimensional causal growth, and it forces the famous 3/5 to 2/5 split through a simple balance argument.',
      paragraphs: [
        'A classic picture in quantum gravity and causal-set theory is to sprinkle points randomly into spacetime and then ask how the number of points inside a ball grows as the ball gets bigger. In ordinary three-dimensional space that growth is cubic — volume scales with radius cubed. HQIV uses a different counting rule from the very beginning: it only counts the new possible light-ray (null) directions that become available on the surface of each successive shell. That counting law is quadratic, not cubic.',
        'This paper isolates why that difference matters. It proves the elementary combinatorial identities (stars-and-bars counting on the light cone) and packages them as a machine-checked "conditional forcing" theorem in Lean. The theorem says: if you assume a shared geometric bridge that lets different observers compare their rapidity (a kind of speed-through-spacetime dial) and you also assume the already-certified so(8) closure from the previous paper, then a whole package of desirable properties follows automatically — common rapidity, positivity of the curvature channel, and a clean reference normalization.',
        'The 3/5 and 2/5 split itself receives a second, independent explanation here using a minimal spanning-tree model. Imagine the growing shells as a network that must stay connected with as little total "wire" as possible. The balance between the part of the energy budget that imprints curvature (α) and the part that stays as free horizon (γ) is forced by requiring that the tree overlaps itself in a dimension-dependent way. For three spatial dimensions the math gives exactly α = 3/5 and γ = 2/5. A separate Lean theorem then shows that the lattice itself produces the numerator "3" at every shell through a hockey-stick identity, so the 3 and the 5 have different origins but combine into one clean ratio.',
        'The paper is careful about what is actually proved versus what remains conjectural. The conditional forcing theorem and the algebraic family of (α_d, γ_d) ratios are fully rigorous. The stronger claim — that a purely causal partial order with no other inputs must select the octonions and Spin(8) — is stated explicitly as an open conjecture, not as a theorem. That honesty is built into the title.',
        'Because this paper supplies the "dimensional hinge" that justifies working in three spatial dimensions with the octonionic carrier, every later paper in the series can treat 3D causal growth and the 3/5 : 2/5 split as established background rather than re-arguing them. The main open task it leaves is to keep testing whether the uniqueness conjecture can be strengthened or whether other carriers are still logically possible.',
      ],
      takeaway: 'The fact that we live in three large spatial dimensions may not be an arbitrary accident — it may be the only number of dimensions in which a simple, local, light-cone counting rule plus the demand for a connected history automatically produces both the observed curvature-imprint ratio and a rich enough internal symmetry for particles and forces.',
      licence: 'CC-BY-4.0',
    },
  },
  {
    id: 'octonionic-action',
    title:
      'Octonionic Action from the HQIV-LEAN Variational Layer: Derivation, Holonomy Alignment, and a Tiered Uniqueness Thesis',
    shortTitle: 'Octonionic action & holonomy',
    kind: 'preprint',
    tier: 1,
    version: 'v1',
    date: '2026-05-27',
    doi: '10.5281/zenodo.20416085',
    zenodoUrl: 'https://zenodo.org/records/20416085',
    hook: 'The discrete action layer in one place: O–Maxwell Lagrangian, Euler–Lagrange identity, lapse dragging that unifies gauge and gravity sectors, and certified holonomy alignment.',
    spineFocus:
      'Turns the octonionic carrier into an action principle: discrete O-Maxwell differences, shared φ, and lapse dragging bind gauge and gravity to the same spine.',
    abstract:
      'Variational sequel centring the action already present in HQIV-LEAN: discrete octonion-indexed gauge potential A, O–Maxwell Lagrangian, proved Euler–Lagrange identity, gravitational constraint shown equivalent to the HQVM Friedmann identity with G_eff(φ)=φ^{3/5}, “lapse dragging” as the cross-sector φ identification, and holonomy alignment (cyclic Stokes, trivial plaquette holonomy, Wilson bounds). Introduces a tiered uniqueness thesis. Explicit minimal Fin 4 seed realisation with numerical verification and companion scripts.',
    leanResolution:
      'unifying gravity and gauge forces — lapse dragging identifies the same auxiliary φ across O–Maxwell and Friedmann sectors',
    keyClaims: [
      'Discrete O–Maxwell action and Euler–Lagrange identity derived and proved on the Fin8 × Fin4 carrier — matches discrete divergence of field strength minus sources.',
      'Gravitational constraint is exactly the HQVM Friedmann identity once the same auxiliary scalar φ is identified across sectors via “lapse dragging”.',
      'Holonomy alignment: cyclic Stokes identity + trivial plaquette holonomy + two-sided Wilson bounds on the kinetic term, all on the same discrete F data.',
      'Tiered uniqueness thesis: (I) uniqueness inside the stated Lagrangian class, (II) classical Hurwitz + certified G₂ ∪ {Δ} ⇒ so(8), (III) patch-internal interoperability programme.',
    ],
    artifacts: [
      'scripts.zip (SPARC-style first-pass checks + worked numerical example)',
      'Lean 4 variational layer (Action.lean, ModifiedMaxwell.lean, holonomy certificates)',
    ],
    pipelineSteps: [7, 8, 9, 10, 11, 12],
    layArticle: {
      slug: 'octonionic-action',
      contributor: {
        name: 'HQIV project (high-school level starter summaries)',
        url: 'https://disregardfiat.tech',
      },
      contributedAt: '2026-05-28',
      hook: 'The same auxiliary "dimmer switch" field that controls gravity also appears in the electromagnetic-like forces, and the universe keeps their books balanced through a mechanism called lapse dragging — all on one discrete, octonion-indexed grid.',
      paragraphs: [
        'In ordinary physics, gravity is described by one set of equations (Einstein\'s) while electricity, magnetism, and the nuclear forces are described by gauge theories with their own fields and potentials. It is a long-standing dream to find a single underlying layer from which both emerge. This paper shows how that works inside the HQIV discrete framework.',
        'On the eight-channel octonion carrier, you can define a discrete gauge potential — basically eight little arrows at every point on a tiny 4-direction spacetime patch. The "field strength" is simply the difference between neighboring arrows, exactly the way ordinary electromagnetism defines the electric and magnetic fields from the vector potential, except now it happens in eight parallel channels at once. From that difference you build a kinetic term (the O-Maxwell Lagrangian) whose Euler-Lagrange equation is the discrete version of "the divergence of the field equals the sources."',
        'When the same auxiliary scalar field φ that appeared in the gravitational sector is identified with the lapse (the local rate at which proper time advances), a cross-sector link called lapse dragging appears. The gravitational constraint equation that comes out of varying the total action is numerically identical to the Friedmann equation of cosmology once you use the effective gravitational strength G_eff(φ) = φ^{3/5}. In other words, the dimmer switch that slows down or speeds up the flow of time is the same knob that appears in both gravity and the gauge forces.',
        'The paper also proves holonomy statements: around any tiny closed loop on the discrete grid, the total twist (Wilson loop) satisfies strict bounds, and a cyclic Stokes identity holds. These are the discrete analogs of the familiar integral theorems of vector calculus. They are not assumed; they follow from the same finite-difference definition of field strength used everywhere else. Companion Python scripts let anyone reproduce the numerical checks on a laptop.',
        'What is still developing is the full dictionary between this discrete action and the everyday continuum calculations that particle physicists perform. The tiered uniqueness thesis in the paper says there is a proved uniqueness result inside the class of actions considered here, a second level that rests on the already-certified so(8) closure, and a third, more open level about how different patches must be glued together consistently. Later papers in the series (especially the fluid-chart and applied-phenomenology work) build directly on this action foundation.',
      ],
      takeaway: 'Gravity and the other forces do not have to be glued together after the fact; once you let the same auxiliary bookkeeping field control both the curvature of space and the strength of the gauge fields, and you enforce local energy accounting, the two sectors talk to each other automatically through how fast time is allowed to advance in each patch.',
      licence: 'CC-BY-4.0',
    },
  },
  {
    id: 'finite-mode-kirchhoff',
    title:
      "Kirchhoff's Law of Thermal Emission with Built-in UV/IR Cutoffs from HQIV's Discrete Null Lattice",
    shortTitle: 'Finite-mode Kirchhoff radiation',
    kind: 'preprint',
    tier: 1,
    version: 'v1',
    date: '2026-05-27',
    doi: '10.5281/zenodo.20416564',
    zenodoUrl: 'https://zenodo.org/records/20416564',
    hook: 'Blackbody spectrum as a finite sum with built-in Planck-pole UV cutoff and lock-in IR cutoff — no hand-imposed regularisation, no UV catastrophe.',
    spineFocus:
      'Applies the growth spine to radiation: finite null-shell mode counts replace continuum mode density and make the UV/IR cutoffs structural.',
    abstract:
      'Third paper in the Tier-1 foundation-extension quartet. Derives Kirchhoff’s law directly from the discrete null lattice (mode count N(m)=(m+2)(m+1) from stars-and-bars) plus informational monogamy fixing α=3/5. The spectrum is an explicit finite sum between m=0 (Planck pole) and the lock-in reference shell. Recovers radiation-era H ∝ T² from the propagation-shell identification. Quantitative prediction: 0.379° isotropic cosmic birefringence at the present epoch using wall-clock age (agrees with Planck PR4 EB within −0.40σ). All core theorems machine-checked in Lean 4.',
    leanResolution:
      'the ultraviolet catastrophe — finite blackbody mode sums with built-in Planck-pole UV and lock-in IR cutoffs',
    keyClaims: [
      'Mode count per shell is finite by construction: N(m)=(m+2)(m+1), cumulative given by the hockey-stick identity — UV catastrophe never appears.',
      'Blackbody energy density is a finite sum between explicit UV cutoff (m=0 Planck pole) and IR cutoff at the lock-in reference shell; no renormalisation required.',
      'Radiation-era Friedmann scaling H ∝ T² emerges from the quadratic shell law under propagation-shell identification — not imported.',
      'Using the wall-clock age (51.2 Gyr) the model predicts 0.379° CMB birefringence, within −0.40σ of Planck PR4; using apparent age (13.8 Gyr) yields 0.103° (−2.55σ) — an internal discriminator.',
    ],
    artifacts: [
      'scripts.zip (numerical blackbody + birefringence reproduction)',
      'Lean 4 finite-sum identities and absence-of-divergence certificates (HorizonBlackbodySpectrum.lean)',
    ],
    pipelineSteps: [8, 9, 11],
    layArticle: {
      slug: 'finite-mode-kirchhoff',
      contributor: {
        name: 'HQIV project (high-school level starter summaries)',
        url: 'https://disregardfiat.tech',
      },
      contributedAt: '2026-05-28',
      hook: 'The warm glow from any hot object (blackbody radiation) does not need a special mathematical fix to avoid producing infinite energy at high frequencies. If the possible light modes are counted on a discrete grid of shells with a natural smallest size, the famous ultraviolet catastrophe simply never occurs — and you even get a concrete prediction for a tiny twist in the cosmic microwave background.',
      paragraphs: [
        'Every physics student learns about the ultraviolet catastrophe: classical wave theory predicted that a hot object should radiate infinite energy at very short wavelengths, which is obviously wrong. Planck fixed it by introducing energy quanta "by hand." This paper shows that the same fix appears automatically once light modes are counted the HQIV way — on a discrete null lattice with a smallest possible cell size.',
        'On each expanding shell labeled by an integer m, the number of independent ways light can point is exactly N(m) = (m+2)(m+1). This is a finite number that grows quadratically. The energy per mode at temperature T is the usual Bose factor, but now the total energy density is a plain finite sum from the ultraviolet cutoff (the Planck pole at m = 0) out to whatever infrared cutoff corresponds to the "lock-in" shell that sets the scale for the present epoch. There are no infinities, no integrals that blow up, and no renormalization required.',
        'Because the quadratic growth law is the same one that produces the radiation-dominated era in cosmology, the familiar H ∝ T² scaling of the early universe drops out of the counting with no extra assumptions. The paper also works out a quantitative signature: the same 3/5 imprint that appears everywhere else produces a small net rotation of the polarization of light that has traveled across the observable universe. Using the wall-clock age of 51.2 billion years, the predicted rotation is 0.379 degrees — which agrees with the latest Planck satellite polarization data within 0.4 sigma. If you instead plug in the apparent age of 13.8 billion years that we actually observe, the prediction drops to 0.103 degrees, which is a 2.55-sigma mismatch. That difference is a built-in test the theory offers to future, more precise measurements.',
        'All the core identities (the finite mode count, the closed-form cumulative sum via the hockey-stick identity, and the absence of any ultraviolet divergence) are machine-checked in Lean 4 with zero "sorry" placeholders. Supplementary Python scripts let anyone reproduce the numerical blackbody curves and the birefringence prediction on their own computer.',
        'The main limitation is that this is still a clean, single-temperature, isotropic calculation. Real astrophysical sources have temperature gradients, magnetic fields, and bulk motion. Turning the discrete lattice into a practical tool for modeling actual stars, accretion disks, or the detailed spectrum of the cosmic microwave background will require more work on how to patch many local charts together. The birefringence number is the cleanest near-term test.',
      ],
      takeaway: 'A hot object glows the way it does, with a finite amount of energy at every wavelength, because the possible light waves are standing on a discrete ladder of shells that has a bottom rung; the same ladder that prevents infinities in the lab also writes a small but measurable twist into the oldest light in the sky.',
      licence: 'CC-BY-4.0',
    },
  },
  {
    id: 'thermodynamics-arrow',
    title:
      'Thermodynamics and the Arrow of Time from the HQIV Temperature Ladder: Finite Blackbody Entropy, Causal Monogamy, and Machine-Checked Dissipation Signs',
    shortTitle: 'Thermodynamics & arrow of time',
    kind: 'preprint',
    tier: 1,
    version: 'v1',
    date: '2026-05-31',
    doi: '10.5281/zenodo.20478826',
    zenodoUrl: 'https://zenodo.org/records/20478826',
    hook: 'The four laws of thermodynamics and the arrow of time emerge from the shell temperature ladder T(m)=1/(m+1) — not postulated — with finite blackbody entropy and machine-checked dissipation signs.',
    spineFocus:
      'Reads thermodynamics from the same outward growth index: shell cooling, acyclicity, and finite entropy production give the arrow of time.',
    abstract:
      'Fourth paper in the Tier-1 foundation-extension quartet. On the discrete shell temperature ladder T(m)=1/(m+1), Lean certifies the zeroth through third laws, finite-shell photon density and entropy density s=(4/3)U/T without a continuum ω/T→∞ limit, and Stefan–Boltzmann T⁴ scaling once enough shells are occupied. The macroscopic arrow of time is derived as the conjunction of causal acyclicity, nonnegative discrete entropy production, monotonic outward shell indexing, and a machine-checked Lyapunov descent toward the S³ null reference. A new section derives (α,γ)=(3/5,2/5) directly from the octonionic null-lattice mode budget.',
    leanResolution:
      'the arrow of time — derived from causal acyclicity, nonnegative entropy production, and shell-cooling monotonicity',
    keyClaims: [
      'Zeroth through third laws machine-checked on the ladder T(m)=1/(m+1); finite blackbody entropy without continuum limit.',
      'Stefan–Boltzmann T⁴ scaling recovered from finite-shell occupation table — not imported.',
      'Arrow of time derived (not postulated): acyclic ≺ + nonnegative entropy production + monotonic shell cooling + Lyapunov deficit descent to the S³ reference.',
      '(α,γ)=(3/5,2/5) re-derived as outputs of the discrete null-lattice axioms in a self-contained section.',
    ],
    artifacts: [
      'scripts.zip (ladder values, C3 dissipation sign, Euler monotonicity, finite-vs-large-cutoff blackbody table)',
      'Lean 4 thermodynamic arrow certificate (HQIVParallelPoincare build target)',
    ],
    pipelineSteps: [0, 1, 2, 3, 4, 8, 9, 11, 12],
    layArticle: {
      slug: 'thermodynamics-arrow',
      contributor: {
        name: 'HQIV project (high-school level starter summaries)',
        url: 'https://disregardfiat.tech',
      },
      contributedAt: '2026-05-31',
      hook: 'Why does time only run forward? In HQIV the answer is not a mystery postulate — it falls out of four ordinary rules already built into the discrete light-cone bookkeeping: no closed causal loops, entropy never decreases on finite patches, outer shells are always cooler, and under-filled early shells relax toward balance.',
      paragraphs: [
        'Thermodynamics is usually taught as four laws plus an extra assumption that "entropy increases" because that is what we observe. This paper shows that on HQIV\'s discrete temperature ladder — where shell m has temperature T(m) = 1/(m+1) — all four laws and the arrow of time are theorems, not axioms.',
        'On each finite shell the photon count, radiation pressure P = U/3, and entropy density s = (4/3)U/T are defined without ever taking the dangerous continuum limit where the number of modes goes to infinity. When you add up enough shells, the familiar Stefan–Boltzmann T⁴ law appears anyway, but only after the finite bookkeeping is done honestly.',
        'The direction of time comes from four structures that were already in the programme: the causal partial order cannot loop back on itself; entropy production on any finite heat patch is nonnegative; moving outward on the null lattice means moving to lower temperature; and any horizon that starts with too few occupied early shells must relax via a machine-checked Lyapunov descent until it reaches the S³ null reference. Together these force a macroscopic arrow without importing one by hand.',
        'The paper also re-derives the famous 3/5 and 2/5 split between curvature imprint and monogamy overlap directly from the octonionic null-lattice mode budget, reinforcing that those numbers are outputs of the discrete axioms rather than fitted inputs.',
        'What remains open is the full continuum dictionary for complicated astrophysical environments with gradients, bulk motion, and magnetic fields. The finite-patch theorems are rigorous; translating them patch-by-patch into everyday engineering thermodynamics is ongoing work.',
      ],
      takeaway: 'The arrow of time may be nothing more than what happens when information on a discrete, acyclic light-cone lattice is forbidden from double-counting itself and must always settle its early-shell deficits before moving on.',
      licence: 'CC-BY-4.0',
    },
  },
  {
    id: 'tuft-sm-lagrangian',
    title:
      'Dynamic Fermion Mass Spectrum and Standard Model Lagrangian from the HQIV Discrete Octonion Action: Nielsen TUFT Hopf Shells and Inner–Outer Casimir Realization',
    shortTitle: 'SM Lagrangian & mass spectrum',
    kind: 'preprint',
    tier: 2,
    version: 'v2',
    date: '2026-06-08',
    doi: '10.5281/zenodo.20601215',
    zenodoUrl: 'https://zenodo.org/records/20601215',
    hook: 'From two discrete axioms plus octonion tables, Lean certifies a sector-by-sector bridge to the Standard Model Lagrangian — masses and Yukawa weights from the inner–outer Casimir chart κ₆(ξ,Φ,t), proton lock-in fixing the dimensionful chart.',
    spineFocus:
      'Uses the fixed octonion action and lock-in shell to read the Standard Model chart, with the proton anchor setting scale after the dimensionless spine is fixed.',
    abstract:
      'Opening Tier-2 combined foundation. From light-cone combinatorics + informational monogamy and concrete octonion tables, Lean certifies (zero sorry) a sector-by-sector bridge S_HQIV ⇒ L_SM in which masses and Yukawa weights follow the inner–outer Casimir chart κ₆(ξ,Φ,t)=η_local(ξ)·γ·C₂(ξ,Φ,t). At the reference lock-in slice ξ_lock=5, charged leptons, electroweak bosons, neutrinos, and selected hadrons match PDG centrals to ~0.2%, ~0.4%, Σm_ν≈6.6×10⁻³ eV (~5% of the cosmological cap), and ~1% respectively — PDG values are comparison layers only. A single local proton measurement m_p=938.272 MeV fixes the dimensionful chart and downstream cosmological outputs (apparent age ≈13.8 Gyr, wall-clock age ≈51.2 Gyr, T_CMB≈2.7255 K) without simultaneous fits.',
    leanResolution:
      'the Standard Model Lagrangian — sector-by-sector bridge from discrete octonion action with masses from the κ₆ Casimir chart',
    keyClaims: [
      'S_HQIV ⇒ L_SM bridge certified sector-by-sector in Lean; κ₆ factorisation with C₂=56/45 at lock-in and five sector equalities.',
      'Charged leptons, W/Z, neutrinos, and selected hadrons match PDG centrals at the lock-in slice to ~0.2–1% — no per-flavour fitting.',
      'Proton lock-in scale witness: one local m_p measurement fixes the entire dimensionful chart and cosmological readouts.',
      'Hopf-shell / Nielsen TUFT alignment packaged with explicit chart distinctions; anomaly cancellation (AnomalyCancellation) and holonomy discharge (TuftSynthesisZetaHolonomyDischarge) certified in Lean.',
    ],
    artifacts: [
      'scripts.zip (sector mass charts, lock-in witness reproduction)',
      'Lean 4 mass-spectrum and Lagrangian-bridge modules (paper_tuft_sm_lagrangian target)',
    ],
    pipelineSteps: [5, 6, 7, 8, 9, 10, 11, 12],
    layArticle: {
      slug: 'tuft-sm-lagrangian',
      contributor: {
        name: 'HQIV project (high-school level starter summaries)',
        url: 'https://disregardfiat.tech',
      },
      contributedAt: '2026-06-02',
      hook: 'The masses of electrons, muons, W and Z bosons, neutrinos, and even some hadrons can be read off a single discrete bookkeeping chart — once you fix one anchor (the proton mass), the rest of the Standard Model Lagrangian follows with no per-particle tuning.',
      paragraphs: [
        'Particle physics usually treats the masses and coupling strengths of the Standard Model as measured inputs — dozens of numbers you look up in a table. This paper is the first HQIV release that tries to derive the whole Lagrangian sector-by-sector from the discrete octonion action already built in earlier work.',
        'The key object is an inner–outer Casimir chart κ₆ that depends on a continuous shell coordinate ξ and a few auxiliary angles. At the special lock-in slice ξ = 5 (with the auxiliary angles set to zero), the chart produces numerical masses that land within about 0.2% for charged leptons, 0.4% for the W and Z bosons, roughly 5% for the sum of neutrino masses, and about 1% for selected hadrons — compared against PDG reference values used only as a sanity check, not as fit targets.',
        'Crucially, only one dimensionful measurement is needed locally: the proton mass at 938.272 MeV. That single anchor fixes the entire MeV scale and propagates outward to cosmological numbers the programme already discussed — an apparent age near 13.8 billion years, a wall-clock age near 51.2 billion years, and a CMB temperature near 2.7255 K — without simultaneously fitting any of those observables.',
        'The paper also documents how Nielsen\'s TUFT Hopf-shell picture aligns with HQIV\'s discrete carrier: nested fibrations supply the gauge sectors, fibre windings supply three generations, and Beltrami spectra on S³ connect to HQIV\'s existing spectral data — but the two frameworks are not silently identified; the chart distinctions are explicit.',
        'What remains open is mainly the tier-III cross-patch dictionary, measure normalization on rotated charts (NonAbelianHolonomyMeasureScaffold), and subleading zeta polish on every sector. Anomaly cancellation and holonomy discharge are already in the Lean spine; extending to every hadron and every astrophysical environment is queued fit-out.',
      ],
      takeaway: 'If a single proton mass measurement really does pin the entire dimensionful chart, the Standard Model may be less a menu of arbitrary constants and more a forced readout of the same discrete octonion ledger that already fixed α = 3/5.',
      licence: 'CC-BY-4.0',
    },
  },
  {
    id: 'baryogenesis-lockin',
    title:
      'Curvature-Ratio Lock-In for Baryon Asymmetry: Demonstrated on the HQIV Discrete Spine (Lean Formalisation)',
    shortTitle: 'Baryogenesis lock-in',
    kind: 'preprint',
    tier: 2,
    version: 'v1',
    date: '2026-06-16',
    doi: '10.5281/zenodo.20711255',
    zenodoUrl: 'https://zenodo.org/records/20711255',
    hook: 'Baryon asymmetry as a theorem-level readout of the same lock-in calibration and horizon-ratio monotonicity used for hadrons and BBN.',
    spineFocus:
      'Places baryogenesis on the HQIV spine: monotone horizon ratios at lock-in generate η readouts using the same normalization as hadrons and BBN.',
    abstract:
      'Tier-2 capability demonstration on the shared discrete curvature-ratio spine. At lock-in shell m=4, horizon ratios Ω_k(n;N)=I(n)/I(N) are proved monotone with Ω_k(M;M)=1, and the baryon readout η(n;N) shares that normalisation; a single quarantined anchor η_paper supplies the comparison-layer scale. Primary artefacts are the Lean formalisation and Python reproduction bundle.',
    leanResolution:
      'baryon asymmetry — monotone η(n;N) readout at lock-in shell m=4 from horizon-ratio bookkeeping',
    keyClaims: [
      'Horizon ratios Ω_k(n;N) proved monotone at lock-in with Ω_k(M;M)=1 (Lean-certified).',
      'Baryon readout η(n;N) shares the same normalisation as hadron and BBN witnesses on the spine.',
      'Single quarantined anchor η_paper for comparison layer only — not a fit target inside the formal readout.',
      'Same lock-in calibration, monotonicity, and triality scaffolds as nucleon binding and BBN downstream.',
    ],
    artifacts: [
      'Lean 4 baryogenesis lock-in modules',
      'scripts.zip (horizon-ratio and η witness reproduction)',
    ],
    pipelineSteps: [4, 8, 9, 11, 12],
    layArticle: null,
  },
  {
    id: 'nucleon-binding',
    title:
      'Binding Energy and the Weak Force from HQIV Composite-Trace Weights: Lock-In Masses, Three Ledgers, and Zero-Knob Half-Lives',
    shortTitle: 'Nucleon binding & β decay',
    kind: 'preprint',
    tier: 2,
    version: 'v1',
    date: '2026-06-16',
    doi: '10.5281/zenodo.20711453',
    zenodoUrl: 'https://zenodo.org/records/20711453',
    hook: 'Local-curvature slot equations B_curv(ξ), three β ledgers, and composite-trace binding — from nucleons through condensed matter.',
    spineFocus:
      'Reads nucleon mass and β decay from octonion-network composite traces while preserving the three separate ledgers imposed by the spine.',
    abstract:
      'Establishes the local-curvature slot equations witnessed from nucleon binding through bulk condensed matter. At lock-in shell referenceM=4, proton and neutron masses are constituent energies minus a shared 8×8 composite-trace binding on the 𝔰𝔬(8) network. Three strictly separate β ledgers (strong overlap, kinematic Q, weak width) yield free-neutron width to ≲0.01% without half-life fit parameters; integrated τ_n≈880 s at 300 K.',
    leanResolution:
      'nucleon masses and β-decay — three-ledger composite-trace weights with zero-knob weak widths',
    keyClaims: [
      'Proton and neutron masses from constituent energies minus shared composite-trace E_bind on the 𝔰𝔬(8) network.',
      'Three β ledgers strictly separated: strong overlap, kinematic Q, and weak width from Fermi coupling.',
      'Free-neutron weak width matches reference to ≲0.01% in phase space — no half-life fit parameters.',
      'Light-isotope masses agree at mean 0.003% on the A≤4 panel; same B_curv(ξ) stack as BBN integrator.',
    ],
    artifacts: [
      'scripts.zip (nucleon mass charts, β tipping, binding network reproduction)',
      'Lean 4 nucleon-binding and three-ledger modules (paper_nucleon_binding target)',
    ],
    pipelineSteps: [5, 6, 7, 8, 9, 10, 11, 12],
    layArticle: null,
  },
  {
    id: 'bbn',
    title:
      'Big-Bang Nucleosynthesis from HQIV Network Weights: Lock-In η, Epoch Ladder, and Integrated Witnesses in the Lean Library',
    shortTitle: 'BBN light elements',
    kind: 'preprint',
    tier: 2,
    version: 'v1',
    date: '2026-06-16',
    doi: '10.5281/zenodo.20723606',
    zenodoUrl: 'https://zenodo.org/records/20723606',
    hook: 'Primordial Y_p, D/H, ³He/H, and ⁷Li/H from an 8×8 network readout when lock-in η and nucleon masses are fixed upstream.',
    spineFocus:
      'Shows downstream closure: once η, nucleon masses, and binding weights are fixed upstream, BBN abundances are read from the same 8×8 network.',
    abstract:
      'States what the BBN Lean stack proves about primordial light-element readouts when lock-in η, nucleon masses, and composite-trace binding weights are already fixed upstream. At lock-in the library defines an 8×8 network readout for Y_p, D/H, ³He/H, and ⁷Li/H; an integrated witness certifies Y_p in the observed band. Python reproduction at η_paper yields Y_p≈0.244, D/H≈2.51×10⁻⁵, ³He/H≈1.01×10⁻⁵, and ⁷Li/H≈2.54×10⁻¹⁰.',
    leanResolution:
      'primordial abundances — Y_p, D/H, ³He/H, and ⁷Li/H from network weights at lock-in η',
    keyClaims: [
      '8×8 network readout for Y_p, D/H, ³He/H, and ⁷Li/H from valley counts and cluster binding Q values.',
      'BBN epoch placed on the temperature shell ladder between QCD lock-in and the CMB today.',
      'Integrated Y_p witness certified in the observed band; umbrella bbn_full_vital_readout in Lean.',
      'η imported from baryogenesis witness layer — not refit in this note; Coc semi-analytic fits are comparison-only.',
    ],
    artifacts: [
      'scripts.zip (BBN integrator, epoch ladder, abundance reproduction)',
      'Lean 4 BBN vital readout and stoichiometric integrator modules',
    ],
    pipelineSteps: [8, 9, 11, 12],
    layArticle: null,
  },
  {
    id: 'gluon-curvature',
    title:
      'The Gluon as Curvature Artifact: Strong Binding from Inner–Outer Casimir Trapping on the Octonion Carrier',
    shortTitle: 'Gluon as curvature artifact',
    kind: 'technical-note',
    tier: 2,
    version: 'v1',
    date: '2026-06-17',
    doi: '10.5281/zenodo.20724572',
    zenodoUrl: 'https://zenodo.org/records/20724572',
    hook: 'Continuum “gluons” and “QCD binding” are reader translations of trapped Casimir on strong octonion channels — not independent vector fields.',
    spineFocus:
      'Clarifies the strong-sector readout: confinement is trapped Casimir on the octonion carrier, with continuum gluons only a comparison translation.',
    abstract:
      'Tier-2 closure note establishing that continuum gluons and QCD binding are reader translations of inner–outer Casimir trapping on the strong octonion channels, not independent vector fields in the proved discrete action. Hadronic and nuclear binding is discharged upstream by composite-trace weights; pion exchange and other meson mediators are not required in the proved library. Binding uses one network sum with trapped-Casimir factorisation of latticeSimplexCount·α_eff.',
    leanResolution:
      'strong force confinement — binding as trapped Casimir on octonion channels, not independent gluon fields',
    keyClaims: [
      'Strong kinetic term is abelian octonion kinetic density restricted to channels {4,5,6,7}.',
      'Uniform network binding E_bind(m) with trapped-Casimir factorisation of coupling cells (Lean-certified).',
      'Pion exchange and meson mediators not required in the proved library beyond masked abelian kinetic + trapped Casimir.',
      'Shared inner–outer Casimir primitive drives heavy lepton gap and strong-sector trapping on one geometric object.',
    ],
    artifacts: [
      'scripts.zip (trapped-Casimir and strong-kinetic witness reproduction)',
      'Lean 4 gluon-curvature closure modules (paper_gluon_curvature target)',
    ],
    pipelineSteps: [5, 6, 7, 8, 9],
    layArticle: null,
  },
  {
    id: 'hep-decay-readout',
    title:
      'Heavy-Flavour Branching Ratios Derived from Discrete Three-Ledger Rules on the HQIV Null-Lattice Carrier',
    shortTitle: 'HEP decay readout',
    kind: 'preprint',
    tier: 2,
    version: 'v1',
    date: '2026-06-21',
    doi: '10.5281/zenodo.20780430',
    zenodoUrl: 'https://zenodo.org/records/20780430',
    hook: '567 open-channel heavy-flavour readouts from γ-rational CKM/OZI ledger weights — PDG enters only in a quarantined comparison layer.',
    spineFocus:
      'Extends the three-ledger spine to heavy flavour: channel weights, contacts, and phase space are generated before comparison data enters quarantine.',
    abstract:
      'Heavy-flavour branching ratios read out from discrete combinatorial rules on the fixed three-ledger null-lattice spine, using only γ=2/5, γ-rational CKM/OZI weights, spine-discharge contacts, phase space, and normalization. Laboratory masses and PDG branching fractions enter exclusively in a quarantined comparison layer. Programmatic channel generation produces 567 open-channel readouts with zero structural failures on the 81-witness suite; curated panel of 17 channels lies within 3σ (mean 0.22σ).',
    leanResolution:
      'heavy-flavour decays — 567 channel readouts from γ-rational three-ledger rules (81/81 structural witnesses)',
    keyClaims: [
      'f_EM=37/10 for hidden-quarkonium EM contact derived as theorem of monogamy bookkeeping on the fixed carrier.',
      '567 open-channel readouts with zero structural failures on the 81-witness suite.',
      'Curated 17-channel panel within 3σ (mean 0.22σ, max 0.86σ) after Monte Carlo witness propagation.',
      'Extends three-ledger β tipping from nucleon binding to open and hidden heavy flavour — PDG quarantined.',
    ],
    artifacts: [
      'scripts.zip (multichannel readout pipeline, 81-witness suite)',
      'Lean 4 HEP decay readout modules (paper_hep_decay_readout target)',
    ],
    pipelineSteps: [5, 6, 7, 8, 9, 10],
    layArticle: null,
  },
  {
    id: 'lightcone-chemistry',
    title:
      'Discrete Electronic Structure from the HQIV Light Cone: Condensed Packing, Bands, SCF/Fock/KS, and Core Spectroscopy without Fitted XC',
    shortTitle: 'Light-cone chemistry extent',
    kind: 'preprint',
    tier: 2,
    version: 'v1',
    date: '2026-07-10',
    doi: '10.5281/zenodo.21286980',
    zenodoUrl: 'https://zenodo.org/records/21286980',
    hook: 'Discrete electronic structure from the light cone: packing, bands, SCF/Fock/KS, and core XPS without fitted XC — Lean lemmas plus Python witnesses.',
    spineFocus:
      'Extends the null-lattice spine into chemistry: spectroscopy, condensed packing, bands, and discrete SCF on the same carrier, with NIST/CRC/HITRAN in comparison quarantine only.',
    abstract:
      'Tier-2 chemistry extent. From the discrete light cone the stack proves electron counting, octet capacity, VSEPR contact geometry, bond-order bookkeeping, hydrogenic line spectra, stoichiometry and Hess-law thermochemistry, finite-site energy traces, phase-geometry density, and discrete transport slots. A second-order binding architecture records spectral-gap, selection-weight, outside-contact, and voltage-generation ledgers. Condensed packing splits Lindemann lattice density from optical number density; on a fourteen-species panel mean density comparison error is ≈0.37%. The discrete electronic stack includes activation/KIE, multi-orbital bands, SCF, Fock, local-XC Kohn–Sham, EH AO integrals, and core XPS — a first-principles alternative to fitted XC for closed-shell solids and molecular ices. Laboratory data stay quarantined outside the derivation path.',
    leanResolution:
      'fitted exchange–correlation functionals — discrete SCF/Fock/KS and core XPS from light-cone slots without XC fitting',
    keyClaims: [
      'Electron counting, octet capacity, VSEPR geometry, bond orders, and hydrogenic spectra from discrete light-cone slots.',
      'Second-order binding architecture: spectral gap, selection weights, n-body envelope, five-channel outside-contact G_eff, six-route voltage ledger.',
      'Fourteen-species condensed packing panel at ≈0.37% mean density comparison error; gas-phase constants never used as solid inputs.',
      'SCF, Fock, local-XC Kohn–Sham, AO integrals, and core XPS without fitted XC — continuum GTO/STO optional comparison only.',
      'Arena chemistry panels (spectroscopy, crystals, condensed phase) seeded from the same witness payloads.',
    ],
    artifacts: [
      'scripts.zip (spectroscopy, packing, bands, SCF/XPS witness reproduction)',
      'Lean 4 chemistry-extent lemmas (zero sorry on load-bearing modules)',
      'data/hqiv_lab_witnesses.json condensed-panel comparisons',
    ],
    pipelineSteps: [5, 6, 7, 8, 9, 10, 11],
    layArticle: null,
  },
]

export const leanResolutionSlides: LeanResolutionSlide[] = papers.map((p) => ({
  paperId: p.id,
  paperShortTitle: p.shortTitle,
  resolution: p.leanResolution,
  doi: p.doi,
}))

/**
 * Example lay article used as the contribution template on the
 * Technical Tour. Renders as a "preview" so a writer can see
 * structure, tone and length before opening a PR.
 */
export const exampleLayArticle: LayArticle = {
  slug: 'example',
  contributor: {
    name: 'Your name here',
    orcid: '0000-0000-0000-0000',
    url: 'https://example.org/your-page',
  },
  contributedAt: 'YYYY-MM-DD',
  hook: 'One-line teaser that survives being read out loud at a dinner party.',
  paragraphs: [
    'Paragraph 1 — the puzzle. Open with the everyday question or problem the paper is responding to. No equations yet; ground the reader.',
    'Paragraph 2 — the key idea. State, in plain language, the single thing the paper actually does. If you cannot do this in two sentences, you have not understood the paper yet — keep reading the abstract.',
    'Paragraph 3 — why it is non-trivial. What would a sceptical physicist worry about? Address it honestly. Mention the formal-verification scaffold (Lean modules, certificates) by name so the reader knows where to audit.',
    'Paragraph 4 — what it predicts or rules out. Concrete consequences. Distinguish proven results from numerical/conjectural ones (the curation policy requires this).',
    'Paragraph 5 — limits and open questions. What the paper does not claim. Where the next move is.',
  ],
  takeaway:
    'A single sentence the reader can repeat to a friend a week later. The takeaway is the hardest part to write; spend the most time here.',
  licence: 'CC-BY-4.0',
}

export function findPaperByPipelineStep(step: number): Paper[] {
  return papers.filter((p) => p.pipelineSteps.includes(step))
}
