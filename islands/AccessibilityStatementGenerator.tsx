import { useMemo, useState } from "react";

import {
  accessibilityTitle,
  buildAccessibilitySections,
  emptyAccessibility,
  missingAccessibilityFields,
  standardLabel,
  STANDARD_ORDER,
  type AccessibilityValues,
  type Assessment,
  type Conformity,
  type Reason,
  type Regime,
  type Standard,
} from "./accessibility";
import type { Lang, Provider } from "./shared";
import { Area, Choice, Disclaimer, DocumentOutput, Field, Group, Radios } from "./ui";

/**
 * Barrierefreiheitserklärung-Generator — Formular und Vorschau.
 *
 * Die Wahl des Regimes ganz oben ist der inhaltliche Kern: eine öffentliche
 * Stelle und ein Unternehmen geben nicht dasselbe Dokument ab, auch wenn die
 * beiden Texte einander sehr ähnlich sehen. Was sich unterscheidet, steht in
 * `accessibility.ts`; hier wird nur ausgewählt.
 */

interface Strings {
  regime: string;
  regimeBfsg: string;
  regimeBfsgHint: string;
  regimePublic: string;
  regimePublicHint: string;
  provider: string;
  company: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  serviceName: string;
  serviceNameHint: string;
  serviceUrl: string;
  status: string;
  conformity: string;
  conformityFull: string;
  conformityPartial: string;
  conformityNone: string;
  standard: string;
  nonAccessible: string;
  nonAccessibleHint: string;
  reason: string;
  reasonNone: string;
  reasonBurden: string;
  reasonExempt: string;
  reasonInProgress: string;
  reasonDetails: string;
  preparation: string;
  createdOn: string;
  reviewedOn: string;
  assessment: string;
  assessmentSelf: string;
  assessmentExternal: string;
  assessor: string;
  feedback: string;
  feedbackContact: string;
  feedbackContactHint: string;
  feedbackDeadline: string;
  feedbackDeadlineHint: string;
  enforcement: string;
  enforcementBody: string;
  enforcementBodyHint: string;
  marketSurveillance: string;
  marketSurveillanceHint: string;
  filename: string;
}

