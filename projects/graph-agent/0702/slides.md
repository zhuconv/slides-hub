---
theme: default
title: "SchemaRouter — Next 3 Months (P0 → P1 → P2)"
info: "Three-month roadmap + selling points — July 2, 2026"
class: text-center
drawings:
  persist: false
transition: slide-left
mdc: true
---

<style>
/* --- compact helpers (per-slide `class: compact`) --- */
.slidev-layout.compact h1 { font-size: 1.5em !important; line-height: 1.15 !important; margin-bottom: 0.3em !important; }
.slidev-layout.compact h3 { font-size: 1em !important; margin: 0.15em 0 !important; }
.slidev-layout.compact p, .slidev-layout.compact li { line-height: 1.3 !important; font-size: 0.85em !important; }
.slidev-layout.compact ul { margin: 0.15em 0 !important; padding-left: 1.1em !important; }
.slidev-layout.compact li { margin: 0.05em 0 !important; }

/* --- vertical fill: center content so slides don't bottom-gap --- */
.slidev-layout.fill { display: flex; flex-direction: column; justify-content: center; }
.slidev-layout.fill h1 { margin-bottom: 0.5rem; }
.slidev-layout.fill .grid-cols-2 > div { min-height: 13.5rem; }

/* --- card + metric helpers (roadmap / metric pages) --- */
.card { padding: 1.1rem; border-radius: 8px; border: 1px solid; min-height: 12rem; }
.blue   { background: #eff6ff; border-color: #bfdbfe; }
.green  { background: #ecfdf5; border-color: #a7f3d0; }
.purple { background: #f5f3ff; border-color: #ddd6fe; }
.amber  { background: #fffbeb; border-color: #fde68a; }
.slate  { background: #f8fafc; border-color: #cbd5e1; }
.metric-label { font-size: 0.72rem; opacity: 0.68; text-transform: uppercase; letter-spacing: 0.03em; font-weight: 700; }
.metric { font-size: 1.7rem; font-weight: 750; line-height: 1.1; margin: 0.15rem 0 0.35rem; }
.source { font-size: 0.67rem; opacity: 0.58; margin-top: 0.5rem; line-height: 1.25; }
</style>

# SchemaRouter

## Next 3 months — P0 → P1 → P2

<div class="mt-6 text-base opacity-80">
From a production LLM gateway → a usable playground → open source → paper
</div>

<div class="abs-br m-6 text-sm opacity-50">
Jiajun Zhu · UT Austin · Jul 2, 2026
</div>

---
class: fill
---

# Roadmap at a glance — three milestones

<div class="grid grid-cols-3 gap-4 mt-5">
<div class="card green">
<div class="metric-label">P0 · ≤ 2 weeks</div>
<div class="metric">Usable playground</div>
<p class="text-sm">Hosted on <code>schemarouter.com</code>; drive raw-DB → prediction from one screen. <b>Done =</b> a new user runs a task unaided.</p>
</div>
<div class="card blue">
<div class="metric-label">P1 · ~1 month</div>
<div class="metric">Open-source v1</div>
<p class="text-sm">First public GitHub release of the framework — installable, runnable end-to-end on the benchmarks below.</p>
</div>
<div class="card purple">
<div class="metric-label">P2 · ≤ 2 months</div>
<div class="metric">Paper draft</div>
<p class="text-sm">Submittable draft — the two selling points, argued with enterprise-MLDB + RelBench evidence.</p>
</div>
</div>

<div class="mt-5 p-3 amber rounded-lg text-sm">
Each milestone unlocks the next: the <b>playground</b> is the demo surface, the <b>OSS release</b> is the artifact, the <b>paper</b> is the claim — all on one SchemaRouter core.
</div>

---
class: fill
---

# Past two weeks — a production LLM gateway

<p class="mt-1 opacity-75 text-sm"><code>schemarouter.com</code> Google Workspace + GCP project; one gateway is the backend for every model API we serve.</p>

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Production-grade serving

- **Load-balanced** — high concurrency behind a global HTTPS LB
- **Multi-tier API auth** — internal dev · playground user · enterprise customer
- **Per-team & per-user** rate limits + spend quotas
- **Observability** — live monitoring + API traces

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Two strategic payoffs

- **Self-host ready** — plug in a self-hosted LLM (e.g. *GLM-5.2*) as backend; for customers who won't send data to OpenAI / Anthropic, one unified access layer
- **Cheap frontier tokens early** — subscription → credit: ~$200/mo reverse-proxies to ≈ $5k of Claude / GPT usage at full quota

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Beyond serving, the gateway is a <b>trust story</b> (self-host) and a <b>runway story</b> (cheap Claude/GPT) — the backbone both the playground and the OSS release call into.
</div>

---
layout: image
image: /llm-gateway.png
backgroundSize: contain
---

---
class: fill
---

# The bet — autonomous, ever-improving ML over structured DBs

<p class="mt-1 opacity-75 text-sm">Problem class: turn a raw, multi-table operational DB into a prediction, with <b>no data scientist in the loop</b>.</p>

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Ability 1 — Autonomy

- Raw DB + plain-text demand → prediction, **end-to-end**
- No data scientist hand-building features or pipelines
- The hard part is the **messy middle** *(next slide)*

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Ability 2 — Long horizon

- **Continual growth** — keeps improving over many rounds, not one shot
- A **convergent evolutionary LLM search** over features **and** models
- Improves over a long horizon, not a single-pass pipeline

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
These two abilities are the spine of both deliverables — the <b>OSS release (P1)</b> ships them, the <b>paper (P2)</b> argues them.
</div>

---
class: fill
---

# Selling point 1 — the semantic context layer

<p class="mt-1 opacity-75 text-sm">Between a raw enterprise DB and ML-ready features sits a layer nobody owns. <b>We build it.</b></p>

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### The gap everyone skips

- **Claude Code** unlocked real coding agents — but even those jump straight from raw DB → model
- Missing: a layer of **business concepts** + **data cleaning** between raw tables and ML-ready features
- Skip it → wrong task, unusable features, invalid predictions

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### The context layer we build

- Reads the plain-text business demand and **defines the prediction task**
- Turns raw tables + business concepts into **clean, well-preprocessed, ML-ready features**
- The semantic layer that makes the downstream prediction **actually valid**

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
This middle layer is the moat — the part "just point an agent at the DB" never builds, and what makes autonomy on real enterprise data work at all.
</div>

---
class: fill
---

# Selling point 2 — a long-horizon, ever-improving loop

<p class="mt-1 opacity-75 text-sm">One evolutionary LLM search that keeps getting better the longer it runs.</p>

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Comprehensive — the whole stack

- One search covering **both** halves of the job: **data science** *and* **model engineering**
- **Data-science side** — feature synthesis (e.g. **xRFM**)
- **Model-engineering side** — foundation models **TabPFN**, **KumoRFM**, plus classic learners

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Continual performance growth

- Keeps improving **round after round** over a long horizon
- A **convergent** search — reliably climbs toward better solutions
- Continual growth, **not a one-shot pipeline**

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Breadth + continual growth = the <b>long-horizon</b> ability made concrete — one loop spanning both feature engineering and model selection, improving the longer it runs.
</div>

---
class: fill
---

# Proving it — two benchmark fronts

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Primary — Enterprise MLDB

- **Raw DB + pure-text instruction → prediction outcome**
- The benchmark that stresses *both* selling points
- Validates **autonomy + continual improvement** on real enterprise data

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Also — clean-table ML over DB

- **RelBench** + standard clean, well-processed tables
- The setting the field **already measures** → apples-to-apples number
- Head-to-head vs the field's published baselines

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Enterprise MLDB is where our story lives; RelBench is the number the community trusts. Together they back <b>P1</b>'s release claims and <b>P2</b>'s paper.
</div>
