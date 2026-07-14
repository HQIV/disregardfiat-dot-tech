/**
 * Bibliography of researchers whose work informs the HQIV programme.
 *
 * Curated for context: each entry pairs an author with a short note on
 * how their research connects to the discrete light-cone / octonionic
 * threads of HQIV, plus durable identifiers (ORCID, DOI, arXiv) so a
 * reader can audit the sources independently.
 */

export type WorkType = 'thesis' | 'article' | 'preprint' | 'book' | 'review' | 'repository'

export type Work = {
  title: string
  venue: string
  year: number | string
  type: WorkType
  /** DOI string (without the https://doi.org/ prefix); preferred when available. */
  doi?: string
  /** arXiv identifier (e.g. "1611.09182") when no DOI exists or as the open-access pointer. */
  arxiv?: string
  /** Direct URL fallback when neither DOI nor arXiv is appropriate. */
  url?: string
}

export type AuthorLinks = {
  orcid?: string
  website?: string
  scholar?: string
  wikipedia?: string
  blog?: string
  institution?: string
}

export type Author = {
  id: string
  name: string
  /** Short professional title, e.g. "Mathematical physicist". */
  role: string
  affiliation: string
  /** Optional portrait. If omitted, an initials monogram is shown. */
  imageUrl?: string
  /** Credit + license note rendered as a tooltip / caption under the portrait. */
  imageCredit?: string
  links: AuthorLinks
  /** 1–2 sentence biographical sketch. */
  bio: string
  /** Why this author matters to the HQIV programme. */
  hqivRelevance: string
  /** Short keywords to anchor cross-references. */
  themes: string[]
  works: Work[]
  /**
   * True if the author is an active HQIV-programme contributor (e.g. shares
   * code, papers, or proofs into the Zenodo community / GitHub org). When
   * false / omitted the author is treated as a foundational predecessor
   * whose work HQIV draws on but who has not necessarily commented on it.
   */
  activeContributor?: boolean
}

