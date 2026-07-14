/**
 * Public HQIV resources: the three places where the framework actually
 * lives outside this site. Wording on the Resources page mirrors the
 * Zenodo community's stated mission and curation policy verbatim where
 * possible, so the site can't drift from the curation rules.
 *
 * Sources:
 *   https://github.com/HQIV
 *   https://zenodo.org/communities/hqiv (About + Curation Policy)
 *   https://discord.gg/UUfGBQBv
 */

export type ResourceKind = 'code' | 'archive' | 'community'

export type Resource = {
  id: string
  kind: ResourceKind
  name: string
  url: string
  /** One-line tagline for cards. */
  tagline: string
  /** What lives there, in plain language. */
  what: string
  /** When the casual reader should click through. */
  audience: string
  /** Short bullet list of concrete contents / sections. */
  contains: string[]
}

export const resources: Resource[] = [
  {
    id: 'github',
    kind: 'code',
    name: 'HQIV on GitHub',
    url: 'https://github.com/HQIV',
    tagline: 'Living software: Lean 4 proofs, calculators, simulation code.',
    what:
      'The HQIV GitHub organisation hosts the working source for the framework — the hqiv-lean ecosystem, Python simulation packages, browser-side calculators (Quantum Maxwell, octonion Lie-algebra tools), and the patch / build artifacts referenced in the Zenodo records.',
    audience:
      'Read here if you want to compile the Lean proofs, re-run a simulation, or read the actual source for a claim instead of a paragraph about it.',
    contains: [
      'hqiv-lean — Lean 4 formalisations (axioms, derivations, octonionic constructions)',
      'pyhqiv (HQIV/pyhqiv) — Python implementation, tests, and the HQIV Arena CI scorer',
      'hqiv-arena CLI — clone, run, submit PRs; leaderboard at disregardfiat.tech/#arena',
      'Arena chemistry panels — spectroscopy, crystal contacts, condensed-phase audits (lightcone chemistry extent)',
      'Browser calculators (Quantum Maxwell, octonion Lie-algebra)',
      'CLASS / N-body patches and analysis scripts',
      'Build instructions and Alectryon-ready proof documentation',
    ],
  },
  {
    id: 'zenodo',
    kind: 'archive',
    name: 'HQIV community on Zenodo',
    url: 'https://zenodo.org/communities/hqiv',
    tagline: 'Curated, DOI-anchored archive of papers, datasets and code.',
    what:
      'A CERN-hosted, peer-curated record of HQIV outputs: preprints, technical notes, simulation datasets and Lean packages, each carrying a permanent DOI. The community is open to anyone — including critics — and submissions are reviewed against an explicit curation policy that demands formal verification, reproducibility, and honest labelling of what is proven vs. conjectured.',
    audience:
      'Read here if you want the definitive, citable version of an HQIV result, or if you want to submit your own constructive or critical work against the framework.',
    contains: [
      'Preprints and published articles with permanent DOIs',
      'Technical notes (e.g. the so(8) closure realisation review)',
      'Lean 4 proof libraries and Alectryon snapshots',
      'Reproducible simulation datasets and analysis outputs',
      'Versioned records — major updates re-deposited with clear lineage',
    ],
  },
  {
    id: 'discord',
    kind: 'community',
    name: 'HQIV Discord',
    url: 'https://discord.gg/UUfGBQBv',
    tagline: 'Active development discussion and informal review.',
    what:
      'The HQIV Discord is where day-to-day work happens: open questions, proof-in-progress threads, simulator screenshots, and constructive critique. It is the natural staging ground for ideas before they become Zenodo records.',
    audience:
      'Drop in if you want to ask the authors a question, follow active threads, or workshop a critique or alternative formalisation before committing it to the archive.',
    contains: [
      'Open #proofs and #simulation discussion',
      'Real-time help with Lean builds and Python pipelines',
      'Pre-submission feedback for prospective Zenodo contributors',
      'Coordination with the broader division-algebra / horizon-physics community',
    ],
  },
]

/**
 * Pulled verbatim (lightly trimmed) from the Zenodo community's
 * "Standards & Philosophy" and "Core Principles" sections so the site
 * cannot misrepresent the curation rules.
 */
export type CurationPillar = { title: string; body: string }

export const curationPillars: CurationPillar[] = [
  {
    title: 'Formal verification first',
    body:
      'Mathematical claims — especially core derivations, physical predictions, and group structures — must be supported by complete, machine-checked proofs in Lean 4 (or an equivalent prover) wherever feasible. Proofs are expected to compile cleanly with no `sorry` tactics for claimed results.',
  },
  {
    title: 'No overclaiming',
    body:
      'Titles, abstracts and descriptions must accurately reflect what has been proven versus what remains conjectural or supported only by simulation / numerical evidence. Strong claims without matching formal evidence are not accepted.',
  },
  {
    title: 'Critical engagement is welcomed',
    body:
      'Rigorous refutations, identifications of tensions or gaps, alternative formalisations, and falsification attempts are explicitly invited and evaluated by the same standards as constructive contributions. Well-argued criticism that meets the formal and documentation bar will not be rejected for being critical.',
  },
  {
    title: 'Reproducibility & documentation',
    body:
      'Every code and data submission ships with a README, dependencies, parameters and instructions sufficient for independent reproduction. Living code on GitHub is strongly preferred, and the Zenodo record points to a version-tagged snapshot of it.',
  },
  {
    title: 'Constructive curator review',
    body:
      'Curators may accept, request revisions, edit metadata for consistency, or decline submissions. Reviews aim to be timely and constructive. As a working rule: if your formal verifications build and your manuscript matches the formal verification, your submission will be accepted.',
  },
]
