import { describe, expect, it } from "vitest";

import {
  buildImprintSections,
  emptyImprint,
  imprintTitle,
  LEGAL_FORMS,
  legalFormLabel,
  missingImprintFields,
  REGISTERED_FORMS,
  type ImprintValues,
} from "./imprint";
import { renderText } from "./shared";

/**
 * Der Impressum-Baukasten.
 *
 * Geprüft wird die Klauselauswahl, nicht die Formulierung: welche Ankreuzung
 * welchen Abschnitt erzeugt, und — genauso wichtig — welche Abwahl ihn wieder
 * verschwinden lässt. Ein Abschnitt, der nach dem Abwählen stehen bleibt, ist
 * in einem solchen Werkzeug der Fehler, der am längsten unbemerkt bleibt: der
 * Text sieht weiterhin richtig aus, er ist nur nicht mehr wahr.
 */

const filled: ImprintValues = {
  ...emptyImprint,
  provider: {
    company: "Muster Bau GmbH",
    represented: "Alex Muster",
    street: "Hauptstraße 1",
    postalCode: "21493",
    city: "Schwarzenbek",
    country: "Deutschland",
    phone: "04151 000000",
    email: "info@example.org",
    website: "https://example.org",
  },
  legalForm: "gmbh",
  registered: true,
  registerCourt: "Amtsgericht Lübeck",
  registerNumber: "HRB 12345",
  vatRegistered: true,
  vatId: "DE123456789",
};

const textOf = (values: ImprintValues, lang: "de" | "en" = "de"): string =>
  renderText(imprintTitle(lang), buildImprintSections(values, lang));

const headings = (values: ImprintValues, lang: "de" | "en" = "de"): string[] =>
  buildImprintSections(values, lang).map((section) => section.heading);

describe("Grundgerüst", () => {
  it("nennt die Pflichtangaben nach § 5 DDG zuerst", () => {
    expect(headings(filled)[0]).toContain("§ 5 DDG");
  });

  it("übernimmt Anschrift und Kontakt", () => {
    const text = textOf(filled);
    expect(text).toContain("Muster Bau GmbH");
    expect(text).toContain("21493 Schwarzenbek");
    expect(text).toContain("info@example.org");
  });

  it("beschriftet die Vertretung nach Rechtsform", () => {
    expect(textOf({ ...filled, legalForm: "gmbh" })).toContain("Geschäftsführung: Alex Muster");
    expect(textOf({ ...filled, legalForm: "ev" })).toContain("Vorstand: Alex Muster");
  });

  it("lässt die Vertretungszeile weg, wenn niemand benannt ist", () => {
    const text = textOf({ ...filled, provider: { ...filled.provider, represented: "" } });
    expect(text).not.toContain("Geschäftsführung:");
  });

  it("kennt für jede Rechtsform eine Bezeichnung in beiden Sprachen", () => {
    for (const form of LEGAL_FORMS) {
      expect(legalFormLabel(form, "de").length, `de ${form}`).toBeGreaterThan(3);
      expect(legalFormLabel(form, "en").length, `en ${form}`).toBeGreaterThan(3);
    }
  });

  it("belegt nur die eingetragenen Rechtsformen vor", () => {
    expect(REGISTERED_FORMS).toContain("gmbh");
    expect(REGISTERED_FORMS).not.toContain("sole");
    expect(REGISTERED_FORMS).not.toContain("gbr");
  });
});

describe("Ankreuzfelder schalten Abschnitte", () => {
  const cases: { key: keyof ImprintValues; heading: string }[] = [
    { key: "registered", heading: "Registereintrag" },
    { key: "vatRegistered", heading: "Umsatzsteuer-Identifikationsnummer" },
    { key: "regulatedProfession", heading: "Berufsrechtliche Angaben" },
    { key: "hasSupervisoryAuthority", heading: "Aufsichtsbehörde" },
    { key: "hasInsurance", heading: "Berufshaftpflichtversicherung" },
    { key: "editorial", heading: "Redaktionell verantwortlich" },
    { key: "includeLiability", heading: "Haftung für Inhalte" },
    { key: "includeCopyright", heading: "Urheberrecht" },
  ];

  it.each(cases.map((entry) => [entry.key, entry.heading] as const))(
    "%s bringt den Abschnitt und nimmt ihn wieder weg",
    (key, heading) => {
      const on = headings({ ...filled, [key]: true } as ImprintValues).join(" | ");
      const off = headings({ ...filled, [key]: false } as ImprintValues).join(" | ");
      expect(on, `${String(key)} an`).toContain(heading);
      expect(off, `${String(key)} aus`).not.toContain(heading);
    },
  );

  it("führt den Abschnitt zur Streitbeilegung immer", () => {
    // Die Angabe ist keine Option: sie fehlt oder sie ist da, und wenn sie
    // fehlt, ist das der Mangel.
    expect(headings({ ...emptyImprint })).toContain("Verbraucherstreitbeilegung");
  });

  it("dreht die Aussage zur Streitbeilegung wirklich um", () => {
    const unwilling = textOf({ ...filled, disputeResolution: "unwilling" });
    const willing = textOf({
      ...filled,
      disputeResolution: "willing",
      disputeBody: "Universalschlichtungsstelle des Bundes",
    });
    expect(unwilling).toContain("nicht bereit");
    expect(willing).not.toContain("nicht bereit");
    expect(willing).toContain("Universalschlichtungsstelle des Bundes");
  });
});

