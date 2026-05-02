import { readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";

function expandCssImports(filePath: string, visited: Set<string>): string[] {
  const absolutePath = resolve(filePath);

  if (visited.has(absolutePath)) {
    return [];
  }

  visited.add(absolutePath);

  const source = readFileSync(absolutePath, "utf8");
  const imports = Array.from(
    source.matchAll(/@import\s+url\((['"]?)([^'")]+)\1\);?/g),
    (match) => match[2],
  );

  if (imports.length === 0) {
    return [source];
  }

  return imports.flatMap((importPath) =>
    expandCssImports(resolve(dirname(absolutePath), importPath), visited),
  );
}

export function readCssTree(relativePath: string) {
  const absolutePath = resolve(process.cwd(), relativePath);
  const stats = statSync(absolutePath);

  if (stats.isDirectory()) {
    throw new Error(`Expected a CSS file entry point, not a directory: ${relativePath}`);
  }

  if (!isAbsolute(absolutePath)) {
    throw new Error(`Expected an absolute CSS path: ${relativePath}`);
  }

  return expandCssImports(absolutePath, new Set()).join("\n");
}
