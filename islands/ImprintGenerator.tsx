import { useMemo, useState } from "react";

import {
  buildImprintSections,
  emptyImprint,
  imprintTitle,
  legalFormLabel,
  missingImprintFields,
  LEGAL_FORMS,
  REGISTERED_FORMS,
  type ImprintValues,
  type LegalForm,
} from "./imprint";
import type { Lang, Provider } from "./shared";
import { Area, Check, Choice, Disclaimer, DocumentOutput, Field, Group, Radios } from "./ui";

/**
 * Impressum-Generator — Formular und Vorschau.
 *
 * Die Insel ist bewusst nur Bedienoberfläche: welche Klausel bei welcher
 * Ankreuzung im Text landet, entscheidet `buildImprintSections` in
 * `imprint.ts`, und genau das wird ohne DOM getestet.
 */

interface Strings {
  provider: string;
  company: string;
  companyHint: string;
  represented: string;
  representedHint: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  contact: string;
  phone: string;
  email: string;
  website: string;
  legalForm: string;
  additions: string;
  registered: string;
  registeredHint: string;
  registerCourt: string;
  registerNumber: string;
  vat: string;
  vatHint: string;
  vatId: string;
  profession: string;
  professionHint: string;
  professionTitle: string;
  chamber: string;
  professionState: string;
  professionRules: string;
  professionRulesUrl: string;
  authority: string;
  authorityHint: string;
  authorityName: string;
  authorityUrl: string;
  insurance: string;
  insurerName: string;
  insurerAddress: string;
  insuranceScope: string;
  editorial: string;
  editorialHint: string;
  editorName: string;
  editorAddress: string;
  dispute: string;
  disputeUnwilling: string;
  disputeWilling: string;
  disputeBody: string;
  clauses: string;
  liability: string;
  copyright: string;
  filename: string;
}

/**
 * Deutsch ist der Default, hier wie in der Shell. Ein Aufrufer ohne `lang`
 * bekommt damit dasselbe Verhalten wie vor dem englischen Baum — und die
 * gesamte deutsche Testreihe ist zugleich der Regressionstest dafür.
 */
const STRINGS = {
  de: {
    provider: "Anbieter",
    company: "Name oder Firma",
    companyHint: "So, wie der Betrieb im Register oder in der Gewerbeanmeldung steht.",
    represented: "Vertretungsberechtigte Person",
    representedHint: "Bei einer GmbH die Geschäftsführung, bei einem Verein der Vorstand.",
    street: "Straße und Hausnummer",
    postalCode: "PLZ",
    city: "Ort",
    country: "Land",
    contact: "Kontakt",
    phone: "Telefon",
    email: "E-Mail",
    website: "Website",
    legalForm: "Rechtsform",
    additions: "Zusätzliche Angaben",
    registered: "Im Handels-, Vereins- oder Partnerschaftsregister eingetragen",
    registeredHint: "Steht auf dem Registerauszug.",
    registerCourt: "Registergericht",
    registerNumber: "Registernummer",
    vat: "Umsatzsteuer-Identifikationsnummer vorhanden",
    vatHint: "Nicht die Steuernummer des Finanzamts — die gehört nicht ins Impressum.",
    vatId: "USt-IdNr.",
    profession: "Reglementierter Beruf",
    professionHint: "Etwa Handwerk mit Meisterpflicht, Heilberufe, Rechts- oder Steuerberatung.",
    professionTitle: "Berufsbezeichnung",
    chamber: "Zuständige Kammer",
    professionState: "Verliehen in",
    professionRules: "Berufsrechtliche Regelungen",
    professionRulesUrl: "Fundstelle im Netz",
    authority: "Zuständige Aufsichtsbehörde angeben",
    authorityHint: "Nötig bei erlaubnispflichtigen Tätigkeiten, etwa Bewachung oder Vermittlung.",
    authorityName: "Aufsichtsbehörde",
    authorityUrl: "Website der Behörde",
    insurance: "Berufshaftpflichtversicherung angeben",
    insurerName: "Versicherer",
    insurerAddress: "Anschrift des Versicherers",
    insuranceScope: "Räumlicher Geltungsbereich",
    editorial: "Journalistisch-redaktionelle Inhalte (§ 18 Abs. 2 MStV)",
    editorialHint: "Etwa ein Blog oder ein Magazin auf der eigenen Seite.",
    editorName: "Redaktionell verantwortliche Person",
    editorAddress: "Anschrift der verantwortlichen Person",
    dispute: "Verbraucherstreitbeilegung",
    disputeUnwilling: "Wir nehmen an keinem Schlichtungsverfahren teil",
    disputeWilling: "Wir nehmen an einem Schlichtungsverfahren teil",
    disputeBody: "Zuständige Verbraucherschlichtungsstelle",
    clauses: "Freiwillige Klauseln",
    liability: "Haftung für Inhalte und Verweise anhängen",
    copyright: "Urheberrechtshinweis anhängen",
    filename: "impressum",
  },
  en: {
    provider: "Provider",
    company: "Name or company",
    companyHint: "As the business appears in the register or the trade registration.",
    represented: "Authorised representative",
    representedHint: "For a GmbH the managing director, for an association the board.",
    street: "Street and number",
    postalCode: "Postcode",
    city: "Town",
    country: "Country",
    contact: "Contact",
    phone: "Phone",
    email: "Email",
    website: "Website",
    legalForm: "Legal form",
    additions: "Additional details",
    registered: "Entered in the commercial, association or partnership register",
    registeredHint: "It is on the register extract.",
    registerCourt: "Registering court",
    registerNumber: "Register number",
    vat: "VAT identification number held",
    vatHint: "Not the tax number issued by the tax office — that does not belong here.",
    vatId: "VAT ID",
    profession: "Regulated profession",
    professionHint: "For example regulated trades, health professions, legal or tax advice.",
    professionTitle: "Professional title",
    chamber: "Competent chamber",
    professionState: "Awarded in",
    professionRules: "Professional regulations",
    professionRulesUrl: "Where they can be read",
    authority: "State the supervisory authority",
    authorityHint: "Required for licensed activities such as security services or brokerage.",
    authorityName: "Supervisory authority",
    authorityUrl: "Website of the authority",
    insurance: "State the professional indemnity insurance",
    insurerName: "Insurer",
    insurerAddress: "Address of the insurer",
    insuranceScope: "Geographical scope",
    editorial: "Journalistic and editorial content (section 18 (2) MStV)",
    editorialHint: "For example a blog or a magazine on your own site.",
    editorName: "Responsible editor",
    editorAddress: "Address of the responsible editor",
    dispute: "Consumer dispute resolution",
    disputeUnwilling: "We do not take part in arbitration proceedings",
    disputeWilling: "We do take part in arbitration proceedings",
    disputeBody: "Competent consumer arbitration board",
    clauses: "Optional clauses",
    liability: "Append liability for content and links",
    copyright: "Append a copyright notice",
    filename: "legal-notice",
  },
} satisfies Record<Lang, Strings>;

