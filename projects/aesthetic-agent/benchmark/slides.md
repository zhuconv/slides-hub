---
theme: default
title: "AestheticAgent: Multi-Model Evolutionary Preference Discovery"
info: "Pilot Benchmark Report — Text-Only vs Evolve vs Multi-Model Evolve"
author: "Jiajun Zhu"
---

<style>
  :root { --slidev-code-font-size: 0.85em; }
  .slidev-layout { font-size: 1.05em; }
  table { font-size: 0.92em; }
  h1 { font-size: 1.9em !important; }
  h2 { font-size: 1.5em !important; }
  li { font-size: 1.0em; }
  p { font-size: 1.0em; }
  .small { font-size: 0.85em; }
  .footnote { font-size: 0.75em; color: #888; margin-top: 1em; }
</style>

# AestheticAgent

## Multi-Model Evolutionary Aesthetic Preference Discovery

Pilot Benchmark Report: Text-Only vs Evolutionary Search vs Multi-Model Search

<div class="small" style="margin-top: 2em; color: #666;">

Jiajun Zhu &mdash; April 2026

5 profiles &times; 3 methods &times; 1 seed | FLUX / SD3.5 / SD1.5

</div>

---

# Problem Setting

Given a **hidden aesthetic preference** defined by 5 axes, discover it through iterative image generation and scoring.

| Axis | Example Values |
|------|---------------|
| art_style | Impressionism, Minimalism, Pop Art, Anime, ... (8 values) |
| color | Warm, Cool, Neutral, Vibrant, Monochrome, Earth (6 values) |
| art_medium | Oil Painting, Watercolor, Digital, Pencil, Ink, Pastel (6 values) |
| saturation | Vivid, Moderate, Muted (3 values) |
| detail | Fine, Moderate, Minimal (3 values) |

**Liked-profile search space**: 8 &times; 6 &times; 6 &times; 3 &times; 3 = **2,592** combinations (joint liked/disliked/model space is larger)

**Evaluator**: Claude conditioned on hidden GT preferences; optimization agents receive only image scores (1&ndash;10)

---

# Three Methods

<div class="grid grid-cols-3 gap-4">
<div>

### Text-Only (Baseline)
- Claude refines profiles based on score history
- Liked/disliked profile pair updated per round
- No structured search or memory
- **8 rounds, 4 image pairs/round**

</div>
<div>

### Evolutionary Search (Single-Model)
- Structured axis-level mutations proposed by Claude
- Duplicate rejection + image evaluation pipeline
- Per-axis hypothesis tracking
- Win/loss pattern feedback
- **10 rounds, ~4 candidates/round**

</div>
<div>

### Multi-Model Search
- All evolutionary features, plus:
- **Cross-model exploration** (FLUX, SD3.5, SD1.5)
- Forced model mutations in early rounds
- Cross-model re-evaluation every 3 rounds
- **10 rounds, ~4 candidates/round**

</div>
</div>

---

# Benchmark Protocol

| Parameter | Value |
|-----------|-------|
| Profiles tested | minimalist, dark_anime, vibrant_pop, warm_impressionist, vibrant_surreal |
| Runs per method | 1 (seed=42 for all) |
| Text-Only rounds | 8 (4 image pairs per round = 64 images total) |
| Evolve/Multi rounds | 10 (~4 candidates/round, 4 pairs each = ~320 images total) |
| Base prompts | 4 fixed (portrait, landscape, animal, still\_life) |
| Image resolution | 512 &times; 512 |
| Scorer | Claude Sonnet (reads images via SDK) |
| Mutation proposer | Claude Sonnet (text-only, no image access) |
| Hardware | 3 &times; NVIDIA RTX A6000 (48GB) |
| Selection metric | Preference margin (avg\_pref &minus; avg\_dispref) |

<div class="footnote">

Note: Text-Only uses fewer total evaluations (64 vs ~320 images). Evolve methods have higher evaluation budget by design (more candidates explored per round).

</div>

---
layout: image
image: /benchmark_comparison.png
backgroundSize: 90%
---

---

# Results Summary

| Profile | Text-Only Liked Acc. | Evolve Liked Acc. | Multi Liked Acc. | Multi Best Model |
|---------|:---------:|:------:|:-----------:|:---------------:|
| minimalist | 0/5 | 2/5 | **3/5** | flux |
| dark_anime | 2/5 | 1/5 | **3/5** | flux |
| vibrant_pop | 3/5 | 0/5 | **3/5** | sd15 |
| warm_impressionist | 1/5 | **3/5** | 2/5 | flux |
| vibrant_surreal | 1/5 | 3/5 | **5/5** | sd35 |
| **Average** | **1.4/5** | **1.8/5** | **3.2/5** | |

| Metric | Text-Only | Evolve | Multi-Model |
|--------|:---------:|:------:|:-----------:|
| Avg Liked Accuracy | 1.4/5 | 1.8/5 | **3.2/5** |
| Avg Preference Margin | 3.0 | 4.2 | **4.9** |

<div class="footnote">

Text-Only: final profile accuracy. Evolve/Multi: best candidate by margin. Single seed; no confidence intervals.

</div>

---

# Average Ordering in This Pilot

Average ordering across five synthetic profiles:

**Text-Only (1.4/5, 3.0) &lt; Evolutionary Search (1.8/5, 4.2) &lt; Multi-Model Search (3.2/5, 4.9)**

<br>

Per-profile exceptions:
- **dark_anime**: Evolve liked acc (1/5) &lt; Text-Only (2/5), though margin is higher (5.0 vs 1.0)
- **vibrant_pop**: Evolve (0/5) converges to wrong optimum; Multi-Model rescues via SD1.5
- **warm_impressionist**: Multi (2/5) &lt; Evolve (3/5); FLUX already well-suited

<div class="footnote">

Liked accuracy and margin do not always agree — margin is the optimization target but not perfectly correlated with GT recovery. A held-out evaluation with an independent judge is needed for stronger claims.

</div>

---

# Multi-Model Advantage

<div class="grid grid-cols-2 gap-6">
<div>

### Generator Selection Matters

Across these five synthetic profiles, the best generator varies by target style:
- **vibrant_pop**: SD1.5 (margin 5.5) vs FLUX (2.75)
- **vibrant_surreal**: SD3.5 achieves **5/5 accuracy**
- **minimalist, dark_anime, warm_impr.**: FLUX wins

Single-model search is blind to this signal.

### Implication
Generator choice is itself part of the aesthetic search space, not just a fixed hyperparameter.

</div>
<div>

<img src="/benchmark_model_selection.png" style="width:100%" />

<div class="small" style="text-align:center; color:#666;">
Best model at each round (Multi-Model Search). Color = which model holds the best candidate.
</div>

</div>
</div>

---

# Convergence Analysis

<div class="grid grid-cols-2 gap-6">
<div>

### Text-Only (Baseline)
- Oscillates without converging
- Gets stuck in local optima (Warm/Realism)
- Best avg margin: 3.0

### Evolutionary Search
- Systematic axis exploration via hypothesis tracking
- Better margin (4.2) but limited to one generator
- Fails on vibrant_pop (wrong local optimum with FLUX)

</div>
<div>

### Multi-Model Search
- Model diversity rescues failed searches
- **vibrant_surreal**: perfect 5/5 via SD3.5
- **vibrant_pop**: SD1.5 achieves 3/5 where FLUX-only gets 0/5
- Best overall: 3.2/5 accuracy, 4.9 margin

### Observation
The multi-model advantage is largest when the default model (FLUX) is a poor fit for the target aesthetic.

</div>
</div>

---

# Algorithmic Components

Design choices in the evolutionary search (not yet validated by ablation):

1. **VRAM-efficient model swapping**: Unload current model before loading next, enabling multi-model search on a single 48GB GPU

2. **Disliked-side mutation guidance**: Sampler requests disliked profile mutations and tracks per-axis dispref statistics

3. **Win/loss pattern feedback**: Track which axis changes led to margin improvements vs regressions; feed into next mutation proposals

4. **Cross-model re-evaluation**: Every 3 rounds, re-evaluate best profile on untested models to find optimal model&ndash;style pairings

5. **Tournament parent selection**: Top-K tournament instead of greedy best-only, maintaining exploration diversity

---

# Limitations

<div class="grid grid-cols-2 gap-6">
<div>

### Experimental Design
- **Circular evaluation**: Same Claude family scores images and proposes mutations
- **Fixed prompts**: Same 4 prompts for search and evaluation
- **Single seed**: No uncertainty estimates or confidence intervals
- **Unequal budgets**: Text-Only sees ~64 images, Evolve sees ~320

</div>
<div>

### Metric & Reporting
- **Margin &ne; accuracy**: Best-margin candidate not always highest GT match
- **Selection asymmetry**: Text-Only reports final profile; Evolve reports best-seen candidate
- **No ablation support** for individual algorithmic components
- **No held-out evaluation** to test generalization

</div>
</div>

---

# Next Steps

1. **Held-out prompt evaluation**: Optimize on 4 prompts, evaluate final candidate on 20&ndash;40 unseen prompts
2. **Independent judge**: Re-score final candidates with a different model family
3. **Multi-seed runs**: 3 seeds &times; 5 profiles &times; 3 methods with confidence intervals
4. **Best-fixed-model baselines**: Run evolve\_sd15 and evolve\_sd35 with equal budget
5. **Joint liked+disliked objective**: Explicit search budget for the disliked profile
6. **Ablation study**: Isolate contribution of each algorithmic component

---

# Conclusion

<div style="font-size: 1.05em;">

**AestheticAgent** discovers hidden aesthetic preferences through evolutionary search over visual style profiles.

**Pilot result**: In this single-seed benchmark across five synthetic profiles, multi-model evolutionary search achieves the best average result (3.2/5 liked accuracy, 4.9 margin), outperforming single-model evolutionary search (1.8/5, 4.2) and text-only refinement (1.4/5, 3.0).

**Core insight**: Generator choice is part of the aesthetic search space. No single model dominates all styles &mdash; FLUX excels at minimalist aesthetics, SD3.5 at surrealism, SD1.5 at pop art. Multi-model search discovers these pairings automatically.

</div>

---

# Appendix: Experimental Details

| Profile | GT Liked | GT Disliked |
|---------|----------|-------------|
| minimalist | Minimalism / Neutral / Pencil / Muted / Minimal | Pop Art / Vibrant / Digital / Vivid / Fine |
| dark_anime | Anime / Monochrome / Digital / Muted / Fine | Impressionism / Vibrant / Watercolor / Vivid / Moderate |
| vibrant_pop | Pop Art / Vibrant / Digital / Vivid / Fine | Minimalism / Neutral / Pencil / Muted / Minimal |
| warm_impressionist | Impressionism / Warm / Oil Painting / Vivid / Moderate | Minimalism / Cool / Pencil / Muted / Minimal |
| vibrant_surreal | Surrealism / Vibrant / Oil Painting / Vivid / Fine | Realism / Monochrome / Pencil / Muted / Minimal |

<div class="small" style="margin-top:1em">

**Image models**: FLUX.1-schnell (4 steps, cfg=0), SD3.5-medium (28 steps, cfg=7), SD1.5 (25 steps, cfg=7.5)

**Scorer/Proposer**: Claude Sonnet (claude-sonnet-4-5-20250514) via claude-agent-sdk

**Base prompts**: "a young woman with freckles", "a lone tree in a vast field", "a ginger cat on a windowsill", "sunflowers in a glass mason jar"

**Seed**: 42 for all methods | **Hardware**: 3x NVIDIA RTX A6000 (48GB)

</div>

---
layout: image
image: /benchmark_convergence.png
backgroundSize: 75%
---