/** Deutsch ist der Default, hier wie in der Shell. */
const STRINGS = {
  de: {
    regime: "Wer gibt die Erklärung ab?",
    regimeBfsg: "Unternehmen (BFSG)",
    regimeBfsgHint:
      "Gilt seit dem 28. Juni 2025 unter anderem für Onlineshops und andere Dienstleistungen an Verbraucher.",
    regimePublic: "Öffentliche Stelle (BITV 2.0, § 12b BGG)",
    regimePublicHint: "Behörden, Kommunen und andere Träger öffentlicher Verwaltung.",
    provider: "Anbieter",
    company: "Name oder Firma",
    street: "Straße und Hausnummer",
    postalCode: "PLZ",
    city: "Ort",
    country: "Land",
    phone: "Telefon",
    email: "E-Mail",
    serviceName: "Bezeichnung des Angebots",
    serviceNameHint: "Etwa „die Website www.beispiel.de“ oder „der Onlineshop“.",
    serviceUrl: "Adresse",
    status: "Stand der Barrierefreiheit",
    conformity: "Vereinbarkeit",
    conformityFull: "Vollständig vereinbar",
    conformityPartial: "Teilweise vereinbar",
    conformityNone: "Nicht vereinbar",
    standard: "Angewandter Standard",
    nonAccessible: "Nicht barrierefreie Inhalte",
    nonAccessibleHint: "Konkret benennen — pauschale Sätze helfen niemandem weiter.",
    reason: "Begründung",
    reasonNone: "Keine Begründung angeben",
    reasonBurden: "Unverhältnismäßige Belastung",
    reasonExempt: "Außerhalb des Anwendungsbereichs",
    reasonInProgress: "Wird derzeit umgesetzt",
    reasonDetails: "Erläuterung",
    preparation: "Erstellung",
    createdOn: "Erstellt am",
    reviewedOn: "Zuletzt überprüft am",
    assessment: "Bewertungsverfahren",
    assessmentSelf: "Selbstbewertung",
    assessmentExternal: "Externe Prüfung",
    assessor: "Prüfstelle",
    feedback: "Rückmeldung",
    feedbackContact: "Kontaktweg für Rückmeldungen",
    feedbackContactHint: "E-Mail-Adresse, Formular oder Telefonnummer — erreichbar und benannt.",
    feedbackDeadline: "Antwortfrist",
    feedbackDeadlineHint: "Leer lassen für „einem Monat“.",
    enforcement: "Durchsetzung",
    enforcementBody: "Schlichtungsstelle",
    enforcementBodyHint: "Anschrift der zuständigen Schlichtungsstelle nach § 16 BGG.",
    marketSurveillance: "Marktüberwachungsstelle",
    marketSurveillanceHint: "Anschrift der zuständigen Marktüberwachungsstelle der Länder.",
    filename: "barrierefreiheitserklaerung",
  },
  en: {
    regime: "Who is issuing the statement?",
    regimeBfsg: "Business (BFSG)",
    regimeBfsgHint:
      "Applies since 28 June 2025 to online shops and other services offered to consumers, among others.",
    regimePublic: "Public body (BITV 2.0, section 12b BGG)",
    regimePublicHint: "Authorities, municipalities and other public administration bodies.",
    provider: "Provider",
    company: "Name or company",
    street: "Street and number",
    postalCode: "Postcode",
    city: "Town",
    country: "Country",
    phone: "Phone",
    email: "Email",
    serviceName: "Name of the service",
    serviceNameHint: "For example “the website www.example.com” or “the online shop”.",
    serviceUrl: "Address",
    status: "State of accessibility",
    conformity: "Compliance",
    conformityFull: "Fully compliant",
    conformityPartial: "Partially compliant",
    conformityNone: "Not compliant",
    standard: "Standard applied",
    nonAccessible: "Non-accessible content",
    nonAccessibleHint: "Name it concretely — blanket sentences help nobody.",
    reason: "Reasoning",
    reasonNone: "Give no reason",
    reasonBurden: "Disproportionate burden",
    reasonExempt: "Outside the scope",
    reasonInProgress: "Being implemented",
    reasonDetails: "Explanation",
    preparation: "Preparation",
    createdOn: "Prepared on",
    reviewedOn: "Last reviewed on",
    assessment: "Assessment method",
    assessmentSelf: "Self-assessment",
    assessmentExternal: "External assessment",
    assessor: "Assessing body",
    feedback: "Feedback",
    feedbackContact: "Contact channel for feedback",
    feedbackContactHint: "An email address, a form or a phone number — reachable and named.",
    feedbackDeadline: "Response time",
    feedbackDeadlineHint: "Leave empty for “one month”.",
    enforcement: "Enforcement",
    enforcementBody: "Conciliation body",
    enforcementBodyHint: "Address of the competent conciliation body under section 16 BGG.",
    marketSurveillance: "Market surveillance authority",
    marketSurveillanceHint: "Address of the competent market surveillance authority of the federal states.",
    filename: "accessibility-statement",
  },
} satisfies Record<Lang, Strings>;

interface Props {
  lang?: Lang;
}

