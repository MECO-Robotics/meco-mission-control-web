#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const srcRoot = path.join(cwd, "src");
const diagnosticsRoot = path.join(cwd, ".diagnostics", "organization-audit");
const now = new Date();

const args = new Set(process.argv.slice(2));
const enforceHard = args.has("--enforce-hard");

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", "coverage"]);
const TS_EXTENSIONS = new Set([".ts", ".tsx"]);

const FILE_THRESHOLDS = {
  target: 150,
  trigger: 220,
  hard: 300,
};

const IMPORT_THRESHOLDS = {
  target: 60,
  review: 80,
  trigger: 100,
  hard: 150,
};

const DIR_THRESHOLDS = {
  targetMin: 5,
  targetMax: 10,
  trigger: 12,
  hard: 20,
};

const CSS_THRESHOLDS = {
  linesTarget: 120,
  linesTrigger: 150,
  linesHard: 220,
  selectorsTarget: 15,
  selectorsTrigger: 20,
  selectorsHard: 30,
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function toPosix(relativePath) {
  return relativePath.replaceAll("\\", "/");
}

function walkDirectory(rootDir) {
  const filePaths = [];
  const directoryStats = [];

  function visit(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    const filteredEntries = entries.filter((entry) => !SKIP_DIRS.has(entry.name));
    const directFileCount = filteredEntries.filter((entry) => entry.isFile()).length;
    const relativeDirectoryPath = toPosix(path.relative(cwd, currentDir) || ".");

    directoryStats.push({
      path: relativeDirectoryPath,
      directFileCount,
    });

    for (const entry of filteredEntries) {
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath);
        continue;
      }
      if (entry.isFile()) {
        filePaths.push(absolutePath);
      }
    }
  }

  visit(rootDir);
  return { filePaths, directoryStats };
}

function isTypeOnlyDeclaration(line) {
  if (
    line.startsWith("type ") ||
    line.startsWith("interface ") ||
    line.startsWith("export type ") ||
    line.startsWith("export interface ")
  ) {
    return true;
  }
  return false;
}

function countToken(line, token) {
  return line.split(token).length - 1;
}

function getCurlyBraceDelta(line) {
  return countToken(line, "{") - countToken(line, "}");
}

function shouldTrackTypeOnlyDeclaration(line) {
  if (line.endsWith("=")) {
    return true;
  }
  if (getCurlyBraceDelta(line) > 0) {
    return true;
  }
  return false;
}

function isTypeOnlyTerminatorLine(line, braceDepth) {
  if (braceDepth > 0) {
    return false;
  }
  if (line.includes(";")) {
    return true;
  }
  if (line === "}" || line === "};") {
    return true;
  }
  if (line.endsWith("}") && !line.endsWith("{")) {
    return true;
  }
  return false;
}

function isImportStartLine(line) {
  return line.startsWith("import ");
}

