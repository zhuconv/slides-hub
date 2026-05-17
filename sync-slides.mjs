#!/usr/bin/env node
/**
 * sync-slides.mjs — Pull slides from local repos, remote servers, or URLs.
 *
 * Every deck name is "<project>/<deck>" — the segment before the first "/"
 * is the project it is archived under on the index page.
 *
 * projects.json schema:
 * [
 *   // ── 本地 repo ──
 *   {
 *     "name": "graph-agent/0531",     // <project>/<deck>; deck 建议用 MMDD
 *     "date": "2026-05-31",           // 用于首页归档排序
 *     "src": "/path/to/repo",
 *     "slides": "slides.md",
 *     "assets": ["public", "slides_assets"]
 *   },
 *
 *   // ── 同一 repo 多个 deck —— 换 deck 名即可 ──
 *   {
 *     "name": "graph-agent/ablation",
 *     "date": "2026-06-02",
 *     "src": "/path/to/repo",
 *     "slides": "docs/ablation.slides.md",
 *     "assets": ["docs/figures"]
 *   },
 *
 *   // ── 远程 server (rsync over ssh) ──
 *   {
 *     "name": "aesthetic-agent/0610",
 *     "date": "2026-06-10",
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
  console.log("Name must be <project>/<deck>. Reuse an existing project name");
  console.log("(graph-agent / aesthetic-agent) or pick a new one for a new project.\n");

  const today = new Date().toISOString().slice(0, 10);
  const name = await ask("Name <project>/<deck> (e.g. graph-agent/0531): ");
  const date = await ask(`Date [${today}]: `) || today;
  const type = await ask("Type — (l)ocal or (r)emote? [l]: ") || "l";

  if (!name.includes("/")) {
    console.error(`\n✗ "${name}" must be <project>/<deck>, e.g. graph-agent/0531`);
    rl.close();
    return;
  }

  let entry;
  if (type.startsWith("r")) {
    const remote = await ask("Remote path (user@host:/path/to/repo): ");
    const slides = await ask("Slides file [slides.md]: ") || "slides.md";
    entry = { name, date, remote, slides, assets: ["public"] };
  } else {
    const src = await ask("Local repo path: ");
    const slides = await ask("Slides file [slides.md]: ") || "slides.md";
    const assetsRaw = await ask("Asset dirs (comma-separated) [public]: ") || "public";
    const assets = assetsRaw.split(",").map(s => s.trim());
    entry = { name, date, src, slides, assets };
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
