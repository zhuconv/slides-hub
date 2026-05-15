---
theme: default
title: "Interactive Personalized Image Generation — PreferImg Benchmark & Aesthetic Agent"
info: "ICLR 2026 submission — paper summary"
class: text-center
drawings:
  persist: false
transition: slide-left
mdc: true
---

<style>
.slidev-layout.fill {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.slidev-layout.fill h1 { font-size: 2.05rem; line-height: 1.18; margin-bottom: 0.3rem; }
.slidev-layout.fill h3 { font-size: 1.3rem; margin: 0 0 0.5rem; }
.slidev-layout.fill p  { line-height: 1.45; margin: 0.35rem 0; }
.slidev-layout.fill li { line-height: 1.5; margin: 0.34rem 0; }
.slidev-layout.fill ul { padding-left: 1.15rem; }
</style>

# Interactive Personalized Image Generation

## Personalization as a sparse-signal, multi-turn problem — the PreferImg benchmark and an aesthetic agent

<div class="abs-br m-6 text-sm opacity-50">
ICLR 2026 submission · paper summary · May 2026
</div>

---
class: fill
---

# Aligning text-to-image models targets the *average* viewer

<div class="grid grid-cols-2 gap-6 mt-3 text-lg" style="min-height: 17rem">
<div class="p-6 bg-blue-50 rounded-lg border border-blue-200">

### Population-level alignment

- Reward models learned from ranked images — ImageReward, Pick-a-Pic
- Diffusion tuned directly with reward / preference objectives — DDPO, Diffusion-DPO
- Real gains in **average** visual appeal and prompt following

</div>
<div class="p-6 bg-green-50 rounded-lg border border-green-200">

### But aesthetic judgment is personal

- Users **systematically disagree** on the same image
- Disagreement tracks personal attributes and content interests — not noise
- Personalized generation: from a *small* history, make what **this** user prefers

</div>
</div>

<div class="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-sm">
An average-quality target is intrinsically incomplete for aesthetics — taste is subjective and culturally situated, so a population-level reward leaves each user's preference on the table.
</div>

---
class: fill
---

# Each prior approach fixes only part of the problem

<div class="grid grid-cols-3 gap-4 mt-3 text-base" style="min-height: 15rem">
<div class="p-5 bg-blue-50 rounded-lg border border-blue-200">

### Reward optimization

DPO-style tuning on a learned user-preference embedding.

- ✓ Strong when a reliable reward exists
- ✗ Personalized feedback is sparse, weakly identified
- ✗ A few examples → unstable optimization

</div>
<div class="p-5 bg-green-50 rounded-lg border border-green-200">

### Text prompting

Taste written as language, appended to the prompt.

- ✓ Interpretable and editable
- ✓ Cleanly separates content from style
- ✗ Tacit aesthetics resist precise words

</div>
<div class="p-5 bg-purple-50 rounded-lg border border-purple-200">

### Embedding steering

Shifts the generator along preference directions.

- ✓ Captures non-verbal style
- ✗ Whole-image directions entangle object + style
- ✗ Can change *what* is depicted

</div>
</div>

<div class="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-sm">
<strong>Reframe.</strong> Treat signal sparsity as part of the problem, not a nuisance hidden in a one-shot profile — personalization becomes <strong>multi-turn</strong>: start sparse, generate, collect feedback, refine.
</div>

---
class: fill
---

# AestheticBench: a closed personalization loop

<img src="/aestheticbench_loop.svg" class="w-full mt-2" />

<div class="grid grid-cols-2 gap-6 mt-2 text-sm">
<div class="p-4 bg-blue-50 rounded-lg border border-blue-200">

### One benchmark instance

- Sparse initial evidence + a **fixed interaction budget**
- Each turn: propose candidates → feedback → update state
- End: final images + an inferred preference profile

</div>
<div class="p-4 bg-green-50 rounded-lg border border-green-200">

### Scored on four axes

- **Profile accuracy** — inferred vs. hidden preference
- **Final preference score** and **pass@k**
- **Efficiency** — accuracy per generated image / turn

</div>
</div>

<div class="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-sm">
PreferImg supplies the data; AestheticMCQ screens the proxy evaluator before it is trusted. The benchmark measures whether an agent genuinely <em>improves</em> as sparse feedback accumulates.
</div>

---
class: fill
---

# An aesthetic agent for *any* text-to-image backend

<div class="grid grid-cols-2 gap-6 mt-3 text-lg" style="min-height: 16rem">
<div class="p-6 bg-blue-50 rounded-lg border border-blue-200">

### Two complementary control channels

- **Prompt drafting** — turns user evidence into explicit, editable instructions; separates content from aesthetic constraints
- **Embedding steering** — captures hard-to-name visual tendencies from ± examples, applied in the generator's representation space

</div>
<div class="p-6 bg-green-50 rounded-lg border border-green-200">

### Three agent families compared

- **Text-only** — summarize taste in language, then draft prompts
- **Evolve** — keep one preference hypothesis, mutate it on feedback
- **Multi-evolve (ours)** — a *frontier* of hypotheses across backends; resists early lock-in

</div>
</div>

<div class="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-sm">
<strong>Composition.</strong> The agent runs both channels over multiple turns — text's interpretability plus steering's expressivity — so personalization is bottlenecked by neither alone.
</div>

---
class: fill
---

# What we test — and what early runs show

<div class="grid grid-cols-2 gap-6 mt-3 text-lg" style="min-height: 16rem">
<div class="p-6 bg-blue-50 rounded-lg border border-blue-200">

### Three questions it isolates

- **Evaluator validity** — which multimodal model is a trustworthy proxy user?
- **End-to-end personalization** — which agent best finds latent taste on a budget?
- **System design** — harness vs. reasoning backend vs. image backend
- Ablations sweep each axis, plus interaction budget

</div>
<div class="p-6 bg-green-50 rounded-lg border border-green-200">

### Early findings *(numbers being frozen)*

- **Multi-evolve beats text-only and single-hypothesis evolve**
- The gap widens as more budget exposes early search mistakes
- LLM-as-human evaluator validated against MCQ data — scalable yet user-specific

</div>
</div>

<div class="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-sm">
<strong>Three contributions.</strong> (1) Reframe personalized generation as a sparse-signal, multi-turn problem. (2) Release the PreferImg benchmark + leaderboard. (3) An aesthetic agent composing prompt drafting and embedding steering across backends.
</div>