export const bibliography: Author[] = [
  {
    id: 'baez',
    name: 'John C. Baez',
    role: 'Mathematical physicist',
    affiliation: 'U. C. Riverside (emeritus) · University of Edinburgh',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/John_Baez_November_2003.jpg/480px-John_Baez_November_2003.jpg',
    imageCredit:
      'Photo: Andrej Bauer, 2003 — Wikimedia Commons, CC BY-SA 2.5.',
    links: {
      orcid: '0000-0002-0609-9836',
      website: 'https://math.ucr.edu/home/baez/',
      institution: 'https://math.ucr.edu/home/baez/',
      wikipedia: 'https://en.wikipedia.org/wiki/John_C._Baez',
      blog: 'https://golem.ph.utexas.edu/category/',
    },
    bio:
      'Mathematical physicist known for foundational expositions of the four normed division algebras, n‑categories, and applied category theory; long-running essayist for the AMS Notices.',
    hqivRelevance:
      'Baez’s synthesis of octonions, Clifford algebras and exceptional Jordan algebras is the canonical entry-point for the 8‑dimensional carrier and triality structure used in HQIV’s phase lift on span{e₁,e₇} and so(8) closure work.',
    themes: ['octonions', 'division algebras', 'category theory', 'so(8) / triality'],
    works: [
      {
        title: 'The Octonions',
        venue: 'Bull. Amer. Math. Soc. 39 (2002), 145–205',
        year: 2002,
        type: 'review',
        doi: '10.1090/S0273-0979-01-00934-X',
        arxiv: 'math/0105155',
      },
      {
        title: 'Division Algebras and Quantum Theory',
        venue: 'Foundations of Physics 42(7), 819–855',
        year: 2012,
        type: 'article',
        doi: '10.1007/s10701-011-9566-z',
        arxiv: '1101.5690',
      },
      {
        title: 'Division Algebras and Supersymmetry I',
        venue:
          'Superstrings, Geometry, Topology, and C*-algebras (Proc. Symp. Pure Math. 81), with J. Huerta',
        year: 2010,
        type: 'article',
        arxiv: '0909.0551',
      },
      {
        title: 'G₂ and the Rolling Ball',
        venue: 'Transactions of the AMS 366, 5257–5293 (with J. Huerta)',
        year: 2014,
        type: 'article',
        doi: '10.1090/S0002-9947-2014-05977-1',
        arxiv: '1205.2447',
      },
      {
        title: 'Can We Understand the Standard Model Using Octonions?',
        venue: 'Lecture notes / talk, UC Riverside',
        year: 2021,
        type: 'preprint',
        url: 'https://math.ucr.edu/home/baez/standard/standard_octonions_web.pdf',
      },
    ],
  },
  {
    id: 'furey',
    name: 'Nichol (Cohl) Furey',
    role: 'Mathematical physicist · Freigeist Fellow',
    affiliation: 'Humboldt-Universität zu Berlin · AIMS South Africa',
    imageCredit: 'Portrait omitted pending a permissively-licensed source.',
    links: {
      website: 'https://www.furey.space/',
      institution: 'https://www.hu-berlin.de/en/people-detail-page/dr-nichol-furey',
      scholar: 'https://scholar.google.co.uk/citations?user=0Ely154AAAAJ',
      wikipedia: 'https://en.wikipedia.org/wiki/Cohl_Furey',
    },
    bio:
      'Mathematical physicist building the Standard Model directly from division algebras — the Dixon algebra ℝ⊗ℂ⊗ℍ⊗𝕆 — by treating particle sectors as generalized ideals of an algebra acting on itself.',
    hqivRelevance:
      'Furey’s programme is the closest active analogue of the HQIV stance that gauge structure should be read off algebraic bookkeeping rather than fitted: her SU(3)×SU(2)×U(1) construction from ℂ⊗𝕆 ladder operators is the comparator for HQIV’s 8‑D carrier and its symmetry content.',
    themes: ['Dixon algebra', 'standard-model symmetries', 'octonions', 'Clifford ideals'],
    works: [
      {
        title: 'Standard Model Physics from an Algebra?',
        venue: 'PhD thesis, University of Waterloo',
        year: 2015,
        type: 'thesis',
        arxiv: '1611.09182',
        doi: '10.48550/arXiv.1611.09182',
      },
      {
        title: 'Unified Theory of Ideals',
        venue: 'Phys. Rev. D 86, 025024',
        year: 2012,
        type: 'article',
        doi: '10.1103/PhysRevD.86.025024',
        arxiv: '1002.1497',
      },
      {
        title:
          'SU(3)_C × SU(2)_L × U(1)_Y (× U(1)_X) as a Symmetry of Division Algebraic Ladder Operators',
        venue: 'Eur. Phys. J. C 78, 375',
        year: 2018,
        type: 'article',
        doi: '10.1140/epjc/s10052-018-5844-7',
        arxiv: '1806.00612',
      },
      {
        title: 'Generations: Three Prints, in Colour',
        venue: 'JHEP 10 (2014) 046',
        year: 2014,
        type: 'article',
        doi: '10.1007/JHEP10(2014)046',
        arxiv: '1405.4601',
      },
      {
        title: 'Three Generations, Two Unbroken Gauge Symmetries, and One Eight-Dimensional Algebra',
        venue: 'Physics Letters B 785, 84–89',
        year: 2018,
        type: 'article',
        doi: '10.1016/j.physletb.2018.08.032',
        arxiv: '1910.08395',
      },
      {
        title: 'Division Algebraic Symmetry Breaking',
        venue: 'Physics Letters B 831, 137186 (with M. J. Hughes)',
        year: 2022,
        type: 'article',
        doi: '10.1016/j.physletb.2022.137186',
        arxiv: '2210.10126',
      },
    ],
  },
  {
    id: 'dixon',
    name: 'Geoffrey M. Dixon',
    role: 'Mathematical physicist',
    affiliation: 'Independent · formerly Brandeis University',
    imageCredit: 'Portrait omitted pending a permissively-licensed source.',
    links: {
      website: 'https://www.7stones.com/Homepage/AlgebraSite2.html',
      institution: 'https://www.7stones.com/Homepage/AlgebraSite2.html',
    },
    bio:
      'Mathematical physicist who has spent four decades advocating that the algebraic design of physics is read off the tensor product T = ℝ ⊗ ℂ ⊗ ℍ ⊗ 𝕆 of the four normed division algebras; author of the Kluwer monograph that gave this programme its definitive form.',
    hqivRelevance:
      'Dixon is the proximate ancestor of the algebraic-bookkeeping stance HQIV adopts: HQIV reads the Hurwitz cap at the octonions and the eight-dimensional carrier the same way Dixon does, but anchors the gauge content not in an a priori T-algebra factorisation but in a discrete null-lattice closure whose Lie span happens to be so(8). His monograph is the background reference HQIV inherits whenever it cites the "Dixon algebra" or invokes division-algebra classification.',
    themes: ['Dixon algebra ℝ⊗ℂ⊗ℍ⊗𝕆', 'division algebras', 'algebraic design of physics'],
    works: [
      {
        title:
          'Division Algebras: Octonions, Quaternions, Complex Numbers, and the Algebraic Design of Physics',
        venue: 'Kluwer Academic Publishers (Mathematics and Its Applications 290)',
        year: 1994,
        type: 'book',
        doi: '10.1007/978-1-4757-2315-1',
      },
      {
        title: 'Division Algebras, Spinors, Idempotents, the Algebraic Structure of Reality',
        venue: 'Online manuscript (self-published)',
        year: 2010,
        type: 'preprint',
        url: 'https://www.7stones.com/Homepage/AlgebraSite2.html',
      },
    ],
  },
  {
    id: 'sudbery',
    name: 'Anthony Sudbery',
    role: 'Mathematician',
    affiliation: 'University of York (emeritus)',
    imageCredit: 'Portrait omitted pending a permissively-licensed source.',
    links: {
      institution: 'https://www.york.ac.uk/maths/people/anthony-sudbery/',
      website: 'https://www-users.york.ac.uk/~as2/',
    },
    bio:
      'British mathematician whose 1984 paper on division algebras, (pseudo-)orthogonal groups and spinors is the canonical reference for the spinor / division-algebra correspondences in dimensions 3, 4, 6 and 10; later contributions span quaternionic analysis and the foundations of quantum probability.',
    hqivRelevance:
      'Sudbery [1984] supplies the spinor ↔ division-algebra dictionary that lets HQIV identify the seven imaginary octonion units with operators on ℝ⁸ and lift spatial SO(3) into an internal triality-compatible eight-dimensional carrier. His enumeration of which (pseudo-)orthogonal groups admit division-algebra coordinatisations is the classification HQIV silently uses when it writes Spin(8) and reads e₇ as the colour axis.',
    themes: ['division algebras', 'spinors', '(pseudo)orthogonal groups', 'so(8) / triality'],
    works: [
      {
        title: 'Division Algebras, (Pseudo)Orthogonal Groups and Spinors',
        venue: 'J. Phys. A: Math. Gen. 17, 939–955',
        year: 1984,
        type: 'article',
        doi: '10.1088/0305-4470/17/5/018',
      },
      {
        title: 'Quaternionic Analysis',
        venue: 'Math. Proc. Cambridge Philos. Soc. 85, 199–225',
        year: 1979,
        type: 'article',
        doi: '10.1017/S0305004100055638',
      },
    ],
  },
  {
    id: 'gunaydin',
    name: 'Murat Günaydin (with Feza Gürsey)',
    role: 'Theoretical physicist',
    affiliation: 'Pennsylvania State University · Yale University (Gürsey, 1921–1992)',
    imageCredit: 'Portrait omitted pending a permissively-licensed source.',
    links: {
      institution: 'https://science.psu.edu/physics/people/mxg14',
      wikipedia: 'https://en.wikipedia.org/wiki/Feza_G%C3%BCrsey',
    },
    bio:
      'Günaydin and Gürsey introduced octonions into particle physics in the mid-1970s, proposing that quark colour statistics live naturally on a non-associative algebra; Günaydin has since extended the programme to exceptional-group symmetries, U-duality and minimal unitary realisations of exceptional Lie algebras.',
    hqivRelevance:
      'The Günaydin–Gürsey papers are the first physical use of the octonion algebra HQIV inherits — the original proof-of-concept that an eight-dimensional non-associative carrier can house colour-like degrees of freedom. HQIV cites them for historical priority on the imaginary-octonion → colour reading that the discrete null lattice later promotes to an audited so(8) closure with e₇ fixed as the colour axis.',
    themes: ['octonions in particle physics', 'colour statistics', 'exceptional groups', 'G₂'],
    works: [
      {
        title: 'Quark Statistics and Octonions',
        venue: 'Physical Review D 9, 3387–3396',
        year: 1974,
        type: 'article',
        doi: '10.1103/PhysRevD.9.3387',
      },
      {
        title: 'Quark Statistics and Octonions (extended treatment)',
        venue: 'Journal of Mathematical Physics 17(4), 680–694',
        year: 1976,
        type: 'article',
        doi: '10.1063/1.522959',
      },
    ],
  },
  {
    id: 'springer',
    name: 'T. A. Springer (with F. D. Veldkamp)',
    role: 'Mathematician',
    affiliation: 'Utrecht University (Springer, 1926–2011 · Veldkamp, emeritus)',
    imageCredit: 'Portrait omitted pending a permissively-licensed source.',
    links: {
      wikipedia: 'https://en.wikipedia.org/wiki/T._A._Springer',
    },
    bio:
      'Tonny Springer was a Dutch mathematician known for foundational work on linear algebraic groups, Springer representations of Weyl groups and exceptional simple groups; his joint monograph with Ferdinand Veldkamp on octonions, Jordan algebras and exceptional groups is a standard reference in the field.',
    hqivRelevance:
      'Springer–Veldkamp is the textbook HQIV reaches for whenever it needs precise classical facts about Aut(𝕆) = G₂, the exceptional Jordan algebra and the triality structure of Spin(8). These are the black-box theorems HQIV cites — rather than re-proves — when promoting a 3D spatial backbone to an internal triality-compatible sector on ℝ⁸.',
    themes: ['octonions', 'exceptional Lie groups', 'Jordan algebras', 'triality'],
    works: [
      {
        title: 'Octonions, Jordan Algebras and Exceptional Groups',
        venue: 'Springer Monographs in Mathematics',
        year: 2000,
        type: 'book',
        doi: '10.1007/978-3-662-12622-6',
      },
    ],
  },
  {
    id: 'brodie',
    name: 'Keith Brodie',
    role: 'Independent researcher · numerical verifier',
    affiliation: 'Anaheim, California',
    imageCredit: 'Portrait omitted pending a permissively-licensed source.',
    links: {
      website: 'https://github.com/KeithBrodie',
      institution: 'https://www.linkedin.com/in/keithbrodie',
    },
    bio:
      'Independent researcher running an open, parameter-free horizon-thermodynamics programme. Publishes reference Python that derives galactic, cosmological and electromagnetic anomalies — MOND from SPARC, JWST early-galaxy structure formation, a Jacobson↔Quantised-Inertia bridge, redshift and cavity-hydrogen results — directly from horizon bookkeeping rather than fitted parameters.',
    hqivRelevance:
      'Brodie’s independent programme is the most direct external numerical witness HQIV has for the α = 3/5 curvature-imprint ratio: his SPARC MOND derivation, JWST structure-formation calculation, Jacobson + Quantised-Inertia bridge and cavity-hydrogen permittivity result all sit at the same horizon-thermodynamic exponent that HQIV reads off lattice combinatorics — reached from a different starting point with zero free parameters. HQIV does not speak for that programme; it cites it because the numbers line up where two independent derivations meet.',
    themes: [
      'horizon thermodynamics',
      'α = 3/5 (independent numerical witness)',
      'MOND from first principles',
      'JWST early-galaxy anomaly',
    ],
    works: [
      {
        title: 'Deriving the MOND Interpolation Function from Horizon Thermodynamics with Zero Free Parameters (SPARC galaxy rotation curves)',
        venue: 'Working paper + reference implementation, GitHub',
        year: 2026,
        type: 'repository',
        url: 'https://github.com/KeithBrodie/SPARC-rotation-paper',
      },
      {
        title:
          'Accelerated Structure Formation from Horizon Thermodynamics: Resolving the JWST Early Massive Galaxy Anomaly',
        venue: 'Working paper + reference implementation, GitHub',
        year: 2026,
        type: 'repository',
        url: 'https://github.com/KeithBrodie/jwst-massive-galaxies',
      },
      {
        title: 'Jacobson + Quantised Inertia (horizon-thermodynamic bridge)',
        venue: 'Reference implementation, GitHub',
        year: 2026,
        type: 'repository',
        url: 'https://github.com/KeithBrodie/jacobson-qi-paper',
      },
      {
        title: 'Redshift Anomaly from Horizon Thermodynamics',
        venue: 'Working paper + reference implementation, GitHub',
        year: 2026,
        type: 'repository',
        url: 'https://github.com/KeithBrodie/redshift-anomaly-paper',
      },
      {
        title: 'Cavity Hydrogen Permittivity from Horizon Thermodynamics',
        venue: 'Reference implementation, GitHub',
        year: 2026,
        type: 'repository',
        url: 'https://github.com/KeithBrodie/cavity-hydrogen-permittivity',
      },
    ],
  },
  {
    id: 'mcculloch',
    name: 'M. E. (Mike) McCulloch',
    role: 'Physicist · Lecturer in Geomatics',
    affiliation: 'University of Plymouth',
    imageUrl: '/mem_400x400.jpg',
    imageCredit: 'Portrait used with permission (via X).',
    links: {
      institution: 'https://www.plymouth.ac.uk/staff/mike-mcculloch',
      blog: 'https://physicsfromtheedge.blogspot.com/',
      website: 'https://quantizedinertia.com/',
      scholar: 'https://scholar.google.com/citations?user=4F8R4AcAAAAJ',
    },
    bio:
      'Originator (2007) of Quantised Inertia / MiHsC: a model in which inertial mass is produced by anisotropic Unruh radiation modulated by Rindler and Hubble-scale horizons, predicting galaxy rotation curves and a class of horizon-engineered thrust effects without dark matter.',
    hqivRelevance:
      'McCulloch’s horizon-pressure picture is the physical sibling of HQIV’s discrete light-cone bookkeeping: both treat finite horizons as the carrier of dynamics rather than continuum bulk. His MiHsC galactic-rotation and minimum-acceleration scales are direct comparison points for HQIV’s α=3/5 imprint on G_eff(φ).',
    themes: ['quantised inertia / MiHsC', 'Unruh radiation', 'horizon thermodynamics', 'galaxy rotation without DM'],
    works: [
      {
        title: 'Modelling the Pioneer Anomaly as Modified Inertia',
        venue: 'MNRAS 376, 338–342',
        year: 2007,
        type: 'article',
        doi: '10.1111/j.1365-2966.2007.11433.x',
        arxiv: 'astro-ph/0612599',
      },
      {
        title: 'Minimum Accelerations from Quantised Inertia',
        venue: 'EPL 90, 29001',
        year: 2010,
        type: 'article',
        doi: '10.1209/0295-5075/90/29001',
      },
      {
        title: 'Testing Quantised Inertia on Galactic Scales',
        venue: 'Astrophysics and Space Science 342, 575–578',
        year: 2012,
        type: 'article',
        doi: '10.1007/s10509-012-1197-0',
        arxiv: '1207.7007',
      },
      {
        title: 'Inertia from an Asymmetric Casimir Effect',
        venue: 'EPL 101, 59001',
        year: 2013,
        type: 'article',
        doi: '10.1209/0295-5075/101/59001',
        arxiv: '1302.2775',
      },
      {
        title: 'Testing Quantised Inertia on the EmDrive',
        venue: 'EPL 111, 60005',
        year: 2015,
        type: 'article',
        doi: '10.1209/0295-5075/111/60005',
        arxiv: '1604.03449',
      },
      {
        title: 'Quantised Inertia from Relativity and the Uncertainty Principle',
        venue: 'EPL 115, 69001',
        year: 2016,
        type: 'article',
        doi: '10.1209/0295-5075/115/69001',
        arxiv: '1610.06787',
      },
      {
        title: 'Testing Quantised Inertia on EmDrives with Dielectrics',
        venue: 'EPL 118, 34003',
        year: 2017,
        type: 'article',
        doi: '10.1209/0295-5075/118/34003',
      },
      {
        title: 'Physics from the Edge: A New Cosmological Model for Inertia',
        venue: 'World Scientific',
        year: 2014,
        type: 'book',
        doi: '10.1142/9013',
      },
    ],
  },
  {
    id: 'jacobson',
    name: 'Ted Jacobson',
    role: 'Theoretical physicist',
    affiliation: 'University of Maryland, College Park',
    imageCredit: 'Portrait omitted pending a permissively-licensed source.',
    links: {
      institution: 'https://umdphysics.umd.edu/people/faculty/current/item/108-jacobson.html',
      scholar: 'https://scholar.google.com/citations?user=qDqovZAAAAAJ',
      wikipedia: 'https://en.wikipedia.org/wiki/Ted_Jacobson',
    },
    bio:
      'Theoretical physicist working on black-hole thermodynamics, quantum gravity and analogue-gravity systems; author of the 1995 derivation showing the Einstein equation arises as a horizon-thermodynamic equation of state from Clausius δQ = T δS applied to local Rindler horizons.',
    hqivRelevance:
      'Jacobson [1995] is the load-bearing external reference behind Appendix A of the HQIV 3D causal-growth paper. HQIV reads Jacobson’s flux–entropy identity on null horizons through Brodie’s discrete packaging, then combines it with the causal-monogamy template to recover α = 3/5 = d/(2d−1) at d = 3 with no fitted parameters. Jacobson’s ontology — gravity as horizon thermodynamics — is the physical interpretation HQIV adopts for the curvature channel K(n).',
    themes: ['horizon thermodynamics', 'Einstein equation as equation of state', 'null surfaces'],
    works: [
      {
        title: 'Thermodynamics of Spacetime: The Einstein Equation of State',
        venue: 'Physical Review Letters 75, 1260–1263',
        year: 1995,
        type: 'article',
        doi: '10.1103/PhysRevLett.75.1260',
        arxiv: 'gr-qc/9504004',
      },
      {
        title: 'Entanglement Equilibrium and the Einstein Equation',
        venue: 'Physical Review Letters 116, 201101',
        year: 2016,
        type: 'article',
        doi: '10.1103/PhysRevLett.116.201101',
        arxiv: '1505.04753',
      },
      {
        title: 'On the Origin of the Outgoing Black Hole Modes',
        venue: 'Physical Review D 53, 7082–7088',
        year: 1996,
        type: 'article',
        doi: '10.1103/PhysRevD.53.7082',
        arxiv: 'hep-th/9601064',
      },
    ],
  },
  {
    id: 'sorkin',
    name: 'Rafael D. Sorkin',
    role: 'Theoretical physicist',
    affiliation: 'Perimeter Institute · Syracuse University (emeritus)',
    imageCredit: 'Portrait omitted pending a permissively-licensed source.',
    links: {
      institution: 'https://perimeterinstitute.ca/people/rafael-sorkin',
      scholar: 'https://scholar.google.com/citations?user=4VKfH-MAAAAJ',
      wikipedia: 'https://en.wikipedia.org/wiki/Rafael_Sorkin',
    },
    bio:
      'Co-founder of the causal-set programme (with Bombelli, Lee and Meyer, 1987), which models spacetime as a locally finite partially ordered set, and originator of several discrete quantum-gravity tools — classical sequential growth dynamics, the Sorkin–Johnston vacuum, the spacetime action, and Myrheim–Meyer-type dimension estimators.',
    hqivRelevance:
      'Sorkin’s causal-set programme is the ontological neighbour HQIV speaks to most directly: HQIV adopts the locally-finite partial order ≺ as its primitive object and inherits the sprinkling and dimension-estimator vocabulary that the 3D causal-growth paper uses to argue d = 3 transverse counting. HQIV departs from the standard causal-set programme in two specific places — it counts null-shell modes (quadratic in m) rather than bulk-ball volume (cubic), and it selects a specific octonionic gauge completion — but the substrate is recognisably Sorkin’s.',
    themes: ['causal sets', 'discrete spacetime', 'sequential growth', 'sprinkling'],
    works: [
      {
        title: 'Space-Time as a Causal Set',
        venue: 'Phys. Rev. Lett. 59, 521–524 (with L. Bombelli, J. Lee, D. Meyer)',
        year: 1987,
        type: 'article',
        doi: '10.1103/PhysRevLett.59.521',
      },
      {
        title: 'Causal Sets: Discrete Gravity',
        venue: 'Lectures on Quantum Gravity (A. Gomberoff & D. Marolf, eds.), Springer, 305–327',
        year: 2005,
        type: 'review',
        doi: '10.1007/0-387-24992-3_7',
        arxiv: 'gr-qc/0309009',
      },
      {
        title: 'Classical Sequential Growth Dynamics for Causal Sets',
        venue: 'Phys. Rev. D 61, 024002 (with D. P. Rideout)',
        year: 2000,
        type: 'article',
        doi: '10.1103/PhysRevD.61.024002',
        arxiv: 'gr-qc/9904062',
      },
    ],
  },
  {
    id: 'nielsen',
    name: 'Jenny Lorraine Nielsen',
    role: 'Director of Research · theoretical physicist',
    affiliation: 'Center for Topological Physics · University of Kansas',
    imageCredit: 'Portrait omitted pending a permissively-licensed source.',
    links: {
      website: 'https://www.centerfortopologicalphysics.com/',
      institution: 'https://www.centerfortopologicalphysics.com/about',
    },
    bio:
      'Director of the Center for Topological Physics and originator of Topological Unified Field Theory (TUFT): a programme showing that charge-quantised, U(1)-complete gauge theories must be formulated on the universal complex Hopf fibration S¹ → S^∞ → ℂP^∞ and its finite shells S¹ → S^{2n+1} → ℂP^n, with Standard-Model gauge factors, Einstein–Cartan gravity, Beltrami contact spectra and zeta-regularised sector determinants arising as reductions along nested Hopf shells.',
    hqivRelevance:
      'Nielsen’s TUFT is the topological neighbour HQIV bridges in its Hopf-shell formalisation layer: nested fibrations supply U(1) from the circular fibre, SU(2) from the S³ shell and SU(3) from S⁵; fibre-winding sectors yield three generations with a hyperbolic cut-off at n = 4; Beltrami eigenvalues on S³ align with HQIV’s existing Laplace–Beltrami data (with explicit Peter–Weyl vs coexact normalisation tracked in Lean). HQIV imports the finite-shell discipline and 4/3 resonance match where lock-in neighbours coincide — without silently identifying TUFT’s continuous charts with HQIV’s discrete patch ontology.',
    themes: [
      'TUFT',
      'Hopf fibration',
      'contact Beltrami spectrum',
      'three generations',
      'gauge–gravity unification',
    ],
    works: [
      {
        title:
          'The Topological Unified Field Theory on the Complex Hopf Fibration (The Complex Hopf Fibration as the Canonical Space for Gauge-Gravity Unification: The Field, Universal Action, and Particle Spectrum)',
        venue: 'International Journal of Topology (forthcoming); PhilArchive NIETTU',
        year: 2026,
        type: 'preprint',
        url: 'https://philarchive.org/rec/NIETTU',
      },
    ],
  },
  {
    id: 'ettinger',
    name: 'Steven Ettinger Jr',
    role: 'Independent researcher · HQIV programme lead',
    affiliation: 'Independent (steven@disregardfiat.tech)',
    imageCredit: 'Portrait omitted pending a permissively-licensed source.',
    links: {
      website: 'https://disregardfiat.tech',
      institution: 'https://github.com/HQIV',
      scholar: 'https://zenodo.org/communities/hqiv',
    },
    bio:
      'Independent researcher running the HQIV (Horizon-Quantised Informational Vacuum) programme: a discrete patch quantum theory built on two axioms — a discrete light-cone shell law A(m) = 4(m+1)(m+2) and informational monogamy on overlapping horizons — together with a machine-checked Lean 4 library certifying the load-bearing identities (zero sorry across the audited cone).',
    hqivRelevance:
      'Primary author of the HQIV manuscript series this site indexes. The closure paper and the 3D causal-growth sequel establish the audited chain uniform growth ⇒ K ⇒ Ω ⇒ R ⇒ ∆ ⇒ ⟨G₂ ∪ {∆}⟩_Lie = so(8), with α = 3/5 forced shell-by-shell by the hockey-stick identity and γ = 2/5 fixed as the unit-split complement.',
    themes: [
      'HQIV',
      'discrete light-cone',
      'octonionic gauge',
      'Lean 4 formalisation',
      'α = 3/5 imprint',
    ],
    activeContributor: true,
    works: [
      {
        title:
          'From Discrete Null-Lattice Growth to so(8): Concrete Realization and Exact Lie Closure',
        venue: 'Zenodo (HQIV community); latest version DOI 10.5281/zenodo.21328050 (2026-07-12)',
        year: 2026,
        type: 'preprint',
        doi: '10.5281/zenodo.21328050',
      },
      {
        title:
          'Discrete Electronic Structure from the HQIV Light Cone: Condensed Packing, Bands, SCF/Fock/KS, and Core Spectroscopy without Fitted XC',
        venue: 'Zenodo (HQIV community); v1 DOI 10.5281/zenodo.21286980 (2026-07-10)',
        year: 2026,
        type: 'preprint',
        doi: '10.5281/zenodo.21286980',
      },
      {
        title:
          'Three-Dimensional Causal Growth and the Octonionic Gauge Sector: Conditional Forcing and a Uniqueness Conjecture',
        venue: 'Zenodo (HQIV community), preprint v1 — May 26, 2026',
        year: 2026,
        type: 'preprint',
        url: 'https://zenodo.org/communities/hqiv',
      },
      {
        title:
          'Light-Cone-Derived Auxiliary Fields Supply an Explicit Derived Interpretation of Quantum Superposition',
        venue: 'Zenodo (HQIV community); v2 DOI 10.5281/zenodo.19336553 (2026-03-30)',
        year: 2026,
        type: 'preprint',
        doi: '10.5281/zenodo.19336553',
      },
      {
        title:
          'HQIV-Lean — Lean 4 Formalisation of the HQIV Closure and Forcing Theorems (public slimmed mirror)',
        venue: 'GitHub (HQIV organization)',
        year: 2026,
        type: 'repository',
        url: 'https://github.com/HQIV/hqiv-lean',
      },
    ],
  },
]