export default function AccessibilityStatementGenerator({ lang = "de" }: Props) {
  const t = STRINGS[lang];
  const [values, setValues] = useState<AccessibilityValues>(emptyAccessibility);

  const set = <K extends keyof AccessibilityValues>(key: K, value: AccessibilityValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const setProvider = <K extends keyof Provider>(key: K, value: Provider[K]) =>
    setValues((prev) => ({ ...prev, provider: { ...prev.provider, [key]: value } }));

  const sections = useMemo(() => buildAccessibilitySections(values, lang), [values, lang]);
  const missing = useMemo(() => missingAccessibilityFields(values, lang), [values, lang]);

  return (
    <div className="accessibility-tool space-y-6">
      <Disclaimer lang={lang} />

      <Group title={t.regime}>
        <Radios<Regime>
          legend={t.regime}
          name="a11y-regime"
          value={values.regime}
          onChange={(value) => set("regime", value)}
          options={[
            { value: "bfsg", label: t.regimeBfsg, hint: t.regimeBfsgHint },
            { value: "public", label: t.regimePublic, hint: t.regimePublicHint },
          ]}
        />
      </Group>

      <Group title={t.provider}>
        <Field
          label={t.company}
          required
          value={values.provider.company}
          onChange={(value) => setProvider("company", value)}
        />
        <Field
          label={t.street}
          value={values.provider.street}
          onChange={(value) => setProvider("street", value)}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field
            label={t.postalCode}
            value={values.provider.postalCode}
            onChange={(value) => setProvider("postalCode", value)}
          />
          <Field
            label={t.city}
            value={values.provider.city}
            onChange={(value) => setProvider("city", value)}
          />
          <Field
            label={t.country}
            value={values.provider.country}
            onChange={(value) => setProvider("country", value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label={t.phone}
            type="tel"
            value={values.provider.phone}
            onChange={(value) => setProvider("phone", value)}
          />
          <Field
            label={t.email}
            type="email"
            value={values.provider.email}
            onChange={(value) => setProvider("email", value)}
          />
        </div>
        <Field
          label={t.serviceName}
          hint={t.serviceNameHint}
          required
          value={values.serviceName}
          onChange={(value) => set("serviceName", value)}
        />
        <Field
          label={t.serviceUrl}
          type="url"
          value={values.serviceUrl}
          onChange={(value) => set("serviceUrl", value)}
        />
      </Group>

      <Group title={t.status}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Choice<Conformity>
            label={t.conformity}
            value={values.conformity}
            onChange={(value) => set("conformity", value)}
            options={[
              { value: "full", label: t.conformityFull },
              { value: "partial", label: t.conformityPartial },
              { value: "none", label: t.conformityNone },
            ]}
          />
          <Choice<Standard>
            label={t.standard}
            value={values.standard}
            onChange={(value) => set("standard", value)}
            options={STANDARD_ORDER.map((standard) => ({
              value: standard,
              label: standardLabel(standard),
            }))}
          />
        </div>

        {values.conformity !== "full" && (
          <Area
            label={t.nonAccessible}
            hint={t.nonAccessibleHint}
            rows={5}
            value={values.nonAccessible}
            onChange={(value) => set("nonAccessible", value)}
          />
        )}

        <Choice<Reason>
          label={t.reason}
          value={values.reason}
          onChange={(value) => set("reason", value)}
          options={[
            { value: "none", label: t.reasonNone },
            { value: "burden", label: t.reasonBurden },
            { value: "exempt", label: t.reasonExempt },
            { value: "inprogress", label: t.reasonInProgress },
          ]}
        />
        {values.reason !== "none" && (
          <Area
            label={t.reasonDetails}
            rows={3}
            value={values.reasonDetails}
            onChange={(value) => set("reasonDetails", value)}
          />
        )}
      </Group>

      <Group title={t.preparation}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label={t.createdOn}
            type="date"
            required
            value={values.createdOn}
            onChange={(value) => set("createdOn", value)}
          />
          <Field
            label={t.reviewedOn}
            type="date"
            value={values.reviewedOn}
            onChange={(value) => set("reviewedOn", value)}
          />
        </div>
        <Choice<Assessment>
          label={t.assessment}
          value={values.assessment}
          onChange={(value) => set("assessment", value)}
          options={[
            { value: "self", label: t.assessmentSelf },
            { value: "external", label: t.assessmentExternal },
          ]}
        />
        {values.assessment === "external" && (
          <Field label={t.assessor} value={values.assessor} onChange={(value) => set("assessor", value)} />
        )}
      </Group>

      <Group title={t.feedback}>
        <Field
          label={t.feedbackContact}
          hint={t.feedbackContactHint}
          required
          value={values.feedbackContact}
          onChange={(value) => set("feedbackContact", value)}
        />
        <Field
          label={t.feedbackDeadline}
          hint={t.feedbackDeadlineHint}
          value={values.feedbackDeadline}
          onChange={(value) => set("feedbackDeadline", value)}
        />
      </Group>

      <Group title={t.enforcement}>
        {values.regime === "public" ? (
          <Area
            label={t.enforcementBody}
            hint={t.enforcementBodyHint}
            rows={3}
            value={values.enforcementBody}
            onChange={(value) => set("enforcementBody", value)}
          />
        ) : (
          <Area
            label={t.marketSurveillance}
            hint={t.marketSurveillanceHint}
            rows={3}
            value={values.marketSurveillance}
            onChange={(value) => set("marketSurveillance", value)}
          />
        )}
      </Group>

      <DocumentOutput
        lang={lang}
        title={accessibilityTitle(lang)}
        sections={sections}
        missing={missing}
        filenameBase={t.filename}
      />
    </div>
  );
}
