import {
  addressBlock,
  clean,
  contactBlock,
  emptyProvider,
  join,
  type Lang,
  type Provider,
  type Section,
} from "./shared";

/**
 * Der Textaufbau des Impressum-Generators.
 *
 * Absichtlich eine reine Funktion ohne DOM: die Klauselauswahl ist das, was
 * hier falsch sein kann, und sie lässt sich so im node-Umfeld prüfen. Die
 * Insel daneben ist nur Formular und Vorschau.
 *
 * **Die ODR-Plattform kommt hier nicht vor.** Die Europäische Kommission hat
 * sie am 20. Juli 2025 abgeschaltet; ein Link darauf ist heute ein toter
 * Verweis in einem Pflichttext und damit eher ein Risiko als eine Erfüllung.
 * Genau daran erkennt man die Impressum-Generatoren, die seit Jahren niemand
 * angefasst hat — ein Test in diesem Pack hält den Verweis draußen.
 */

export type LegalForm =
  | "sole"
  | "freelance"
  | "gbr"
  | "ek"
  | "ug"
  | "gmbh"
  | "gmbh-co-kg"
  | "ag"
  | "ev";

export interface ImprintValues {
  provider: Provider;
  legalForm: LegalForm;
  registered: boolean;
  registerCourt: string;
  registerNumber: string;
  vatRegistered: boolean;
  vatId: string;
  regulatedProfession: boolean;
  professionTitle: string;
  chamber: string;
  professionState: string;
  professionRules: string;
  professionRulesUrl: string;
  hasSupervisoryAuthority: boolean;
  authorityName: string;
  authorityUrl: string;
  editorial: boolean;
  editorName: string;
  editorAddress: string;
  hasInsurance: boolean;
  insurerName: string;
  insurerAddress: string;
  insuranceScope: string;
  disputeResolution: "unwilling" | "willing";
  disputeBody: string;
  includeLiability: boolean;
  includeCopyright: boolean;
}

export const emptyImprint: ImprintValues = {
  provider: { ...emptyProvider, country: "Deutschland" },
  legalForm: "sole",
  registered: false,
  registerCourt: "",
  registerNumber: "",
  vatRegistered: false,
  vatId: "",
  regulatedProfession: false,
  professionTitle: "",
  chamber: "",
  professionState: "",
  professionRules: "",
  professionRulesUrl: "",
  hasSupervisoryAuthority: false,
  authorityName: "",
  authorityUrl: "",
  editorial: false,
  editorName: "",
  editorAddress: "",
  hasInsurance: false,
  insurerName: "",
  insurerAddress: "",
  insuranceScope: "",
  disputeResolution: "unwilling",
  disputeBody: "",
  includeLiability: true,
  includeCopyright: true,
};

/**
 * Rechtsform → ausgeschriebene Bezeichnung und die passende Beschriftung der
 * Vertretung. Ein Verein hat einen Vorstand, eine GmbH eine Geschäftsführung —
 * „Vertreten durch“ über beiden wäre nicht falsch, aber es liest sich wie ein
 * Formular und nicht wie ein Impressum.
 */
const FORMS: Record<LegalForm, { de: string; en: string; deRep: string; enRep: string }> = {
  sole: {
    de: "Einzelunternehmen",
    en: "Sole proprietorship",
    deRep: "Inhaberin bzw. Inhaber",
    enRep: "Owner",
  },
  freelance: {
    de: "Freiberufliche Tätigkeit",
    en: "Freelance practice",
    deRep: "Inhaberin bzw. Inhaber",
    enRep: "Owner",
  },
  gbr: {
    de: "Gesellschaft bürgerlichen Rechts (GbR)",
    en: "Gesellschaft bürgerlichen Rechts (GbR)",
    deRep: "Gesellschafterinnen und Gesellschafter",
    enRep: "Partners",
  },
  ek: {
    de: "Eingetragene Kauffrau bzw. eingetragener Kaufmann (e. K.)",
    en: "Registered merchant (e. K.)",
    deRep: "Inhaberin bzw. Inhaber",
    enRep: "Owner",
  },
  ug: {
    de: "Unternehmergesellschaft (haftungsbeschränkt)",
    en: "Unternehmergesellschaft (haftungsbeschränkt)",
    deRep: "Geschäftsführung",
    enRep: "Managing directors",
  },
  gmbh: {
    de: "Gesellschaft mit beschränkter Haftung (GmbH)",
    en: "Gesellschaft mit beschränkter Haftung (GmbH)",
    deRep: "Geschäftsführung",
    enRep: "Managing directors",
  },
  "gmbh-co-kg": {
    de: "GmbH & Co. KG",
    en: "GmbH & Co. KG",
    deRep: "Vertreten durch die persönlich haftende Gesellschafterin",
    enRep: "Represented by the general partner",
  },
  ag: {
    de: "Aktiengesellschaft (AG)",
    en: "Aktiengesellschaft (AG)",
    deRep: "Vorstand",
    enRep: "Executive board",
  },
  ev: {
    de: "Eingetragener Verein (e. V.)",
    en: "Registered association (e. V.)",
    deRep: "Vorstand",
    enRep: "Board",
  },
};

