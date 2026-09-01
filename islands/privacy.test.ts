import { describe, expect, it } from "vitest";

import {
  buildPrivacySections,
  emptyPrivacy,
  missingPrivacyFields,
  privacyTitle,
  type PrivacyValues,
} from "./privacy";
import { renderText } from "./shared";

/**
 * Der Datenschutz-Baukasten.
 *
 * Zwei Eigenschaften machen den Unterschied zwischen einer Erklärung und einer
 * Aufzählung, und beide sind unsichtbar, wenn man den Text nur liest:
 *
 * 1. **Jeder Baustein nennt eine Rechtsgrundlage.** Ohne sie erfüllt der Text
 *    Art. 13 DSGVO nicht, sieht aber vollständig aus. Die meisten frei
 *    verfügbaren Muster scheitern genau daran.
 * 2. **Ein abgewählter Baustein verschwindet.** Ein Abschnitt über ein
 *    Analysewerkzeug, das der Betrieb gar nicht einsetzt, ist eine falsche
 *    Angabe über die eigene Verarbeitung.
 */

const base: PrivacyValues = {
  ...emptyPrivacy,
  provider: {
    company: "Beispiel Handel GmbH",
    represented: "",
    street: "Marktplatz 4",
    postalCode: "21493",
    city: "Schwarzenbek",
    country: "Deutschland",
    phone: "",
    email: "datenschutz@example.org",
    website: "https://example.org",
  },
};

const textOf = (values: PrivacyValues, lang: "de" | "en" = "de"): string =>
  renderText(privacyTitle(lang), buildPrivacySections(values, lang));

const headings = (values: PrivacyValues, lang: "de" | "en" = "de"): string[] =>
  buildPrivacySections(values, lang).map((section) => section.heading);

/** Alles an, damit jeder Baustein einmal im Text vorkommt. */
const everything: PrivacyValues = {
  ...base,
  hasDpo: true,
  dpoName: "Kim Beispiel",
  dpoContact: "dsb@example.org",
  supervisoryAuthority: "Unabhängiges Landeszentrum für Datenschutz Schleswig-Holstein",
  hosting: true,
  hostingProvider: "Beispiel Hosting GmbH",
  hostingCountry: "Deutschland",
  serverLogs: true,
  contactForm: true,
  emailContact: true,
  phoneContact: true,
  essentialCookies: true,
  consentCookies: true,
  consentTool: "Beispiel Consent",
  analytics: true,
  analyticsTool: "matomo",
  newsletter: true,
  newsletterProvider: "Beispiel Mail",
  maps: true,
  mapsProvider: "osm",
  webfonts: true,
  fontsMode: "google",
  videos: true,
  videoProvider: "YouTube",
  socialProfiles: true,
  socialNetworks: "Instagram",
  socialPlugins: true,
  shop: true,
  paymentProviders: "PayPal",
  booking: true,
  bookingProvider: "Beispiel Termine",
  liveChat: true,
  chatProvider: "Beispiel Chat",
  cdn: true,
  cdnProvider: "Beispiel CDN",
  applications: true,
  thirdCountry: true,
  thirdCountryDetails: "Videos werden von einem Anbieter in den USA ausgeliefert.",
};

describe("Grundgerüst", () => {
  it("beginnt mit dem Verantwortlichen", () => {
    expect(headings(base)[0]).toBe("Verantwortlicher");
    expect(textOf(base)).toContain("Beispiel Handel GmbH");
  });

  it("führt die Rechte der betroffenen Person immer", () => {
    // Auch bei einer Erklärung, in der jeder optionale Baustein abgewählt ist:
    // die Rechte hängen nicht daran, welche Dienste jemand einsetzt.
    const minimal: PrivacyValues = {
      ...emptyPrivacy,
      hosting: false,
      serverLogs: false,
      contactForm: false,
      emailContact: false,
      essentialCookies: false,
    };
    const list = headings(minimal);
    expect(list).toContain("Ihre Rechte");
    expect(list).toContain("Beschwerderecht bei einer Aufsichtsbehörde");
    expect(list).toContain("Speicherdauer");
  });
});