interface Props {
  lang?: Lang;
}

export default function ImprintGenerator({ lang = "de" }: Props) {
  const t = STRINGS[lang];
  const [values, setValues] = useState<ImprintValues>(emptyImprint);

  const set = <K extends keyof ImprintValues>(key: K, value: ImprintValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const setProvider = <K extends keyof Provider>(key: K, value: Provider[K]) =>
    setValues((prev) => ({ ...prev, provider: { ...prev.provider, [key]: value } }));

  /**
   * Die Registerangabe wird beim Wechsel der Rechtsform vorbelegt, nicht
   * erzwungen: eine GmbH ohne Registereintrag gibt es nicht, aber die
   * Ankreuzung bleibt bedienbar, weil die Kombinationen zu vielfältig sind, um
   * sie einem Nutzer zu verbieten.
   */
  const setLegalForm = (form: LegalForm) =>
    setValues((prev) => ({ ...prev, legalForm: form, registered: REGISTERED_FORMS.includes(form) }));

  const sections = useMemo(() => buildImprintSections(values, lang), [values, lang]);
  const missing = useMemo(() => missingImprintFields(values, lang), [values, lang]);

  return (
    <div className="imprint-tool space-y-6">
      <Disclaimer lang={lang} />

      <Group title={t.provider}>
        <Choice
          label={t.legalForm}
          value={values.legalForm}
          onChange={setLegalForm}
          options={LEGAL_FORMS.map((form) => ({ value: form, label: legalFormLabel(form, lang) }))}
        />
        <Field
          label={t.company}
          hint={t.companyHint}
          required
          value={values.provider.company}
          onChange={(value) => setProvider("company", value)}
        />
        <Field
          label={t.represented}
          hint={t.representedHint}
          value={values.provider.represented}
          onChange={(value) => setProvider("represented", value)}
        />
        <Field
          label={t.street}
          required
          value={values.provider.street}
          onChange={(value) => setProvider("street", value)}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field
            label={t.postalCode}
            required
            value={values.provider.postalCode}
            onChange={(value) => setProvider("postalCode", value)}
          />
          <Field
            label={t.city}
            required
            value={values.provider.city}
            onChange={(value) => setProvider("city", value)}
          />
          <Field
            label={t.country}
            value={values.provider.country}
            onChange={(value) => setProvider("country", value)}
          />
        </div>
      </Group>

      <Group title={t.contact}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field
            label={t.phone}
            type="tel"
            value={values.provider.phone}
            onChange={(value) => setProvider("phone", value)}
          />
          <Field
            label={t.email}
            type="email"
            required
            value={values.provider.email}
            onChange={(value) => setProvider("email", value)}
          />
          <Field
            label={t.website}
            type="url"
            value={values.provider.website}
            onChange={(value) => setProvider("website", value)}
          />
        </div>
      </Group>

      <Group title={t.additions}>
        <Check
          label={t.registered}
          hint={t.registeredHint}
          checked={values.registered}
          onChange={(checked) => set("registered", checked)}
        />
        {values.registered && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={t.registerCourt}
              value={values.registerCourt}
              onChange={(value) => set("registerCourt", value)}
            />
            <Field
              label={t.registerNumber}
              value={values.registerNumber}
              onChange={(value) => set("registerNumber", value)}
            />
          </div>
        )}

        <Check
          label={t.vat}
          hint={t.vatHint}
          checked={values.vatRegistered}
          onChange={(checked) => set("vatRegistered", checked)}
        />
        {values.vatRegistered && (
          <Field label={t.vatId} value={values.vatId} onChange={(value) => set("vatId", value)} />
        )}

        <Check
          label={t.profession}
          hint={t.professionHint}
          checked={values.regulatedProfession}
          onChange={(checked) => set("regulatedProfession", checked)}
        />
        {values.regulatedProfession && (
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field
                label={t.professionTitle}
                value={values.professionTitle}
                onChange={(value) => set("professionTitle", value)}
              />
              <Field
                label={t.chamber}
                value={values.chamber}
                onChange={(value) => set("chamber", value)}
              />
              <Field
                label={t.professionState}
                value={values.professionState}
                onChange={(value) => set("professionState", value)}
              />
            </div>
            <Field
              label={t.professionRules}
              value={values.professionRules}
              onChange={(value) => set("professionRules", value)}
            />
            <Field
              label={t.professionRulesUrl}
              type="url"
              value={values.professionRulesUrl}
              onChange={(value) => set("professionRulesUrl", value)}
            />
          </div>
        )}

        <Check
          label={t.authority}
          hint={t.authorityHint}
          checked={values.hasSupervisoryAuthority}
          onChange={(checked) => set("hasSupervisoryAuthority", checked)}
        />
        {values.hasSupervisoryAuthority && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={t.authorityName}
              value={values.authorityName}
              onChange={(value) => set("authorityName", value)}
            />
            <Field
              label={t.authorityUrl}
              type="url"
              value={values.authorityUrl}
              onChange={(value) => set("authorityUrl", value)}
            />
          </div>
        )}

        <Check
          label={t.insurance}
          checked={values.hasInsurance}
          onChange={(checked) => set("hasInsurance", checked)}
        />
        {values.hasInsurance && (
          <div className="grid gap-3">
            <Field
              label={t.insurerName}
              value={values.insurerName}
              onChange={(value) => set("insurerName", value)}
            />
            <Field
              label={t.insurerAddress}
              value={values.insurerAddress}
              onChange={(value) => set("insurerAddress", value)}
            />
            <Field
              label={t.insuranceScope}
              value={values.insuranceScope}
              onChange={(value) => set("insuranceScope", value)}
            />
          </div>
        )}

        <Check
          label={t.editorial}
          hint={t.editorialHint}
          checked={values.editorial}
          onChange={(checked) => set("editorial", checked)}
        />
        {values.editorial && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={t.editorName}
              value={values.editorName}
              onChange={(value) => set("editorName", value)}
            />
            <Field
              label={t.editorAddress}
              value={values.editorAddress}
              onChange={(value) => set("editorAddress", value)}
            />
          </div>
        )}
      </Group>

      <Group title={t.dispute}>
        <Radios
          legend={t.dispute}
          name="imprint-dispute"
          value={values.disputeResolution}
          onChange={(value) => set("disputeResolution", value)}
          options={[
            { value: "unwilling", label: t.disputeUnwilling },
            { value: "willing", label: t.disputeWilling },
          ]}
        />
        {values.disputeResolution === "willing" && (
          <Area
            label={t.disputeBody}
            rows={3}
            value={values.disputeBody}
            onChange={(value) => set("disputeBody", value)}
          />
        )}
      </Group>

      <Group title={t.clauses}>
        <Check
          label={t.liability}
          checked={values.includeLiability}
          onChange={(checked) => set("includeLiability", checked)}
        />
        <Check
          label={t.copyright}
          checked={values.includeCopyright}
          onChange={(checked) => set("includeCopyright", checked)}
        />
      </Group>

      <DocumentOutput
        lang={lang}
        title={imprintTitle(lang)}
        sections={sections}
        missing={missing}
        filenameBase={t.filename}
      />
    </div>
  );
}
