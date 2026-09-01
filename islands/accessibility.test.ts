import { describe, expect, it } from "vitest";

import {
  accessibilityTitle,
  buildAccessibilitySections,
  emptyAccessibility,
  missingAccessibilityFields,
  standardLabel,
  STANDARD_ORDER,
  type AccessibilityValues,
} from "./accessibility";
import { renderText } from "./shared";

/**
 * Die Barrierefreiheitserklärung.
 *
 * Der Kern dieser Datei ist ein einziger Test: dass die Erklärung einer
 * öffentlichen Stelle auf die Schlichtungsstelle nach § 16 BGG verweist und
 * die eines Unternehmens auf die Marktüberwachung. Vertauscht wären beide
 * Texte falsch — und zwar am Ende eines Dokuments, das bis dahin vollkommen
 * plausibel klingt. Kein Typcheck, kein Linter und kein Blick auf die Seite
 * würde das zeigen.
 */

const filled: AccessibilityValues = {
  ...emptyAccessibility,
  provider: {
    company: "Beispiel Handel GmbH",
    represented: "",
    street: "Marktplatz 4",
    postalCode: "21493",
    city: "Schwarzenbek",
    country: "Deutschland",
    phone: "04151 000000",
    email: "info@example.org",
    website: "",
  },
  serviceName: "der Onlineshop shop.example.org",
  serviceUrl: "https://shop.example.org",
  conformity: "partial",
  nonAccessible: "Die PDF-Preisliste ist nicht getaggt.",
  createdOn: "2026-09-01",
  reviewedOn: "2026-09-01",
  feedbackContact: "barrierefreiheit@example.org",
};

const textOf = (values: AccessibilityValues, lang: "de" | "en" = "de"): string =>
  renderText(accessibilityTitle(lang), buildAccessibilitySections(values, lang));

const headings = (values: AccessibilityValues, lang: "de" | "en" = "de"): string[] =>
  buildAccessibilitySections(values, lang).map((section) => section.heading);

describe("Regime", () => {
  it("verweist ein Unternehmen auf die Marktüberwachung", () => {
    const text = textOf({ ...filled, regime: "bfsg" });
    expect(text).toContain("Marktüberwachungsstelle");
    expect(text).not.toContain("§ 16 BGG");
    expect(headings({ ...filled, regime: "bfsg" })).toContain("Marktüberwachung");
  });

  it("verweist eine öffentliche Stelle auf die Schlichtungsstelle nach § 16 BGG", () => {
    const text = textOf({ ...filled, regime: "public" });
    expect(text).toContain("§ 16 BGG");
    expect(text).not.toContain("Marktüberwachungsstelle");
    expect(headings({ ...filled, regime: "public" })).toContain("Durchsetzungsverfahren");
  });

  it("nennt im Geltungsbereich die jeweils richtige Vorschrift", () => {
    expect(textOf({ ...filled, regime: "bfsg" })).toContain("Barrierefreiheitsstärkungsgesetz");
    expect(textOf({ ...filled, regime: "public" })).toContain("§ 12b");
    expect(textOf({ ...filled, regime: "public" })).toContain("BITV 2.0");
  });

  it("hält die beiden Verweise auch im englischen Baum auseinander", () => {
    expect(textOf({ ...filled, regime: "public" }, "en")).toContain("section 16 BGG");
    expect(textOf({ ...filled, regime: "bfsg" }, "en")).toContain("market surveillance");
    expect(textOf({ ...filled, regime: "bfsg" }, "en")).not.toContain("section 16 BGG");
  });
});

