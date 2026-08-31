import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";

const ROOT = new URL("../", import.meta.url).pathname;
const SRC = join(ROOT, "src");

// Transitional ceilings. Tighten these whenever a migration removes inline styles.
// New files default to zero, preventing the debt from spreading.
const INLINE_STYLE_BASELINE = {
  "src/components/ui/Skeleton.tsx": 1,
  "src/pages/Home.tsx": 3,
  "src/pages/Podcasts.tsx": 1,
  "src/pages/epl/EPLDashboard.tsx": 27,
  "src/pages/epl/MatchDetail.tsx": 4,
  "src/pages/nfl/NFLDashboard.tsx": 25,
};

const failures = [];

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return [path];
  }).filter((path) => [".ts", ".tsx"].includes(extname(path)));
}

function cssFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return cssFiles(path);
    return extname(path) === ".css" ? [path] : [];
  });
}

function lineNumber(source, index) {
  return source.slice(0, index).split("\n").length;
}

for (const absolutePath of cssFiles(SRC)) {
  const path = relative(ROOT, absolutePath);
  if (path === "src/styles/tokens.css") continue;
  const source = readFileSync(absolutePath, "utf8");
  for (const match of source.matchAll(/#[0-9a-f]{3,8}\b|rgba?\s*\(/gi)) {
    failures.push(`${path}:${lineNumber(source, match.index)} uses a raw color; use a semantic token`);
  }
}

for (const absolutePath of sourceFiles(SRC)) {
  const path = relative(ROOT, absolutePath);
  const source = readFileSync(absolutePath, "utf8");

  if (path.endsWith(".tsx") && path !== "src/lib/sourceMeta.ts") {
    for (const match of source.matchAll(/#[0-9a-f]{3,8}\b|rgba?\s*\(/gi)) {
      failures.push(`${path}:${lineNumber(source, match.index)} uses a raw color; use a semantic token or sourceMeta.ts`);
    }
  }

  if (path.startsWith("src/pages/") && path.endsWith(".tsx")) {
    for (const match of source.matchAll(/<(button|select|input|textarea)\b/g)) {
      failures.push(`${path}:${lineNumber(source, match.index)} uses a native control; use a shared UI primitive`);
    }
  }

  if (path.endsWith(".tsx")) {
    for (const match of source.matchAll(/<(div|span)\b[^>]*\bonClick\s*=/gis)) {
      failures.push(`${path}:${lineNumber(source, match.index)} makes a non-interactive element clickable; use a link or button`);
    }

    const inlineStyleCount = [...source.matchAll(/style\s*=\s*\{\{/g)].length;
    const baseline = INLINE_STYLE_BASELINE[path] ?? 0;
    if (inlineStyleCount > baseline) {
      failures.push(`${path} has ${inlineStyleCount} inline style objects; transitional ceiling is ${baseline}`);
    }
  }
}

if (failures.length > 0) {
  console.error("UI architecture checks failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("UI architecture checks passed.");