describe("was NICHT im Text stehen darf", () => {
  const everything: ImprintValues = {
    ...filled,
    regulatedProfession: true,
    professionTitle: "Elektrotechnikermeister",
    chamber: "Handwerkskammer Lübeck",
    professionState: "Deutschland",
    professionRules: "Handwerksordnung",
    professionRulesUrl: "https://example.org/hwo",
    hasSupervisoryAuthority: true,
    authorityName: "Kreis Herzogtum Lauenburg",
    authorityUrl: "https://example.org/behoerde",
    editorial: true,
    editorName: "Alex Muster",
    editorAddress: "Hauptstraße 1, 21493 Schwarzenbek",
    hasInsurance: true,
    insurerName: "Beispiel Versicherung AG",
    insurerAddress: "Beispielweg 2, 20095 Hamburg",
    insuranceScope: "Deutschland",
    disputeResolution: "willing",
    disputeBody: "Universalschlichtungsstelle des Bundes",
  };

  it("verweist nirgends auf die abgeschaltete ODR-Plattform", () => {
    // Die Europäische Kommission hat die Plattform am 20. Juli 2025
    // abgeschaltet. Der Verweis steht bis heute in fast jedem frei
    // verfügbaren Muster und in jedem Generator, den seither niemand
    // angefasst hat — er ist inzwischen ein toter Link in einem Pflichttext.
    for (const lang of ["de", "en"] as const) {
      const text = textOf(everything, lang).toLowerCase();
      expect(text, lang).not.toContain("ec.europa.eu/consumers/odr");
      expect(text, lang).not.toContain("os-plattform");
      expect(text, lang).not.toContain("online-streitbeilegung");
      expect(text, lang).not.toContain("odr");
    }
  });

  it("nimmt den Hinweis des Werkzeugs nicht in den Pflichttext auf", () => {
    // Der Muster-Hinweis gehört in die Oberfläche. Stünde er im erzeugten
    // Text, wanderte er beim Einfügen auf die Seite des Nutzers und würde
    // dort als Teil des Impressums gelesen.
    for (const lang of ["de", "en"] as const) {
      const text = textOf(everything, lang).toLowerCase();
      expect(text, lang).not.toContain("rechtsberatung");
      expect(text, lang).not.toContain("legal advice");
      expect(text, lang).not.toContain("zur orientierung");
      expect(text, lang).not.toContain("sample for orientation");
    }
  });

  it("erwähnt die Steuernummer nicht", () => {
    // Die Steuernummer des Finanzamts gehört nicht ins Impressum; § 5 DDG
    // verlangt die USt-IdNr. Ein Generator, der beide Felder anbietet, bringt
    // seine Nutzer dazu, eine nicht öffentliche Angabe zu veröffentlichen.
    expect(textOf(everything)).not.toMatch(/Steuernummer/i);
  });
});

describe("Hinweise auf fehlende Angaben", () => {
  it("meldet die leeren Pflichtfelder", () => {
    const missing = missingImprintFields(emptyImprint, "de");
    expect(missing).toContain("Name oder Firma");
    expect(missing).toContain("vollständige Anschrift");
    expect(missing).toContain("E-Mail-Adresse");
  });

  it("schweigt, wenn alles ausgefüllt ist", () => {
    expect(missingImprintFields(filled, "de")).toEqual([]);
  });

  it("verlangt die Registernummer erst, wenn ein Register angekreuzt ist", () => {
    expect(missingImprintFields({ ...filled, registered: false, registerNumber: "" }, "de")).toEqual([]);
    expect(missingImprintFields({ ...filled, registerNumber: "" }, "de")).toContain("Registernummer");
  });
});

describe("Sprachparität", () => {
  it("erzeugt in beiden Sprachen dieselbe Abschnittsfolge", () => {
    // Übersetzt werden die Sätze, nicht die Auswahl. Ein englischer Text mit
    // einem Abschnitt weniger wäre ein anderes Dokument, und niemand, der die
    // deutsche Fassung geprüft hat, würde es bemerken.
    const de = buildImprintSections(filled, "de");
    const en = buildImprintSections(filled, "en");
    expect(en.length).toBe(de.length);
    expect(en.map((section) => section.paragraphs.length)).toEqual(
      de.map((section) => section.paragraphs.length),
    );
  });

  it("übersetzt die Überschriften wirklich", () => {
    const de = buildImprintSections(filled, "de").map((section) => section.heading);
    const en = buildImprintSections(filled, "en").map((section) => section.heading);
    expect(en).not.toEqual(de);
    expect(imprintTitle("en")).toBe("Legal notice");
  });

  it("behält die deutschen Fundstellen auch im englischen Text", () => {
    // Ein englischsprachiges Impressum eines deutschen Betriebs verweist
    // weiterhin auf § 5 DDG — die Vorschrift wird nicht mitübersetzt.
    expect(textOf(filled, "en")).toContain("DDG");
  });
});
