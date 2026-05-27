#!/usr/bin/env node
/**
 * build-all.mjs — Build all project slides into dist/<project>/<deck>/
 *
 * Generates a two-level landing site:
 *   dist/index.html            — lists projects
 *   dist/<project>/index.html  — lists that project's decks
 *
 * A deck name is "<project>/<deck>" (e.g. "graph-agent/0507"); the segment
 * before the first "/" is the project it is archived under.
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync, cpSync } from "fs";
import { resolve, join } from "path";
import { execSync } from "child_process";

const hub = resolve(import.meta.dirname || ".");
const projects = JSON.parse(readFileSync(join(hub, "projects.json"), "utf-8"));
const distRoot = join(hub, "dist");

mkdirSync(distRoot, { recursive: true });

const escapeHtml = (s) =>
  String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

/** Pull the `title:` field out of a slides.md YAML frontmatter block. */
function readTitle(slidesFile, fallback) {
  try {
    const fm = readFileSync(slidesFile, "utf-8").match(/^---\n([\s\S]*?)\n---/);
    const m = fm && fm[1].match(/^title:\s*(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  } catch {}
  return fallback;
}

/** Pull the <title>…</title> from a raw HTML deck's index.html. */
function readHtmlTitle(htmlFile, fallback) {
  try {
    const m = readFileSync(htmlFile, "utf-8").match(/<title>([^<]+)<\/title>/i);
    if (m) return m[1].trim();
  } catch {}
  return fallback;
}

// ── Build every deck ──

const built = [];

for (const { name, date } of projects) {
  const projDir = join(hub, "projects", name);
  const slidesFile = join(projDir, "slides.md");
  const indexFile = join(projDir, "index.html");
  const outDir = join(distRoot, name);

  if (existsSync(slidesFile)) {
    // ── Slidev deck ──
    console.log(`\n📦 Building ${name}...`);
    try {
      execSync(
        `npx slidev build "${slidesFile}" --base /slides-hub/${name}/ --out "${outDir}"`,
        { cwd: projDir, stdio: "inherit" }
      );
      built.push({ name, date: date || "", title: readTitle(slidesFile, name) });
      console.log(`✓  ${name} → dist/${name}/`);
    } catch (e) {
      console.error(`✗  ${name} build failed: ${e.message}`);
    }
  } else if (existsSync(indexFile)) {
    // ── Raw HTML deck (reveal.js, hand-rolled, etc.) — copy through ──
    console.log(`\n📦 Copying ${name} (raw HTML)...`);
    try {
      mkdirSync(outDir, { recursive: true });
      cpSync(projDir, outDir, { recursive: true });
      built.push({ name, date: date || "", title: readHtmlTitle(indexFile, name) });
      console.log(`✓  ${name} → dist/${name}/`);
    } catch (e) {
      console.error(`✗  ${name} copy failed: ${e.message}`);
    }
  } else {
    console.warn(`⚠  skip ${name}: no slides.md or index.html`);
  }
}

// ── Group decks by project, newest deck first within each ──

const byDateDesc = (a, b) =>
  (b.date || "").localeCompare(a.date || "") || b.name.localeCompare(a.name);

const groups = new Map(); // project -> deck[]
for (const deck of built) {
  const slash = deck.name.indexOf("/");
  const project = slash === -1 ? deck.name : deck.name.slice(0, slash);
  if (!groups.has(project)) groups.set(project, []);
  groups.get(project).push(deck);
}
for (const decks of groups.values()) decks.sort(byDateDesc);

// Projects ordered by their most-recent deck (most active first).
const orderedProjects = [...groups.entries()].sort(
  ([, a], [, b]) => byDateDesc(a[0], b[0])
);

// ── Shared page template ──

const today = new Date().toISOString().slice(0, 10);

const style = `
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 720px;
           margin: 56px auto; padding: 0 24px; line-height: 1.5; color: #1a1a1a; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    h1 { border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 4px; }
    .page-head { display: flex; justify-content: space-between; align-items: baseline;
                 border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 4px; }
    .page-head h1 { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
    .tagline { color: #6b7280; margin-top: 0; }
    .back { margin: 0 0 16px; font-size: 0.9em; }
    .back a { color: #6b7280; }
    ul { list-style: none; padding: 0; margin: 22px 0 0; }
    li { border-top: 1px solid #f0f0f0; }
    li:last-child { border-bottom: 1px solid #f0f0f0; }
    .row a { display: block; padding: 13px 8px; border-radius: 6px; }
    .row a:hover { background: #f7f8fa; text-decoration: none; }
    .head { display: flex; justify-content: space-between; align-items: baseline; }
    .name { font-weight: 600; }
    .projects .name { font-size: 1.15em; }
    .decks .name { font-size: 1.04em; font-weight: 500; }
    .arrow { color: #9ca3af; }
    .meta { display: block; color: #9ca3af; font-size: 0.82em; margin-top: 2px;
            font-variant-numeric: tabular-nums; }
    footer { margin-top: 44px; color: #9ca3af; font-size: 0.82em;
             border-top: 1px solid #e5e7eb; padding-top: 12px; }
    .gh-link { color: #6b7280; font-size: 0.85em; display: inline-flex;
               align-items: center; gap: 6px; text-decoration: none; flex-shrink: 0; }
    .gh-link svg { width: 16px; height: 16px; fill: currentColor; }
    .gh-link:hover { color: #1a1a1a; text-decoration: none; }`;

const ghLink = `<a class="gh-link" href="https://github.com/zhuconv/slides-hub" target="_blank" rel="noopener" aria-label="View source on GitHub">
    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
    <span>Source</span>
  </a>`;

const page = (title, body) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>${style}
  </style>
</head>
<body>
${body}
</body>
</html>
`;

// ── Landing page: one row per project ──

const projectRows = orderedProjects
  .map(
    ([project, decks]) => `      <li class="row">
        <a href="/slides-hub/${project}/">
          <span class="head"><span class="name">${escapeHtml(project)}</span><span class="arrow">&rarr;</span></span>
          <span class="meta">${decks.length} deck${decks.length === 1 ? "" : "s"}${
      decks[0].date ? ` &middot; latest ${decks[0].date}` : ""
    }</span>
        </a>
      </li>`
  )
  .join("\n");

writeFileSync(
  join(distRoot, "index.html"),
  page(
    "Slides Hub",
    `  <div class="page-head"><h1>Slides Hub</h1>${ghLink}</div>
  <p class="tagline">Project slide decks, archived by project.</p>
  <ul class="projects">
${projectRows}
  </ul>
  <footer>${built.length} decks &middot; ${groups.size} projects &middot; built ${today}</footer>`
  )
);

// ── Per-project page: one row per deck ──

let projectPages = 0;
for (const [project, decks] of orderedProjects) {
  // A bare-named deck (no "/") already occupies dist/<project>/ — don't clobber it.
  if (decks.some((d) => d.name === project)) continue;

  const deckRows = decks
    .map(
      (d) => `      <li class="row">
        <a href="/slides-hub/${d.name}/">
          <span class="name">${escapeHtml(d.title)}</span>
          <span class="meta">${escapeHtml(d.name)}${d.date ? ` &middot; ${d.date}` : ""}</span>
        </a>
      </li>`
    )
    .join("\n");

  mkdirSync(join(distRoot, project), { recursive: true });
  writeFileSync(
    join(distRoot, project, "index.html"),
    page(
      `${project} · Slides Hub`,
      `  <p class="back"><a href="/slides-hub/">&lsaquo; all projects</a></p>
  <div class="page-head"><h1>${escapeHtml(project)}</h1>${ghLink}</div>
  <p class="tagline">${decks.length} deck${decks.length === 1 ? "" : "s"}</p>
  <ul class="decks">
${deckRows}
  </ul>
  <footer>built ${today}</footer>`
    )
  );
  projectPages++;
}

console.log(
  `\n✓ Site generated: landing + ${projectPages} project pages, ${built.length} decks.`
);
