import {
  addressBlock,
  clean,
  contactBlock,
  emptyProvider,
  type Lang,
  type Provider,
  type Section,
} from "./shared";

/**
 * Der Textaufbau des Barrierefreiheitserklärung-Generators.
 *
 * **Zwei Erklärungen, ein Formular.** Eine öffentliche Stelle erklärt nach
 * § 12b BGG und der BITV 2.0 und verweist am Ende auf die Schlichtungsstelle
 * nach § 16 BGG. Ein Unternehmen erklärt nach dem BFSG und verweist auf die
 * Marktüberwachungsstelle der Länder. Beide Texte sehen einander sehr ähnlich,
 * und genau darum ist der vertauschte Verweis der Fehler, der hier am
 * wahrscheinlichsten ist und am wenigsten auffällt — er steht am Ende eines
 * plausibel klingenden Dokuments. Ein Test hält die Zuordnung fest.
 */

export type Regime = "bfsg" | "public";
export type Conformity = "full" | "partial" | "none";
export type Assessment = "self" | "external";
export type Standard = "en301549" | "wcag21" | "wcag22";
export type Reason = "none" | "burden" | "exempt" | "inprogress";

export interface AccessibilityValues {
  provider: Provider;
  regime: Regime;
  serviceName: string;
  serviceUrl: string;
  conformity: Conformity;
  standard: Standard;
  createdOn: string;
  reviewedOn: string;
  assessment: Assessment;
  assessor: string;
  nonAccessible: string;
  reason: Reason;
  reasonDetails: string;
  feedbackContact: string;
  feedbackDeadline: string;
  enforcementBody: string;
  marketSurveillance: string;
}

export const emptyAccessibility: AccessibilityValues = {
  provider: { ...emptyProvider, country: "Deutschland" },
  regime: "bfsg",
  serviceName: "",
  serviceUrl: "",
  conformity: "partial",
  standard: "en301549",
  createdOn: "",
  reviewedOn: "",
  assessment: "self",
  assessor: "",
  nonAccessible: "",
  reason: "none",
  reasonDetails: "",
  feedbackContact: "",
  feedbackDeadline: "",
  enforcementBody: "",
  marketSurveillance: "",
};

const STANDARDS: Record<Standard, string> = {
  en301549: "EN 301 549",
  wcag21: "WCAG 2.1 (Konformitätsstufe AA)",
  wcag22: "WCAG 2.2 (Konformitätsstufe AA)",
};

export const STANDARD_ORDER: Standard[] = ["en301549", "wcag21", "wcag22"];

export const standardLabel = (standard: Standard): string => STANDARDS[standard];

export const accessibilityTitle = (lang: Lang): string =>
  lang === "de" ? "Erklärung zur Barrierefreiheit" : "Accessibility statement";

/** Angaben, ohne die die Erklärung ihren Zweck nicht erfüllt. */
export function missingAccessibilityFields(values: AccessibilityValues, lang: Lang): string[] {
  const de = lang === "de";
  const missing: string[] = [];
  if (!clean(values.provider.company)) missing.push(de ? "Name des Anbieters" : "name of the provider");
  if (!clean(values.serviceName)) missing.push(de ? "Bezeichnung des Angebots" : "name of the service");
  if (!clean(values.createdOn)) missing.push(de ? "Datum der Erstellung" : "date of preparation");
  if (!clean(values.feedbackContact)) {
    missing.push(de ? "Kontaktweg für Rückmeldungen" : "contact channel for feedback");
  }
  if (values.conformity !== "full" && !clean(values.nonAccessible)) {
    missing.push(de ? "Beschreibung der nicht barrierefreien Inhalte" : "description of the non-accessible content");
  }
  if (values.assessment === "external" && !clean(values.assessor)) {
    missing.push(de ? "Name der Prüfstelle" : "name of the assessing body");
  }
  return missing;
}

