---
theme: default
title: "AestheticBench + AestheticMCQ"
info: "Dev report"
author: "Jiajun Zhu"
---

<style>
  :root { --slidev-code-font-size: 0.8em; }
  table { font-size: 0.9em; }
  h1 { font-size: 1.7em !important; }
  h2 { font-size: 1.3em !important; }
  .small { font-size: 0.85em; color: #666; }
  .muted { color: #666; }
  .slidev-layout p { color: #1a1a1a !important; opacity: 1 !important; }
</style>

# AestheticBench + AestheticMCQ

From a pilot study to a reproducible benchmark + its human calibration set

Jiajun Zhu &mdash; April 2026

---

# Recap: last update

[Prior slides](https://zhuconv.github.io/slides-hub/aesthetic-agent/benchmark/) compared three agents on 5 hand-picked profiles:

| | Text-Only | Evolve | Multi-Model Evolve |
|---|:---:|:---:|:---:|
| Liked accuracy (/5) | 1.4 | 1.8 | **3.2** |
| Preference margin | 3.0 | 4.2 | **4.9** |

Multi-model beats single-model beats text-only &mdash; generator choice is part of the search space.

**Open issues from that study**

- 5 profiles, no difficulty split &rarr; not a benchmark
- Agent, scorer, and generation pipeline were entangled
- LLM-as-a-judge never calibrated against humans

---

# Two sibling repos

**AestheticBench** &mdash; a reproducible benchmark for aesthetic preference discovery. Makes the pilot comparable, extensible, and third-party-runnable.

**AestheticMCQ** &mdash; a human-labeled MCQ dataset: "which 5-axis profile best describes this image?" Calibrates the VLM judge that AestheticBench's simulated user is built on.

<div style="margin-top: 1.2em;">

Both repos share the same 5-axis / 2,592-profile space, the same prompt templates, and the same model specs &mdash; enforced by byte-equality tests.

</div>

---

# AestheticBench: two-tier design

<div class="grid grid-cols-2 gap-6">
<div>

**Tier 1 &mdash; Core** (ranks LLMs)

LLM calls standard tools; environment owns generation. Only reasoning varies.

</div>
<div>

**Tier 2 &mdash; Open** (ranks agent systems)

Agent is a black box; generation, model choice, and search strategy all on the agent side.

</div>
</div>

<div style="margin-top: 1em;">

Shared across tiers: scorer, simulated user, GT profiles, metrics, trajectory logging.

Instances: 50-profile curated anthology (15 easy / 20 medium / 15 hard).

</div>

---

# AestheticBench: early result

Tier 2, Open, budget = 120, GPT-5.4 scorer, 4 easy instances:

| Agent | Axis acc (/5) | Final score (/10) | pass@1 |
|---|:---:|:---:|:---:|
| `text_only`    | 2.50 | 6.50 | 0.50 |
| `evolve`       | 2.75 | 5.63 | 0.50 |
| `multi_evolve` | **3.00** | **6.44** | **0.75** |

Pilot ordering (`multi_evolve` &gt; `evolve` &gt; `text_only`) holds on the benchmark harness with a real remote scorer.

---

# AestheticMCQ: what and why

**Each item** = 1 synthetic image + 4 candidate 5-axis profiles (one is the GT injected into the generator).

**Annotator task**: pick the profile that best describes the image.

**Headline metric**: VLM-vs-human-majority agreement.

**Why**: every AestheticBench metric traces back to the simulated user's judgments. Without external ground truth, we can't tell whether the leaderboard reflects reasoning or just judge miscalibration.

---

# AestheticMCQ: what we shipped

Foundation PR &mdash; CPU-only, zero API cost, **39 tests passing**:

- Profile space + prompt rendering, byte-equal to AestheticBench
- Four distractor strategies + deterministic instance planner
- FastAPI + SQLite annotation web app with per-annotator token auth
- Sanity viewer to eyeball planned items before burning GPU

<div class="small muted" style="margin-top: 1em;">

Next PRs: image generation, auto-QA filter, label ingest + HF export.

</div>

---

# Next step

Once AMCQ image generation + labeling land, **bench each candidate API in both roles**:

- **As aesthetic judge** &mdash; agreement with human majority on AMCQ
- **As aesthetic agent** &mdash; pass@k on AestheticBench Tier 1 (`CoreAgent`)

<div style="margin-top: 1em;">

Same LLM, same tools, same 50 instances &mdash; isolates reasoning from generation.

**Deliverable**: one table, two columns per candidate (Claude / GPT / Gemini). An API that scores well but reasons poorly (or vice versa) becomes immediately visible.

</div>

---

# Summary

**AestheticBench** turns the pilot into a two-tier benchmark. Early slice confirms pilot ordering on a real remote scorer.

**AestheticMCQ** is the external human ground truth that calibrates the VLM judge. Foundation PR is in.

**Next**: benchmark APIs in both roles &mdash; judge (AMCQ) and agent (AB Tier-1) &mdash; to separate scoring ability from reasoning ability.
