import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const artRoot = resolve(root, "js/asciiArt");
const backupRoot = resolve(root, "backupFolder");
const inventoryPath = resolve(artRoot, "inventory.json");
const manifestPath = resolve(artRoot, "manifest.json");
const mode = process.argv[2] ?? "--check";

if (!["--check", "--update"].includes(mode)) {
  console.error("Usage: node scripts/ascii-assets.mjs [--check|--update]");
  process.exit(2);
}

function filesBelow(directory, predicate = () => true) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return filesBelow(path, predicate);
    return predicate(path) ? [path] : [];
  });
}

function repoPath(path) {
  return relative(root, path).split(sep).join("/");
}

function dimensions(text) {
  if (text === null) {
    return { approximateWidth: null, approximateHeight: null };
  }
  const rows = text.replace(/^\r?\n/, "").replace(/\r?\n$/, "").split(/\r?\n/);
  return {
    approximateWidth: Math.max(0, ...rows.map((row) => [...row].length)),
    approximateHeight: text.length ? rows.length : 0,
  };
}

function literalFor(source, declarationEnd) {
  const tail = source.slice(declarationEnd);
  const raw = tail.match(/^\s*String\.raw`([\s\S]*?)`\s*(?:\.slice\(1\))?\s*;/);
  if (raw) return raw[1];

  const template = tail.match(/^\s*`([\s\S]*?)`\s*(?:\.slice\(1\))?\s*;/);
  if (template && !template[1].includes("${")) return template[1];

  const array = tail.match(/^\s*\[([\s\S]*?)\]\s*(?:\.join\(\s*["']\\n["']\s*\))?\s*;/);
  if (!array) return null;
  const rows = [];
  for (const match of array[1].matchAll(/(?:^|,)\s*("(?:\\.|[^"\\])*")\s*(?=,|$)/gm)) {
    try { rows.push(JSON.parse(match[1])); } catch { return null; }
  }
  return rows.length ? rows.join("\n") : null;
}

function usageCount(name, sourcePath) {
  const matcher = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "g");
  return filesBelow(resolve(root, "js"), (path) => path.endsWith(".js"))
    .reduce((count, path) => count + (path === sourcePath ? 0 : (readFileSync(path, "utf8").match(matcher)?.length ?? 0)), 0);
}

function statusFor(path, name, uses) {
  const lower = `${repoPath(path)} ${name}`.toLowerCase();
  if (lower.includes("test") || lower.includes("experimental")) return "EXPERIMENTAL";
  if (lower.includes("legacy") || lower.includes("archive")) return "LEGACY";
  if (lower.includes("unfinished")) return "UNFINISHED";
  if (uses > 0) return "ACTIVE";
  return "UNKNOWN";
}

function buildInventory() {
  const sourceFiles = filesBelow(artRoot, (path) => path.endsWith(".js")).sort();
  return {
    policy: "No status authorizes deletion. UNKNOWN material is preserved pending manual review.",
    generatedBy: "node scripts/ascii-assets.mjs --update",
    files: sourceFiles.map((path) => {
      const source = readFileSync(path, "utf8");
      const exports = [];
      for (const match of source.matchAll(/export\s+const\s+([A-Za-z_$][\w$]*)\s*=/g)) {
        const name = match[1];
        const literal = literalFor(source, match.index + match[0].length);
        const uses = usageCount(name, path);
        exports.push({
          assetName: name,
          exportName: name,
          ...dimensions(literal),
          status: statusFor(path, name, uses),
          associatedLocationOrEnemy: repoPath(path).includes("/scenes/")
            ? repoPath(path).split("/").at(-1).replace(/\.js$/, "")
            : "UNKNOWN",
          unfinished: /unfinished/i.test(`${name} ${source.slice(Math.max(0, match.index - 120), match.index)}`),
          containsUnicode: literal === null ? /[^\x00-\x7f]/.test(source) : /[^\x00-\x7f]/.test(literal),
          significantTrailingSpaces: literal === null
            ? source.split(/\r?\n/).some((row) => / +$/.test(row))
            : literal.split(/\r?\n/).some((row) => / +$/.test(row)),
          clickableCoordinateData: /(?:regions?|hitboxes?|clickable|\bx\s*:|\by\s*:)/i.test(source),
          runtimeReferencesOutsideSource: uses,
          dimensionsKnown: literal !== null,
        });
      }
      return {
        file: repoPath(path),
        status: statusFor(path, "", exports.reduce((sum, item) => sum + item.runtimeReferencesOutsideSource, 0)),
        containsUnexportedOrCommentedContent: source.includes("`") || /\/\*[\s\S]*?[\\/|_]{2}/.test(source),
        exports,
      };
    }),
  };
}

function buildManifest() {
  const protectedFiles = [
    ...filesBelow(artRoot, (path) => path !== inventoryPath && path !== manifestPath),
    ...filesBelow(backupRoot),
  ].sort();
  return {
    policy: "Byte hashes protect trailing spaces, backslashes, Unicode, commented art, and unused art.",
    files: Object.fromEntries(protectedFiles.map((path) => [
      repoPath(path),
      createHash("sha256").update(readFileSync(path)).digest("hex"),
    ])),
  };
}

const expectedInventory = `${JSON.stringify(buildInventory(), null, 2)}\n`;
const expectedManifest = `${JSON.stringify(buildManifest(), null, 2)}\n`;

if (mode === "--update") {
  writeFileSync(inventoryPath, expectedInventory);
  writeFileSync(manifestPath, expectedManifest);
  console.log("Updated ASCII asset inventory and protected-byte manifest.");
  process.exit(0);
}

const failures = [];
if (!existsSync(inventoryPath) || readFileSync(inventoryPath, "utf8") !== expectedInventory) {
  failures.push("js/asciiArt/inventory.json is missing or stale");
}
if (!existsSync(manifestPath) || readFileSync(manifestPath, "utf8") !== expectedManifest) {
  failures.push("js/asciiArt/manifest.json is missing or protected bytes changed");
}
if (failures.length) {
  console.error(failures.join("\n"));
  console.error("Review every artwork change, then run --update only if it is intentional and verified.");
  process.exit(1);
}
console.log("ASCII asset inventory and protected bytes are valid.");
