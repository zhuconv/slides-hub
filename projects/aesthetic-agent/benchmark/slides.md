---
theme: default
title: "AestheticAgent: Multi-Model Evolutionary Preference Discovery"
info: "Pilot Benchmark Report"
author: "Jiajun Zhu"
---

<style>
  :root { --slidev-code-font-size: 0.85em; }
  .slidev-layout { font-size: 1.05em; }
  table { font-size: 0.92em; }
  h1 { font-size: 1.9em !important; }
  h2 { font-size: 1.5em !important; }
  .small { font-size: 0.85em; }
  .footnote { font-size: 0.75em; color: #888; margin-top: 1em; }
</style>

# AestheticAgent

## Multi-Model Evolutionary Aesthetic Preference Discovery

<div style="margin-top: 2em; color: #555; font-size: 0.95em;">

Jiajun Zhu &mdash; April 2026

**Core insight**: Generator choice is part of the aesthetic search space. No single model dominates all styles.

</div>

---

# Problem & Approach

**Task**: Discover a hidden 5-axis aesthetic preference through iterative image generation and scoring.

**Search space**: 2,592 liked-profile combinations (8 art styles &times; 6 colors &times; 6 media &times; 3 saturations &times; 3 details)

**Three methods compared**:

| | Text-Only | Evolve (Single-Model) | Multi-Model Evolve |
|---|---|---|---|
| Strategy | Claude refines profiles from scores | Structured mutations + hypothesis tracking | + cross-model exploration (FLUX/SD3.5/SD1.5) |
| Search | No memory, single profile/round | L1 filter + L2 eval, ~4 candidates/round | + forced model mutations + re-eval every 3 rounds |

---
layout: image
image: /pipeline_overview.png
backgroundSize: 90%
---

---
layout: image
image: /benchmark_comparison.png
backgroundSize: 90%
---

---

# Key Results

<div style="font-size: 0.9em;">

| Profile | Text-Only | Evolve | Multi-Model | Best Model |
|---------|:---------:|:------:|:-----------:|:----------:|
| minimalist | 0/5 (2.8) | 2/5 (3.5) | **3/5** (3.8) | flux |
| dark_anime | 2/5 (1.0) | 1/5 (5.0) | **3/5** (5.0) | flux |
| vibrant_pop | 3/5 (3.8) | 0/5 (2.8) | **3/5** (5.5) | **sd15** |
| warm_impress. | 1/5 (5.8) | **3/5** (5.5) | 2/5 (5.2) | flux |
| vibrant_surr. | 1/5 (1.5) | 3/5 (4.0) | **5/5** (5.0) | **sd35** |
| **Average** | **1.4/5** (3.0) | **1.8/5** (4.2) | **3.2/5** (4.9) | |

</div>

**Ordering**: Text-Only (1.4/5) &lt; Evolve (1.8/5) &lt; Multi-Model (3.2/5)

<div class="small" style="color:#888;">Cells: liked accuracy (margin). 5 profiles, 1 seed. Text = final profile; Evolve/Multi = best candidate.</div>

---

# Why Multi-Model Wins

<div class="grid grid-cols-2 gap-6">
<div>

The best generator varies **by target style**:

- **vibrant_pop**: SD1.5 (5.5) vs FLUX (2.8)
- **vibrant_surreal**: SD3.5 achieves **5/5 accuracy**
- Minimalist, dark anime, warm: FLUX wins

Single-model search cannot discover these pairings.

Multi-model search recovers from bad model-style fits by switching generators mid-search.

</div>
<div>

<img src="/benchmark_model_selection.png" style="width:100%" />

<div class="small" style="text-align:center; color:#666;">
Best model at each round. Color = which model holds the best candidate.
</div>

</div>
</div>

---

# Limitations & Next Steps

**Current limitations**:
- Circular evaluation (same Claude family for scoring + mutations)
- Single seed, 4 fixed prompts, unequal compute budgets
- Margin-based selection does not perfectly recover GT profiles

**Next steps**:
- Held-out prompt evaluation + independent judge
- Multi-seed runs with confidence intervals
- Best-fixed-model baselines (evolve_sd15, evolve_sd35)

---

# Conclusion

**AestheticAgent** discovers hidden aesthetic preferences through evolutionary search over 5-axis visual style profiles.

**Result**: Multi-model search (3.2/5 avg accuracy, 4.9 margin) outperforms single-model evolve (1.8/5, 4.2) and text-only (1.4/5, 3.0) across five profiles.

**Key insight**: Generator choice is part of the aesthetic search space &mdash; FLUX excels at minimalist styles, SD3.5 at surrealism, SD1.5 at pop art. Multi-model search discovers these pairings automatically.

---

# Appendix

| Profile | GT Liked | GT Disliked |
|---------|----------|-------------|
| minimalist | Minimalism / Neutral / Pencil / Muted / Minimal | Pop Art / Vibrant / Digital / Vivid / Fine |
| dark_anime | Anime / Monochrome / Digital / Muted / Fine | Impressionism / Vibrant / Watercolor / Vivid / Moderate |
| vibrant_pop | Pop Art / Vibrant / Digital / Vivid / Fine | Minimalism / Neutral / Pencil / Muted / Minimal |
| warm_impressionist | Impressionism / Warm / Oil Painting / Vivid / Moderate | Minimalism / Cool / Pencil / Muted / Minimal |
| vibrant_surreal | Surrealism / Vibrant / Oil Painting / Vivid / Fine | Realism / Monochrome / Pencil / Muted / Minimal |

<div class="small">

Models: FLUX.1-schnell, SD3.5-medium, SD1.5 | Scorer: Claude Sonnet | Seed: 42 | Hardware: 3x A6000

</div>

---
layout: image
image: /benchmark_convergence.png
backgroundSize: 75%
---
