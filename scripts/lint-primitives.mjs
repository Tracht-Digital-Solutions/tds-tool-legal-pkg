#!/usr/bin/env node
/**
 * Fails the build on a control that bypasses the shared design library.
 *
 * WHY THIS EXISTS. There are no CSS files in any extension package — every
 * style comes from `@tracht-digital-solutions/tds-shared`. A `<button>` with
 * no `btn` class therefore has no padding, no radius and no 44px
 * coarse-pointer target, and an `<input>` with no `field` class is worse than
 * unstyled: Tailwind's preflight zeroes borders, so it renders INVISIBLE and
 * its label collides with its value.
 *
 * That is not hypothetical. Before this check, across the 14 extension
 * packages, 86 of 101 buttons and 105 of 121 text controls were bare — the
 * settings panels shipped with invisible inputs for months, because nothing
 * looked at them and CI runs type-check and build rather than tests. The four
 * `tds-tool-*` packs and `tds-tools-frontend` were outside that sweep and had
 * drifted just as far (12 of 12 buttons bare); they carry this script now too.
 *
 * Deliberately dependency free — it runs as one CI step in every package
 * without an install-ordering problem — but NOT a naive regex any more; see
 * `readTag` for why that mattered.
 *
 * Usage: node scripts/lint-primitives.mjs [dir]   (default: cwd)
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.argv[2] ?? process.cwd();
const SKIP = new Set(["node_modules", "dist", ".git", ".claude", "vendor"]);

/** Input types that legitimately carry no `field` class. */
const BARE_TYPES = new Set(["checkbox", "radio", "file", "hidden", "submit", "button", "range"]);

/**
 * The `.btn-*` colour variants tds-shared actually defines
 * (`styles/primitives.css`). Hard-coded rather than parsed out of
 * node_modules: this script has to run as one dependency-free CI step, and the
 * list changes about once a year. If tds-shared gains a variant, add it here.
 */
const BTN_VARIANTS = new Set(["primary", "accent", "ghost", "danger"]);

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx|astro)$/.test(entry) && !/\.test\.tsx$/.test(entry)) files.push(p);
  }
})(ROOT);

/**
 * Read one tag, from its `<` through the `>` that actually closes it.
 *
 * This used to be `/<button\b[^>]*>/`, and that is wrong in a way that hid for
 * as long as the script existed: `[^>]*` stops at the FIRST `>`, and an arrow
 * function supplies one. So `<button onClick={() => x} className="btn ...">`
 * was only ever seen as far as `<button onClick={() =`, the `className` was
 * never in the matched text, and a perfectly well-dressed control was reported
 * as bare. Every repo silently absorbed that by writing `className` before the
 * handler — a convention nobody chose, enforced by a bug.
 *
 * It also cut the other way and stayed quiet about it: the `<td>`/`<th>` check
 * looks FOR a class (`flex`), so a truncated tag means the class is missing
 * from the text and the violation is simply not found.
 *
 * So: walk the tag, tracking string state and `{}` depth, and stop at the first
 * `>` that is outside both. That handles `=>`, a `>` comparison inside an
 * expression, and a `>` inside a string such as
 * `placeholder='{"a": "b"}'` — all of which occur in these repos.
 */
function readTag(src, start) {
  let quote = null; // '"' | "'" | '`'
  let depth = 0; // {} nesting
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") quote = c;
    else if (c === "{") depth++;
    else if (c === "}") depth = Math.max(0, depth - 1);
    else if (c === ">" && depth === 0) return src.slice(start, i + 1);
  }
  return src.slice(start); // unterminated — treat the remainder as the tag
}

/** Every tag of the given names in `src`, as {tag, name, index}. */
function tags(src, names) {
  const out = [];
  const re = new RegExp(`<(${names.join("|")})\\b`, "g");
  for (const m of src.matchAll(re)) out.push({ tag: readTag(src, m.index), name: m[1], index: m.index });
  return out;
}

/**
 * The class string of a tag.
 *
 * `className={field}` yields the identifier, not the classes, so a local
 * `const field = "field-boxed w-full"` is resolved out of the same file before
 * giving up. Without that, the check depends on what a variable is NAMED —
 * `className={area}` read as bare while `className={field}` passed, which is a
 * spelling rule dressed up as a design rule. Unresolvable expressions (an
 * import, a ternary, a template literal) fall back to the raw text, which still
 * matches when the class name is written literally inside it.
 */
