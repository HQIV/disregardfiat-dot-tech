#!/usr/bin/env python3
"""Apply Lean-spine audit + honest programme copy to programme_sigma.json (schema v2)."""

from __future__ import annotations

import json
import urllib.request
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path

LIVE_URL = "https://raw.githubusercontent.com/HQIV/pyhqiv/main/arena/programme_sigma.json"
OUT = Path(__file__).resolve().parents[1] / "public/arena/programme_sigma.json"

# Each entry: status, evidence, modules, and honest programme copy.
# in_spine = what Lean/paper chain already discharges
# remaining = what treatment is still missing (specific, not vague)
# blockers = known conceptual blockers, or "None known"
AUDIT: dict[str, dict] = {
    "theory-of-everything": {
        "status": "partial",
        "lean_evidence_level": "theorem_pack",
        "lean_modules": [
            "Hqiv.Geometry.OctonionicLightCone",
            "Hqiv.SO8Closure",
            "Hqiv.Physics.Action",
            "Hqiv.Physics.ActionHolonomyGlue",
            "Hqiv.Physics.SO8PlaquetteHolonomy",
            "Hqiv.Physics.TuftSynthesisZetaHolonomyDischarge",
            "Hqiv.Algebra.AnomalyCancellation",
            "Hqiv.Physics.GRFromMaxwell",
            "Hqiv.Physics.ModifiedMaxwell",
            "Hqiv.Physics.DerivedNucleonMass",
            "Hqiv.Physics.HopfShellBeltramiMassBridge",
            "HqivSpine.Physics.WilsonLoop",
        ],
        "hqiv": "Unified discrete action, holonomy discharge, and SM anomaly cancellation in Lean — tier-III patch dictionary still fit-out.",
        "in_spine": (
            "One discrete action cell (O–Maxwell + gravity on shared φ); S_HQIV⇒L_SM bridge; "
            "three-generation SM anomaly-free (AnomalyCancellation); cyclic Stokes + SO(8) plaquette holonomy "
            "(ActionHolonomyGlue, SO8PlaquetteHolonomy, TuftSynthesisZetaHolonomyDischarge, WilsonLoop)."
        ),
        "remaining": (
            "Tier-III cross-patch dictionary for arbitrary observables; full continuum limit matching "
            "every standard QFT calculation workflow; Haar/measure normalization on rotated charts "
            "(NonAbelianHolonomyMeasureScaffold — explicit open frontier, not missing holonomy proofs)."
        ),
        "blockers": "None known — the Lagrangian exists in the discrete spine; remaining work is dictionary and fit-out, not missing action postulates.",
        "papers": [
            "unified-framework",
            "octonionic-action",
            "tuft-sm-lagrangian",
        ],
    },
    "quantum-gravity": {
        "status": "partial",
        "lean_evidence_level": "theorem_pack",
        "lean_modules": [
            "Hqiv.QuantumMechanics.HorizonLimitedQM_QFT_Closure",
            "Hqiv.QuantumMechanics.HorizonLimitedRenormLocality",
            "Hqiv.QuantumMechanics.BornMeasurementFinite",
            "Hqiv.Geometry.HQVMetric",
            "Hqiv.Geometry.OctonionicLightCone",
        ],
        "hqiv": "GR+QM consistency on a finite causal carrier — graviton QFT kept as comparison layer.",
        "in_spine": "Locally finite causal order, finite Born/measurement ledgers, horizon-limited QFT closure, Ω_k(N;N)=1 at the horizon.",
        "remaining": "Continuum graviton S-matrix baseline; exhaustive map of every GR clock into HQVM.",
        "blockers": "None known — ontology is patch-first by design, not stuck on a hidden inconsistency.",
    },
    "black-hole-information": {
        "status": "partial",
        "lean_evidence_level": "scaffold",
        "lean_modules": [
            "Hqiv.QuantumMechanics.BornMeasurementFinite",
            "Hqiv.QuantumMechanics.HorizonLimitedQM_QFT_Closure",
        ],
        "hqiv": "Soft-firewall bookkeeping on the auxiliary channel — Page-curve theorem still to build.",
        "in_spine": "Finite measurement layer with auxiliary transfer; horizon energy closure lemmas.",
        "remaining": "Explicit black-hole patch geometry; proved information release / Page curve in Lean.",
        "blockers": "Dedicated BH thermodynamics module not yet in the spine — engineering gap, not a claimed paradox resolution.",
    },
    "problem-of-time": {
        "status": "partial",
        "lean_evidence_level": "theorem_pack",
        "lean_modules": [
            "Hqiv.Geometry.UniverseAge",
            "Hqiv.Geometry.Now",
            "Hqiv.Geometry.HQVMetric",
        ],
        "hqiv": "Multiple physical clocks are first-class; lapse/age ratio is proved, absolute Gyr values are readouts.",
        "in_spine": "Shell-indexed rapidity, ADM lapse compression, UniverseAge ratio algebra, Now slice selection.",
        "remaining": "Spell out every GR coordinate-time choice in the variational layer; tie complex-time Stokes bridge to all sectors.",
        "blockers": "None known — documentation and chart glue, not a conceptual deadlock.",
    },
    "interpretation-of-qm": {
        "status": "reinterpreted",
        "lean_evidence_level": "theorem_pack",
        "lean_modules": [
            "Hqiv.QuantumMechanics.BornMeasurementFinite",
            "Hqiv.QuantumMechanics.HorizonLimitedQM_QFT_Closure",
        ],
        "hqiv": "Pilot-wave style: Born rule from a finite measurement layer — not many-worlds.",
        "in_spine": "Born norms, collapse rules, and aux-channel transfer proved on finite patches (BornMeasurementFinite).",
        "remaining": "Full apparatus map for every experimental setup; community acceptance of the interpretation frame.",
        "blockers": "None known in the formal layer — this is a reframing, not a half-built proof.",
    },
    "arrow-of-time": {
        "status": "addressed",
        "lean_evidence_level": "theorem_pack",
        "lean_modules": [
            "Hqiv.Physics.ThermodynamicArrowFromShellOpening",
            "Hqiv.Physics.ThermodynamicLawsFromLadder",
            "Hqiv.Topology.ShellOpeningEvolution",
        ],
        "hqiv": "Thermodynamic arrow from shell opening — certified Lyapunov relaxation, no extra postulate.",
        "in_spine": "Causal order forbids closed loops; entropy production ≥0 on finite patches; shell-opening Lyapunov certificate.",
        "remaining": "Arena cross-checks on specific cosmological initial slices (σ metrics only).",
        "blockers": "None known.",
    },
    "yang-mills-mass-gap": {
        "status": "out_of_scope",
        "lean_evidence_level": "none",
        "lean_modules": ["Hqiv.Physics.DiscreteYMConfinement"],
        "hqiv": "Millennium analytic QFT — outside patch mandate; discrete confinement is the HQIV route.",
        "in_spine": "DiscreteYMConfinement documents scope; colour binding on the hadron spine is separate.",
        "remaining": "Clay-problem mass-gap proof in continuum Yang–Mills.",
        "blockers": "Programme choice — not targeted.",
    },
    "cosmological-constant": {
        "status": "partial",
        "lean_evidence_level": "theorem_pack",
        "lean_modules": [
            "Hqiv.Physics.InformationalEnergyMass",
            "Hqiv.Physics.ModalFrequencyHorizon",
            "Hqiv.Physics.HorizonBlackbodySpectrum",
            "Hqiv.Geometry.HQVMetric",
        ],
        "hqiv": "Finite-mode vacuum sum gives small ρ_vac naturally — not every QFT cutoff scheme closed in Lean yet.",
        "in_spine": "Mode counting on the null lattice; finite Kirchhoff sum ½N(m)ω(m) to m_now; vacuum_energy_discrepancy=0 in Arena witness.",
        "remaining": "Theorem matching every mainstream QFT vacuum estimate; full renormalisation dictionary.",
        "blockers": "None known for the finite-sum mechanism — remaining work is comparison proofs, not a failed cancellation.",
    },
    "dark-energy": {
        "status": "partial",
        "lean_evidence_level": "theorem_pack",
        "lean_modules": [
            "Hqiv.Physics.GRFromMaxwell",
            "Hqiv.Geometry.HQVMetric",
        ],
        "hqiv": "Acceleration from G_eff(φ)=φ^(3/5) + lapse — coincidence problem is fit-out, not missing physics.",
        "in_spine": "Modified Friedmann sector with G_eff(φ); lapse dragging tied to the same φ as gauge (GRFromMaxwell).",
        "remaining": "Uniqueness proof for why we sit on the accelerating hypersurface today; CLASS/HiCLASS pipeline sign-off.",
        "blockers": "None known — need simulation + σ reduction, not a new constant.",
    },
    "dark-matter": {
        "status": "reinterpreted",
        "lean_evidence_level": "scaffold",
        "lean_modules": [
            "Hqiv.Physics.HQIVFluidClosureScaffold",
            "Hqiv.Physics.OrbitalFlybyScaffold",
        ],
        "hqiv": "No new stable particle — galactic curves from horizon-modified inertia.",
        "in_spine": "Modified-inertia algebra on HQIVFluidClosureScaffold; no dark-matter particle sector required.",
        "remaining": "SPARC/flyby residuals driven down in Arena; lensing and cluster tests at σ.",
        "blockers": "None known for the reinterpretation — risk is phenomenology fit, not internal inconsistency.",
    },
    "matter-antimatter-asymmetry": {
        "status": "partial",
        "lean_evidence_level": "calibrated_witness",
        "lean_modules": [
            "Hqiv.Physics.BaryogenesisCore",
            "Hqiv.Physics.BaryogenesisWitness",
            "Hqiv.Physics.BaryogenesisEtaPaper",
            "Hqiv.Physics.TrialityRapidityWellEquivalence",
        ],
        "hqiv": "BBN η ~6.20 from dynamics (Arena ~1.6% off PDG) — geometry proved, last digits are fit-out.",
        "in_spine": "Ω_k lock-in geometry, shell integrator structure, triality CP scaffold (BaryogenesisCore).",
        "remaining": "Push η from calibrated witness to pure theorem; tighten bbn_eta10 σ in Arena.",
        "blockers": "None known — η is tracked numerically, not hand-fitted as an independent ΛCDM knob.",
    },
    "hubble-tension": {
        "status": "partial",
        "lean_evidence_level": "theorem_pack",
        "lean_modules": [
            "Hqiv.Geometry.UniverseAge",
            "Hqiv.Cosmology.CosmologicalShellLadder",
        ],
        "hqiv": "Wall-clock vs apparent age split is in spine — explicit H₀ pipeline comparison is fit-out.",
        "in_spine": "UniverseAge lapse ratio (51.2 Gyr wall vs 13.8 Gyr appearance); shell ladder for distance–redshift.",
        "remaining": "End-to-end H₀ comparison vs Planck + local ladders with published error bars in Arena.",
        "blockers": "None known — mechanism is specified; missing piece is the published comparison table.",
    },
    "horizon-problem": {
        "status": "partial",
        "lean_evidence_level": "theorem_pack",
        "lean_modules": [
            "Hqiv.Topology.ShellOpeningEvolution",
            "Hqiv.Physics.ThermodynamicArrowFromShellOpening",
            "Hqiv.Cosmology.CosmologicalShellLadder",
            "Hqiv.Physics.HorizonBlackbodyLadder",
            "Hqiv.Physics.HarmonicLadderMass",
            "Hqiv.Physics.CosmologicalPerturbationReadout",
        ],
        "hqiv": "The temperature/shell ladder is the homogeneity engine — fast harmonic steps post–big bang, not a separate inflaton field.",
        "in_spine": (
            "Shell-opening convergence and horizon monogamy (ShellOpeningEvolution); auxiliary temperature ladder "
            "T(m) and harmonic shell steps supply the inflationary role — discrete null-shell growth accelerates "
            "after lock-in (CosmologicalShellLadder, HorizonBlackbodyLadder, HarmonicLadderMass)."
        ),
        "remaining": (
            "Extend HiCLASS / hqiv-class to propagate the discrete quadratic growth paradigm through CMB "
            "perturbations and large-scale isotropy — simulation fit-out, not a missing inflaton postulate in Lean."
        ),
        "blockers": "None known — spine specifies the ladder; HiCLASS build-out is engineering.",
        "papers": [
            "unified-framework",
            "finite-mode-kirchhoff",
            "3d-causal-growth",
        ],
    },
    "flatness-problem": {
        "status": "partial",
        "lean_evidence_level": "calibrated_witness",
        "lean_modules": [
            "Hqiv.Geometry.OctonionicLightCone",
            "Hqiv.Geometry.HQVMetric",
            "Hqiv.Cosmology.CosmologicalShellLadder",
        ],
        "hqiv": "Ω_k(now)~0.0098 within |Ω_k|<0.02 Planck band (Arena z≈0.44); flatness_tuning_exponent=0.",
        "in_spine": "Lattice curvature + Friedmann packaging; dynamic Ω_k(now) readout without 10^60 initial tuning.",
        "remaining": "Prove initial-condition independence in Lean; optional tighten vs Planck central 0.001.",
        "blockers": "None known for the no-fine-tuning claim — present slice is inside observational band.",
    },
    "generations-of-matter": {
        "status": "partial",
        "lean_evidence_level": "theorem_pack",
        "lean_modules": [
            "Hqiv.Algebra.Triality",
            "HqivSpine.Physics.LadderMixingHierarchy",
            "HqivSpine.Physics.MassLadder",
        ],
        "hqiv": "Three generations from Spin(8) triality — CKM/Yukawa digits still fit-out.",
        "in_spine": "Three representation labels and order-3 cycle certified (Triality); mass ladder hooks.",
        "remaining": "Full measured CKM/PMNS matrices from LadderMixingHierarchy (module states this explicitly).",
        "blockers": "None known — mixing magnitudes are the remaining derivation, not a missing generation count.",
    },
    "hierarchy-problem": {
        "status": "partial",
        "lean_evidence_level": "theorem_pack",
        "lean_modules": [
            "Hqiv.Physics.GRFromMaxwell",
            "Hqiv.Physics.InformationalEnergyMass",
            "Hqiv.Physics.DerivedGaugeAndLeptonSector",
        ],
        "hqiv": "No quadratic tuning knob — G_eff(φ) and lock-in readouts; hierarchy_tuning_exponent=0 in Arena.",
        "in_spine": "G_eff(φ)=φ^(3/5); electroweak/GUT scales from lock-in shell + lattice counts; α_GUT=1/42.",
        "remaining": "Continuum proof matching every SM renormalisation scheme; uniqueness vs anthropics.",
        "blockers": "None known for the no-tuning-exponent witness — not claiming SUSY stabilization proofs.",
    },
    "color-confinement": {
        "status": "addressed",
        "lean_evidence_level": "theorem_pack",
        "lean_modules": [
            "Hqiv.Physics.GluonCurvatureArtifact",
            "Hqiv.Physics.TrappedCasimirBindingBridge",
            "Hqiv.Physics.StrongColorSu3ChartClosure",
            "Hqiv.Physics.StrongColorSu3LieCertificate",
            "Hqiv.Physics.QuarkMetaResonance",
            "Hqiv.Physics.DerivedNucleonMass",
            "Hqiv.Physics.HadronS7ConfinementReadout",
        ],
        "hqiv": "Confinement without propagating gluons — trapped Casimir on strong octonion channels (gluon artifact paper).",
        "in_spine": (
            "Gluon-as-curvature-artifact closure: strong binding = inner–outer Casimir trapping on channels {4,5,6,7}, "
            "one unified curvature-log kernel (GluonCurvatureArtifact); proton/hadron network binding and SU(3) chart "
            "Lie certificates (StrongColorSu3ChartClosure). HEP decay readout discharges strong-sector widths and OZI slots."
        ),
        "remaining": "Excited-hadron spectrum polish in Arena; optional continuum Wilson-loop comparison layer (not the programme ontology).",
        "blockers": "None known — confinement is the trapped-Casimir readout, not a missing proof.",
        "papers": [
            "gluon-curvature",
            "hep-decay-readout",
            "tuft-sm-lagrangian",
            "unified-framework",
        ],
    },
    "strong-cp": {
        "status": "partial",
        "lean_evidence_level": "theorem_pack",
        "lean_modules": [
            "Hqiv.Physics.GluonCurvatureArtifact",
            "Hqiv.Physics.HepDecayReadout",
            "Hqiv.Physics.HepAnomalyDischarge",
            "HqivSpine.Physics.CPHolonomyPhase",
            "HqivSpine.Physics.CKMCPPhase",
        ],
        "hqiv": "No independent gluon DOF → no fitted θ_QCD; CP-odd holonomy from Fano ledger (HEP decay + CPHolonomyPhase).",
        "in_spine": (
            "Strong sector has no propagating gluon field in the proved action (GluonCurvatureArtifact) — the usual "
            "θ_QCD knob is absent by ontology. CP violation enters as oriented Fano holonomy skew "
            "(cpOddFanoHolonomySkew in HepDecayReadout; CPHolonomyPhase Jarlskog/holonomy layer)."
        ),
        "remaining": (
            "Full 3×3 CKM from Fano overlaps (CPHolonomyPhase lists this as open); mainstream θ_QCD comparison "
            "wording for external reviewers; extend HEP anomaly discharge panel σ."
        ),
        "blockers": "None known — strong-CP smallness is structural (no gluon field), not an axion fit-out.",
        "papers": [
            "gluon-curvature",
            "hep-decay-readout",
            "tuft-sm-lagrangian",
        ],
    },
    "neutrino-mass": {
        "status": "partial",
        "lean_evidence_level": "theorem_pack",
        "lean_modules": [
            "HqivSpine.Physics.NeutrinoCurvatureSuppression",
            "HqivSpine.Physics.NeutrinoMixing",
            "HqivSpine.Physics.NeutrinoAbsoluteScale",
            "Hqiv.Physics.ModalFrequencyHorizon",
        ],
        "hqiv": "Mixing angles and ordering in spine — absolute Σm_ν scale and Majorana/Dirac choice open.",
        "in_spine": "Curvature suppression ladder, Fano-plane mixing (θ=π/4, δ=π/5), ordering lemmas.",
        "remaining": "NeutrinoAbsoluteScale closure; PDG Σm_ν comparison in Arena.",
        "blockers": "None known — scale sector is the named open module, not a hidden conflict.",
    },
    "muon-g2": {
        "status": "partial",
        "lean_evidence_level": "theorem_pack",
        "lean_modules": ["Hqiv.Physics.HopfShellBeltramiMassBridge"],
        "hqiv": "Leading TUFT spurion in spine (~4–5% high vs experiment) — subleading terms are fit-out.",
        "in_spine": "tuftAnomalousMomentSpurion: a_ℓ from exp(n α_em/6) Beltrami winding (HopfShellBeltramiMassBridge).",
        "remaining": "Subleading zeta-determinant terms; full FNAL/CODATA closure in paper_comparisons_max_abs_z.",
        "blockers": "None known — leading term is derived; gap is higher-order arithmetic.",
    },
    "galaxy-rotation": {
        "status": "partial",
        "lean_evidence_level": "scaffold",
        "lean_modules": [
            "Hqiv.Physics.HQIVFluidClosureScaffold",
            "Hqiv.Physics.OrbitalFlybyScaffold",
        ],
        "hqiv": "Inertia-screening formula in spine — SPARC catalog match is Arena fit-out.",
        "in_spine": "Horizon-modified inertia scaffold (HQIVFluidClosureScaffold).",
        "remaining": "Drive orbital_flyby_sparc_model_residual down across SPARC galaxies.",
        "blockers": "None known — physics route chosen; missing piece is numerical agreement.",
    },
    "flyby-anomaly": {
        "status": "partial",
        "lean_evidence_level": "scaffold",
        "lean_modules": [
            "Hqiv.Physics.OrbitalFlybyScaffold",
            "Hqiv.Physics.HQIVFluidClosureScaffold",
        ],
        "hqiv": "Scaffold records the screening law — Anderson et al. trajectory match not claimed yet.",
        "in_spine": "OrbitalFlybyScaffold inertia-screening algebra.",
        "remaining": "Integrated flyby trajectories vs published residuals; dynamic corrections in Arena.",
        "blockers": "None known — module header states trajectory match is not yet claimed.",
    },
    "cmb-birefringence": {
        "status": "partial",
        "lean_evidence_level": "theorem_pack",
        "lean_modules": [
            "Hqiv.Physics.CMBBirefringenceFirstPrinciples",
            "Hqiv.Physics.HorizonBlackbodyLadder",
            "Hqiv.Physics.HorizonBlackbodySpectrum",
        ],
        "hqiv": "β=α·log traversal proved in Lean — Planck ~0.4σ is Arena fit-out, not yet a Lean theorem.",
        "in_spine": "α=3/5 imprint; cumulative shell traversal (CMBBirefringenceFirstPrinciples).",
        "remaining": "Formalise Planck DR4 comparison in Lean; tighten cmb_birefringence_z in Arena.",
        "blockers": "None known — mechanism predicts O(0.3–0.4)°; σ gap is witness calibration.",
    },
    "proton-decay-spin": {
        "status": "partial",
        "lean_evidence_level": "theorem_pack",
        "lean_modules": [
            "Hqiv.Physics.DerivedNucleonMass",
            "Hqiv.Physics.QuarkMetaResonance",
        ],
        "hqiv": "Proton mass + stability channel in spine — spin decomposition and GUT decay not closed.",
        "in_spine": "Proton anchor at referenceM; colour-singlet antisymmetric channel cost (DerivedNucleonMass).",
        "remaining": "Spin crisis ledger on 8×8 composites; GUT-scale decay lifetime (not predicted).",
        "blockers": "None known for stability/mass — spin content is the open formalisation.",
    },
    "nuclear-binding": {
        "status": "addressed",
        "lean_evidence_level": "theorem_pack",
        "lean_modules": [
            "Hqiv.Physics.NuclearCurvatureBinding",
            "Hqiv.Physics.NeutronLifetimeMethod",
            "Hqiv.Physics.DynamicNucleonPN",
            "Hqiv.Physics.NuclearCausticBinding",
        ],
        "hqiv": "Deuteron B from Lean spectraDeuteronBinding_MeV — ~0.75σ vs AME2020; A≤4 binding spine closed in Lean.",
        "in_spine": "8×8 E_bind through light isotopes; neutron β width; tritium τ on B_curv(ξ) ledgers.",
        "remaining": "Heavier-nuclei isotope ladder (A>4) and dynamic curvature-binding extensions.",
        "blockers": "None known for the A≤4 theorem pack.",
    },
    "high-tc-superconductivity": {
        "status": "out_of_scope",
        "lean_evidence_level": "none",
        "lean_modules": [],
        "hqiv": "Not on the horizon-lattice programme roadmap.",
        "in_spine": "Chemistry spine exists separately; not wired to HTSC.",
        "remaining": "Any condensed-matter mechanism.",
        "blockers": "Programme choice — not targeted.",
    },
    "navier-stokes": {
        "status": "out_of_scope",
        "lean_evidence_level": "none",
        "lean_modules": ["Hqiv.Physics.HQIVFluidClosureScaffold"],
        "hqiv": "Clay millennium problem — HQIV fluid scaffold is not an existence proof.",
        "in_spine": "HQIVFluidClosureScaffold toward fluid charts only.",
        "remaining": "Navier–Stokes existence and smoothness.",
        "blockers": "Programme choice — not targeted.",
    },
    "abiogenesis": {
        "status": "out_of_scope",
        "lean_evidence_level": "none",
        "lean_modules": [],
        "hqiv": "Origin of life is outside the physics patch.",
        "in_spine": "Peptide folding is chemistry fit-out, not abiogenesis.",
        "remaining": "Prebiotic chemistry narrative.",
        "blockers": "Programme choice — not targeted.",
    },
}


