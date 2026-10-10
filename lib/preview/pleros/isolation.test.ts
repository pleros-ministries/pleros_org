import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The demo must never reach live data or side effects. This walks every
 * runtime import reachable from the demo routes and components (type-only
 * imports are erased at build time and skipped) and fails on anything that
 * could touch a session, the database, a server action or Node APIs.
 */

const ROOT = resolve(__dirname, "../../..");
const ENTRY_DIRS = ["app/preview/pleros", "components/preview/pleros"];

const FORBIDDEN_PATHS = [
  /\/_actions\//,
  /^lib\/db\//,
  /^lib\/app-session/,
  /^lib\/auth/,
  /^lib\/email\//,
  /^lib\/notifications\//,
  /^lib\/push/,
  /^lib\/sogp\/discipleship\.ts$/,
  /^app\/\(site\)\//,
];
const FORBIDDEN_PACKAGES = [
  /^node:/,
  /^server-only$/,
  /^next\/headers$/,
  /^drizzle-orm/,
  /^@neondatabase\//,
  /^better-auth/,
  /^resend$/,
  /^web-push$/,
];

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

/** Runtime import specifiers in a file; `import type` and `export type` are skipped. */
function runtimeImports(source: string): string[] {
  const specifiers: string[] = [];
  const pattern = /(?:^|\n)\s*(import|export)\s+(type\s+)?([^'"]*?)\s*from\s*["']([^"']+)["']|(?:^|\n)\s*import\s*["']([^"']+)["']/g;
  for (const match of source.matchAll(pattern)) {
    if (match[5]) {
      specifiers.push(match[5]);
      continue;
    }
    if (match[2]) continue;
    const clause = match[3] ?? "";
    // `import { type A, type B } from` is erased too.
    const names = clause.replace(/[{}]/g, "").split(",").map((part) => part.trim()).filter(Boolean);
    if (names.length > 0 && names.every((name) => name.startsWith("type "))) continue;
    specifiers.push(match[4]!);
  }
  return specifiers;
}

function resolveLocal(from: string, specifier: string): string | null {
  const base = specifier.startsWith("@/") ? join(ROOT, specifier.slice(2)) : resolve(dirname(from), specifier);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function walk(): { files: Set<string>; packages: Map<string, string> } {
  const files = new Set<string>();
  const packages = new Map<string, string>();
  const queue = ENTRY_DIRS.flatMap((dir) => listFiles(join(ROOT, dir)));
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (files.has(file)) continue;
    files.add(file);
    if (!/\.(ts|tsx)$/.test(file)) continue;
    for (const specifier of runtimeImports(readFileSync(file, "utf8"))) {
      if (specifier.startsWith(".") || specifier.startsWith("@/")) {
        const target = resolveLocal(file, specifier);
        if (target) queue.push(target);
        continue;
      }
      packages.set(specifier, relative(ROOT, file));
    }
  }
  return { files, packages };
}

describe("demo isolation", () => {
  const { files, packages } = walk();
  const local = [...files].map((file) => relative(ROOT, file));

  it("reaches the demo's own files and the shared pure rules", () => {
    expect(local).toContain("lib/preview/pleros/store.ts");
    expect(local).toContain("lib/community/activity-form.ts");
    expect(local).toContain("components/community/report/activity-form/step-where.tsx");
  });

  it("never imports a server action, session, database or messaging module", () => {
    const offending = local.filter((file) => FORBIDDEN_PATHS.some((pattern) => pattern.test(file)));
    expect(offending).toEqual([]);
  });

  it("never imports a server-only or Node package", () => {
    const offending = [...packages.entries()]
      .filter(([specifier]) => FORBIDDEN_PACKAGES.some((pattern) => pattern.test(specifier)))
      .map(([specifier, file]) => `${specifier} (from ${file})`);
    expect(offending).toEqual([]);
  });

  it("has no fetch, server action directive or external send in its own code", () => {
    const own = local.filter((file) => file.includes("preview/pleros"));
    for (const file of own) {
      const source = readFileSync(join(ROOT, file), "utf8");
      expect(source, file).not.toMatch(/["']use server["']|\bfetch\(|sendBeacon|navigator\.share|window\.open\(/);
    }
  });

  it("detects a forbidden import when one is present", () => {
    expect(runtimeImports('import { saveMinistryActivity } from "@/app/(site)/dashboard/community/_actions/report-actions";')).toEqual([
      "@/app/(site)/dashboard/community/_actions/report-actions",
    ]);
    expect(runtimeImports('import type { MemberActivity } from "@/lib/db/queries/ministry-activities";')).toEqual([]);
    expect(runtimeImports('import { type A, type B } from "@/lib/db/schema";')).toEqual([]);
  });
});