const classOf = (tag, src) => {
  const m = tag.match(/class(?:Name)?\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/);
  if (!m) return "";
  const raw = m[1] ?? m[2] ?? m[3] ?? "";
  const ident = raw.trim();
  if (!/^[A-Za-z_$][\w$]*$/.test(ident)) return raw;
  const decl = src.match(new RegExp(`\\b(?:const|let|var)\\s+${ident}\\s*=\\s*["'\`]([^"'\`]*)["'\`]`));
  return decl ? decl[1] : raw;
};

const findings = [];
for (const file of files) {
  const src = readFileSync(file, "utf8");
  const at = (index) =>
    `${relative(ROOT, file).replace(/\\/g, "/")}:${src.slice(0, index).split(/\r?\n/).length}`;

  for (const { tag, name, index } of tags(src, ["button", "input", "select", "textarea"])) {
    const cls = classOf(tag, src);
    const where = at(index);

    if (name === "button") {
      // `.chip` is the library's own filter/tab control and carries its own
      // hover + focus treatment, so it is an accepted alternative to `.btn`.
      //
      // `.tds-dropdown__trigger` / `__item` likewise: they are shared classes
      // that carry their own geometry, hover AND focus-visible treatment, and
      // the item is 44px at every pointer type. The rule is "must carry a
      // shared class that provides geometry", not "must literally say btn" —
      // forcing `.btn` onto a menu row would give it the pill radius and
      // button padding and make the menu look like a stack of buttons.
      if (!/\b(btn|chip|tds-dropdown__(trigger|item))\b/.test(cls)) {
        findings.push(`${where}  <button> needs "btn btn-*" (or "chip")`);
      }
      // …and the VARIANT has to exist. `btn btn-secondary` passed the check
      // above while matching no rule at all, so the control rendered with
      // geometry and a touch target but no colour — invisible against the
      // card it sat on. Same failure shape as a bare button, one step later.
      for (const variant of cls.matchAll(/\bbtn-([a-z-]+)\b/g)) {
        if (!BTN_VARIANTS.has(variant[1])) {
          findings.push(
            `${where}  "btn-${variant[1]}" is not a tds-shared variant (${[...BTN_VARIANTS].join(", ")})`,
          );
        }
      }
    } else {
      const type = (tag.match(/type\s*=\s*"([^"]*)"/) ?? [])[1] ?? "text";
      if (BARE_TYPES.has(type)) continue;
      if (!/\bfield\b/.test(cls)) findings.push(`${where}  <${name}> needs "field-boxed" (or "field")`);
    }
  }

  // Tables. A bare <table> gets browser defaults — no cell padding, no header
  // treatment, no row rules — because there is no global `table` rule in the
  // shared CSS. `.tds-table` is also what makes it scroll on a phone instead
  // of being clipped by `body { overflow-x: hidden }`, so the class is not
  // cosmetic: without it the right-hand columns are unreachable there.
  for (const { tag, index } of tags(src, ["table"])) {
    if (!/\btds-table\b/.test(classOf(tag, src))) findings.push(`${at(index)}  <table> needs "tds-table"`);
  }

  // `display: flex` on a table cell takes it out of the table's column
  // algorithm — it stops being a table-cell, so the column silently
  // desynchronises from its header. Put the flex on a wrapper inside the cell
  // (`.tds-toolbar` / `.tds-row`, both of which wrap on a narrow screen).
  for (const { tag, name, index } of tags(src, ["td", "th"])) {
    if (/\bflex\b|\bgrid\b/.test(classOf(tag, src))) {
      findings.push(`${at(index)}  <${name}> must not be flex/grid — wrap the contents instead`);
    }
  }
}

if (findings.length) {
  console.error(`\n${findings.length} element(s) bypass the shared primitives:\n`);
  for (const f of findings) console.error(`  ${f}`);
  console.error("\nSee tds-shared/styles/primitives.css. `.btn` carries the geometry and");
  console.error("`.btn-*` only the colour — BOTH classes are required.");
  console.error("NOTE: this is a regex scan, so a tag name written inside a COMMENT");
  console.error("counts as markup. Name the element in prose instead.\n");
  process.exit(1);
}
console.log(`lint-primitives: ${files.length} file(s) clean`);
