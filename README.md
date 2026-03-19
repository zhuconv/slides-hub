# Slides Hub

Centralized hosting for all project slides. Powered by [Slidev](https://sli.dev), auto-deployed to GitHub Pages.

**Live site**: https://zhuconv.github.io/slides-hub/

## One-Command Upload (from any server)

```bash
cd /path/to/my-project

# Basic — current dir has slides.md
curl -sL https://raw.githubusercontent.com/zhuconv/slides-hub/main/upload.sh | bash -s -- my-project

# Specify slides file + asset dirs
curl -sL https://raw.githubusercontent.com/zhuconv/slides-hub/main/upload.sh | bash -s -- my-project report.slides.md public/ figures/

# Multiple slides from one repo — use different names
curl -sL https://raw.githubusercontent.com/zhuconv/slides-hub/main/upload.sh | bash -s -- diffbpo/main slides.md
curl -sL https://raw.githubusercontent.com/zhuconv/slides-hub/main/upload.sh | bash -s -- diffbpo/ablation docs/ablation.slides.md docs/figures/
```

Requirements: `git` with SSH access to `github.com:zhuconv/slides-hub.git`, plus `node` or `python3` on the server.

## Local Workflow (on this machine)

### Add a project

Edit `projects.json`:

```json
[
  {
    "name": "aesthetic-agent",
    "src": "/path/to/AestheticAgent",
    "slides": "slides.md",
    "assets": ["public", "slides_assets"]
  },
  {
    "name": "diffbpo/main",
    "src": "/path/to/DiffBPO",
    "slides": "slides.md"
  },
  {
    "name": "diffbpo/ablation",
    "src": "/path/to/DiffBPO",
    "slides": "docs/ablation.slides.md",
    "assets": ["docs/figures"]
  },
  {
    "name": "remote-exp",
    "remote": "user@server:/home/user/project",
    "slides": "slides.md",
    "assets": ["public"]
  }
]
```

Or use the interactive helper:

```bash
node sync-slides.mjs --add
```

### Sync and deploy

```bash
node sync-slides.mjs              # sync all projects
node sync-slides.mjs diffbpo/main # sync one project
git add -A && git commit -m "update slides" && git push
```

GitHub Actions auto-builds and deploys on push.

## Source Types

| Type | `projects.json` field | How it syncs |
|------|----------------------|--------------|
| Local repo | `"src": "/path/to/repo"` | `cp` |
| Remote server | `"remote": "user@host:/path"` | `rsync` over SSH |
| Any server | (use `upload.sh`) | `git clone` + push |

## URL Structure

```
https://zhuconv.github.io/slides-hub/                   → index page
https://zhuconv.github.io/slides-hub/aesthetic-agent/    → AestheticAgent slides
https://zhuconv.github.io/slides-hub/diffbpo/main/       → DiffBPO main slides
https://zhuconv.github.io/slides-hub/diffbpo/ablation/   → DiffBPO ablation slides
```

## Project Structure

```
slides-hub/
├── projects.json          # registry of all slide sources
├── sync-slides.mjs        # pull slides from local/remote sources
├── build-all.mjs          # build all decks → dist/
├── upload.sh              # one-command upload from any server
├── package.json
├── .github/workflows/
│   └── deploy.yml         # GitHub Pages auto-deploy
└── projects/              # synced slide files (git-tracked)
    └── <name>/
        ├── slides.md
        └── public/        # images and assets
```
