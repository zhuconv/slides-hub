---
theme: default
title: "Aesthetic Preference Agent System"
info: Implementation Report
---

# Aesthetic Preference Agent System

Iterative aesthetic preference discovery via multi-agent loop

March 2026

---
layout: image
image: /architecture.png
backgroundSize: contain
---

---

# Target: Minimalist Modernist

| Axis | GT Liked | GT Disliked |
|------|----------|-------------|
| color | Neutral | Vibrant |
| art_style | Minimalism | Pop Art |
| art_medium | Pencil | Digital |
| detail | Minimal | Fine |
| saturation | Muted | Vivid |

**Start**: random — Realism / Warm / Pastel / Moderate / Fine (0/5 match)

---
layout: image
image: /round0_grid.png
backgroundSize: contain
---

<!--
Round 0 — Random Start (0/5 match)
Profile: Realism / Warm / Pastel / Moderate / Fine
Scores: preferred avg=2.7, dispreferred avg=6.8, decisiveness = -4.1
-->

---
layout: image
image: /round1_grid.png
backgroundSize: contain
---

<!--
Round 1 — First Correction (2/5 match)
Profile: Realism / Warm / Pencil / Moderate / Minimal — medium and detail fixed
Scores: preferred avg=6.2, dispreferred avg=4.9, decisiveness = +1.3
-->

---
layout: image
image: /round2_grid.png
backgroundSize: contain
---

<!--
Round 2 — Major Leap (4/5 match)
Profile: Minimalism / Warm / Pencil / Muted / Minimal — art_style and saturation found
Scores: preferred avg=8.8, dispreferred avg=2.3, decisiveness = +6.5
-->

---
layout: image
image: /round3_grid.png
backgroundSize: contain
---

<!--
Round 3 — Converged! (5/5 match)
Profile: Minimalism / Neutral / Pencil / Muted / Minimal — last axis (color) found
Scores: preferred avg=9.5, dispreferred avg=3.1, decisiveness = +6.3
-->

---
layout: image
image: /evolution_strip.png
backgroundSize: contain
---

<!--
Evolution: "Woman Studying" across 4 rounds
Style converges from Realism/Warm/Pastel to Minimalism/Neutral/Pencil
-->

---
layout: image
image: /before_after.png
backgroundSize: contain
---

<!--
Before vs After: All 4 Base Prompts
Round 0 (random) vs Round 3 (converged)
-->

---

# Convergence Summary

| Round | Liked | Disliked | Decisiveness | Key Change |
|-------|-------|----------|-------------|------------|
| 0 | 0/5 | 1/5 | -4.1 | Random start |
| 1 | 2/5 | 3/5 | +1.3 | medium→Pencil, detail→Minimal |
| 2 | 4/5 | 5/5 | +6.5 | style→Minimalism, sat→Muted |
| 3 | **5/5** | **5/5** | +6.3 | color→Neutral — **CONVERGED** |

4 rounds, 32 images, ~50 seconds on GH200

Disliked profile also converged: Surrealism/Cool/Pastel → **Pop Art/Vibrant/Digital** (5/5)

---

# Summary

- Multi-agent system discovers hidden aesthetic profile in **4 rounds**
- From **0/5 random** to **5/5 perfect match** on both liked and disliked profiles
- 5-axis VisualProfile (2,592 possible styles) — structured, not free-form
- Content-style decoupling via fixed base prompts
- 26/26 tests passed (CPU + GPU on NVIDIA GH200 120GB)

**Next steps**: Full delta optimization with trained E2T model, extend to SD3.5/FLUX
