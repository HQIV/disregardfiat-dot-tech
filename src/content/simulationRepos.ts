/**
 * External simulation codebases referenced from the HQIV Calculator tab.
 * Repos live in the HQIV GitHub organisation.
 */

export type SimulationRepo = {
  id: string
  name: string
  url: string
  tagline: string
  what: string
  contains: string[]
  /** Optional deep links into the same repo (e.g. CLASS vs HiCLASS subtrees). */
  subtrees?: { label: string; path: string }[]
}

export const HQIV_CLASS_REPO = 'https://github.com/HQIV/hqiv-class'
export const HQIV_NBODY_REPO = 'https://github.com/HQIV/n-body'

export const simulationRepos: SimulationRepo[] = [
  {
    id: 'class',
    name: 'CLASS patch',
    url: `${HQIV_CLASS_REPO}/tree/main/class`,
    tagline: 'Cosmic linear anisotropy solving system with HQIV metric modifications.',
    what:
      'A patched build of CLASS (Cosmic Linear Anisotropy Solving System) that ingests the HQIV auxiliary field φ and effective gravitational strength G_eff(φ) = φ^{3/5}. Use this to reproduce CMB and large-scale structure predictions from the modified Friedmann sector.',
    contains: [
      'HQIV-modified background evolution',
      'Perturbation equations aligned with the lapse-dragging identification',
      'Run scripts and analysis notebooks under runs/ and analysis/',
    ],
  },
  {
    id: 'hiclass',
    name: 'HiCLASS',
    url: `${HQIV_CLASS_REPO}/tree/main/hi_class`,
    tagline: 'Horizon-informed CLASS extension for patch-internal cosmology.',
    what:
      'The HiCLASS subtree in hqiv-class implements the horizon-quantised information vacuum chart inside the CLASS framework. It is the preferred entry point when comparing HQIV to Planck-era constraints with the full perturbation pipeline.',
    contains: [
      'HiCLASS source and build hooks',
      'Parameter files for HQIV lock-in shells',
      'Shared analysis/ and scripts/ with the CLASS patch',
    ],
    subtrees: [
      { label: 'Full hqiv-class repo', path: '' },
      { label: 'CLASS patch', path: 'class' },
      { label: 'HiCLASS', path: 'hi_class' },
    ],
  },
  {
    id: 'n-body',
    name: 'N-body simulation',
    url: HQIV_NBODY_REPO,
    tagline: 'Non-linear structure formation with HQIV-modified gravity.',
    what:
      'PySCO-based N-body pipeline with HQIV metric modifications in hqiv_modifications/. Runs galaxy-scale and cosmological box simulations where G_eff(φ) replaces a fixed Newton constant.',
    contains: [
      'hqiv_modifications/ — patched force law and lapse coupling',
      'PySCO submodule and run configurations',
      'Analysis scripts and documented example runs',
    ],
  },
]