/** Die Rechtsformen in der Reihenfolge, in der die Auswahlliste sie zeigt. */
export const LEGAL_FORMS: LegalForm[] = [
  "sole",
  "freelance",
  "gbr",
  "ek",
  "ug",
  "gmbh",
  "gmbh-co-kg",
  "ag",
  "ev",
];

/** Anzeigename einer Rechtsform in der Sprache des Formulars. */
export const legalFormLabel = (form: LegalForm, lang: Lang): string =>
  lang === "de" ? FORMS[form].de : FORMS[form].en;

/**
 * Die Rechtsformen, die in ein Register eingetragen sind.
 *
 * Nur eine Vorbelegung der Ankreuzfelder, keine Sperre: eine GbR kann keine
 * Handelsregisternummer haben, ein Verein aber sehr wohl eine
 * Vereinsregisternummer, und die Kombinationen sind zu vielfältig, um sie
 * einem Nutzer zu verbieten.
 */
export const REGISTERED_FORMS: LegalForm[] = ["ek", "ug", "gmbh", "gmbh-co-kg", "ag", "ev"];

export const imprintTitle = (lang: Lang): string => (lang === "de" ? "Impressum" : "Legal notice");

/** Pflichtangaben, die noch fehlen — als Hinweis, nicht als Sperre. */
export function missingImprintFields(values: ImprintValues, lang: Lang): string[] {
  const de = lang === "de";
  const missing: string[] = [];
  const p = values.provider;
  if (!clean(p.company)) missing.push(de ? "Name oder Firma" : "name or company");
  if (!clean(p.street) || !clean(p.postalCode) || !clean(p.city)) {
    missing.push(de ? "vollständige Anschrift" : "complete address");
  }
  if (!clean(p.email)) missing.push(de ? "E-Mail-Adresse" : "email address");
  if (values.registered && !clean(values.registerNumber)) {
    missing.push(de ? "Registernummer" : "register number");
  }
  if (values.vatRegistered && !clean(values.vatId)) {
    missing.push(de ? "USt-IdNr." : "VAT ID");
  }
  if (values.editorial && !clean(values.editorName)) {
    missing.push(de ? "redaktionell verantwortliche Person" : "responsible editor");
  }
  return missing;
}

