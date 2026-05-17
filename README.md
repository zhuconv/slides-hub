# Slides Hub

Centralized hosting for all project slides. Powered by [Slidev](https://sli.dev), auto-deployed to GitHub Pages.

**Live site**: https://zhuconv.github.io/slides-hub/

The site is two-level — the landing page lists projects; each project page lists its decks, newest first.

## Projects

Every deck is named `<project>/<deck>`. Current projects:

| Project | What it is |
|---------|-----------|
| `graph-agent` | LLM-agent feature synthesis & benchmarking for tabular / graph ML |
| `aesthetic-agent` | Multi-agent aesthetic preference discovery for image generation |

Their individual decks (`graph-agent/0507`, `aesthetic-agent/0515`, …) are listed on the [live index](https://zhuconv.github.io/slides-hub/).

## Naming convention — read before adding slides

Every deck **must** be named `<project>/<deck>`. Before adding one, decide what `<project>` is:

- **Existing project?** Reuse its **exact** name — `graph-agent` or `aesthetic-agent`. The deck is archived under that group on the index.
- **New project?** Pick a new kebab-case name (e.g. `diff-bpo`). It becomes a new group on the index.

`<deck>` is a sub-name unique within the project. **Use the `MMDD` date of the talk** (e.g. `0531`) so it sorts chronologically — this is the default convention. Descriptive slugs (`benchmark`, `bench-dev`) also work but won't sort by date.

> A bare name with no `/` (e.g. `my-talk`) is **rejected** by `upload.sh` and `sync-slides.mjs --add` — a deck must always live under a project.

Each deck also carries a `date` (`YYYY-MM-DD`) in `projects.json`; the index sorts decks newest-first by it. `upload.sh` and the interactive helper fill it in for you.

## Adding a deck

### Option A — One-command upload (from any server)

```bash
cd /path/to/my-project

# current dir has slides.md → new deck "0531" under the graph-agent project
curl -sL https://raw.githubusercontent.com/zhuconv/slides-hub/main/upload.sh | bash -s -- graph-agent/0531

# specify slides file + asset dirs
curl -sL https://raw.githubusercontent.com/zhuconv/slides-hub/main/upload.sh | bash -s -- graph-agent/0531 report.slides.md public/ figures/

# a brand-new project — just use a new prefix
curl -sL https://raw.githubusercontent.com/zhuconv/slides-hub/main/upload.sh | bash -s -- diff-bpo/0531
```

`upload.sh` clones the hub, drops the deck under `projects/<project>/<deck>/`, appends a `projects.json` entry (with today's date), then commits and pushes. GitHub Actions rebuilds and redeploys.

Requirements: `git` with SSH access to `github.com:zhuconv/slides-hub.git`, plus `node` or `python3` on the server.

### Option B — Local workflow (on this machine)

Register the deck in `projects.json`:

```json
[
  {
    "name": "graph-agent/0531",
    "date": "2026-05-31",
    "src": "/path/to/GraphAgent",
    "slides": "slides.md",
    "assets": ["public"]
  }
]
```

Or use the interactive helper — it prompts for name, date, and source:

```bash
node sync-slides.mjs --add
```

Then sync and deploy:

```bash
node sync-slides.mjs                  # sync all decks
node sync-slides.mjs graph-agent/0531 # sync one deck
git add -A && git commit -m "graph-agent/0531: add deck" && git push
```

GitHub Actions auto-builds and deploys on push.

## Source Types

| Type | `projects.json` field | How it syncs |
|------|----------------------|--------------|
| Local repo | `"src": "/path/to/repo"` | `cp` |
| Remote server | `"remote": "user@host:/path"` | `rsync` over SSH |
| Uploaded directly | `"src": "uploaded"` | already pushed via `upload.sh`; sync skips it |

## URL Structure

```
https://zhuconv.github.io/slides-hub/                       → landing — list of projects
https://zhuconv.github.io/slides-hub/graph-agent/           → graph-agent — list of its decks
https://zhuconv.github.io/slides-hub/graph-agent/0507/      → graph-agent, deck 0507
https://zhuconv.github.io/slides-hub/aesthetic-agent/0515/  → aesthetic-agent, deck 0515
```

## Project Structure

```
slides-hub/
├── projects.json          # registry of all decks (name, date, source)
├── sync-slides.mjs        # pull slides from local / remote sources
├── build-all.mjs          # build all decks → dist/ + landing & project pages
├── upload.sh              # one-command upload from any server
├── package.json
├── .github/workflows/
│   └── deploy.yml         # GitHub Pages auto-deploy
└── projects/              # synced slide files (git-tracked)
    └── <project>/
        └── <deck>/
            ├── slides.md
            └── public/    # images and assets
```
