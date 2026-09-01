import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import pack from "./index";

/**
 * Manifest-Vertrag dieses Packs.
 *
 * Die Copy-Budgets werden hier UND in der Site geprüft. Das ist keine
 * Doppelung aus Bequemlichkeit: eine zu lange Meta-Description hat kein
 * sichtbares Fehlerbild — sie fehlt einfach im Suchergebnis — und wenn sie erst
 * in `tds-tools-frontend` rot wird, fällt der Build in einem Repo, dessen Autor
 * den Satz nicht geschrieben hat.
 *
 * Alle vier Werkzeuge sind FREI. Das ist eine Aussage über die Positionierung
 * (Rechtstext-Generatoren sind Einstiegsfragen, keine Kaufabschlüsse) und
 * zugleich der Zustand, den ein versehentlich gesetztes `premiumDefault`
 * lautlos umdrehen würde: die Seite verschwände hinter dem `ToolGate`, ohne
 * dass irgendwo etwas rot wird.
 */

const repoRoot = new URL("..", import.meta.url);
const pkg = JSON.parse(readFileSync(new URL("package.json", repoRoot), "utf8")) as {
  name: string;
  files: string[];
};

/** Kategorien, für die die Tools-Site einen Abschnitt rendert. */
const CATEGORIES = [
  "business",
  "compliance",
  "content",
  "developer",
  "design",
  "marketing",
  "media",
  "security",
  "other",
];

const IDS = [
  "accessibility-statement-generator",
  "ai-image-badge",
  "imprint-generator",
  "privacy-policy-generator",
];

const SLUGS = [
  "barrierefreiheitserklaerung-generator",
  "datenschutzerklaerung-generator",
  "impressum-generator",
  "ki-kennzeichnung-bilder",
];

describe("Pack-Hülle", () => {
  it("nennt eine stabile Pack-Kennung", () => {
    expect(pack.id).toBe("legal");
    expect(pack.name).toBe("Recht & Pflichten");
  });

  it("liefert alle vier dokumentierten Werkzeuge", () => {
    expect(pack.tools.map((tool) => tool.id).sort()).toEqual(IDS);
  });
});

