/**
 * Equation Atlas data model
 *
 * Every entry represents a famous foundational equation (or family)
 * that is currently treated as phenomenological / axiomatic / fitted
 * in mainstream physics, together with the HQIV derivation that
 * yields it (or a close, corrected version) from the discrete null-lattice
 * + horizon monogamy + α=3/5 imprint + octonionic carrier.
 *
 * The `steps` array is designed for rich progressive algebraic presentation:
 * - progressive reveal
 * - color-coded lock-in moments (α=3/5, lattice counting, unit split, etc.)
 * - side-by-side standard vs HQIV forms
 * - explanatory prose that can be rendered next to KaTeX
 *
 * This file is the single source of truth. The UI component should
 * consume these objects directly.
 */

export type PhysicsDomain =
  | 'GR'
  | 'EM'
  | 'SM'
  | 'Thermo'
  | 'Gauge'
  | 'Quantum';

export interface DerivationStep {
  /** Stable id for anchoring / deep linking */
  id: string;
  /** Short label shown in the step header */
  label: string;
  /** The central algebraic expression for this step (raw TeX) */
  teX: string;
  /** Explanatory prose (1-3 sentences). Rendered alongside the math. */
  prose: string;
  /** When true, the step is a "lock-in" moment — the UI should emphasize it */
  lockIn?: boolean;
  /** Optional CSS class hint for the renderer (e.g. 'emerald-glow') */
  highlightClass?: string;
}

export interface Equation {
  id: string;
  /** Short, human title */
  title: string;
  /** Domains for filtering */
  domains: PhysicsDomain[];
  /** The standard observed/phenomenological form (raw TeX) */
  standardTeX: string;
  /** One-line hook: why this is currently "unconnected" or fitted */
  standardHook: string;
  /** The HQIV-derived form (raw TeX) */
  hqivYieldTeX: string;
  /** One-line hook for the HQIV side */
  hqivHook: string;
  /** Rich, ordered derivation steps for the visual derivation panel */
  steps: DerivationStep[];
  /** References back to the source papers / Lean */
  references: {
    paper?: string; // folder or short title in papers/
    zenodo?: string; // concept DOI or record URL
    lean?: string; // module path
    note?: string;
  };
  /** Optional: which pipeline step in the old 13-step tour this most relates to */
  relatedOldStep?: number;
}

