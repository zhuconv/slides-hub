---
theme: default
title: "GraphAgent — From Development to Production"
class: text-center
drawings:
  persist: false
transition: slide-left
mdc: true
---

<style>
.slidev-layout.compact h1 { font-size: 1.5em !important; line-height: 1.15 !important; margin-bottom: 0.3em !important; }
.slidev-layout.compact h3 { font-size: 1em !important; margin: 0.15em 0 !important; }
.slidev-layout.compact p, .slidev-layout.compact li { line-height: 1.3 !important; font-size: 0.85em !important; }
.slidev-layout.compact ul { margin: 0.15em 0 !important; padding-left: 1.1em !important; }
.slidev-layout.compact li { margin: 0.05em 0 !important; }
.slidev-layout.compact table { font-size: 0.8em !important; }
.slidev-layout.compact .p-2 { padding: 0.5rem 0.6rem !important; }
.slidev-layout.compact .mt-3 { margin-top: 0.4rem !important; }
</style>

# GraphAgent

## From development to production — an end-to-end benchmark, a deterministic feature compiler, an optimized search engine

<div class="abs-br m-6 text-sm opacity-50">
Jiajun Zhu · UT Austin · Jun 2026
</div>

---

# The arc — development → production

<div class="text-sm mt-2">

Prior deck: <a href="https://zhuconv.github.io/slides-hub/graph-agent/0507/1" target="_blank" class="text-blue-700 underline">zhuconv.github.io/slides-hub/graph-agent/0507</a> — the <code>GraphML-FS</code> research prototype.

</div>

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Development — the prototype worked, but…

- **No parallelism inside a round** — one agent, one solution at a time
- **Errors hard to localise** — a feature bug crashed the whole pipeline
- **Free-form Python outran the validator** → debug churn ate wall time
- Measured on a **public leaderboard** we don't own

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Production — harden each axis

- **Benchmark** — our own end-to-end harness, leakage-safe, hidden test
- **srlang** — features become *compiled SQL*; unsafe ones won't typecheck
- **Engine harness** — parallel search over atomic specs, on an MCP server
- **Playground** — a surface to drive & inspect it all

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Each prototype gap maps to one production component: validator-churn → <b>srlang</b>, no-parallelism → <b>engine harness</b>, ad-hoc eval → <b>benchmark</b>. This deck walks them in that order.
</div>

---

# System at a glance — three components, one loop

<img src="/system.svg" class="w-full mt-2" />

<div class="mt-1 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
The <b>benchmark</b> sets the tasks and scores predictions. The <b>method</b> splits in two — a deterministic <code>srlang</code> layer compiles features to SQL, an engine harness searches over it via MCP. The <b>playground</b> is the human surface. Order of this deck: benchmark → engine → playground.
</div>

---

# Benchmark — end-to-end, from raw DB to prediction

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### What it is

Not a clean feature matrix. Every task hands the system:

- a **raw multi-table SQLite DB**, and
- a **business goal** in plain language.

The system must **define the task → build point-in-time features → train → predict**, then is scored on a **hidden test set** held by the eval service.

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Why it's the right bar

- **Real enterprise data**: banking, delivery, SAP ERP, hospital ops, adtech
- **Real signal**: leakage-safe baselines beat random by a wide margin (0.74–0.94 AUROC)
- **Not Kaggle**: mined from relational DBs, signal-tested, low contamination
- **8 tasks · ~1.56M test rows**

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Schema-plausible ≠ usable — every task passes an AUROC-vs-random gate. That single check killed the synthetic "looks real, no signal" candidates and confirmed the 8 keepers.
</div>

---
class: compact
---

# Benchmark — the 8 enterprise tasks

<div class="text-sm mt-3">

| # | task | source | domain | metric | n | baseline vs random |
|---|---|---|---|:-:|--:|:-:|
| 1 | `financial_loan_bad_status` | BIRD | banking / credit risk | AUROC | 682 | 0.48 (small/noisy) |
| 2 | `retail_complaints_consumer_dispute` | BIRD | consumer-finance | AUROC | 22,417 | 0.567 |
| 3 | `debit_card_next_month_consumption` | BIRD | card / retail | MAE | 305,410 | 9,116 vs 12,291 |
| 4 | `delivery_center_order_canceled` | Spider 2.0 | last-mile delivery | AUROC | 368,999 | **0.943** |
| 5 | `complex_oracle_customer_next_quarter_purchase` | Spider 2.0 | retail warehouse | AUROC | 7,020 | 0.862 |
| 6 | `rel_salt_customer_90d_reorder` | RelBench (SAP) | SAP ERP B2B | AUROC | 13,155 | 0.891 |
| 7 | `seznam_advertiser_next_month_churn` | CTU | adtech wallet | AUROC | 1,131,975 | 0.802 |
| 8 | `fnhk_30day_readmission` | CTU | hospital ops | AUROC | 38,214 | 0.742 |