describe("Ankreuzfelder schalten Abschnitte", () => {
  const cases: { key: keyof PrivacyValues; heading: string }[] = [
    { key: "hasDpo", heading: "Datenschutzbeauftragte Person" },
    { key: "hosting", heading: "Hosting" },
    { key: "serverLogs", heading: "Server-Logdateien" },
    { key: "contactForm", heading: "Kontaktformular" },
    { key: "analytics", heading: "Webanalyse" },
    { key: "newsletter", heading: "Newsletter" },
    { key: "maps", heading: "Kartendienst" },
    { key: "webfonts", heading: "Schriftarten" },
    { key: "videos", heading: "Eingebettete Videos" },
    { key: "shop", heading: "Bestellungen und Zahlungsabwicklung" },
    { key: "booking", heading: "Termin- und Buchungssystem" },
    { key: "liveChat", heading: "Chat" },
    { key: "cdn", heading: "Content Delivery Network" },
    { key: "applications", heading: "Bewerbungen" },
    { key: "thirdCountry", heading: "Übermittlung in Drittländer" },
  ];

  it.each(cases.map((entry) => [entry.key, entry.heading] as const))(
    "%s bringt den Abschnitt und nimmt ihn wieder weg",
    (key, heading) => {
      const on = headings({ ...everything, [key]: true } as PrivacyValues);
      const off = headings({ ...everything, [key]: false } as PrivacyValues);
      expect(on, `${String(key)} an`).toContain(heading);
      expect(off, `${String(key)} aus`).not.toContain(heading);
    },
  );

  it("führt den Cookie-Abschnitt nur, solange eine der beiden Arten gesetzt ist", () => {
    expect(headings({ ...everything, essentialCookies: false })).toContain("Cookies");
    expect(headings({ ...everything, consentCookies: false })).toContain("Cookies");
    expect(headings({ ...everything, essentialCookies: false, consentCookies: false })).not.toContain(
      "Cookies",
    );
  });

  it("nennt beim Kontaktabschnitt nur die tatsächlich angebotenen Wege", () => {
    const emailOnly = textOf({ ...everything, phoneContact: false });
    expect(emailOnly).toContain("Wenn Sie uns per E-Mail kontaktieren");
    const both = textOf(everything);
    expect(both).toContain("per E-Mail oder Telefon kontaktieren");
  });
});

describe("Rechtsgrundlagen", () => {
  it("nennt in jedem Abschnitt eine Rechtsgrundlage oder ein Recht", () => {
    // Der Unterschied zwischen einer Erklärung und einer Liste eingesetzter
    // Dienste. Ausgenommen sind die Abschnitte, die selbst keine Verarbeitung
    // beschreiben.
    const exempt = new Set(["Verantwortlicher", "Datenschutzbeauftragte Person", "Verschlüsselte Übertragung"]);
    for (const section of buildPrivacySections(everything, "de")) {
      if (exempt.has(section.heading)) continue;
      const body = section.paragraphs.join(" ");
      expect(body, `Abschnitt „${section.heading}“`).toMatch(/Art\. \d+|§ \d+/);
    }
  });

  it("stützt einwilligungspflichtige Dienste nicht auf ein berechtigtes Interesse", () => {
    // Analyse, Karten, Google Fonts und Videos brauchen eine Einwilligung.
    // Ein „berechtigtes Interesse“ an genau diesen Stellen ist der Fehler, den
    // die meisten Muster machen, und er steht dann schwarz auf weiß auf der
    // Seite des Nutzers.
    const consentSections = ["Webanalyse", "Kartendienst", "Eingebettete Videos"];
    for (const section of buildPrivacySections(everything, "de")) {
      if (!consentSections.includes(section.heading)) continue;
      const body = section.paragraphs.join(" ");
      expect(body, section.heading).toContain("lit. a DSGVO");
      expect(body, section.heading).not.toContain("berechtigtes Interesse");
    }
  });

  it("nennt bei lokalen Schriftarten gar keine Übermittlung", () => {
    const local = textOf({ ...everything, fontsMode: "local" });
    expect(local).toContain("auf unserem eigenen Server");
    expect(local).not.toContain("Google Fonts");
  });
});

describe("Freitextfelder", () => {
  it("übernimmt eine eigene Speicherdauer statt des allgemeinen Absatzes", () => {
    const own = "Wir löschen Kundendaten zehn Jahre nach dem letzten Auftrag.";
    const text = textOf({ ...everything, retention: own });
    expect(text).toContain(own);
    expect(text).not.toContain("es sei denn, gesetzliche Aufbewahrungsfristen");
  });

  it("nennt die zuständige Aufsichtsbehörde, wenn sie angegeben ist", () => {
    expect(textOf(everything)).toContain("Unabhängiges Landeszentrum für Datenschutz");
    expect(textOf({ ...everything, supervisoryAuthority: "" })).toContain("Beschwerderecht");
  });
});

describe("Hinweise auf fehlende Angaben", () => {
  it("meldet die leeren Pflichtfelder", () => {
    const missing = missingPrivacyFields(emptyPrivacy, "de");
    expect(missing).toContain("Name des Verantwortlichen");
    expect(missing).toContain("E-Mail-Adresse");
  });

  it("verlangt den Namen des Analysewerkzeugs nur bei „anderes Werkzeug“", () => {
    expect(missingPrivacyFields({ ...base, analytics: true, analyticsTool: "matomo" }, "de")).toEqual([]);
    expect(
      missingPrivacyFields({ ...base, analytics: true, analyticsTool: "other", analyticsName: "" }, "de"),
    ).toContain("Name des Analysewerkzeugs");
  });
});

describe("Sprachparität", () => {
  it("erzeugt in beiden Sprachen dieselbe Abschnittsfolge", () => {
    const de = buildPrivacySections(everything, "de");
    const en = buildPrivacySections(everything, "en");
    expect(en.length).toBe(de.length);
    expect(en.map((section) => section.paragraphs.length)).toEqual(
      de.map((section) => section.paragraphs.length),
    );
  });

  it("nennt die Artikel der DSGVO in beiden Sprachen", () => {
    expect(textOf(everything, "en")).toContain("GDPR");
    expect(textOf(everything, "de")).toContain("DSGVO");
  });
});