export type ResolvedLink = { label: string; href: string; tone: 'primary' | 'muted' }

/** Build the display link list for an author, skipping anything not provided. */
export function resolveLinks(a: Author): ResolvedLink[] {
  const out: ResolvedLink[] = []
  if (a.links.orcid)
    out.push({ label: `ORCID ${a.links.orcid}`, href: `https://orcid.org/${a.links.orcid}`, tone: 'primary' })
  if (a.links.website)
    out.push({ label: 'Website', href: a.links.website, tone: 'primary' })
  if (a.links.institution && a.links.institution !== a.links.website)
    out.push({ label: 'Institution', href: a.links.institution, tone: 'muted' })
  if (a.links.scholar) out.push({ label: 'Google Scholar', href: a.links.scholar, tone: 'muted' })
  if (a.links.blog) out.push({ label: 'Blog', href: a.links.blog, tone: 'muted' })
  if (a.links.wikipedia) out.push({ label: 'Wikipedia', href: a.links.wikipedia, tone: 'muted' })
  return out
}

export function workHref(w: Work): string | null {
  if (w.doi) return `https://doi.org/${w.doi}`
  if (w.arxiv) return `https://arxiv.org/abs/${w.arxiv}`
  return w.url ?? null
}

export function workIdentifier(w: Work): string | null {
  if (w.doi) return `doi:${w.doi}`
  if (w.arxiv) return `arXiv:${w.arxiv}`
  return null
}

/** "JCB" / "NF" / "MEM" — initials for the monogram fallback avatar. */
export function initials(name: string): string {
  const parts = name
    .replace(/\(.*?\)/g, '')
    .split(/\s+/)
    .map((s) => s.replace(/[^A-Za-z]/g, ''))
    .filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}
