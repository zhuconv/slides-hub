---
theme: default
title: "srlang — a usage guide"
class: text-center
transition: slide-left
mdc: true
---

<style>
.slidev-layout.compact h1 { font-size: 1.5em !important; line-height: 1.15 !important; margin-bottom: 0.3em !important; }
.slidev-layout.compact h3 { font-size: 1em !important; margin: 0.15em 0 !important; }
.slidev-layout.compact p, .slidev-layout.compact li { line-height: 1.3 !important; font-size: 0.85em !important; }
.slidev-layout.compact ul { margin: 0.15em 0 !important; padding-left: 1.1em !important; }
.slidev-layout.compact li { margin: 0.05em 0 !important; }
.slidev-layout.compact pre { font-size: 0.72em !important; line-height: 1.25 !important; }
.slidev-layout.compact table { font-size: 0.8em !important; }
.slidev-layout pre { font-size: 0.78em; line-height: 1.3; }
</style>

# srlang

## Leakage-safe features, by construction — a usage guide

<div class="abs-br m-6 text-sm opacity-50">
Jun 2026
</div>

---

# What srlang is — intent in, trustworthy SQL out

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### You write *intent*, not code

- a typed **feature-IR** (5 grain primitives), or DSL-JSON
- it declares *what* the feature means, **point-in-time**
- leakage is a **type**, not a convention you hope holds

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### srlang hands back

- real **DuckDB SQL** — compiled + materialized for you
- a **leakage guarantee**: unsafe ⇒ a compile error
- **same IR → same hash → same SQL** (reproducible)

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
<code>pip install srlang</code> — the kernel is just <code>{duckdb, pandas}</code>; <code>[model]</code> adds the boosts, <code>[mcp]</code> the agent server. You provide a clean DB; srlang provides the leak-free features on top.
</div>

---
class: compact
---

# The 30-second tour — six nouns, one loop

```python
import srlang as sr
from srlang.models import GBDT

proj = sr.project(spec, data_dir="…")                       # 1. typed schema + policy
task = proj.task(label=sr.forward_label("orders", "count", "90d"),
                 anchors=anchors, split=sr.TemporalSplit("2018-01-01"))   # 2. a task
feat = {"txns_90d": {"produce": {"source": {"relation": "orders"},        # 3. a feature
                                 "summary": "count", "scope": {"causal": True, "window": "90d"}}}}

pipe = sr.pipeline(task, features=feat, model=GBDT())        # 4. model + 5. pipeline
pipe.certificate()          # {end_to_end: True}  — proven leak-free, BEFORE you fit
pipe.fit(target)            # ⑦ train-only fit; ⑧ OOF↔full handled automatically
pipe.export("./bundle")     # IR + SQL + leakage cert + model
sr.predict("./bundle", new_rows)   # 6. prediction — skew-free PIT serving
```

<div class="mt-2 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Each line is a leakage <b>seam</b> the kernel enforces — you never hand-write the point-in-time SQL, and a leak can't survive to <code>fit</code>.
</div>

---

# Write a feature — author it, then `check` it

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### A safe feature (DSL-JSON)

```json
{ "produce": {
    "source": {"relation": "orders"},
    "summary": "count",
    "scope": {"causal": true,
              "window": "90d"} } }
```

`sr.verbs.check(intent, schema)` → `{ok: true}`

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### A leaky one is *rejected*

a feature that reads the future / the label →

```json
{ "ok": false,
  "error_class": "train_only_feature",
  "reason": "feature may not be
             forward-looking",
  "fix": "use a causal/windowed agg" }
```

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
You — or an agent — only ever explore what type-checks. The structured rejection (class · reason · fix) <i>is</i> the contract; nothing leaky materializes.
</div>

---

# Why you trust it — leakage is a *compile error*

<div class="grid grid-cols-2 gap-4 mt-4 text-sm">
<div class="p-3 bg-purple-50 rounded border border-purple-200">

### The type system

- **Visibility lattice**: `ALL_ROWS < CAUSAL < TRAIN_ONLY`
- **Rule A** — only a causal/windowed reduction may read the strict past
- **Rule B** — only a label-agg reads the label, and never as a feature at predict time
- unsafe ⇒ fails `check` **before any SQL runs**

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### The proofs ship with it

