---
theme: default
title: "AestheticBench + AestheticMCQ"
info: "Dev report"
author: "Jiajun Zhu"
fonts:
  sans: "Inter"
---

<style>
  :root { --slidev-code-font-size: 0.72em; }
  .slidev-layout { font-size: 0.95em; padding: 2.2em 2.5em !important; }
  table { font-size: 0.82em; }
  th, td { padding: 0.2em 0.45em !important; }
  h1 { font-size: 1.75em !important; margin-bottom: 0.35em !important; }
  h2 { font-size: 1.25em !important; margin-bottom: 0.25em !important; }
  .small { font-size: 0.8em; }
  .muted { color: #666; }
  .slidev-layout p { color: #1a1a1a !important; opacity: 1 !important; margin: 0.35em 0 !important; }
  .slidev-layout ul, .slidev-layout ol { margin: 0.25em 0 !important; }
  .slidev-layout li { margin: 0.18em 0 !important; }
  pre { font-size: 0.78em !important; line-height: 1.2em !important; margin: 0.3em 0 !important; }
</style>

# AestheticBench + AestheticMCQ

## From a pilot study to a reproducible benchmark + its human calibration set

<div style="margin-top: 2.2em; color: #555; font-size: 0.95em;">

Jiajun Zhu &mdash; April 2026

</div>

---

# Recap: last update

<div style="font-size: 0.92em;">

[Prior slides](https://zhuconv.github.io/slides-hub/aesthetic-agent/benchmark/) compared three agents on 5 hand-picked aesthetic profiles (SD1.5 + FLUX + SD3.5, LLM-as-a-judge):

| | Text-Only | Evolve | Multi-Model Evolve |
|---|:---:|:---:|:---:|
| Mean liked accuracy (/5) | 1.4 | 1.8 | **3.2** |
| Preference margin | 3.0 | 4.2 | **4.9** |

**Findings**: multi-model beats single-model beats text-only. Generator choice is part of the search space &mdash; no single model dominates all styles.

**Open issues from that study**

- 5 profiles, no difficulty split, no public/private split &rarr; not a benchmark
- Agent, scorer, and generation pipeline were entangled
- LLM-as-a-judge was never calibrated against humans

This report: two sibling repos that address both gaps.

</div>

---

# Two sibling repos

<div class="grid grid-cols-2 gap-6" style="font-size: 0.92em;">
<div>

## AestheticBench

**What**: reproducible benchmark for aesthetic preference discovery.

**Why**: make the pilot comparable, extensible, and third-party-runnable.

**Achieved**: two-tier environment, 50 curated instances, real-scorer results on an early slice.

</div>
<div>

## AestheticMCQ

**What**: human-labeled MCQ dataset &mdash; "which 5-axis profile best describes this image?"

**Why**: AB's simulated user is a VLM judge &mdash; nobody has measured its agreement with real humans.

**Achieved**: foundation PR done (dataset plumbing + annotation web app), byte-equal to AB.

</div>
</div>

Both repos share the same 5-axis / 2,592-profile space, the same prompt templates, and the same model specs &mdash; enforced by byte-equality tests.

---

# AestheticBench: two-tier design

<div class="grid grid-cols-2 gap-4" style="font-size: 0.88em;">
<div>

**Tier 1 &mdash; Core** (ranks LLMs)

LLM calls standard tools; environment owns generation. Only reasoning varies.

```
Agent = LLM
  | tool calls
  v
Environment: generate_image, get_feedback,
             compare_images, chat,
             submit_prediction
```

</div>
<div>

**Tier 2 &mdash; Open** (ranks agent systems)

Agent is a black box; generation + model choice + search strategy all on the agent side.

```
Agent = black box
  | images + messages
  v
Environment: submit_image, compare_images,
             chat, submit_prediction
```

</div>
</div>

<div style="font-size: 0.88em; margin-top: 0.4em;">

Shared across tiers: scorer, simulated user, GT profiles, metrics, trajectory logging. Separate Tier-1 / Tier-2 leaderboards.

**Instances**: 50-profile curated anthology (15 easy / 20 medium / 15 hard) + random sampler over the full 2,592 space.

</div>

---

# AestheticBench: what we shipped

<div style="font-size: 0.9em;">

- `Environment` class exposing both tiers from one implementation (`src/environment.py`)
- Liked-only scorer supporting Anthropic, OpenAI, and local CLIProxyAPI-backed Codex/GPT
- Three open-tier baselines as bench-native `OpenAgent`s: `text_only`, `evolve`, `multi_evolve`
- Real diffusers generation in the agent path (FLUX / SD3.5 / SD1.5)
- Harness: agent &times; tier &times; instances &times; K trials &rarr; `results.json` + `trajectory.jsonl`
- **275 tests passing** on the `reproduce` branch

**Early result slice** &mdash; Tier 2, Open, budget = 120, GPT-5.4 scorer, 4 easy instances:

| Agent | Mean axis acc (/5) | Final score (/10) | pass@1 |
|---|:---:|:---:|:---:|
| `text_only`    | 2.50 | 6.50 | 0.50 |
| `evolve`       | 2.75 | 5.63 | 0.50 |
| `multi_evolve` | **3.00** | **6.44** | **0.75** |

Pilot ordering (`multi_evolve` &gt; `evolve` &gt; `text_only`) holds on the benchmark harness with a real remote scorer. Remaining 8 (medium + hard) instances pending a dedicated GPU.

</div>

---

# AestheticMCQ: what and why

<div style="font-size: 0.9em;">

**Each item** = 1 synthetic image + 4 candidate 5-axis profiles (one is the GT profile injected into the generator) + correct index.

**Annotator task**: pick the profile that best describes the image.

**Headline metric**: VLM-vs-human-majority agreement &mdash; how often a candidate VLM judge picks the same option as the human majority.

**Why it matters**: every AB metric traces back to the simulated user's judgments. If the VLM judge miscalibrates on, e.g., `anime + oil painting + minimal detail`, then AB's rankings on `anime_oil` mean something different from what the leaderboard says. AMCQ gives us the external ground truth to check that.

**Distractor mix** (`configs/distractor_policy.yaml`): 40% 1-axis swap, 30% 2-axis swap, 15% weighted-Hamming cluster, 15% uniform random &mdash; hardness spectrum from fine-grained discrimination down to sanity check.

</div>

---

# AestheticMCQ: what we shipped

<div style="font-size: 0.88em;">

**Foundation PR** &mdash; CPU-only, zero API cost, 39 tests passing:

- Profile space + prompt rendering, byte-equal to AB (`test_vocab_is_byte_equal_to_ab`, `test_prompt_templates_byte_equal_to_ab`, `test_model_specs_match_ab`)
- All four distractor strategies + deterministic instance planner &rarr; `plan.jsonl`
- FastAPI + SQLite annotation web service with per-annotator token auth
- `sanity_view.py` to eyeball planned items before burning GPU

**Not yet built (next PRs)**: image generation (Stage C), auto-QA filter (Stage D), label ingest + HF export (Stages E/G). No real images generated yet.

**Compatibility pins &mdash; why the byte-equality tests exist**

If AB edits a prompt template or swaps a checkpoint without us noticing, AMCQ ends up measuring a different image distribution and its calibration number stops being about AB. The byte-equality tests fail loudly on such drift &mdash; divergence becomes a visible, reviewed merge instead of a silent one.

</div>

---

# Next step

<div style="font-size: 0.95em;">

Once AMCQ image generation + labeling land, **bench each candidate API in both roles**:

- **As aesthetic judge** &mdash; VLM-vs-human-majority agreement on AMCQ. This tells us how much to trust the simulated user's scores.
- **As aesthetic agent** &mdash; pass@k on AestheticBench Tier 1 (`CoreAgent`). Same LLM, same tools, same 50 instances &mdash; isolates reasoning quality from generation quality.

<div style="margin-top: 0.6em;">

**Candidates**: Claude 4.x (Opus / Sonnet), GPT-5.x (incl. local CLIProxyAPI-backed Codex), Gemini 2.x.

**Deliverable**: one table per model with two columns &mdash; judge agreement (from AMCQ) and agent pass@k (from AB Tier 1) &mdash; so an API that scores images well but reasons poorly (or vice versa) is immediately visible.

</div>

<div style="margin-top: 0.6em;" class="muted small">

Also pending before either column is publishable: full 12-instance balanced AB run (dedicated GPU, no OOM contention) to replace the current 4-easy slice.

</div>

</div>

---

# Summary

<p style="color: #1a1a1a;"><strong>AestheticBench</strong> turns the pilot study into a two-tier benchmark with 50 curated instances, three open-tier baselines, and a real LLM scorer. Early slice confirms the pilot ordering (<code>multi_evolve</code> &gt; <code>evolve</code> &gt; <code>text_only</code>).</p>

<p style="color: #1a1a1a;"><strong>AestheticMCQ</strong> is the external human ground truth that calibrates AB's VLM judge. Foundation PR is in; byte-equality with AB keeps the two artifacts in sync.</p>

<p style="color: #1a1a1a;"><strong>Next:</strong> benchmark API endpoints in both roles &mdash; aesthetic judge (AMCQ agreement) and aesthetic agent (AB Tier-1 pass@k) &mdash; to separate scoring ability from reasoning ability in one report.</p>

<div class="muted small" style="margin-top: 1.2em; border-top: 1px solid #ddd; padding-top: 0.6em;">
Repos: <code>AestheticBench-report</code> (reproduce branch, 275 tests), <code>AMCQ</code> (foundation PR, 39 tests). Prior slides: <a href="https://zhuconv.github.io/slides-hub/aesthetic-agent/benchmark/">aesthetic-agent/benchmark</a>.
</div>