function isImportTerminatorLine(line) {
  if (line.includes(";")) {
    return true;
  }

  // Support semicolon-less one-line imports.
  if (/^import\s+["'`][^"'`]+["'`]$/.test(line)) {
    return true;
  }
  if (/^import\s+.+\s+from\s+["'`][^"'`]+["'`]$/.test(line)) {
    return true;
  }
  if (/^}\s+from\s+["'`][^"'`]+["'`](\s+(with|assert)\s+\{[^}]*\})?$/.test(line)) {
    return true;
  }

  return false;
}

function countImplementationLinesTs(content) {
  const lines = content.split(/\r?\n/);
  let inBlockComment = false;
  let inImportDeclaration = false;
  let inTypeOnlyDeclaration = false;
  let typeOnlyBraceDepth = 0;
  let count = 0;

  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (inBlockComment) {
      if (line.includes("*/")) {
        inBlockComment = false;
        line = line.slice(line.indexOf("*/") + 2).trim();
        if (!line) {
          continue;
        }
      } else {
        continue;
      }
    }

    if (line.startsWith("/*")) {
      if (!line.includes("*/")) {
        inBlockComment = true;
        continue;
      }
      line = line.slice(line.indexOf("*/") + 2).trim();
      if (!line) {
        continue;
      }
    }

    if (line.startsWith("//")) {
      continue;
    }

    if (inImportDeclaration) {
      if (isImportTerminatorLine(line)) {
        inImportDeclaration = false;
      }
      continue;
    }

    if (isImportStartLine(line)) {
      if (!isImportTerminatorLine(line)) {
        inImportDeclaration = true;
      }
      continue;
    }

    if (inTypeOnlyDeclaration) {
      typeOnlyBraceDepth += getCurlyBraceDelta(line);
      if (isTypeOnlyTerminatorLine(line, typeOnlyBraceDepth)) {
        inTypeOnlyDeclaration = false;
        typeOnlyBraceDepth = 0;
      }
      continue;
    }

    if (isTypeOnlyDeclaration(line)) {
      if (shouldTrackTypeOnlyDeclaration(line)) {
        inTypeOnlyDeclaration = true;
        typeOnlyBraceDepth = Math.max(0, getCurlyBraceDelta(line));
        if (isTypeOnlyTerminatorLine(line, typeOnlyBraceDepth)) {
          inTypeOnlyDeclaration = false;
          typeOnlyBraceDepth = 0;
        }
      }
      continue;
    }

    count += 1;
  }

  return count;
}

function countImportLines(content) {
  const lines = content.split(/\r?\n/);
  let inImportDeclaration = false;
  let inBlockComment = false;
  let count = 0;

  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (inBlockComment) {
      if (line.includes("*/")) {
        inBlockComment = false;
        line = line.slice(line.indexOf("*/") + 2).trim();
        if (!line) {
          continue;
        }
      } else {
        continue;
      }
    }

    if (line.startsWith("/*")) {
      if (!line.includes("*/")) {
        inBlockComment = true;
        continue;
      }
      line = line.slice(line.indexOf("*/") + 2).trim();
      if (!line) {
        continue;
      }
    }

    if (line.startsWith("//")) {
      continue;
    }

    if (inImportDeclaration) {
      count += 1;
      if (isImportTerminatorLine(line)) {
        inImportDeclaration = false;
      }
      continue;
    }

    if (isImportStartLine(line)) {
      count += 1;
      if (!isImportTerminatorLine(line)) {
        inImportDeclaration = true;
      }
    }
  }

  return count;
}

function countCssRuleLines(content) {
  const lines = content.split(/\r?\n/);
  let inBlockComment = false;
  let count = 0;

  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (inBlockComment) {
      if (line.includes("*/")) {
        inBlockComment = false;
        line = line.slice(line.indexOf("*/") + 2).trim();
        if (!line) {
          continue;
        }
      } else {
        continue;
      }
    }

    if (line.startsWith("/*")) {
      if (!line.includes("*/")) {
        inBlockComment = true;
        continue;
      }
      line = line.slice(line.indexOf("*/") + 2).trim();
      if (!line) {
        continue;
      }
    }

    if (line.startsWith("@import")) {
      continue;
    }

    count += 1;
  }

  return count;
}

function approximateCssSelectorCount(content) {
  return (content.match(/{/g) || []).length;
}

function classifySeverity(value, trigger, hard) {
  if (value > hard) {
    return "hard";
  }
  if (value > trigger) {
    return "trigger";
  }
  return "ok";
}

function sortByValueDescending(items, key) {
  return [...items].sort((left, right) => right[key] - left[key]);
}

if (!fs.existsSync(srcRoot)) {
  console.error("Organization audit failed: src/ directory not found.");
  process.exit(1);
}

const { filePaths, directoryStats } = walkDirectory(srcRoot);
const tsFiles = [];
const cssFiles = [];

for (const absolutePath of filePaths) {
  const extension = path.extname(absolutePath);
  if (!TS_EXTENSIONS.has(extension) && extension !== ".css") {
    continue;
  }

  const relativePath = toPosix(path.relative(cwd, absolutePath));
  const content = fs.readFileSync(absolutePath, "utf8");

  if (extension === ".css") {
    cssFiles.push({
      path: relativePath,
      cssRuleLines: countCssRuleLines(content),
      selectorCount: approximateCssSelectorCount(content),
    });
    continue;
  }

  tsFiles.push({
    path: relativePath,
    implementationLines: countImplementationLinesTs(content),
    importLines: countImportLines(content),
    isTestLike: /(?:__tests__|\.test\.|\.spec\.)/i.test(relativePath),
  });
}

const runtimeTsFiles = tsFiles.filter((file) => !file.isTestLike);
const testTsFiles = tsFiles.filter((file) => file.isTestLike);

const fileHardViolations = runtimeTsFiles.filter(
  (file) => file.implementationLines > FILE_THRESHOLDS.hard,
);
const fileTriggerViolations = runtimeTsFiles.filter(
  (file) =>
    file.implementationLines > FILE_THRESHOLDS.trigger &&
    file.implementationLines <= FILE_THRESHOLDS.hard,
);

const importHardViolations = tsFiles.filter((file) => file.importLines > IMPORT_THRESHOLDS.hard);
const importTriggerViolations = tsFiles.filter(
  (file) =>
    file.importLines > IMPORT_THRESHOLDS.trigger &&
    file.importLines <= IMPORT_THRESHOLDS.hard,
);
const importReviewCandidates = tsFiles.filter(
  (file) =>
    file.importLines > IMPORT_THRESHOLDS.review &&
    file.importLines <= IMPORT_THRESHOLDS.trigger,
);

const directoryHardViolations = directoryStats.filter(
  (dir) => dir.directFileCount > DIR_THRESHOLDS.hard,
);
const directoryTriggerViolations = directoryStats.filter(
  (dir) =>
    dir.directFileCount > DIR_THRESHOLDS.trigger &&
    dir.directFileCount <= DIR_THRESHOLDS.hard,
);

const cssLineHardViolations = cssFiles.filter(
  (file) => file.cssRuleLines > CSS_THRESHOLDS.linesHard,
);
const cssLineTriggerViolations = cssFiles.filter(
  (file) =>
    file.cssRuleLines > CSS_THRESHOLDS.linesTrigger &&
    file.cssRuleLines <= CSS_THRESHOLDS.linesHard,
);

const cssSelectorHardViolations = cssFiles.filter(
  (file) => file.selectorCount > CSS_THRESHOLDS.selectorsHard,
);
const cssSelectorTriggerViolations = cssFiles.filter(
  (file) =>
    file.selectorCount > CSS_THRESHOLDS.selectorsTrigger &&
    file.selectorCount <= CSS_THRESHOLDS.selectorsHard,
);

const report = {
  generatedAt: now.toISOString(),
  cwd: toPosix(cwd),
  thresholds: {
    fileImplementationLines: FILE_THRESHOLDS,
    importLines: IMPORT_THRESHOLDS,
    directoryDirectFiles: DIR_THRESHOLDS,
    css: CSS_THRESHOLDS,
  },
  totals: {
    tsFiles: tsFiles.length,
    runtimeTsFiles: runtimeTsFiles.length,
    testTsFiles: testTsFiles.length,
    cssFiles: cssFiles.length,
    directoriesScanned: directoryStats.length,
  },
  violations: {
    runtimeFileHard: sortByValueDescending(fileHardViolations, "implementationLines"),
    runtimeFileTrigger: sortByValueDescending(fileTriggerViolations, "implementationLines"),
    importHard: sortByValueDescending(importHardViolations, "importLines"),
    importTrigger: sortByValueDescending(importTriggerViolations, "importLines"),
    importReview: sortByValueDescending(importReviewCandidates, "importLines"),
    directoryHard: sortByValueDescending(directoryHardViolations, "directFileCount"),
    directoryTrigger: sortByValueDescending(directoryTriggerViolations, "directFileCount"),
    cssLinesHard: sortByValueDescending(cssLineHardViolations, "cssRuleLines"),
    cssLinesTrigger: sortByValueDescending(cssLineTriggerViolations, "cssRuleLines"),
    cssSelectorsHard: sortByValueDescending(cssSelectorHardViolations, "selectorCount"),
    cssSelectorsTrigger: sortByValueDescending(cssSelectorTriggerViolations, "selectorCount"),
  },
  top: {
    runtimeFilesByImplementationLines: sortByValueDescending(runtimeTsFiles, "implementationLines").slice(0, 25),
    testFilesByImplementationLines: sortByValueDescending(testTsFiles, "implementationLines").slice(0, 20),
    cssFilesByRuleLines: sortByValueDescending(cssFiles, "cssRuleLines").slice(0, 25),
    directoriesByDirectFiles: sortByValueDescending(directoryStats, "directFileCount").slice(0, 25),
  },
};

const hardViolationCount =
  report.violations.runtimeFileHard.length +
  report.violations.importHard.length +
  report.violations.directoryHard.length +
  report.violations.cssLinesHard.length +
  report.violations.cssSelectorsHard.length;

const triggerViolationCount =
  report.violations.runtimeFileTrigger.length +
  report.violations.importTrigger.length +
  report.violations.directoryTrigger.length +
  report.violations.cssLinesTrigger.length +
  report.violations.cssSelectorsTrigger.length;

ensureDir(diagnosticsRoot);
const timestamp = now.toISOString().replace(/[:.]/g, "-");
const jsonPath = path.join(diagnosticsRoot, `organization-audit-${timestamp}.json`);
const markdownPath = path.join(diagnosticsRoot, `organization-audit-${timestamp}.md`);
const latestJsonPath = path.join(diagnosticsRoot, "latest.json");
const latestMarkdownPath = path.join(diagnosticsRoot, "latest.md");

const markdownLines = [
  "# Organization Audit",
  "",
  `Generated: ${report.generatedAt}`,
  `Workspace: ${report.cwd}`,
  "",
  "## Totals",
  `- TS/TSX files: ${report.totals.tsFiles} (runtime: ${report.totals.runtimeTsFiles}, tests: ${report.totals.testTsFiles})`,
  `- CSS files: ${report.totals.cssFiles}`,
  `- Directories scanned: ${report.totals.directoriesScanned}`,
  "",
  "## Violations",
  `- Hard violations: ${hardViolationCount}`,
  `- Trigger violations: ${triggerViolationCount}`,
  "",
  "## Top Runtime File Violations (>220 implementation lines)",
  ...report.violations.runtimeFileHard.concat(report.violations.runtimeFileTrigger).slice(0, 20).map(
    (item) => `- ${item.path}: ${item.implementationLines}`,
  ),
  "",
  "## Top CSS Violations",
  ...report.violations.cssLinesHard.concat(report.violations.cssLinesTrigger).slice(0, 20).map(
    (item) => `- ${item.path}: ${item.cssRuleLines} rule/declaration lines`,
  ),
  "",
  "## Top Directory Violations (>12 direct files)",
  ...report.violations.directoryHard.concat(report.violations.directoryTrigger).slice(0, 20).map(
    (item) => `- ${item.path}: ${item.directFileCount} files`,
  ),
  "",
];

if (
  report.violations.runtimeFileHard.length === 0 &&
  report.violations.runtimeFileTrigger.length === 0 &&
  report.violations.cssLinesHard.length === 0 &&
  report.violations.cssLinesTrigger.length === 0 &&
  report.violations.directoryHard.length === 0 &&
  report.violations.directoryTrigger.length === 0
) {
  markdownLines.push("No runtime, CSS, or directory trigger/hard violations detected.");
}

fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
fs.writeFileSync(markdownPath, `${markdownLines.join("\n")}\n`, "utf8");
fs.copyFileSync(jsonPath, latestJsonPath);
fs.copyFileSync(markdownPath, latestMarkdownPath);

const summary = [
  `Organization audit complete: hard=${hardViolationCount}, trigger=${triggerViolationCount}`,
  `- JSON: ${toPosix(path.relative(cwd, latestJsonPath))}`,
  `- Markdown: ${toPosix(path.relative(cwd, latestMarkdownPath))}`,
];
console.log(summary.join("\n"));

if (enforceHard && hardViolationCount > 0) {
  process.exit(1);
}