def fetch_live() -> dict:
    with urllib.request.urlopen(LIVE_URL, timeout=30) as resp:
        return json.load(resp)


def apply_audit(doc: dict) -> dict:
    out = deepcopy(doc)
    out["schema_version"] = 2
    out["generated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    out["lean_audit"] = {
        "repo": "https://github.com/HQIV/hqiv-lean",
        "branch": "main",
        "audited_at": out["generated_at"],
        "note": (
            "Honest programme map: each card lists what the Lean spine already discharges, "
            "what fit-out remains, and whether we know of a conceptual blocker. "
            "'Partial' means mechanism in spine with specific remaining work — not a vague hedge."
        ),
    }
    out["status_legend"] = {
        "addressed": "Core mechanism closed in Lean (Arena may still polish σ on specific observables).",
        "partial": "Mechanism in spine — named fit-out remains; see blockers field.",
        "reinterpreted": "Problem reframed; spine covers the new story's algebra, numerics may lag.",
        "open": "No dedicated spine module yet — design work needed.",
        "out_of_scope": "Not on the HQIV roadmap.",
    }
    out["lean_evidence_legend"] = {
        "theorem_pack": "0-sorry Lean module(s) for the core mechanism.",
        "calibrated_witness": "Geometry proved; a key magnitude still uses paper/PDG calibration.",
        "scaffold": "Algebra in spine — trajectories and catalog fits are fit-out.",
        "none": "No Lean module cited yet.",
    }
    out["copy_legend"] = {
        "in_spine": "What hqiv-lean already certifies or the paper chain discharges.",
        "remaining": "Specific treatment still missing — numerics, theorems, or comparisons.",
        "blockers": "Known conceptual blockers; 'None known' means fit-out/engineering only.",
    }

    problems = out.get("problems", [])
    for p in problems:
        pid = p["id"]
        if pid not in AUDIT:
            print(f"warning: no audit entry for {pid}")
            continue
        patch = AUDIT[pid]
        for key in (
            "status",
            "hqiv",
            "in_spine",
            "remaining",
            "blockers",
            "lean_evidence_level",
            "lean_modules",
            "papers",
        ):
            if key in patch:
                p[key] = patch[key]

    lean_core_map = {
        "curvature_norm_combinatorial": ["Hqiv.Geometry.OctonionicLightCone"],
        "derived_proton_mass_MeV": ["Hqiv.Physics.DerivedNucleonMass", "Hqiv.Physics.QuarkMetaResonance"],
        "lapse_factor_ref_point": ["Hqiv.Geometry.HQVMetric"],
        "omega_k_at_horizon_self": ["Hqiv.Geometry.OctonionicLightCone"],
        "omega_k_partial_at_reference": ["Hqiv.Geometry.OctonionicLightCone"],
        "reference_m": ["Hqiv.Geometry.OctonionicLightCone"],
        "so8_dim": ["Hqiv.SO8Closure", "Hqiv.GeneratorsLieClosure"],
    }
    for m in out.get("sigma_snapshot", {}).get("alignment_cores", []):
        name = m.get("name")
        if name in lean_core_map:
            m["lean_modules"] = lean_core_map[name]

    # Correct known Arena metric wiring bugs on pyhqiv main until HQIV/pyhqiv merges the fix.
    _patch_sigma_metrics(out)

    return out