</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
7 binary (AUROC) + 1 regression (MAE). Sources: BIRD ×3, Spider 2.0 ×2, RelBench / CTU ×3 — three of them obscure real-world dumps (SAP, Czech hospital, adtech panel) chosen for low memorization risk.
</div>

---

# Benchmark — four evaluation modes

<div class="text-sm mt-3">

Each mode exposes a different slice of the pipeline, so we can score **one capability at a time**:

| mode | input exposed | system output | what it isolates |
|---|---|---|---|
| `task_build` | raw DB + business prompt | `task_spec` + `label_sql` + forbidden cols | can it **define** the task? |
| `feature_bundle` | clean DB + oracle spec + fixed model | feature matrix | are the **features** good & leak-free? |
| `pipeline_bundle` | clean DB + oracle spec | predictions | can it **model** end-to-end? |
| `business_e2e` | raw DB + business prompt | predictions | the **whole thing**, prompt → prediction |

</div>

<div class="grid grid-cols-2 gap-4 mt-3 text-xs">
<div class="p-2 bg-blue-50 rounded border border-blue-200">
Lower modes give the system more scaffolding; <code>business_e2e</code> gives the least. Comparing across modes localises <em>where</em> a system fails.
</div>
<div class="p-2 bg-green-50 rounded border border-green-200">
Every mode is gated by the same leakage checker — a leaky or invalid pipeline never earns a clean score.
</div>
</div>

---

# Benchmark — leakage-safe scoring + baselines

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-purple-50 rounded border border-purple-200">

### How a score is trusted

- **Point-in-time**: labels/features cut at a prediction-time anchor; chronological splits
- **Static check**: forbidden-token scan on the SQL/code
- **Empirical check**: near-perfect single feature or implausible score → flagged
- **Fixed LightGBM** in `feature_bundle` isolates feature quality from modeling
- **Hidden GT** lives only in the eval service

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Baselines today *(CC-only = a Claude coding agent)*

| mode | metric | CC-only |
|---|---|--:|
| `task_build` | valid specs | **8/8** |
| `feature_bundle` | fixed-model AUROC | 0.878 (+0.077 lift) |
| `pipeline_bundle` | AUROC / leak-free | 0.860 / 87.5% |
| `business_e2e` | AUROC / leak-free | 0.855 / 75% |

<div class="text-xs opacity-60 mt-1">DFS feature baseline: 0.738 (−0.062 lift). our-system = placeholder.</div>

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Leak-free rate drops from 87.5% → 75% as scaffolding is removed (<code>pipeline</code> → <code>e2e</code>) — exactly the gap a deterministic feature layer should close.
</div>

---

# Method — two layers: deterministic ⊥ search

<div class="grid grid-cols-2 gap-4 mt-4 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Deterministic layer — `srlang`

The part that must be **exactly right, every time**.

- Features written in a typed **feature-IR**, compiled to **real SQL**
- Type system makes leakage a **compile error**
- Same IR → same hash → same SQL

*Answers: "turn this feature into trustworthy SQL."*

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Search layer — engine harness

The part that must be **fast and exploratory**.

- LLM controller + N parallel workers
- Proposes which features to try next
- Built **on top of `srlang` as an MCP server**

*Answers: "which features are worth building?"*

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
This split is the production fix. The prototype let one LLM write free-form Python that <em>outran the validator</em>; now correctness is owned by a deterministic compiler, and the LLM only explores within what compiles.
</div>

---

# srlang — feature-IR → SQL

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### You write intent (the IR)

```python
# "# prior loans for this account
#  in the strict 365d before origination"
prior_loans_365d = Ascend.aggregate(
  source = Source("loan"),
  group_keys = [Col("entity_id")],
  agg = "count",
  filters = [Causal(strict=True),
             Window("365d")],
)
```

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### srlang emits the SQL (DuckDB)

