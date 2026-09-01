import { useMemo, useState } from "react";

import {
  buildPrivacySections,
  emptyPrivacy,
  missingPrivacyFields,
  privacyTitle,
  type AnalyticsTool,
  type FontsMode,
  type MapsProvider,
  type PrivacyValues,
} from "./privacy";
import type { Lang, Provider } from "./shared";
import { Area, Check, Choice, Disclaimer, DocumentOutput, Field, Group } from "./ui";

/**
 * Datenschutzerklärung-Generator — Formular und Vorschau.
 *
 * Ein Baukasten: jede Ankreuzung schaltet genau einen Abschnitt zu. Der Text
 * selbst entsteht in `privacy.ts` und wird dort ohne DOM geprüft — auch in
 * der Gegenrichtung, denn ein Abschnitt, der nach dem Abwählen stehen bleibt,
 * ist der Fehler, den man in einem solchen Werkzeug am längsten nicht bemerkt.
 */

interface Strings {
  controller: string;
  company: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  dpo: string;
  dpoHint: string;
  dpoName: string;
  dpoContact: string;
  supervisoryAuthority: string;
  supervisoryHint: string;
  basics: string;
  hosting: string;
  hostingProvider: string;
  hostingCountry: string;
  serverLogs: string;
  serverLogsHint: string;
  communication: string;
  contactForm: string;
  emailContact: string;
  phoneContact: string;
  tracking: string;
  essentialCookies: string;
  essentialHint: string;
  consentCookies: string;
  consentTool: string;
  analytics: string;
  analyticsTool: string;
  analyticsMatomo: string;
  analyticsGa4: string;
  analyticsOther: string;
  analyticsName: string;
  embedded: string;
  maps: string;
  mapsProvider: string;
  mapsGoogle: string;
  mapsOsm: string;
  mapsOther: string;
  mapsName: string;
  webfonts: string;
  fontsMode: string;
  fontsLocal: string;
  fontsGoogle: string;
  videos: string;
  videoProvider: string;
  cdn: string;
  cdnProvider: string;
  further: string;
  newsletter: string;
  newsletterProvider: string;
  socialProfiles: string;
  socialNetworks: string;
  socialPlugins: string;
  socialPluginsHint: string;
  shop: string;
  paymentProviders: string;
  booking: string;
  bookingProvider: string;
  liveChat: string;
  chatProvider: string;
  applications: string;
  thirdCountry: string;
  thirdCountryHint: string;
  thirdCountryDetails: string;
  retention: string;
  retentionHint: string;
  filename: string;
}

