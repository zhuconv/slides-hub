---
theme: default
title: "AestheticBench: A Two-Tier Benchmark for Aesthetic Preference Discovery"
info: "Local Bench Implementation — Dev Report"
author: "Jiajun Zhu"
---

<style>
  :root { --slidev-code-font-size: 0.78em; }
  .slidev-layout { font-size: 1.0em; }
  table { font-size: 0.88em; }
  h1 { font-size: 1.85em !important; }
  h2 { font-size: 1.4em !important; }
  .small { font-size: 0.82em; }
  .footnote { font-size: 0.72em; color: #888; margin-top: 1em; }
  .slidev-layout p { color: #1a1a1a !important; opacity: 1 !important; }
  pre { font-size: 0.78em !important; line-height: 1.25em !important; }
</style>

# AestheticBench

## A Two-Tier Benchmark for Aesthetic Preference Discovery

<div style="margin-top: 2em; color: #555; font-size: 0.95em;">

Jiajun Zhu &mdash; April 2026

**Dev report**: from a pilot study ([prior slides](https://zhuconv.github.io/slides-hub/aesthetic-agent/benchmark/)) to a reproducible benchmark with a clean agent/environment boundary, curated instances, and real scorer-backed results.

</div>

---

# From Pilot Study to Benchmark

<div style="font-size: 0.95em;">

The pilot established that **generator choice matters** and **multi-model evolve beats single-model and text-only** on 5 hand-picked profiles. But that setup was not a benchmark:

- Agent was entangled with the scorer and generation pipeline
- Only 5 instances, no difficulty labels, no public/private split
- No standard interface for third-party agents
- Hard to compare LLM reasoning vs. end-to-end agent systems independently

**AestheticBench** formalizes the pilot as a reproducible evaluation:

1. Clean agent &harr; environment boundary (two tiers)
2. 50 curated instances spanning easy / medium / hard
3. Standard metrics, trajectory logging, and submission format
4. Real LLM scorer (Claude or GPT, incl. local CLIProxyAPI-backed Codex)

</div>

---

# Two-Tier Design

<div class="grid grid-cols-2 gap-4" style="font-size: 0.9em;">
<div>

**Tier 1 &mdash; Core** (ranks LLMs)

```
Agent = LLM (bare)
   |  tool calls
   v
Environment
  tools: generate_image, get_feedback,
         compare_images, chat,
         submit_prediction
  scorer + simulated user
```

Agent picks tools &amp; arguments. Environment owns generation. Only the LLM's reasoning varies.

</div>
<div>

**Tier 2 &mdash; Open** (ranks agent systems)

```
Agent = black box
   |  images + messages
   v
Environment
  API: submit_image, compare_images,
       chat, submit_prediction
  scorer + simulated user
```

Agent owns generation, model choice, prompt engineering, and search strategy end-to-end.

</div>
</div>

**Shared**: scorer, simulated user, GT profiles, metrics, trajectory format. Separate leaderboards.

---

# Profile Space &amp; Instances

<div style="font-size: 0.95em;">

**VisualProfile &mdash; 5 axes, 2,592 combinations**

| Axis | Values | Count |
|---|---|:---:|
| art_style | Anime, Impressionism, Minimalism, Pop Art, Surrealism, Realism, Classical, Abstract | 8 |
| color | Warm, Cool, Vibrant, Earth, Monochrome, Neutral | 6 |
| art_medium | Digital, Oil Painting, Pencil, Watercolor, Ink, Charcoal | 6 |
| detail | Fine, Moderate, Minimal | 3 |
| saturation | Vivid, Muted, Moderate | 3 |

**Anthology instance set (default, 50 instances)** &mdash; hand-curated coherent aesthetics with difficulty labels:

| Difficulty | Count | Example |
|---|:---:|---|
| Easy | 15 | `charcoal_portrait`, `candy_anime`, `vibrant_pop` |
| Medium | 20 | `ghibli_wash`, `frost_realism`, `wabi_sabi` |
| Hard | 15 | `anime_oil` (anime in oil paint), `color_field` (minimalism + vivid) |

Also supports `--instance-set random` for arbitrary programmatic sampling across the full 2,592 space.

</div>

---

# Environment &amp; Agent Protocols

<div style="font-size: 0.85em;">

```python
# Tier 1 — the LLM never touches a diffusion model
class CoreAgent(Protocol):
    def on_session_start(self, config: SessionConfig, tools: list[ToolDef]) -> None: ...
    def next_tool_call(self, history: list[ToolResult]) -> ToolCall | None: ...

# Tier 2 — the agent owns generation
class OpenAgent(Protocol):
    def on_session_start(self, config: SessionConfig) -> None: ...
    def next_action(self, feedback: dict | None) -> Action | None: ...
```

**Environment** (`src/environment.py`) exposes both interfaces behind one class, backed by:

- `scorer.py` &mdash; LLM vision scorer (1&ndash;10 absolute or A/B pairwise). Supports Anthropic, OpenAI, and any OpenAI-compatible proxy (`base_url` + `api_key`). Validated against a local **CLIProxyAPI** instance exposing `gpt-5.4`.
- `simulated_user.py` &mdash; natural-language persona for optional `chat` channel, gated by `chat_enabled`.
- `trajectory.py` &mdash; auto-recorded JSONL log of every tool call / action.
- `generation_backend.py` &mdash; real diffusers pipelines (FLUX, SD3.5, SD1.5) for Tier 1 and Tier 2 baselines.

</div>

---

# Metrics &amp; Harness

<div style="font-size: 0.9em;">

**Primary metrics** (leaderboard)

| Metric | Definition | Range |
|---|---|:---:|
| Axis accuracy | Predicted axes matching GT | 0&ndash;5 |
| Final score | Avg simulated-user score of last round | 1&ndash;10 |
| Rounds to 3/5 | First round with &ge; 3 axes correct | 1&ndash;budget |
| Efficiency | axis_accuracy / total_images | &ge; 0 |
| pass@k | P(&ge; 1 of k trials reaches &ge; 3/5 accuracy) | 0&ndash;1 |

**Batch runner** (`src/harness/runner.py`): agent &times; tier &times; setting &times; instances &times; K trials &rarr; `results.json` + per-session `trajectory.jsonl`.

Ranking: axis_accuracy &gt; pass@k &gt; efficiency.

</div>

---

# Tier-2 Baselines: What&rsquo;s Included

<div style="font-size: 0.92em;">

Three reference `OpenAgent`s, all sharing a common state-machine / support layer (`src/agents/open_support.py`):

| Agent | Strategy |
|---|---|
| `text_only` | Claude refines a single profile from absolute scores; no structured search |
| `evolve` | AlphaEvolve-Lite: structured mutations, tournament selection, hypothesis tracking, L1/L2 eval |
| `multi_evolve` | `evolve` + forced model mutations (FLUX / SD3.5 / SD1.5) + cross-model re-eval every 3 rounds |

**Shared machinery added in this branch**

- Real diffusers generation (no mock fallback in the agent path)
- Retry-based scorer failure handling (no silent defaults)
- Candidate-level 4-prompt aggregation in absolute mode
- Budget-aware multi-candidate evaluation for `evolve` / `multi_evolve`
- Evidence-based early stop
- Candidate-round accounting in env / metrics (not raw prompt rounds)

Validated: **275 tests passing** on the `reproduce` branch.

</div>

---

# Real Result Slice (Tier 2, Open)

<div style="font-size: 0.9em;">

Setting: `max_images=120` budget, absolute feedback, GPT-5.4 scorer via local CLIProxyAPI, real diffusers on GPU, seed=202, recommended 4-prompt bundle per candidate. **4 easy anthology instances**: `bold_abstract`, `charcoal_portrait`, `retro_comic`, `vibrant_pop`.

| Agent | Mean axis acc (/5) | Final score (/10) | Rounds used | pass@1 |
|---|:---:|:---:|:---:|:---:|
| `text_only`    | 2.50 | 6.50  | 21.2 | 0.50 |
| `evolve`       | 2.75 | 5.625 | 23.2 | 0.50 |
| `multi_evolve` | **3.00** | 6.438 | **19.0** | **0.75** |

**Ordering**: `multi_evolve` &gt; `evolve` &gt; `text_only` &mdash; consistent with the pilot study, now on the benchmark harness with a real remote scorer.

</div>

<div class="small" style="color:#888; margin-top: 0.6em;">
This is a slice, not the full 12-instance balanced set. The remaining 8 (medium + hard) runs hit CUDA OOM from external GPU contention on GPU2 and were discarded &mdash; the result files exist but are marked invalid and must not be aggregated.
</div>

---

# What&rsquo;s Known, What&rsquo;s Pending

<div style="font-size: 0.92em;">

**Known good**

- Two-tier environment + both agent protocols implemented
- 50-instance anthology curated and validated
- Liked-only scorer (Anthropic / OpenAI / local proxy) with retry
- 3 open-tier baselines refactored as bench-native `OpenAgent`s
- Harness, metrics, trajectory, results format all wired through
- 4-easy-instance slice confirms pilot ordering on real scorer + real diffusers

**Pending before a publishable final result**

1. Full 12-instance balanced run (4 easy + 4 medium + 4 hard) for each of `text_only`, `evolve`, `multi_evolve` &mdash; one agent per free GPU
2. Tier-1 baselines (same three strategies but routed through `generate_image` tool)
3. Dialogue-enabled (`chat_enabled=true`) runs &mdash; simulated user persona already exists
4. Scorer consistency audit (target &sigma; &lt; 0.5) + 100-sample human validation
5. Private instance pool rotation and public leaderboard hosting

</div>

---

# Reproducing &amp; Extending

<div style="font-size: 0.88em;">

**Install &amp; run a smoke test** (mock scorer, no GPU)

```bash
pip install -e ".[generation]"
python -m src.harness.runner \
    --agent random --tier core \
    --instance-set anthology --use-mock-scorer \
    --output-dir outputs/random_baseline
```

**Real scorer via local CLIProxyAPI-backed Codex / GPT**

```bash
./cli-proxy-api --codex-login
export AESTHETICBENCH_OPENAI_BASE_URL="http://127.0.0.1:8317/v1"
export AESTHETICBENCH_OPENAI_API_KEY="sk-dummy"
```

**Reproducing the open-tier slice**

```bash
CUDA_VISIBLE_DEVICES=0 python scripts/run_open_budget_eval.py \
    --agent multi_evolve --seed 202 --budget 120 --gpu 0
```

**Writing a new agent**: implement `CoreAgent` (Tier 1) or `OpenAgent` (Tier 2) from `src/agents/protocol.py`. Both take `SessionConfig` on start, and the harness handles the rest.

</div>

---

# Summary

<p style="color: #1a1a1a;"><strong>AestheticBench</strong> turns the pilot multi-model aesthetic-discovery study into a reproducible, two-tier benchmark with 50 curated instances, a clean agent/environment boundary, real LLM scoring, and three open-tier baselines.</p>

<p style="color: #1a1a1a;"><strong>Early evidence:</strong> on a 4-easy-instance slice with a real GPT-5.4 scorer and real diffusers, the pilot ordering holds &mdash; <code>multi_evolve</code> (3.00 / 0.75 pass@1) &gt; <code>evolve</code> (2.75 / 0.50) &gt; <code>text_only</code> (2.50 / 0.50).</p>

<p style="color: #1a1a1a;"><strong>Immediate next step:</strong> a clean full 12-instance balanced run on dedicated GPUs to replace the contaminated remaining-8 attempts and produce the first publishable Tier-2 leaderboard row.</p>

<div class="footnote">
Repo: <code>AestheticBench-report</code>, branch <code>reproduce</code>. Tests: 275 passing. Prior slides: <a href="https://zhuconv.github.io/slides-hub/aesthetic-agent/benchmark/">aesthetic-agent/benchmark</a>.
</div>