describe("Stand der Vereinbarkeit", () => {
  it("formuliert die drei Stufen unterschiedlich", () => {
    const full = textOf({ ...filled, conformity: "full" });
    const partial = textOf({ ...filled, conformity: "partial" });
    const none = textOf({ ...filled, conformity: "none" });
    expect(full).toContain("vollständig vereinbar");
    expect(partial).toContain("teilweise vereinbar");
    expect(none).toContain("nicht vereinbar");
  });

  it("führt die Liste der Mängel nur, wenn es welche gibt", () => {
    expect(headings({ ...filled, conformity: "full" })).not.toContain("Nicht barrierefreie Inhalte");
    expect(headings({ ...filled, conformity: "partial" })).toContain("Nicht barrierefreie Inhalte");
    expect(headings({ ...filled, conformity: "none" })).toContain("Nicht barrierefreie Inhalte");
  });

  it("nennt den gewählten Standard im Satz", () => {
    for (const standard of STANDARD_ORDER) {
      expect(textOf({ ...filled, standard }), standard).toContain(standardLabel(standard));
    }
  });
});

describe("Begründung", () => {
  it("bleibt weg, solange keine gewählt ist", () => {
    expect(headings({ ...filled, reason: "none" })).not.toContain("Begründung");
  });

  it("unterscheidet die drei Gründe", () => {
    const burden = textOf({ ...filled, reason: "burden" });
    const exempt = textOf({ ...filled, reason: "exempt" });
    const progress = textOf({ ...filled, reason: "inprogress" });
    expect(burden).toContain("unverhältnismäßig");
    expect(exempt).toContain("Anwendungsbereich");
    expect(progress).toContain("arbeiten daran");
    expect(new Set([burden, exempt, progress]).size).toBe(3);
  });
});

describe("Rückmeldung", () => {
  it("nennt den angegebenen Kontaktweg", () => {
    expect(textOf(filled)).toContain("barrierefreiheit@example.org");
  });

  it("setzt eine Antwortfrist, auch wenn keine eingetragen ist", () => {
    // Eine Erklärung ohne Frist lässt offen, wie lange jemand warten soll —
    // und das ist genau die Angabe, wegen der der Rückmeldeweg vorgeschrieben
    // ist.
    expect(textOf(filled)).toContain("innerhalb von einem Monat");
    expect(textOf({ ...filled, feedbackDeadline: "zwei Wochen" })).toContain("innerhalb von zwei Wochen");
  });
});

describe("Hinweise auf fehlende Angaben", () => {
  it("meldet die leeren Pflichtfelder", () => {
    const missing = missingAccessibilityFields(emptyAccessibility, "de");
    expect(missing).toContain("Name des Anbieters");
    expect(missing).toContain("Bezeichnung des Angebots");
    expect(missing).toContain("Datum der Erstellung");
    expect(missing).toContain("Kontaktweg für Rückmeldungen");
  });

  it("verlangt die Mängelliste nur unterhalb voller Vereinbarkeit", () => {
    expect(missingAccessibilityFields({ ...filled, conformity: "full", nonAccessible: "" }, "de")).toEqual(
      [],
    );
    expect(missingAccessibilityFields({ ...filled, nonAccessible: "" }, "de")).toContain(
      "Beschreibung der nicht barrierefreien Inhalte",
    );
  });

  it("verlangt die Prüfstelle nur bei externer Prüfung", () => {
    expect(missingAccessibilityFields({ ...filled, assessment: "self" }, "de")).toEqual([]);
    expect(missingAccessibilityFields({ ...filled, assessment: "external" }, "de")).toContain(
      "Name der Prüfstelle",
    );
  });
});

describe("Sprachparität", () => {
  it("erzeugt in beiden Sprachen dieselbe Abschnittsfolge", () => {
    for (const regime of ["bfsg", "public"] as const) {
      const de = buildAccessibilitySections({ ...filled, regime }, "de");
      const en = buildAccessibilitySections({ ...filled, regime }, "en");
      expect(en.length, regime).toBe(de.length);
      expect(en.map((section) => section.paragraphs.length), regime).toEqual(
        de.map((section) => section.paragraphs.length),
      );
    }
  });

  it("übersetzt den Titel", () => {
    expect(accessibilityTitle("de")).toBe("Erklärung zur Barrierefreiheit");
    expect(accessibilityTitle("en")).toBe("Accessibility statement");
  });
});