export const equations: Equation[] = [
  {
    id: 'kirchhoff-finite-mode',
    title: "Kirchhoff's law of thermal emission (finite-mode Planck spectrum)",
    domains: ['Thermo'],
    standardTeX: String.raw`u(\nu,T) = \frac{8\pi h\nu^3}{c^3}\frac{1}{e^{h\nu/kT}-1} \qquad \text{(Rayleigh–Jeans + Bose factor)}`,
    standardHook: 'Mode density assumed continuous and unbounded; UV catastrophe cured by hand via occupation suppression.',
    hqivYieldTeX: String.raw`u(T;m_{\rm UV},m_{\rm IR}) = \sum_{m=m_{\rm UV}}^{m_{\rm IR}} \mathcal{N}(m)\,\omega_m\,n_B(\omega_m,T), \quad \mathcal{N}(m)=(m+2)(m+1)`,
    hqivHook: 'Finite by construction. UV cutoff at Planck pole (m=0), IR cutoff at lock-in shell. No regularisation.',
    steps: [
      {
        id: 'k1',
        label: 'Discrete null-lattice mode count',
        teX: String.raw`\mathcal{N}(m) = (m+2)(m+1) \qquad (x+y+z=m,\ x,y,z\ge0)`,
        prose: 'Stars-and-bars on the light-cone null directions gives exactly two new Planck cells per integer solution at depth m. This replaces the classical continuous 4\pi\nu^2 d\nu / c^3 mode density.',
        lockIn: true,
        highlightClass: 'emerald',
      },
      {
        id: 'k2',
        label: 'Hockey-stick cumulative',
        teX: String.raw`\sum_{m=0}^{n}\mathcal{N}(m) = \frac13(n+1)(n+2)(n+3)`,
        prose: 'The partial sum is closed-form (Lean: cumLatticeSimplexCount_hockey_stick). Every finite interval [m_UV, m_IR] therefore contains finitely many modes — no limit process required.',
      },
      {
        id: 'k3',
        label: 'Temperature / frequency ladder',
        teX: String.raw`\omega_m = \frac{T_{\rm Pl}}{m+1}, \qquad n_B(\omega_m,T) = \frac1{\exp(\omega_m/T)-1}`,
        prose: 'The harmonic ladder on the null lattice assigns frequency inversely with shell depth. At m=0 we sit at the Planck pole; as m increases we go to the infrared.',
      },
      {
        id: 'k4',
        label: 'Per-shell spectral energy',
        teX: String.raw`E_m(T) = \mathcal{N}(m) \cdot \omega_m \cdot n_B(\omega_m,T)`,
        prose: 'Energy per shell is exactly the mode count times the Bose-weighted energy per mode. Every factor is positive and finite for every finite m and T > 0.',
      },
      {
        id: 'k5',
        label: 'Finite blackbody energy density',
        teX: String.raw`u(T;m_{\rm UV},m_{\rm IR}) = \sum_{m=m_{\rm UV}}^{m_{\rm IR}} E_m(T)`,
        prose: 'The total energy density between any two shells is a finite sum. The UV catastrophe never appears: there are only two modes at m=0 (the Planck pole). The IR is also cut off at the lock-in reference shell.',
        lockIn: true,
        highlightClass: 'emerald',
      },
      {
        id: 'k6',
        label: 'Recovered radiation-era scaling',
        teX: String.raw`H \propto T^2 \qquad \text{(from quadratic } \mathcal{N}(m) \text{ asymptotics)}`,
        prose: 'Under the propagation-shell identification the quadratic growth of N(m) directly implies the Friedmann radiation-era scaling without importing it.',
      },
    ],
    references: {
      paper: 'finite_mode_kirchhoff',
      zenodo: 'https://zenodo.org/communities/hqiv',
      lean: 'Hqiv/Physics/HorizonBlackbodySpectrum.lean + OctonionicLightCone.lean',
      note: 'Zero-sorry Lean certificate for the finite sum identities and the absence of UV divergence.',
    },
    relatedOldStep: 9,
  },

  {
    id: 'o-maxwell-discrete',
    title: 'Maxwell equations from discrete gauge potential on the octonion carrier',
    domains: ['EM', 'Gauge'],
    standardTeX: String.raw`F_{\mu\nu} = \partial_\mu A_\nu - \partial_\nu A_\mu, \qquad \mathcal{L} = -\frac14 F_{\mu\nu}F^{\mu\nu} + J^\mu A_\mu`,
    standardHook: 'Gauge potential and field strength are introduced by hand; the action is the simplest gauge-invariant term.',
    hqivYieldTeX: String.raw`F^a{}_{\mu\nu}(A) := A^a{}_\nu - A^a{}_\mu \quad (a\in\mathrm{Fin}\,8,\ \mu,\nu\in\mathrm{Fin}\,4), \quad \mathcal{L}_O = \mathcal{L}_{\rm kin}(A) + 4\pi\mathcal{L}_{\rm src}(J,A) + \mathcal{L}_\phi(A,\phi)`,
    hqivHook: 'Field strength is literally the discrete difference on the Fin8 octonion-indexed cutoff. The kinetic term is the same quadratic form; the φ-coupling is the same α log(φ+1) imprint that appears in gravity.',
    steps: [
      {
        id: 'om1',
        label: 'Discrete gauge potential',
        teX: String.raw`A : \mathrm{Fin}\,8 \to \mathrm{Fin}\,4 \to \mathbb{R}`,
        prose: 'Eight channels (one per imaginary octonion unit plus scalar) on the minimal 4-index spacetime chart. This is the carrier forced by the 3D null-lattice + so(8) closure.',
      },
      {
        id: 'om2',
        label: 'Discrete field strength (exact discrete exterior derivative)',
        teX: String.raw`F^a{}_{\mu\nu}(A) := A^a{}_\nu - A^a{}_\mu`,
        prose: 'No connection or Lie bracket is assumed. The antisymmetric difference on the lattice is already the field strength. This is the same F that later appears in the holonomy glue (Wilson plaquettes on Fin4 cycles).',
        lockIn: true,
        highlightClass: 'emerald',
      },
      {
        id: 'om3',
        label: 'O-Maxwell kinetic density',
        teX: String.raw`\mathcal{L}_{\rm kin}(A) = -\frac14\sum_{a,\mu,\nu}\frac{(F^a{}_{\mu\nu})^2}{2}`,
        prose: 'The factor 1/2 inside the sum implements the usual antisymmetric bookkeeping while summing over ordered pairs. This is the direct discrete analogue of −1/4 F².',
      },
      {
        id: 'om4',
        label: 'Source coupling and φ-imprint term',
        teX: String.raw`\mathcal{L}_{\rm src} = \sum_a\sum_\nu J^a{}_\nu A^a{}_\nu, \qquad \mathcal{L}_\phi = \alpha\log(\phi+1)\sum_\nu(\nabla\phi)_\nu A^0{}_\nu`,
        prose: 'The same α = 3/5 curvature imprint that controls G_eff also couples the auxiliary scalar φ into the gauge sector (lapse dragging).',
      },
      {
        id: 'om5',
        label: 'Euler–Lagrange identity (discrete divergence)',
        teX: String.raw`\mathrm{EL}_O^{(a,\nu)} = \sum_\mu F^a{}_{\mu\nu} - 4\pi J^a{}_\nu = 0`,
        prose: 'The stationarity condition on the discrete action cell is exactly the discrete divergence of F minus sources. Lean proves this identity matches the continuum Maxwell equation under the chart map.',
        lockIn: true,
        highlightClass: 'amber',
      },
    ],
    references: {
      paper: 'octonionic_action + omaxwell_fluid_chart',
      zenodo: 'https://zenodo.org/communities/hqiv',
      lean: 'Hqiv/Physics/Action.lean + ModifiedMaxwell.lean + ActionHolonomyGlue.lean',
    },
    relatedOldStep: 8,
  },

  {
    id: 'g-eff-phi-3-5',
    title: 'Effective gravitational strength G_eff(φ) = φ^{3/5} and modified Friedmann',
    domains: ['GR'],
    standardTeX: String.raw`8\pi G(\rho_m + \rho_r) = 3H^2 + \dots \qquad (G \text{ is an external constant})`,
    standardHook: 'Newton’s constant is an input. The Friedmann equation is imposed as the 00-component of Einstein’s equation.',
    hqivYieldTeX: String.raw`\frac{13}{5}\phi^2 = 8\pi G_{\rm eff}(\phi)(\rho_m + \rho_r), \qquad G_{\rm eff}(\phi) = \phi^{3/5}`,
    hqivHook: 'The same auxiliary lapse field φ that appears in the O-Maxwell sector also sets the gravitational strength. The exponent 3/5 is forced by the lattice.',
    steps: [
      {
        id: 'ge1',
        label: 'Null-shell growth (quadratic, not cubic)',
        teX: String.raw`A(m) = 4(m+2)(m+1) \implies \Delta A(m) = 8(m+2)`,
        prose: 'The 3+1 null-lattice counts new modes on the light cone (surface), not bulk volume. The leading term is quadratic in shell index m. This is the dimensional hinge that distinguishes HQIV from standard causal-set volume counting.',
      },
      {
        id: 'ge2',
        label: 'Curvature density and cumulative ledger',
        teX: String.raw`\rho(x) = x^{-1}(1 + \tfrac35\log x), \qquad K(n) = \sum_{m=0}^{n-1}\rho(m+1)`,
        prose: 'The curvature channel K(n) is the running total of the logarithmic correction. It diverges (ensuring a well-defined phase readout) while remaining strictly monotone.',
      },
      {
        id: 'ge3',
        label: 'Unit split and dimension-balance',
        teX: String.raw`\alpha + \gamma = 1, \qquad \frac{\alpha}{\gamma} = \frac{d}{d-1} \quad (d=3 \text{ transverse})`,
        prose: 'Causal monogamy on overlapping horizons plus a minimal spanning-tree overlap model forces the ratio α/γ = 3/2. Together with the unit split this pins α = 3/5, γ = 2/5 exactly.',
        lockIn: true,
        highlightClass: 'emerald',
      },
      {
        id: 'ge4',
        label: 'Lattice coherence (hockey-stick identity)',
        teX: String.raw`\alpha = \frac{3}{5} = \frac{R(n)}{K(n)} \quad \text{for every shell } n`,
        prose: 'The Lean theorem latticeAlphaRatio_eq_alpha proves that the curvature-imprint ratio is exactly 3/5 at every truncation. The lattice supplies the numerator 3; the dimension-balance denominator supplies the 5. They coincide in the same display number.',
      },
      {
        id: 'ge5',
        label: 'Lapse dragging (same φ in gauge and gravity)',
        teX: String.raw`S_{\rm grav}(\phi,\rho_m,\rho_r) = \frac{13}{5}\phi^2 - 8\pi\phi^{3/5}(\rho_m+\rho_r) = 0 \iff \text{Friedmann}`,
        prose: 'The total action cell contains both the O-Maxwell sector and the gravitational constraint. Stationarity with respect to the same auxiliary scalar φ forces G_eff(φ) = φ^{3/5}. This is the “lapse dragging” identification proved in GRFromMaxwell.lean.',
        lockIn: true,
        highlightClass: 'emerald',
      },
    ],
    references: {
      paper: '3d_causal_growth + octonionic_action',
      zenodo: '10.5281/zenodo.18899939',
      lean: 'Hqiv/Physics/GRFromMaxwell.lean + Action.lean + OctonionicLightCone.lean',
    },
    relatedOldStep: 11,
  },

  {
    id: 'electroweak-scale-horizon',
    title: 'Electroweak scale and gauge-boson masses from lock-in horizon surfaces',
    domains: ['SM'],
    standardTeX: String.raw`v \approx 246\,\mathrm{GeV} \quad (\text{input scale, fitted to } M_W, M_Z, m_H)`,
    standardHook: 'The Higgs vacuum expectation value is an external input. All masses and the Fermi scale are fitted to it.',
    hqivYieldTeX: String.raw`v = T_{\rm lockin} \cdot S(m_{\rm lockin}+1) \cdot (1+\gamma), \quad S(m)=(m+1)(m+2), \quad \gamma=2/5`,
    hqivHook: 'The electroweak scale is read off the lock-in temperature and the outer-horizon surface area at the QCD-onset shell. No PDG number is imported to define the geometry.',
    steps: [
      {
        id: 'ew1',
        label: 'Lock-in shell identification',
        teX: String.raw`m_{\rm lockin} = 4 \quad (\text{QCD-onset shell})`,
        prose: 'The shell m=4 is the smallest integer at which colour confinement and the lock-in chart can begin. It is a modelling choice, not a free parameter; once chosen, everything downstream is fixed by the two axioms.',
      },
      {
        id: 'ew2',
        label: 'Geometric vacuum scale from horizon surfaces',
        teX: String.raw`v = T_{\rm lockin} \cdot S(m+1) \cdot (1+\gamma) = \frac1{m+1}\cdot(m+2)(m+3)\cdot\frac75`,
        prose: 'T_lockin = 1/(m+1) is the temperature at the lock-in shell. S(m) is the horizon surface count. The factor (1+γ) with γ=2/5 is the unit-split complement. The whole expression is a pure lattice rational once m=4 is fixed.',
        lockIn: true,
        highlightClass: 'emerald',
      },
      {
        id: 'ew3',
        label: 'Triality-fixed couplings',
        teX: String.raw`g_{\rm SU(2)}^{\rm derived},\quad g_Y^{\rm derived} \quad \text{from so(8) branching on } 8_s`,
        prose: 'The weak and hypercharge couplings are read from the triality decomposition of the 8-dimensional carrier (weak doublet in the 2 of SU(2) inside Spin(8)). No external α_EM or sin²θ_W is used at this stage.',
      },
      {
        id: 'ew4',
        label: 'Gauge boson masses from carrier Gram matrix',
        teX: String.raw`M_W^{\rm derived} = 392/5 \quad (\text{in module units}), \qquad m_H^2 = 2\lambda v^2`,
        prose: 'The weak W-plane Gram matrix at the derived vev is proportional to the identity; its eigenvalue directly supplies the boson mass. The Higgs quartic is reconstructed from the same carrier norm (no new tunable λ).',
      },
    ],
    references: {
      paper: 'lean_to_mass_spectrum',
      lean: 'Hqiv/Physics/DerivedGaugeAndLeptonSector.lean + WeakDoubletCarrierGaugeQuadratic.lean + ChargedLeptonResonance.lean',
    },
    relatedOldStep: 11,
  },

  {
    id: 'so8-gauge-closure',
    title: 'Gauge structure: SU(3)×SU(2)×U(1) inside so(8) from discrete growth + phase lift',
    domains: ['Gauge', 'SM'],
    standardTeX: String.raw`\mathfrak{su}(3)\oplus\mathfrak{su}(2)\oplus\mathfrak{u}(1) \quad \text{(postulated internal symmetry algebra)}`,
    standardHook: 'The gauge group of the Standard Model is an input. Why these groups and why three generations are fitted or anthropic.',
    hqivYieldTeX: String.raw`\langle G_2 \cup \{\Delta\}\rangle_{\rm Lie} = \mathfrak{so}(8) \quad \text{on the Fano octonion carrier}`,
    hqivHook: 'Starting from the 14-dimensional derivation algebra of the octonions plus a single antisymmetric phase-lift generator Δ supported on span{e₁,e₇}, iterated Lie brackets close exactly to the full 28-dimensional rotation algebra in eight dimensions.',
    steps: [
      {
        id: 'so1',
        label: 'Octonion carrier from 3D null lattice',
        teX: String.raw`\mathbb{O} \simeq \mathbb{R}^8 \quad (\text{Fano plane on the seven imaginary units})`,
        prose: 'The 3D spatial backbone plus the requirement of a multiplication law on seven imaginary transverse directions, together with Hurwitz rigidity, selects the octonions as the unique 8-dimensional normed division algebra.',
      },
      {
        id: 'so2',
        label: 'G₂ derivation algebra',
        teX: String.raw`G_2 = \mathrm{Aut}(\mathbb{O}) \simeq \mathfrak{g}_2 \quad (14\text{-dimensional})`,
        prose: 'The automorphism group of the octonions is the 14-dimensional exceptional group G₂. Its Lie algebra acts on the seven imaginary units and is the starting point for the internal gauge story.',
      },
      {
        id: 'so3',
        label: 'Phase-lift generator Δ on the distinguished plane',
        teX: String.raw`\Delta \in \mathfrak{so}(8), \quad \Delta_{1,7} = -\Delta_{7,1} \ne 0`,
        prose: 'The generator Δ is the minimal additional piece required to promote the spatial SO(3) story into a full internal holonomy on the octonion carrier. It is supported on the plane span{e₁,e₇} fixed by the light-cone combinatorics.',
        lockIn: true,
        highlightClass: 'amber',
      },
      {
        id: 'so4',
        label: 'Iterated Lie closure (machine-checked)',
        teX: String.raw`\langle G_2 \cup \{\Delta\}\rangle_{\rm Lie} = \mathfrak{so}(8) \quad (28\text{-dimensional})`,
        prose: 'Adjoining Δ to G₂ and closing under Lie bracket generates the full rotation algebra in eight dimensions. The result is certified by an exact symbolic proof object over Q and by zero-sorry Lean modules (HQIVSO8Closure).',
        lockIn: true,
        highlightClass: 'emerald',
      },
      {
        id: 'so5',
        label: 'Triality and three generations',
        teX: String.raw`8_s = 8_v = 8_c \quad \text{(triality irreps of Spin(8))}`,
        prose: 'The three 8-dimensional irreps of Spin(8) are permuted by triality. HQIV reads them as the three generation labels. The colour axis e₇ is fixed by the same Fano combinatorics that selected the carrier.',
      },
    ],
    references: {
      paper: 'closure + 3d_causal_growth',
      zenodo: '10.5281/zenodo.20214211',
      lean: 'Hqiv/Algebra/SO8Closure.lean + Hqiv/Algebra/SMEmbedding.lean',
    },
    relatedOldStep: 12,
  },
];

/** Helper: filter equations by domain (or 'All') */
export function filterEquations(
  eqs: Equation[],
  domain: 'All' | PhysicsDomain,
): Equation[] {
  if (domain === 'All') return eqs;
  return eqs.filter((e) => e.domains.includes(domain));
}

/** Helper: find a single equation by id */
export function findEquation(id: string): Equation | undefined {
  return equations.find((e) => e.id === id);
}