```sql
SELECT example_id,
  COUNT(*) OVER (
    PARTITION BY entity_id
    ORDER BY prediction_time
    RANGE BETWEEN INTERVAL 365 DAY PRECEDING
              AND INTERVAL 1 DAY PRECEDING
  ) AS prior_loans_365d   -- strict past
FROM loan
```

</div>
</div>

<div class="grid grid-cols-2 gap-2 mt-2 text-xs">
<div class="p-2 bg-purple-50 rounded border border-purple-200">
<b>5 grain primitives</b>: Introduce · Preserve · Ascend · Descend · Traverse — 13 legacy node kinds collapsed to parameters.
</div>
<div class="p-2 bg-blue-50 rounded border border-blue-200">
<b>Compile</b>: type-check → DuckDB codegen → materialize. Causal → window function; transductive → <code>GROUP BY</code>; relation hop → CTE.
</div>
</div>

<div class="mt-2 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
The "odd-looking language" is a typed algebra, not free-form code — which is exactly what makes the next slide's guarantees possible.
</div>

---

# srlang — determinism & leakage-safety

<div class="grid grid-cols-2 gap-4 mt-4 text-sm">
<div class="p-3 bg-purple-50 rounded border border-purple-200">

### Type system = leakage-safety

- **Visibility lattice**: `ALL_ROWS < CAUSAL_PAST_ONLY < TRAIN_ONLY`
- **Rule A** — only causal/windowed reductions may read strict past
- **Rule B** — only a label-agg may read the label; the result can't be used as a feature at predict time
- An unsafe feature **fails `type_of` before any SQL runs**

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Reproducibility & proof

- **Structural SHA256** — same IR ⇒ byte-identical hash & SQL
- **PIT audit** — as-of replay re-derives leakage-safety dynamically
- **Parity 33/33** programs across 4 tasks; **55 property laws** green
- **Seeded sampling** — regeneration reproduces exact values
- ~2,000 LOC kernel, no v0 dependency

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
This is why we put correctness in a compiler: the validator <em>can't</em> be outrun, because a leaky feature is a type error — not a bug discovered three steps downstream.
</div>

---

# Engine harness — srlang as an MCP server

<img src="/engine.svg" class="w-full mt-2" />

<div class="mt-1 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
The engine never re-implements feature semantics — it <b>calls the kernel</b> through MCP tools (<code>compile · typecheck · pit_check · materialize</code>). Controller (rules) and workers (LLM) explore; the kernel guarantees every candidate is safe and reproducible. <i>MCP packaging is in build; <code>sketch.py</code> is the in-repo seed of the loop.</i>
</div>

---

# Engine harness — making search efficient

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### What buys the speed

- **Atomic spec** is the unit → materialize + eval is **embarrassingly parallel**
- **Hash dedup** — never evaluate the same feature twice across rounds
- **Matrix reuse** — round k+1 builds on rounds 0..k
- **Typed bank prunes** illegal specs **before** SQL runs
- **Two cheap gates** (compile + PIT) kill bad candidates early
- **Train-only CV** scoring — holdout is never read during search

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Evidence — engine on GraphTestbed *(prior deck)*

| task | metric | GraphML-FS | rank |
|---|:-:|--:|:-:|
| `figraph` | AUC-ROC | **0.895** | **#1** |
| `arxiv-citation` | AUC-ROC | **0.789** | **#1** |
| `ibm-aml` | F1 (min.) | **0.184** | **#1** |
| `ieee-fraud` | AUC-ROC | 0.921 | #3 |

<div class="text-xs opacity-60 mt-1">Same <code>claude-sonnet-4-6</code> as competitors — the harness is the differentiator.</div>

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Round wall-time is bounded by the slowest worker, not total prompt count; errors localise to one spec. Next: re-run the same engine against EnterpriseML-Bench's four modes (our-system column).
</div>

---

# Playground — the human surface

<div class="text-sm mt-2 text-center opacity-70">
Drive the search, watch features compile to SQL, and compare runs — all from one screen.
</div>

<div class="flex justify-center mt-2">
  <img src="/playground.png" class="rounded shadow-lg border border-gray-200" style="max-height: 380px;" />
</div>

<div class="mt-2 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
The playground closes the loop from this deck: pick a benchmark task, let the engine search over <code>srlang</code>, and inspect every compiled feature + score in place. <i>(screenshot — replace <code>public/playground.png</code>)</i>
</div>