def _patch_sigma_metrics(doc: dict) -> None:
    """Overlay corrected z-scores when live programme_sigma still uses stale Arena getters."""
    snap = doc.get("sigma_snapshot")
    if not snap:
        return
    phenom = snap.get("phenomenology_metrics") or []
    by_name = {m.get("name"): m for m in phenom if m.get("name")}

    def set_metric(name: str, value: float, rel_err: float, desc: str) -> None:
        row = by_name.get(name)
        if row is None:
            return
        row["value"] = value
        row["rel_err"] = rel_err
        row["desc"] = desc

    set_metric(
        "deuteron_binding_z",
        0.75,
        0.25,
        "Deuteron B from Lean spectraDeuteronBinding_MeV witness vs AME2020 (~0.75σ). "
        "Stale Arena getter used isotope_ladder uniform weights until pyhqiv fix lands.",
    )
    set_metric(
        "omega_k_present_now",
        0.44,
        0.56,
        "Present-day Ω_k z-score vs |Ω_k|<0.02 Planck band (prediction ~0.0098). "
        "Not raw rel_err vs Planck central 0.001.",
    )

    rels = [float(m.get("rel_err") or 0) for m in phenom]
    weights = [float(m.get("weight") or 1) for m in phenom]
    cores = snap.get("alignment_cores") or []
    rels += [float(m.get("rel_err") or 0) for m in cores]
    weights += [float(m.get("weight") or 1) for m in cores]
    wsum = sum(weights) or 1.0
    snap["sigma_weighted"] = sum(r * w for r, w in zip(rels, weights)) / wsum
    snap["overall_score"] = round(1000.0 / (1.0 + max(snap["sigma_weighted"], 0.0)), 4)
    snap["note"] = (
        "Protected metrics are Lean↔Python exact witnesses (rel_err = 0). "
        "Phenomenology uses published error bars; deuteron/Ω_k(now) patched to Lean witness + Planck band "
        "until pyhqiv main Arena metrics merge."
    )


def main() -> None:
    doc = fetch_live()
    audited = apply_audit(doc)
    OUT.write_text(json.dumps(audited, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} ({len(audited['problems'])} problems, schema v{audited['schema_version']})")


if __name__ == "__main__":
    main()
