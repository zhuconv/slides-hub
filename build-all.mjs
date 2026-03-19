#!/usr/bin/env node
/**
 * build-all.mjs — Build all project slides into dist/<name>/
 *
 * Generates an index.html landing page linking to all decks.
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync } from "fs";
import { resolve, join } from "path";
import { execSync } from "child_process";

const hub = resolve(import.meta.dirname || ".");
const projects = JSON.parse(readFileSync(join(hub, "projects.json"), "utf-8"));
const distRoot = join(hub, "dist");

mkdirSync(distRoot, { recursive: true });

const built = [];

for (const { name } of projects) {
  const projDir = join(hub, "projects", name);
  const slidesFile = join(projDir, "slides.md");

  if (!existsSync(slidesFile)) {
    console.warn(`⚠  skip ${name}: no slides.md`);
    continue;
  }

  const outDir = join(distRoot, name);
  console.log(`\n📦 Building ${name}...`);

  try {
    execSync(
      `npx slidev build "${slidesFile}" --base /${name}/ --out "${outDir}"`,
      { cwd: projDir, stdio: "inherit" }
    );
    built.push(name);
    console.log(`✓  ${name} → dist/${name}/`);
  } catch (e) {
    console.error(`✗  ${name} build failed: ${e.message}`);
  }
}

// Generate index page
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Slides Hub</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 60px auto; padding: 0 20px; }
    h1 { border-bottom: 2px solid #eee; padding-bottom: 12px; }
    ul { list-style: none; padding: 0; }
    li { margin: 12px 0; }
    a { color: #2563eb; text-decoration: none; font-size: 1.1em; }
    a:hover { text-decoration: underline; }
    .date { color: #888; font-size: 0.85em; margin-left: 8px; }
  </style>
</head>
<body>
  <h1>Slides Hub</h1>
  <ul>
    ${built.map(n => `<li><a href="/${n}/">${n}</a></li>`).join("\n    ")}
  </ul>
  <p class="date">Built: ${new Date().toISOString().slice(0, 10)}</p>
</body>
</html>`;

writeFileSync(join(distRoot, "index.html"), indexHtml);
console.log(`\n✓ Index page generated with ${built.length} decks.`);
