#!/usr/bin/env node
/**
 * sync-slides.mjs — Pull slides from local repos, remote servers, or URLs.
 *
 * projects.json schema:
 * [
 *   // ── 本地 repo，单个 slides ──
 *   {
 *     "name": "aesthetic-agent",
 *     "src": "/path/to/AestheticAgent",
 *     "slides": "slides.md",
 *     "assets": ["public", "slides_assets"]
 *   },
 *
 *   // ── 本地 repo，多个 slides ──
 *   {
 *     "name": "diffbpo/main",
 *     "src": "/path/to/DiffBPO",
 *     "slides": "slides.md"
 *   },
 *   {
 *     "name": "diffbpo/ablation",
 *     "src": "/path/to/DiffBPO",
 *     "slides": "docs/ablation.slides.md",
 *     "assets": ["docs/figures"]
 *   },
 *
 *   // ── 远程 server (rsync over ssh) ──
 *   {
 *     "name": "remote-project",
 *     "remote": "user@server:/path/to/repo",
 *     "slides": "slides.md",
 *     "assets": ["public"]
 *   }
 * ]
 *
 * Usage:
 *   node sync-slides.mjs              # sync all
 *   node sync-slides.mjs <name>       # sync one project
 *   node sync-slides.mjs --add        # interactive add
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from "fs";
import { execSync } from "child_process";
import { resolve, join, dirname, basename } from "path";
import { createInterface } from "readline";

const hub = resolve(import.meta.dirname || ".");
const configPath = join(hub, "projects.json");
const projects = JSON.parse(readFileSync(configPath, "utf-8"));

// ── Helpers ──

function syncLocal(project) {
  const { name, src, slides = "slides.md", assets = ["public", "slides_assets"] } = project;
  const srcDir = resolve(src);
  const destDir = join(hub, "projects", name);

  if (!existsSync(srcDir)) {
    console.warn(`⚠  skip ${name}: ${srcDir} not found`);
    return false;
  }

  mkdirSync(destDir, { recursive: true });

  // Copy slides file
  const slidesPath = join(srcDir, slides);
  if (!existsSync(slidesPath)) {
    console.warn(`⚠  skip ${name}: ${slidesPath} not found`);
    return false;
  }
  // Always copy as slides.md in dest (Slidev expects this name)
  cpSync(slidesPath, join(destDir, "slides.md"));

  // Copy asset directories
  for (const assetDir of assets) {
    const assetSrc = join(srcDir, assetDir);
    if (existsSync(assetSrc)) {
      cpSync(assetSrc, join(destDir, "public"), { recursive: true });
    }
  }

  return true;
}

function syncRemote(project) {
  const { name, remote, slides = "slides.md", assets = ["public"] } = project;
  const destDir = join(hub, "projects", name);
  mkdirSync(destDir, { recursive: true });

  // rsync slides file
  try {
    execSync(`rsync -avz "${remote}/${slides}" "${destDir}/slides.md"`, { stdio: "pipe" });
  } catch (e) {
    console.warn(`⚠  skip ${name}: rsync failed for slides — ${e.message}`);
    return false;
  }

  // rsync asset directories
  for (const assetDir of assets) {
    try {
      execSync(`rsync -avz "${remote}/${assetDir}/" "${destDir}/public/"`, { stdio: "pipe" });
    } catch {
      // Asset dir might not exist, that's ok
    }
  }

  return true;
}

// ── Interactive add ──

async function interactiveAdd() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((res) => rl.question(q, res));

  console.log("\n📎 Add a new slides source\n");

  const name = await ask("Name (e.g. diffbpo/main): ");
  const type = await ask("Type — (l)ocal or (r)emote? [l]: ") || "l";

  let entry;
  if (type.startsWith("r")) {
    const remote = await ask("Remote path (user@host:/path/to/repo): ");
    const slides = await ask("Slides file [slides.md]: ") || "slides.md";
    entry = { name, remote, slides, assets: ["public"] };
  } else {
    const src = await ask("Local repo path: ");
    const slides = await ask("Slides file [slides.md]: ") || "slides.md";
    const assetsRaw = await ask("Asset dirs (comma-separated) [public]: ") || "public";
    const assets = assetsRaw.split(",").map(s => s.trim());
    entry = { name, src, slides, assets };
  }

  projects.push(entry);
  writeFileSync(configPath, JSON.stringify(projects, null, 2) + "\n");
  console.log(`\n✓ Added "${name}" to projects.json`);
  rl.close();
}

// ── Main ──

const args = process.argv.slice(2);

if (args.includes("--add")) {
  await interactiveAdd();
  process.exit(0);
}

const filter = args[0]; // optional: sync only one project

let synced = 0;
for (const project of projects) {
  if (filter && project.name !== filter) continue;

  const isRemote = !!project.remote;
  const ok = isRemote ? syncRemote(project) : syncLocal(project);

  if (ok) {
    console.log(`✓  ${project.name}: synced ${isRemote ? "from " + project.remote : "locally"}`);
    synced++;
  }
}

console.log(`\nDone. ${synced}/${filter ? 1 : projects.length} synced.`);