describe("Kennungen und Slugs", () => {
  it("vergibt jede Kennung und jeden Slug nur einmal", () => {
    const ids = pack.tools.map((tool) => tool.id);
    const slugs = pack.tools.map((tool) => tool.slug);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("verwendet URL-sichere Slugs", () => {
    for (const tool of pack.tools) {
      expect(tool.slug, `Slug von ${tool.id}`).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(encodeURIComponent(tool.slug)).toBe(tool.slug);
    }
  });

  it("hält die Slugs fest", () => {
    // Ein Slug ist die veröffentlichte Adresse. Ihn zu ändern heißt, eine
    // indexierte Seite gegen eine 404 zu tauschen — das soll eine bewusste
    // Entscheidung mit einer Weiterleitung sein, kein Nebeneffekt einer
    // Umbenennung im Manifest.
    expect(pack.tools.map((tool) => tool.slug).sort()).toEqual(SLUGS);
  });

  it("schreibt Umlaute im Slug aus", () => {
    // „datenschutzerklärung-generator“ wäre prozentkodiert eine unlesbare
    // Adresse und in jedem Backlink eine andere Zeichenfolge.
    for (const tool of pack.tools) {
      expect(tool.slug, `Slug von ${tool.id}`).not.toMatch(/[äöüß]/);
    }
  });
});

describe("Zugang", () => {
  it("lässt alle vier Werkzeuge frei und ohne Anmeldung", () => {
    for (const tool of pack.tools) {
      expect(tool.premiumDefault ?? false, `${tool.id} ist premium`).toBe(false);
      expect(tool.requiresLoginDefault ?? false, `${tool.id} verlangt Anmeldung`).toBe(false);
      expect(tool.priceCentsDefault, `${tool.id} ist frei, aber bepreist`).toBeUndefined();
    }
  });
});

describe("Pflichtfelder", () => {
  it.each(IDS.map((id) => [id]))("%s ist vollständig beschrieben", (id) => {
    const tool = pack.tools.find((entry) => entry.id === id);
    if (!tool) throw new Error(`Werkzeug ${id} fehlt im Pack`);

    expect(tool.name.length).toBeGreaterThan(3);
    expect(tool.icon).toBeTruthy();
    expect(CATEGORIES).toContain(tool.category);

    const { keywords } = tool;
    if (!keywords) throw new Error(`Werkzeug ${id} hat keine Schlagwörter`);
    expect(keywords.length).toBeGreaterThan(2);
  });

  it("sortiert alle vier in denselben Katalog-Abschnitt", () => {
    // Der Nutzen dieser Werkzeuge liegt darin, dass sie zusammen gefunden
    // werden: wer ein Impressum braucht, braucht meistens auch eine
    // Datenschutzerklärung.
    for (const tool of pack.tools) {
      expect(tool.category, `Kategorie von ${tool.id}`).toBe("compliance");
    }
  });

  it("hält jede gerenderte Description im Budget eines Suchergebnisses", () => {
    for (const tool of pack.tools) {
      for (const [label, text] of [
        ["description", tool.description],
        ["seo.description", tool.seo?.description],
      ] as const) {
        if (!text) throw new Error(`Werkzeug ${tool.id} hat kein Feld ${label}`);
        expect([...text].length, `${label} von ${tool.id}`).toBeGreaterThan(80);
        expect([...text].length, `${label} von ${tool.id}`).toBeLessThanOrEqual(160);
      }
    }
  });

  it("hält jeden SEO-Titel im Budget und weg von der Marke", () => {
    for (const tool of pack.tools) {
      const title = tool.seo?.title;
      if (!title) throw new Error(`Werkzeug ${tool.id} hat keinen seo.title`);
      expect([...title].length, `seo.title von ${tool.id}`).toBeLessThanOrEqual(60);
      expect(title.startsWith("TD Tools"), `seo.title von ${tool.id}`).toBe(false);
    }
  });

  it("sagt über jedes Werkzeug etwas anderes", () => {
    const descriptions = pack.tools.map((tool) => tool.seo?.description ?? tool.description);
    const titles = pack.tools.map((tool) => tool.seo?.title);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("verspricht in keiner Beschreibung Rechtssicherheit", () => {
    // Der Kern dieser vier Werkzeuge: sie erzeugen Muster. Eine
    // Katalogbeschreibung, die „rechtssicher“ oder „abmahnsicher“ sagt, wäre
    // genau die Zusage, die der Hinweis in der Insel zurücknimmt — und die
    // Beschreibung ist das, was im Suchergebnis steht.
    const forbidden = /rechtssicher|abmahnsicher|garantiert|legally safe|guaranteed/i;
    for (const tool of pack.tools) {
      expect(tool.description, `description von ${tool.id}`).not.toMatch(forbidden);
      expect(tool.seo?.description ?? "", `seo.description von ${tool.id}`).not.toMatch(forbidden);
    }
  });
});

describe("Verdrahtung der Komponenten", () => {
  it("zeigt auf das eigene tools/-Verzeichnis", () => {
    for (const tool of pack.tools) {
      expect(tool.component.startsWith(`${pkg.name}/tools/`), `${tool.id}`).toBe(true);
      expect(tool.component.endsWith(".astro")).toBe(true);
    }
  });

  it("löst jede Komponente auf eine Datei auf, die es gibt", () => {
    for (const tool of pack.tools) {
      const relative = tool.component.slice(`${pkg.name}/`.length);
      expect(existsSync(fileURLToPath(new URL(relative, repoRoot))), `fehlt: ${relative}`).toBe(true);
    }
  });

  it("veröffentlicht die Verzeichnisse, die die Site als Quelle liest", () => {
    expect(pkg.files).toContain("tools");
    expect(pkg.files).toContain("islands");
  });
});

describe("i18n", () => {
  it("führt dieselben Schlüssel in beiden Sprachen", () => {
    const de = Object.keys(pack.i18n?.de ?? {}).sort();
    const en = Object.keys(pack.i18n?.en ?? {}).sort();
    expect(de).toEqual(en);
    expect(de.length).toBeGreaterThan(0);
  });

  it("stellt jeden Schlüssel unter die Pack-Kennung", () => {
    for (const key of Object.keys(pack.i18n?.de ?? {})) {
      expect(key.startsWith(`${pack.id}.`), `Schlüssel ${key}`).toBe(true);
    }
  });

  it("füllt beide Tabellen", () => {
    // Eine leere englische Tabelle rendert auf jeder /en-Seite den rohen
    // Schlüssel als Beschriftung.
    for (const table of [pack.i18n?.de ?? {}, pack.i18n?.en ?? {}]) {
      for (const [key, value] of Object.entries(table)) {
        expect(value.trim(), `Wert zu ${key}`).not.toBe("");
      }
    }
  });
});