/** Die Abschnitte der Erklärung, abhängig vom gewählten Regime. */
export function buildAccessibilitySections(values: AccessibilityValues, lang: Lang): Section[] {
  const de = lang === "de";
  const isPublic = values.regime === "public";
  const service = clean(values.serviceName) || (de ? "dieses Angebot" : "this service");
  const url = clean(values.serviceUrl);
  const standard = standardLabel(values.standard);
  const sections: Section[] = [];

  sections.push({
    heading: de ? "Geltungsbereich" : "Scope",
    paragraphs: [
      isPublic
        ? de
          ? `Diese Erklärung zur Barrierefreiheit gilt für ${service}${url ? ` (${url})` : ""}. Sie wird nach § 12b des Behindertengleichstellungsgesetzes (BGG) in Verbindung mit der Barrierefreie-Informationstechnik-Verordnung (BITV 2.0) abgegeben.`
          : `This accessibility statement applies to ${service}${url ? ` (${url})` : ""}. It is issued pursuant to section 12b of the German Disability Equality Act (BGG) in conjunction with the Barrier-Free Information Technology Ordinance (BITV 2.0).`
        : de
          ? `Diese Erklärung zur Barrierefreiheit gilt für ${service}${url ? ` (${url})` : ""}. Sie wird nach dem Barrierefreiheitsstärkungsgesetz (BFSG) und der dazugehörigen Verordnung abgegeben.`
          : `This accessibility statement applies to ${service}${url ? ` (${url})` : ""}. It is issued pursuant to the German Accessibility Strengthening Act (BFSG) and its implementing ordinance.`,
      addressBlock(values.provider),
      contactBlock(values.provider, lang),
    ],
  });

  const conformitySentence =
    values.conformity === "full"
      ? de
        ? `Dieses Angebot ist mit ${standard} vollständig vereinbar.`
        : `This service is fully compliant with ${standard}.`
      : values.conformity === "partial"
        ? de
          ? `Dieses Angebot ist mit ${standard} teilweise vereinbar. Die nachstehend aufgeführten Inhalte sind aus den genannten Gründen noch nicht barrierefrei.`
          : `This service is partially compliant with ${standard}. The content listed below is not yet accessible, for the reasons given.`
        : de
          ? `Dieses Angebot ist mit ${standard} nicht vereinbar. Die nachstehend aufgeführten Inhalte sind nicht barrierefrei.`
          : `This service is not compliant with ${standard}. The content listed below is not accessible.`;

  sections.push({
    heading: de ? "Stand der Vereinbarkeit" : "Compliance status",
    paragraphs: [conformitySentence],
  });

  if (values.conformity !== "full") {
    sections.push({
      heading: de ? "Nicht barrierefreie Inhalte" : "Non-accessible content",
      paragraphs: [clean(values.nonAccessible)],
    });
  }

  if (values.reason !== "none") {
    const details = clean(values.reasonDetails);
    const reasonText =
      values.reason === "burden"
        ? de
          ? "Die Herstellung der Barrierefreiheit für die genannten Inhalte würde uns derzeit unverhältnismäßig belasten. Wir prüfen die Einschätzung regelmäßig neu."
          : "Making the content listed above accessible would currently place a disproportionate burden on us. We review that assessment regularly."
        : values.reason === "exempt"
          ? de
            ? "Die genannten Inhalte fallen nicht in den Anwendungsbereich der einschlägigen Vorschriften."
            : "The content listed above falls outside the scope of the applicable rules."
          : de
            ? "Wir arbeiten daran, die genannten Inhalte barrierefrei zu gestalten."
            : "We are working on making the content listed above accessible.";
    sections.push({
      heading: de ? "Begründung" : "Reasoning",
      paragraphs: [reasonText, details],
    });
  }

  const created = clean(values.createdOn);
  const reviewed = clean(values.reviewedOn);
  const assessor = clean(values.assessor);
  sections.push({
    heading: de ? "Erstellung dieser Erklärung" : "Preparation of this statement",
    paragraphs: [
      de
        ? `Diese Erklärung wurde am ${created || "…"} erstellt${reviewed ? ` und zuletzt am ${reviewed} überprüft` : ""}.`
        : `This statement was prepared on ${created || "…"}${reviewed ? ` and last reviewed on ${reviewed}` : ""}.`,
      values.assessment === "external"
        ? de
          ? `Grundlage ist eine externe Prüfung durch ${assessor || "eine unabhängige Prüfstelle"}.`
          : `It is based on an external assessment carried out by ${assessor || "an independent assessing body"}.`
        : de
          ? "Grundlage ist eine Selbstbewertung anhand der oben genannten Anforderungen."
          : "It is based on a self-assessment against the requirements named above.",
    ],
  });

  const deadline =
    clean(values.feedbackDeadline) || (de ? "einem Monat" : "one month");
  sections.push({
    heading: de ? "Rückmeldung und Kontakt" : "Feedback and contact",
    paragraphs: [
      de
        ? `Sind Ihnen Mängel beim barrierefreien Zugang aufgefallen, oder benötigen Sie einen Inhalt in einer zugänglichen Form? Dann melden Sie sich bei uns: ${clean(values.feedbackContact)}`
        : `Have you noticed shortcomings in the accessible access, or do you need content in an accessible form? Please get in touch: ${clean(values.feedbackContact)}`,
      de
        ? `Wir antworten innerhalb von ${deadline} und teilen Ihnen mit, wie wir mit Ihrem Hinweis umgehen.`
        : `We will respond within ${deadline} and tell you how we intend to act on your feedback.`,
    ],
  });

  if (isPublic) {
    const body = clean(values.enforcementBody);
    sections.push({
      heading: de ? "Durchsetzungsverfahren" : "Enforcement procedure",
      paragraphs: [
        de
          ? "Konnten wir Ihre Rückmeldung nicht zu Ihrer Zufriedenheit beantworten, können Sie sich an die Schlichtungsstelle nach § 16 BGG wenden. Das Schlichtungsverfahren ist für Sie kostenfrei; eine rechtliche Vertretung ist nicht erforderlich."
          : "If we could not answer your feedback to your satisfaction, you can turn to the conciliation body under section 16 BGG. The conciliation procedure is free of charge for you, and legal representation is not required.",
        body,
      ],
    });
  } else {
    const body = clean(values.marketSurveillance);
    sections.push({
      heading: de ? "Marktüberwachung" : "Market surveillance",
      paragraphs: [
        de
          ? "Konnten wir Ihre Rückmeldung nicht zu Ihrer Zufriedenheit beantworten, können Sie sich an die Marktüberwachungsstelle der Länder für die Barrierefreiheit von Produkten und Dienstleistungen wenden. Sie prüft, ob die Anforderungen des BFSG eingehalten werden."
          : "If we could not answer your feedback to your satisfaction, you can turn to the market surveillance authority of the federal states for the accessibility of products and services. It examines whether the requirements of the BFSG are being met.",
        body,
      ],
    });
  }

  return sections;
}