/** Die Abschnitte des Impressums in der Reihenfolge, in der sie ausgegeben werden. */
export function buildImprintSections(values: ImprintValues, lang: Lang): Section[] {
  const de = lang === "de";
  const p = values.provider;
  const form = FORMS[values.legalForm];
  const sections: Section[] = [];

  const identity = addressBlock(p);
  const representation = clean(p.represented)
    ? `${de ? form.deRep : form.enRep}: ${clean(p.represented)}`
    : "";

  sections.push({
    heading: de ? "Angaben gemäß § 5 DDG" : "Information pursuant to section 5 DDG",
    paragraphs: [
      identity,
      `${de ? "Rechtsform" : "Legal form"}: ${de ? form.de : form.en}`,
      representation,
    ],
  });

  const contact = contactBlock(p, lang);
  if (contact) {
    sections.push({ heading: de ? "Kontakt" : "Contact", paragraphs: [contact] });
  }

  if (values.registered) {
    const court = clean(values.registerCourt);
    const number = clean(values.registerNumber);
    sections.push({
      heading: de ? "Registereintrag" : "Register entry",
      paragraphs: [
        [
          court && `${de ? "Registergericht" : "Registering court"}: ${court}`,
          number && `${de ? "Registernummer" : "Register number"}: ${number}`,
        ]
          .filter(Boolean)
          .join("\n"),
      ],
    });
  }

  if (values.vatRegistered) {
    sections.push({
      heading: de
        ? "Umsatzsteuer-Identifikationsnummer"
        : "VAT identification number",
      paragraphs: [
        de
          ? `Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: ${clean(values.vatId)}`
          : `VAT identification number pursuant to section 27 a of the German VAT Act: ${clean(values.vatId)}`,
      ],
    });
  }

  if (values.regulatedProfession) {
    sections.push({
      heading: de ? "Berufsrechtliche Angaben" : "Professional regulations",
      paragraphs: [
        [
          clean(values.professionTitle) &&
            `${de ? "Berufsbezeichnung" : "Professional title"}: ${clean(values.professionTitle)}`,
          clean(values.professionState) &&
            `${de ? "Verliehen in" : "Awarded in"}: ${clean(values.professionState)}`,
          clean(values.chamber) &&
            `${de ? "Zuständige Kammer" : "Competent chamber"}: ${clean(values.chamber)}`,
        ]
          .filter(Boolean)
          .join("\n"),
        clean(values.professionRules) &&
          (de
            ? `Es gelten folgende berufsrechtliche Regelungen: ${clean(values.professionRules)}`
            : `The following professional regulations apply: ${clean(values.professionRules)}`),
        clean(values.professionRulesUrl) &&
          (de
            ? `Einsehbar unter: ${clean(values.professionRulesUrl)}`
            : `Available at: ${clean(values.professionRulesUrl)}`),
      ],
    });
  }

  if (values.hasSupervisoryAuthority) {
    sections.push({
      heading: de ? "Aufsichtsbehörde" : "Supervisory authority",
      paragraphs: [join([values.authorityName, values.authorityUrl], "\n")],
    });
  }

  if (values.hasInsurance) {
    sections.push({
      heading: de ? "Berufshaftpflichtversicherung" : "Professional indemnity insurance",
      paragraphs: [
        [
          clean(values.insurerName) &&
            `${de ? "Versicherer" : "Insurer"}: ${clean(values.insurerName)}`,
          clean(values.insurerAddress),
          clean(values.insuranceScope) &&
            `${de ? "Räumlicher Geltungsbereich" : "Geographical scope"}: ${clean(values.insuranceScope)}`,
        ]
          .filter(Boolean)
          .join("\n"),
      ],
    });
  }

  if (values.editorial) {
    sections.push({
      heading: de
        ? "Redaktionell verantwortlich nach § 18 Abs. 2 MStV"
        : "Editorial responsibility pursuant to section 18 (2) MStV",
      paragraphs: [join([values.editorName, values.editorAddress], "\n")],
    });
  }

  sections.push({
    heading: de ? "Verbraucherstreitbeilegung" : "Consumer dispute resolution",
    paragraphs: [
      values.disputeResolution === "willing"
        ? de
          ? `Wir sind bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen. Zuständig ist: ${clean(values.disputeBody)}`
          : `We are willing to take part in dispute resolution proceedings before a consumer arbitration board. The competent body is: ${clean(values.disputeBody)}`
        : de
          ? "Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."
          : "We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board.",
    ],
  });

  if (values.includeLiability) {
    sections.push({
      heading: de ? "Haftung für Inhalte und Verweise" : "Liability for content and links",
      paragraphs: de
        ? [
            "Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.",
            "Unser Angebot enthält Verweise auf Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Zum Zeitpunkt der Verlinkung waren keine Rechtsverstöße erkennbar. Werden uns Rechtsverstöße bekannt, entfernen wir den jeweiligen Verweis umgehend.",
          ]
        : [
            "As a service provider we are responsible for our own content on these pages under the general laws. We are not, however, obliged to monitor third-party information that we transmit or store, or to investigate circumstances that indicate unlawful activity.",
            "Our pages contain links to third-party websites over whose content we have no control. No infringements were apparent at the time the links were created. Should we become aware of any infringement, we will remove the link without delay.",
          ],
    });
  }

  if (values.includeCopyright) {
    sections.push({
      heading: de ? "Urheberrecht" : "Copyright",
      paragraphs: de
        ? [
            "Die von uns erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen unserer schriftlichen Zustimmung.",
            "Soweit die Inhalte auf dieser Seite nicht von uns erstellt wurden, werden die Urheberrechte Dritter beachtet und entsprechend gekennzeichnet.",
          ]
        : [
            "The content and works created by us on these pages are subject to German copyright law. Reproduction, adaptation, distribution and any kind of exploitation beyond the limits of copyright require our written consent.",
            "Where the content on this page was not created by us, the copyright of third parties is respected and marked accordingly.",
          ],
    });
  }

  return sections;
}