/** Deutsch ist der Default, hier wie in der Shell. */
const STRINGS = {
  de: {
    controller: "Verantwortlicher",
    company: "Name oder Firma",
    street: "Straße und Hausnummer",
    postalCode: "PLZ",
    city: "Ort",
    country: "Land",
    phone: "Telefon",
    email: "E-Mail",
    website: "Website",
    dpo: "Datenschutzbeauftragte Person benannt",
    dpoHint: "Pflicht etwa bei umfangreicher Verarbeitung besonderer Datenkategorien.",
    dpoName: "Name",
    dpoContact: "Kontakt",
    supervisoryAuthority: "Zuständige Aufsichtsbehörde",
    supervisoryHint: "Die Behörde des Bundeslands, in dem Ihr Betrieb sitzt.",
    basics: "Betrieb der Website",
    hosting: "Website wird extern gehostet",
    hostingProvider: "Hosting-Anbieter",
    hostingCountry: "Standort der Server",
    serverLogs: "Server-Logdateien werden geführt",
    serverLogsHint: "Das ist bei nahezu jedem Hoster der Fall.",
    communication: "Kontaktwege",
    contactForm: "Kontaktformular",
    emailContact: "Kontakt per E-Mail",
    phoneContact: "Kontakt per Telefon",
    tracking: "Cookies und Auswertung",
    essentialCookies: "Technisch notwendige Cookies",
    essentialHint: "Etwa für eine Sitzung oder den Schutz eines Formulars.",
    consentCookies: "Einwilligungspflichtige Cookies",
    consentTool: "Eingesetztes Einwilligungswerkzeug",
    analytics: "Webanalyse",
    analyticsTool: "Analysewerkzeug",
    analyticsMatomo: "Matomo",
    analyticsGa4: "Google Analytics 4",
    analyticsOther: "Anderes Werkzeug",
    analyticsName: "Name des Werkzeugs",
    embedded: "Eingebundene Dienste",
    maps: "Kartendienst eingebunden",
    mapsProvider: "Anbieter",
    mapsGoogle: "Google Maps",
    mapsOsm: "OpenStreetMap",
    mapsOther: "Anderer Anbieter",
    mapsName: "Name des Anbieters",
    webfonts: "Schriftarten von außen oder lokal",
    fontsMode: "Einbindung",
    fontsLocal: "Lokal auf dem eigenen Server",
    fontsGoogle: "Google Fonts",
    videos: "Videos eingebunden",
    videoProvider: "Videoanbieter",
    cdn: "Content Delivery Network",
    cdnProvider: "CDN-Anbieter",
    further: "Weitere Verarbeitungen",
    newsletter: "Newsletter",
    newsletterProvider: "Versandanbieter",
    socialProfiles: "Profile in sozialen Netzwerken",
    socialNetworks: "Netzwerke",
    socialPlugins: "Schaltflächen sozialer Netzwerke auf der Seite",
    socialPluginsHint: "Nur ankreuzen, wenn die Schaltflächen erst auf Klick verbinden.",
    shop: "Onlineshop oder Zahlungsabwicklung",
    paymentProviders: "Zahlungsdienstleister",
    booking: "Termin- oder Buchungssystem",
    bookingProvider: "Anbieter",
    liveChat: "Chat auf der Website",
    chatProvider: "Chat-Anbieter",
    applications: "Bewerbungen werden entgegengenommen",
    thirdCountry: "Übermittlung in ein Land außerhalb der EU",
    thirdCountryHint: "Etwa bei einem Dienstleister mit Servern in den USA.",
    thirdCountryDetails: "Welche Verarbeitung, welches Land",
    retention: "Eigene Angabe zur Speicherdauer",
    retentionHint: "Leer lassen, um den allgemeinen Absatz zu verwenden.",
    filename: "datenschutzerklaerung",
  },
  en: {
    controller: "Controller",
    company: "Name or company",
    street: "Street and number",
    postalCode: "Postcode",
    city: "Town",
    country: "Country",
    phone: "Phone",
    email: "Email",
    website: "Website",
    dpo: "Data protection officer appointed",
    dpoHint: "Required for instance where special categories of data are processed at scale.",
    dpoName: "Name",
    dpoContact: "Contact",
    supervisoryAuthority: "Competent supervisory authority",
    supervisoryHint: "The authority of the federal state your business is based in.",
    basics: "Running the website",
    hosting: "Website is hosted externally",
    hostingProvider: "Hosting provider",
    hostingCountry: "Location of the servers",
    serverLogs: "Server log files are kept",
    serverLogsHint: "That is the case with virtually every host.",
    communication: "Contact channels",
    contactForm: "Contact form",
    emailContact: "Contact by email",
    phoneContact: "Contact by telephone",
    tracking: "Cookies and analysis",
    essentialCookies: "Technically necessary cookies",
    essentialHint: "For example for a session or to protect a form.",
    consentCookies: "Cookies requiring consent",
    consentTool: "Consent tool in use",
    analytics: "Web analytics",
    analyticsTool: "Analytics tool",
    analyticsMatomo: "Matomo",
    analyticsGa4: "Google Analytics 4",
    analyticsOther: "Another tool",
    analyticsName: "Name of the tool",
    embedded: "Embedded services",
    maps: "Map service embedded",
    mapsProvider: "Provider",
    mapsGoogle: "Google Maps",
    mapsOsm: "OpenStreetMap",
    mapsOther: "Another provider",
    mapsName: "Name of the provider",
    webfonts: "Web fonts, external or local",
    fontsMode: "How they are embedded",
    fontsLocal: "Locally, from our own server",
    fontsGoogle: "Google Fonts",
    videos: "Videos embedded",
    videoProvider: "Video provider",
    cdn: "Content delivery network",
    cdnProvider: "CDN provider",
    further: "Further processing",
    newsletter: "Newsletter",
    newsletterProvider: "Sending provider",
    socialProfiles: "Profiles on social networks",
    socialNetworks: "Networks",
    socialPlugins: "Social network buttons on the site",
    socialPluginsHint: "Only tick this if the buttons connect on click, not on load.",
    shop: "Online shop or payment processing",
    paymentProviders: "Payment service providers",
    booking: "Appointment or booking system",
    bookingProvider: "Provider",
    liveChat: "Chat on the website",
    chatProvider: "Chat provider",
    applications: "Job applications are received",
    thirdCountry: "Transfer to a country outside the EU",
    thirdCountryHint: "For example a provider with servers in the United States.",
    thirdCountryDetails: "Which processing, which country",
    retention: "Own wording on the storage period",
    retentionHint: "Leave empty to use the general paragraph.",
    filename: "privacy-policy",
  },
} satisfies Record<Lang, Strings>;

