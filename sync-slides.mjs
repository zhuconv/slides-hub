#!/usr/bin/env node
/**
 * sync-slides.mjs — Pull slides from all registered project repos.
 *
 * Config: projects.json
 * Each entry: { name, src } where src is the slides dir in that repo.
 * Copies slides.md + any assets (public/, slides_assets/) into projects/<name>/
 */

import { readFileSync, mkdirSync, cpSync, existsSync } from "fs";
import { resolve, join } from "path";

const hub = resolve(import.meta.dirname || ".");
const projects = JSON.parse(readFileSync(join(hub, "projects.json"), "utf-8"));

for (const { name, src } of projects) {
  const srcDir = resolve(src);
  const destDir = join(hub, "projects", name);

  if (!existsSync(srcDir)) {
    console.warn(`⚠  skip ${name}: ${srcDir} not found`);
    continue;
  }

  mkdirSync(destDir, { recursive: true });

  // Copy slides.md
  const slidesFile = join(srcDir, "slides.md");
  if (existsSync(slidesFile)) {
    cpSync(slidesFile, join(destDir, "slides.md"));
  }

  // Copy public/ assets (images used by slides)
  for (const assetDir of ["public", "slides_assets"]) {
    const assetSrc = join(srcDir, assetDir);
    if (existsSync(assetSrc)) {
      cpSync(assetSrc, join(destDir, "public"), { recursive: true });
    }
  }

  console.log(`✓  ${name}: synced from ${srcDir}`);
}

console.log(`\nDone. ${projects.length} projects synced.`);