- **structural SHA256** — same IR ⇒ identical SQL
- **PIT audit** — as-of replay re-derives safety dynamically
- **parity 33/33** vs an independent oracle, 4 tasks
- **363 property laws** green; kernel **byte-frozen**

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
A leaky feature is a <i>type error</i> — caught at the source, not a bug you discover three steps downstream in a score that looks too good.
</div>

---

# project + task — the typed substrate

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### `project` — declare the schema once

```python
proj = sr.project(sr.ProjectSpec(
  target_table="loan",
  hops=(sr.HopSpec("orders",
        src="cust", dst="oid", time="ts"),),
  entity_idspaces=("cust",)),
  data_dir="./data")
```

*(no clean/entity-resolution — that's the harness's job)*

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### `task` — a forward label, point-in-time

```python
task = proj.task(
  label=sr.forward_label(
        "orders", "count", "90d"),
  anchors=anchors,
  split=sr.TemporalSplit("2018-01-01"))
```

forward label + anchors + the dual **embargo** rail

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
The label looks <i>ahead</i> from each anchor by construction; the split carries the embargo so a train label window can't cross into holdout. <code>embargo &lt; H</code> is a compile error.
</div>

---

# model + pipeline — snap them together

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### `srlang.models` — or bring your own

```python
from srlang.models import GBDT      # HistGBDT/
                                    # LightGBM/CatBoost
m = GBDT()
```

any sklearn-shaped `fit`/`predict` object (tabpfn, kumo, yours) conforms to **`Predictor`** and drops in.

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### `pipeline.fit` owns the leakage

```python
pipe = sr.pipeline(task,
        features=feats, model=m)
pipe.fit(target)
```

- **⑦** fits on train rows only
- **⑧** a label-reading feature → OOF on train, full-fit on holdout — **automatic**

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
<b>vs sklearn:</b> the pipeline understands forward labels, the OOF↔full target-encoding swap, and entity/temporal splits — a model stays leakage-naive, so any estimator plugs in.
</div>

---

# certificate + serving — proof, then deploy

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-purple-50 rounded border border-purple-200">

### `certificate()` — machine-checked proof

```python
pipe.certificate()
# {end_to_end: True, features: {...},
#  split: {ok: True, embargo: "90d"}}
```

GREEN only if **every feature** type-checks + passes PIT replay **and** the split is valid. **RED on any leak.**

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### `export` → `predict` — skew-free serving

```python
pipe.export("./bundle")     # IR+SQL+cert
                            # +model+schema
sr.predict("./bundle", new_rows)
```

serving re-runs the **same IR** at new anchors

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
There's no train/serve skew because a feature is <b>declarative IR, not a fitted transform</b> — the exported bundle is a deployable unit, with its leakage certificate inside.
</div>

---

# For agents — the same kernel over MCP

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### The verb contract

- `capabilities` · `describe_schema` — **discover**
- `check` · `check_many` — **validate** (the gate)
- `audit_pit` · `score` · `materialize` — **run**

in-process, `srlang.contract.call`, or **MCP** (`srlang[mcp]`).

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### The trust boundary

- the agent supplies **pure-data intent JSON**
- the harness binds the **schema** + runtime data
- the boundary **never raises** → a structured `Feedback`

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
This is how a search agent uses srlang: it <b>can't outrun the compiler</b> — it only explores what type-checks, and the two cheap gates (compile + PIT) kill bad candidates before any heavy SQL runs.
</div>

---
class: compact
---

# Recap — one loop, nine guaranteed seams

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### The loop you write

`project → task → feature → model → pipeline → prediction`

- **project / task** — typed schema + a forward label
- **feature** — `check` it (the gate)
- **model** — a boost, or your own `Predictor`
- **pipeline** — `fit` · `certificate` · `report`
- **prediction** — `export` → `sr.predict(bundle)`

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### What you get for free

- leakage caught as a **type error**, not downstream
- the **OOF↔full** swap + train-only fit, automatic
- a machine-checked **leakage certificate** per pipeline
- **skew-free** serving from the exported bundle
- the same kernel for humans **and** agents (MCP)

</div>
</div>

<div class="mt-2 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Frozen kernel · parity 33/33 · 363 property laws · tagged <code>m3</code>. &nbsp;Start: <code>pip install srlang[model]</code>, then read the per-folder READMEs + <code>spec/surface-v1.md</code>.
</div>
