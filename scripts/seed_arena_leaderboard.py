#!/usr/bin/env python3
"""Write public/arena/leaderboard.json from HQIV/pyhqiv main baseline + commit."""

from __future__ import annotations

import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASELINE_URL = "https://raw.githubusercontent.com/HQIV/pyhqiv/main/arena/baseline.json"
COMMIT_URL = "https://api.github.com/repos/HQIV/pyhqiv/commits/main"
OUT = Path(__file__).resolve().parents[1] / "public/arena/leaderboard.json"


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "disregardfiat-arena-seed"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


def sigma_weighted(metrics: list[dict]) -> float | None:
    if not metrics:
        return None
    weights = sum(float(m.get("weight") or 0) for m in metrics)
    if weights <= 0:
        return None
    return sum(float(m.get("rel_err") or 0) * float(m.get("weight") or 0) for m in metrics) / weights


def programme_max_z(metrics: list[dict]) -> float | None:
    paper = next((m for m in metrics if m.get("name") == "paper_comparisons_max_abs_z"), None)
    if paper and paper.get("value") is not None:
        return float(paper["value"])
    z_vals = [
        abs(float(m["value"]))
        for m in metrics
        if m.get("unit") == "sigma" and m.get("value") is not None
    ]
    return max(z_vals) if z_vals else None


def metrics_map(metrics: list[dict]) -> dict:
    return {m["name"]: m for m in metrics if m.get("name")}


def main() -> None:
    baseline = fetch_json(BASELINE_URL)
    commit = fetch_json(COMMIT_URL)
    metrics = baseline.get("metrics") or []
    sigma = sigma_weighted(metrics)
    programme_z = programme_max_z(metrics)
    score = baseline.get("overall_score")
    if score is None and sigma is not None:
        score = round(1000.0 / (1.0 + max(sigma, 0.0)), 4)

    author = (commit.get("author") or {}).get("login") or commit.get("commit", {}).get("author", {}).get("name", "HQIV/pyhqiv")
    coverage_count = len(metrics)
    entry = {
        "branch": "main",
        "sha": commit["sha"],
        "author": author,
        "github_login": author if author and "/" not in author and " " not in author else None,
        "score": score,
        "sigma_weighted": round(sigma, 8) if sigma is not None else None,
        "sigma_programme_max_z": round(programme_z, 4) if programme_z is not None else None,
        "coverage_count": coverage_count,
        "num_metrics": coverage_count,
        "coverage_total": coverage_count,
        "coverage_ratio": 1.0,
        "score_coverage_adjusted": score,
        "avatar_url": f"https://github.com/{author}.png?size=64"
        if author and "/" not in author and " " not in author
        else None,
        "timestamp": commit.get("commit", {}).get("author", {}).get("date")
        or datetime.now(timezone.utc).isoformat(),
        "regressions": 0,
        "badges": [],
        "status": "baseline",
        "metrics": metrics_map(metrics),
    }

    payload = {
        "entries": [entry],
        "current_best": entry,
        "coverage_total": coverage_count,
        "history": [
            {
                "ts": entry["timestamp"],
                "score": entry["score"],
                "sigma": entry["sigma_programme_max_z"] or entry["sigma_weighted"],
            }
        ],
        "badges": {},
        "schema_version": 1,
        "note": (
            "Bundled seed from HQIV/pyhqiv main arena/baseline.json. "
            "Live site prefers /api/v1/leaderboard (merged with CI + provisional entries)."
        ),
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} — main {entry['sha'][:12]} score={entry['score']} programme σ={entry['sigma_programme_max_z']} (aggregate σ_weighted={entry['sigma_weighted']})")


if __name__ == "__main__":
    main()
