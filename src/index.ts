import { defineToolPack, defineTool } from "@tracht-digital-solutions/tds-tools-contract";

/**
 * Recht & Pflichten — die vier Werkzeuge für Pflichten, die ein Betrieb auf der
 * eigenen Website erfüllen muss und für die es kaum brauchbare freie Hilfen
 * gibt: Impressum (§ 5 DDG), Datenschutzerklärung (DSGVO),
 * Barrierefreiheitserklärung (BFSG bzw. BITV 2.0) und die Kennzeichnung
 * KI-erzeugter Bilder (Art. 50 KI-VO).
 *
 * Alle vier sind frei und ohne Anmeldung: die Defaults `premiumDefault` /
 * `requiresLoginDefault` fehlen absichtlich, weil ihr Fehlen "frei" bedeutet.
 * Die Verwaltung kann das jederzeit übersteuern.
 *
 * Die drei Textgeneratoren liefern **Muster, keine Rechtsberatung**. Dieser
 * Hinweis steht sichtbar in jeder Insel und in jedem Ratgeber — aber nie im
 * erzeugten Text, damit ihn niemand versehentlich mit auf die eigene Seite
 * kopiert.
 */
export default defineToolPack({
  id: "legal",
  name: "Recht & Pflichten",
  version: "0.1.0",
  tools: [
    defineTool({
      id: "imprint-generator",
      slug: "impressum-generator",
      name: "Impressum-Generator",
      category: "compliance",
      description:
        "Stellen Sie ein Muster-Impressum nach § 5 DDG zusammen: Rechtsform, Register, USt-IdNr. und Aufsichtsbehörde je nach Ankreuzung.",
      icon: "scroll-text",
      keywords: ["impressum", "ddg", "anbieterkennzeichnung", "muster", "generator"],
      component: "@tracht-digital-solutions/tds-tool-legal/tools/ImprintGenerator.astro",
      seo: {
        title: "Impressum-Generator — Muster nach § 5 DDG",
        description:
          "Impressum-Generator für kleine Betriebe: Muster nach § 5 DDG und § 18 MStV, per Ankreuzung zusammengestellt. Ohne Anmeldung, direkt im Browser.",
      },
    }),
    defineTool({
      id: "privacy-policy-generator",
      slug: "datenschutzerklaerung-generator",
      name: "Datenschutzerklärung-Generator",
      category: "compliance",
      description:
        "Setzen Sie eine Muster-Datenschutzerklärung nach DSGVO aus Bausteinen zusammen: Hosting, Kontaktformular, Cookies, Analyse und Newsletter.",
      icon: "shield-check",
      keywords: ["datenschutzerklärung", "dsgvo", "privacy", "muster", "generator"],
      component: "@tracht-digital-solutions/tds-tool-legal/tools/PrivacyPolicyGenerator.astro",
      seo: {
        title: "Datenschutzerklärung erstellen — DSGVO-Muster",
        description:
          "Datenschutzerklärung nach DSGVO als Muster erzeugen: Abschnitte für Hosting, Cookies, Webanalyse und Newsletter zuschalten. Alles lokal im Browser.",
      },
    }),
    defineTool({
      id: "accessibility-statement-generator",
      slug: "barrierefreiheitserklaerung-generator",
      name: "Barrierefreiheitserklärung-Generator",
      category: "compliance",
      description:
        "Erzeugen Sie eine Muster-Barrierefreiheitserklärung — wahlweise nach dem BFSG für Unternehmen oder nach BITV 2.0 für öffentliche Stellen.",
      icon: "accessibility",
      keywords: ["barrierefreiheit", "bfsg", "bitv", "erklärung", "wcag"],
      component:
        "@tracht-digital-solutions/tds-tool-legal/tools/AccessibilityStatementGenerator.astro",
      seo: {
        title: "Barrierefreiheitserklärung erstellen — BFSG",
        description:
          "Barrierefreiheitserklärung für BFSG oder BITV 2.0: Stand der Vereinbarkeit, Rückmeldeweg und Durchsetzungsverfahren als Muster, lokal im Browser.",
      },
    }),
    defineTool({
      id: "ai-image-badge",
      slug: "ki-kennzeichnung-bilder",
      name: "KI-Kennzeichnung für Bilder",
      category: "compliance",
      description:
        "Versehen Sie KI-Bilder mit einem sichtbaren Hinweis und einer maschinenlesbaren Notiz — Text, Ecke und Größe frei wählbar, ganz ohne Upload.",
      icon: "sparkles",
      keywords: ["ki", "kennzeichnung", "ai act", "badge", "wasserzeichen"],
      component: "@tracht-digital-solutions/tds-tool-legal/tools/AiImageBadge.astro",
      seo: {
        title: "KI-Bilder kennzeichnen — Badge und Metadaten",
        description:
          "Bilder als KI-erzeugt kennzeichnen: sichtbares Badge einbrennen und einen Hinweis in PNG oder JPEG einbetten. Läuft vollständig in Ihrem Browser.",
      },
    }),
  ],
  i18n: {
    de: {
      "legal.imprint": "Impressum-Generator",
      "legal.privacy": "Datenschutzerklärung-Generator",
      "legal.accessibility": "Barrierefreiheitserklärung-Generator",
      "legal.ai-badge": "KI-Kennzeichnung für Bilder",
    },
    en: {
      "legal.imprint": "Imprint Generator",
      "legal.privacy": "Privacy Policy Generator",
      "legal.accessibility": "Accessibility Statement Generator",
      "legal.ai-badge": "AI Image Labelling",
    },
  },
});
