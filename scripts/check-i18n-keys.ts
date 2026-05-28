import fs from "node:fs";
import path from "node:path";

const messagesRoot = path.join(process.cwd(), "messages");
const baseLocale = "en";

function collectKeys(obj: unknown, prefix = ""): Set<string> {
  const keys = new Set<string>();
  if (obj == null || typeof obj !== "object" || Array.isArray(obj)) {
    return keys;
  }
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      collectKeys(value, full).forEach((k) => keys.add(k));
    } else {
      keys.add(full);
    }
  }
  return keys;
}

function loadLocaleKeys(locale: string): Set<string> {
  const dir = path.join(messagesRoot, locale);
  const keys = new Set<string>();

  function walk(relativeDir: string) {
    const abs = path.join(dir, relativeDir);
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const rel = path.join(relativeDir, entry.name);
      if (entry.isDirectory()) {
        walk(rel);
        continue;
      }
      if (!entry.name.endsWith(".json")) continue;
      const raw = fs.readFileSync(path.join(dir, rel), "utf8");
      const json = JSON.parse(raw) as unknown;
      const ns = rel.replace(/\\/g, "/").replace(/\.json$/, "");
      collectKeys(json, ns).forEach((k) => keys.add(k));
    }
  }

  walk("");
  return keys;
}

function main() {
  const locales = fs
    .readdirSync(messagesRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => name !== baseLocale);

  const baseKeys = loadLocaleKeys(baseLocale);
  let failed = false;

  for (const locale of locales) {
    const localeKeys = loadLocaleKeys(locale);
    const missing = [...baseKeys].filter((k) => !localeKeys.has(k));
    const extra = [...localeKeys].filter((k) => !baseKeys.has(k));

    if (missing.length || extra.length) {
      failed = true;
      console.error(`\n[${locale}] key mismatch vs ${baseLocale}:`);
      if (missing.length) {
        console.error(`  Missing (${missing.length}):`);
        missing.slice(0, 20).forEach((k) => console.error(`    - ${k}`));
        if (missing.length > 20) {
          console.error(`    ... and ${missing.length - 20} more`);
        }
      }
      if (extra.length) {
        console.error(`  Extra (${extra.length}):`);
        extra.slice(0, 20).forEach((k) => console.error(`    + ${k}`));
      }
    } else {
      console.log(`[${locale}] OK (${localeKeys.size} keys)`);
    }
  }

  if (failed) {
    process.exit(1);
  }
  console.log(`\nAll locales match ${baseLocale} (${baseKeys.size} keys).`);
}

main();