interface Props {
  lang?: Lang;
}

export default function PrivacyPolicyGenerator({ lang = "de" }: Props) {
  const t = STRINGS[lang];
  const [values, setValues] = useState<PrivacyValues>(emptyPrivacy);

  const set = <K extends keyof PrivacyValues>(key: K, value: PrivacyValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const setProvider = <K extends keyof Provider>(key: K, value: Provider[K]) =>
    setValues((prev) => ({ ...prev, provider: { ...prev.provider, [key]: value } }));

  const sections = useMemo(() => buildPrivacySections(values, lang), [values, lang]);
  const missing = useMemo(() => missingPrivacyFields(values, lang), [values, lang]);

  return (
    <div className="privacy-tool space-y-6">
      <Disclaimer lang={lang} />

      <Group title={t.controller}>
        <Field
          label={t.company}
          required
          value={values.provider.company}
          onChange={(value) => setProvider("company", value)}
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
        <Check
          label={t.dpo}
          hint={t.dpoHint}
          checked={values.hasDpo}
          onChange={(checked) => set("hasDpo", checked)}
        />
        {values.hasDpo && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t.dpoName} value={values.dpoName} onChange={(value) => set("dpoName", value)} />
            <Field
              label={t.dpoContact}
              value={values.dpoContact}
              onChange={(value) => set("dpoContact", value)}
            />
          </div>
        )}
        <Field
          label={t.supervisoryAuthority}
          hint={t.supervisoryHint}
          value={values.supervisoryAuthority}
          onChange={(value) => set("supervisoryAuthority", value)}
        />
      </Group>

      <Group title={t.basics}>
        <Check
          label={t.hosting}
          checked={values.hosting}
          onChange={(checked) => set("hosting", checked)}
        />
        {values.hosting && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={t.hostingProvider}
              value={values.hostingProvider}
              onChange={(value) => set("hostingProvider", value)}
            />
            <Field
              label={t.hostingCountry}
              value={values.hostingCountry}
              onChange={(value) => set("hostingCountry", value)}
            />
          </div>
        )}
        <Check
          label={t.serverLogs}
          hint={t.serverLogsHint}
          checked={values.serverLogs}
          onChange={(checked) => set("serverLogs", checked)}
        />
      </Group>

      <Group title={t.communication}>
        <Check
          label={t.contactForm}
          checked={values.contactForm}
          onChange={(checked) => set("contactForm", checked)}
        />
        <Check
          label={t.emailContact}
          checked={values.emailContact}
          onChange={(checked) => set("emailContact", checked)}
        />
        <Check
          label={t.phoneContact}
          checked={values.phoneContact}
          onChange={(checked) => set("phoneContact", checked)}
        />
      </Group>

      <Group title={t.tracking}>
        <Check
          label={t.essentialCookies}
          hint={t.essentialHint}
          checked={values.essentialCookies}
          onChange={(checked) => set("essentialCookies", checked)}
        />
        <Check
          label={t.consentCookies}
          checked={values.consentCookies}
          onChange={(checked) => set("consentCookies", checked)}
        />
        {values.consentCookies && (
          <Field
            label={t.consentTool}
            value={values.consentTool}
            onChange={(value) => set("consentTool", value)}
          />
        )}
        <Check
          label={t.analytics}
          checked={values.analytics}
          onChange={(checked) => set("analytics", checked)}
        />
        {values.analytics && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Choice<AnalyticsTool>
              label={t.analyticsTool}
              value={values.analyticsTool}
              onChange={(value) => set("analyticsTool", value)}
              options={[
                { value: "matomo", label: t.analyticsMatomo },
                { value: "ga4", label: t.analyticsGa4 },
                { value: "other", label: t.analyticsOther },
              ]}
            />
            {values.analyticsTool === "other" && (
              <Field
                label={t.analyticsName}
                value={values.analyticsName}
                onChange={(value) => set("analyticsName", value)}
              />
            )}
          </div>
        )}
      </Group>

      <Group title={t.embedded}>
        <Check label={t.maps} checked={values.maps} onChange={(checked) => set("maps", checked)} />
        {values.maps && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Choice<MapsProvider>
              label={t.mapsProvider}
              value={values.mapsProvider}
              onChange={(value) => set("mapsProvider", value)}
              options={[
                { value: "osm", label: t.mapsOsm },
                { value: "google", label: t.mapsGoogle },
                { value: "other", label: t.mapsOther },
              ]}
            />
            {values.mapsProvider === "other" && (
              <Field
                label={t.mapsName}
                value={values.mapsName}
                onChange={(value) => set("mapsName", value)}
              />
            )}
          </div>
        )}

        <Check
          label={t.webfonts}
          checked={values.webfonts}
          onChange={(checked) => set("webfonts", checked)}
        />
        {values.webfonts && (
          <Choice<FontsMode>
            label={t.fontsMode}
            value={values.fontsMode}
            onChange={(value) => set("fontsMode", value)}
            options={[
              { value: "local", label: t.fontsLocal },
              { value: "google", label: t.fontsGoogle },
            ]}
          />
        )}

        <Check label={t.videos} checked={values.videos} onChange={(checked) => set("videos", checked)} />
        {values.videos && (
          <Field
            label={t.videoProvider}
            value={values.videoProvider}
            onChange={(value) => set("videoProvider", value)}
          />
        )}

        <Check label={t.cdn} checked={values.cdn} onChange={(checked) => set("cdn", checked)} />
        {values.cdn && (
          <Field
            label={t.cdnProvider}
            value={values.cdnProvider}
            onChange={(value) => set("cdnProvider", value)}
          />
        )}
      </Group>

      <Group title={t.further}>
        <Check
          label={t.newsletter}
          checked={values.newsletter}
          onChange={(checked) => set("newsletter", checked)}
        />
        {values.newsletter && (
          <Field
            label={t.newsletterProvider}
            value={values.newsletterProvider}
            onChange={(value) => set("newsletterProvider", value)}
          />
        )}

        <Check
          label={t.socialProfiles}
          checked={values.socialProfiles}
          onChange={(checked) => set("socialProfiles", checked)}
        />
        {values.socialProfiles && (
          <Field
            label={t.socialNetworks}
            value={values.socialNetworks}
            onChange={(value) => set("socialNetworks", value)}
          />
        )}
        <Check
          label={t.socialPlugins}
          hint={t.socialPluginsHint}
          checked={values.socialPlugins}
          onChange={(checked) => set("socialPlugins", checked)}
        />

        <Check label={t.shop} checked={values.shop} onChange={(checked) => set("shop", checked)} />
        {values.shop && (
          <Field
            label={t.paymentProviders}
            value={values.paymentProviders}
            onChange={(value) => set("paymentProviders", value)}
          />
        )}

        <Check label={t.booking} checked={values.booking} onChange={(checked) => set("booking", checked)} />
        {values.booking && (
          <Field
            label={t.bookingProvider}
            value={values.bookingProvider}
            onChange={(value) => set("bookingProvider", value)}
          />
        )}

        <Check
          label={t.liveChat}
          checked={values.liveChat}
          onChange={(checked) => set("liveChat", checked)}
        />
        {values.liveChat && (
          <Field
            label={t.chatProvider}
            value={values.chatProvider}
            onChange={(value) => set("chatProvider", value)}
          />
        )}

        <Check
          label={t.applications}
          checked={values.applications}
          onChange={(checked) => set("applications", checked)}
        />

        <Check
          label={t.thirdCountry}
          hint={t.thirdCountryHint}
          checked={values.thirdCountry}
          onChange={(checked) => set("thirdCountry", checked)}
        />
        {values.thirdCountry && (
          <Area
            label={t.thirdCountryDetails}
            rows={3}
            value={values.thirdCountryDetails}
            onChange={(value) => set("thirdCountryDetails", value)}
          />
        )}

        <Area
          label={t.retention}
          hint={t.retentionHint}
          rows={3}
          value={values.retention}
          onChange={(value) => set("retention", value)}
        />
      </Group>

      <DocumentOutput
        lang={lang}
        title={privacyTitle(lang)}
        sections={sections}
        missing={missing}
        filenameBase={t.filename}
      />
    </div>
  );
}
