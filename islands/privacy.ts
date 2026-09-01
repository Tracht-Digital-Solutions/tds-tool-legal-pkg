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
 * Der Textaufbau des Datenschutzerklärung-Generators.
 *
 * Ein Baukasten: jedes Ankreuzfeld schaltet genau einen Abschnitt zu. Der
 * Fehler, der in so einem Werkzeug am leichtesten passiert und am längsten
 * unbemerkt bleibt, ist ein Abschnitt, der nach dem Abwählen im Text stehen
 * bleibt — deshalb baut diese Funktion die Abschnittsliste bei jedem Aufruf
 * vollständig neu auf und pflegt keinen Zustand, und deshalb prüft ein Test
 * beide Richtungen.
 *
 * Jeder Baustein nennt Zweck UND Rechtsgrundlage. Eine Datenschutzerklärung,
 * die nur aufzählt, welche Dienste eingesetzt werden, erfüllt Art. 13 DSGVO
 * nicht — und genau so sehen die meisten frei verfügbaren Muster aus.
 */

export type AnalyticsTool = "matomo" | "ga4" | "other";
export type MapsProvider = "google" | "osm" | "other";
export type FontsMode = "local" | "google";

export interface PrivacyValues {
  provider: Provider;
  hasDpo: boolean;
  dpoName: string;
  dpoContact: string;
  supervisoryAuthority: string;
  hosting: boolean;
  hostingProvider: string;
  hostingCountry: string;
  serverLogs: boolean;
  contactForm: boolean;
  emailContact: boolean;
  phoneContact: boolean;
  essentialCookies: boolean;
  consentCookies: boolean;
  consentTool: string;
  analytics: boolean;
  analyticsTool: AnalyticsTool;
  analyticsName: string;
  newsletter: boolean;
  newsletterProvider: string;
  maps: boolean;
  mapsProvider: MapsProvider;
  mapsName: string;
  webfonts: boolean;
  fontsMode: FontsMode;
  videos: boolean;
  videoProvider: string;
  socialProfiles: boolean;
  socialNetworks: string;
  socialPlugins: boolean;
  shop: boolean;
  paymentProviders: string;
  booking: boolean;
  bookingProvider: string;
  liveChat: boolean;
  chatProvider: string;
  cdn: boolean;
  cdnProvider: string;
  applications: boolean;
  thirdCountry: boolean;
  thirdCountryDetails: string;
  retention: string;
}

export const emptyPrivacy: PrivacyValues = {
  provider: { ...emptyProvider, country: "Deutschland" },
  hasDpo: false,
  dpoName: "",
  dpoContact: "",
  supervisoryAuthority: "",
  hosting: true,
  hostingProvider: "",
  hostingCountry: "",
  serverLogs: true,
  contactForm: true,
  emailContact: true,
  phoneContact: false,
  essentialCookies: true,
  consentCookies: false,
  consentTool: "",
  analytics: false,
  analyticsTool: "matomo",
  analyticsName: "",
  newsletter: false,
  newsletterProvider: "",
  maps: false,
  mapsProvider: "osm",
  mapsName: "",
  webfonts: false,
  fontsMode: "local",
  videos: false,
  videoProvider: "",
  socialProfiles: false,
  socialNetworks: "",
  socialPlugins: false,
  shop: false,
  paymentProviders: "",
  booking: false,
  bookingProvider: "",
  liveChat: false,
  chatProvider: "",
  cdn: false,
  cdnProvider: "",
  applications: false,
  thirdCountry: false,
  thirdCountryDetails: "",
  retention: "",
};

export const privacyTitle = (lang: Lang): string =>
  lang === "de" ? "Datenschutzerklärung" : "Privacy policy";

/** Was ohne Angabe zu einer Lücke im Pflichttext führt. */
export function missingPrivacyFields(values: PrivacyValues, lang: Lang): string[] {
  const de = lang === "de";
  const missing: string[] = [];
  const p = values.provider;
  if (!clean(p.company)) missing.push(de ? "Name des Verantwortlichen" : "name of the controller");
  if (!clean(p.street) || !clean(p.postalCode) || !clean(p.city)) {
    missing.push(de ? "Anschrift des Verantwortlichen" : "address of the controller");
  }
  if (!clean(p.email)) missing.push(de ? "E-Mail-Adresse" : "email address");
  if (values.hasDpo && !clean(values.dpoContact)) {
    missing.push(de ? "Kontakt des Datenschutzbeauftragten" : "contact of the data protection officer");
  }
  if (values.analytics && values.analyticsTool === "other" && !clean(values.analyticsName)) {
    missing.push(de ? "Name des Analysewerkzeugs" : "name of the analytics tool");
  }
  if (values.newsletter && !clean(values.newsletterProvider)) {
    missing.push(de ? "Newsletter-Anbieter" : "newsletter provider");
  }
  if (values.thirdCountry && !clean(values.thirdCountryDetails)) {
    missing.push(de ? "Angaben zur Drittlandübermittlung" : "details of the third-country transfer");
  }
  return missing;
}

const analyticsLabel = (values: PrivacyValues): string => {
  if (values.analyticsTool === "matomo") return "Matomo";
  if (values.analyticsTool === "ga4") return "Google Analytics 4";
  return clean(values.analyticsName) || "das eingesetzte Analysewerkzeug";
};

const mapsLabel = (values: PrivacyValues): string => {
  if (values.mapsProvider === "google") return "Google Maps";
  if (values.mapsProvider === "osm") return "OpenStreetMap";
  return clean(values.mapsName) || "der eingesetzte Kartendienst";
};

/**
 * Die Abschnitte der Erklärung.
 *
 * Reihenfolge: wer verarbeitet (Verantwortlicher, Datenschutzbeauftragte),
 * dann was auf dieser Website passiert (die Bausteine), dann die Rechte der
 * betroffenen Person. Diese Reihenfolge entspricht dem Aufbau, den die
 * Aufsichtsbehörden in ihren Mustern verwenden.
 */
export function buildPrivacySections(values: PrivacyValues, lang: Lang): Section[] {
  const de = lang === "de";
  const p = values.provider;
  const sections: Section[] = [];

  sections.push({
    heading: de ? "Verantwortlicher" : "Controller",
    paragraphs: [
      de
        ? "Verantwortlich für die Verarbeitung personenbezogener Daten auf dieser Website im Sinne der Datenschutz-Grundverordnung ist:"
        : "The controller responsible for the processing of personal data on this website within the meaning of the General Data Protection Regulation is:",
      addressBlock(p),
      contactBlock(p, lang),
    ],
  });

  if (values.hasDpo) {
    sections.push({
      heading: de ? "Datenschutzbeauftragte Person" : "Data protection officer",
      paragraphs: [
        de
          ? "Wir haben eine datenschutzbeauftragte Person benannt. Sie erreichen sie unter:"
          : "We have appointed a data protection officer. You can reach them at:",
        [clean(values.dpoName), clean(values.dpoContact)].filter(Boolean).join("\n"),
      ],
    });
  }

  sections.push({
    heading: de ? "Allgemeines zur Verarbeitung" : "General information on processing",
    paragraphs: de
      ? [
          "Wir verarbeiten personenbezogene Daten nur, soweit dies für die Bereitstellung dieser Website und unserer Leistungen erforderlich ist oder Sie eingewilligt haben. Rechtsgrundlage ist je nach Zweck Art. 6 Abs. 1 lit. a DSGVO (Einwilligung), Art. 6 Abs. 1 lit. b DSGVO (Vertrag oder vorvertragliche Maßnahmen) oder Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).",
          "Personenbezogene Daten sind alle Informationen, die sich auf eine identifizierte oder identifizierbare Person beziehen. Die Nutzung dieser Website ist grundsätzlich ohne Angabe personenbezogener Daten möglich; wo wir Angaben erheben, geschieht dies auf den unten beschriebenen Wegen.",
        ]
      : [
          "We process personal data only where this is necessary to provide this website and our services, or where you have given your consent. Depending on the purpose, the legal basis is Article 6 (1) (a) GDPR (consent), Article 6 (1) (b) GDPR (contract or pre-contractual measures) or Article 6 (1) (f) GDPR (legitimate interest).",
          "Personal data means any information relating to an identified or identifiable person. This website can generally be used without providing personal data; where we do collect it, this happens through the channels described below.",
        ],
  });

  if (values.hosting) {
    const host = clean(values.hostingProvider);
    const where = clean(values.hostingCountry);
    sections.push({
      heading: de ? "Hosting" : "Hosting",
      paragraphs: [
        de
          ? `Diese Website wird bei einem externen Dienstleister gehostet${host ? ` (${host})` : ""}. Die dabei erhobenen Daten werden auf den Servern des Anbieters gespeichert${where ? `, die sich in ${where} befinden` : ""}. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO; unser berechtigtes Interesse liegt in einer sicheren und zuverlässigen Bereitstellung unseres Angebots.`
          : `This website is hosted by an external service provider${host ? ` (${host})` : ""}. The data collected in that context is stored on the provider's servers${where ? `, which are located in ${where}` : ""}. The legal basis is Article 6 (1) (f) GDPR; our legitimate interest lies in providing our offering securely and reliably.`,
        de
          ? "Mit dem Anbieter haben wir einen Vertrag über die Auftragsverarbeitung nach Art. 28 DSGVO geschlossen. Der Anbieter verarbeitet die Daten ausschließlich nach unserer Weisung."
          : "We have concluded a data processing agreement with the provider pursuant to Article 28 GDPR. The provider processes the data solely on our instructions.",
      ],
    });
  }

  if (values.serverLogs) {
    sections.push({
      heading: de ? "Server-Logdateien" : "Server log files",
      paragraphs: [
        de
          ? "Beim Aufruf dieser Website werden automatisch Informationen erfasst, die Ihr Browser übermittelt: Browsertyp und -version, verwendetes Betriebssystem, aufgerufene Seite, zuvor besuchte Seite, Uhrzeit der Anfrage und die IP-Adresse. Eine Zusammenführung dieser Daten mit anderen Datenquellen nehmen wir nicht vor."
          : "When you access this website, information transmitted by your browser is recorded automatically: browser type and version, operating system, page requested, referring page, time of the request and the IP address. We do not merge this data with other sources.",
        de
          ? "Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt im technisch fehlerfreien Betrieb und in der Sicherheit unserer Systeme. Die Protokolle werden gelöscht, sobald sie für diesen Zweck nicht mehr erforderlich sind."
          : "The legal basis is Article 6 (1) (f) GDPR. Our legitimate interest lies in the technically error-free operation and the security of our systems. The logs are deleted as soon as they are no longer needed for that purpose.",
      ],
    });
  }

  if (values.contactForm) {
    sections.push({
      heading: de ? "Kontaktformular" : "Contact form",
      paragraphs: [
        de
          ? "Wenn Sie uns über das Kontaktformular schreiben, verarbeiten wir Ihre Angaben aus dem Formular einschließlich der dort angegebenen Kontaktdaten, um Ihre Anfrage zu bearbeiten und für Anschlussfragen bereitzuhalten. Ohne Ihre Einwilligung geben wir diese Daten nicht weiter."
          : "If you write to us using the contact form, we process the details you provide, including the contact data given there, in order to handle your enquiry and to remain available for follow-up questions. We do not pass this data on without your consent.",
        de
          ? "Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre Anfrage der Anbahnung oder Erfüllung eines Vertrags dient, im Übrigen Art. 6 Abs. 1 lit. f DSGVO wegen unseres berechtigten Interesses an der Beantwortung von Anfragen. Wir löschen die Angaben, sobald der Vorgang abgeschlossen ist und keine Aufbewahrungspflichten entgegenstehen."
          : "The legal basis is Article 6 (1) (b) GDPR where your enquiry serves the initiation or performance of a contract, and otherwise Article 6 (1) (f) GDPR, based on our legitimate interest in answering enquiries. We delete the details once the matter has been concluded and no retention obligations apply.",
      ],
    });
  }

  if (values.emailContact || values.phoneContact) {
    const channels = de
      ? [values.emailContact ? "E-Mail" : "", values.phoneContact ? "Telefon" : ""]
      : [values.emailContact ? "email" : "", values.phoneContact ? "telephone" : ""];
    const list = channels.filter(Boolean).join(de ? " oder " : " or ");
    sections.push({
      heading: de ? "Kontaktaufnahme per E-Mail oder Telefon" : "Contact by email or telephone",
      paragraphs: [
        de
          ? `Wenn Sie uns per ${list} kontaktieren, speichern wir Ihre Angaben zur Bearbeitung des Anliegens. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO bei vertragsbezogenen Anfragen, sonst Art. 6 Abs. 1 lit. f DSGVO.`
          : `If you contact us by ${list}, we store your details in order to deal with your request. The legal basis is Article 6 (1) (b) GDPR for contract-related enquiries and otherwise Article 6 (1) (f) GDPR.`,
      ],
    });
  }

  if (values.essentialCookies || values.consentCookies) {
    const paragraphs: string[] = [];
    if (values.essentialCookies) {
      paragraphs.push(
        de
          ? "Diese Website verwendet technisch notwendige Cookies. Sie sind erforderlich, damit die Seite funktioniert, etwa um eine Sitzung zu halten oder eine Formulareingabe abzusichern. Rechtsgrundlage ist § 25 Abs. 2 Nr. 2 TDDDG in Verbindung mit Art. 6 Abs. 1 lit. f DSGVO."
          : "This website uses technically necessary cookies. They are required for the site to work, for instance to maintain a session or to secure a form submission. The legal basis is section 25 (2) no. 2 TDDDG in conjunction with Article 6 (1) (f) GDPR.",
      );
    }
    if (values.consentCookies) {
      const tool = clean(values.consentTool);
      paragraphs.push(
        de
          ? `Darüber hinaus setzen wir Cookies und vergleichbare Techniken ein, die nicht technisch notwendig sind. Sie werden erst gesetzt, nachdem Sie eingewilligt haben${tool ? ` — die Einwilligung holen wir über ${tool} ein` : ""}. Rechtsgrundlage ist § 25 Abs. 1 TDDDG in Verbindung mit Art. 6 Abs. 1 lit. a DSGVO. Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen.`
          : `We also use cookies and comparable technologies that are not technically necessary. They are only set once you have given consent${tool ? ` — we obtain that consent through ${tool}` : ""}. The legal basis is section 25 (1) TDDDG in conjunction with Article 6 (1) (a) GDPR. You can withdraw your consent at any time with effect for the future.`,
      );
    }
    sections.push({ heading: de ? "Cookies" : "Cookies", paragraphs });
  }

  if (values.analytics) {
    const tool = analyticsLabel(values);
    sections.push({
      heading: de ? "Webanalyse" : "Web analytics",
      paragraphs: [
        de
          ? `Wir werten die Nutzung dieser Website mit ${tool} aus, um zu erkennen, welche Inhalte gefunden und gelesen werden, und um das Angebot darauf einzurichten.`
          : `We analyse the use of this website with ${tool} in order to understand which content is found and read, and to shape our offering accordingly.`,
        de
          ? "Die Auswertung findet nur statt, wenn Sie eingewilligt haben. Rechtsgrundlage ist Art. 6 Abs. 1 lit. a DSGVO in Verbindung mit § 25 Abs. 1 TDDDG. Sie können die Einwilligung jederzeit widerrufen; die Rechtmäßigkeit der bis dahin erfolgten Verarbeitung bleibt davon unberührt."
          : "The analysis only takes place if you have given consent. The legal basis is Article 6 (1) (a) GDPR in conjunction with section 25 (1) TDDDG. You can withdraw your consent at any time; the lawfulness of processing carried out until then is unaffected.",
      ],
    });
  }

  if (values.newsletter) {
    const provider = clean(values.newsletterProvider);
    sections.push({
      heading: de ? "Newsletter" : "Newsletter",
      paragraphs: [
        de
          ? `Für den Versand unseres Newsletters benötigen wir Ihre E-Mail-Adresse. Die Anmeldung erfolgt im Bestätigungsverfahren: Nach der Eintragung senden wir Ihnen eine E-Mail, in der Sie die Anmeldung bestätigen${provider ? `. Für den Versand nutzen wir ${provider}` : ""}.`
          : `We need your email address in order to send our newsletter. Registration uses a confirmed opt-in: after you sign up we send you an email in which you confirm the subscription${provider ? `. We use ${provider} to send it` : ""}.`,
        de
          ? "Rechtsgrundlage ist Art. 6 Abs. 1 lit. a DSGVO. Sie können den Newsletter jederzeit abbestellen, etwa über den Abmeldelink in jeder Ausgabe. Nach der Abmeldung löschen wir Ihre Adresse aus dem Verteiler."
          : "The legal basis is Article 6 (1) (a) GDPR. You can unsubscribe at any time, for example using the link in every issue. After you unsubscribe we delete your address from the distribution list.",
      ],
    });
  }

  if (values.maps) {
    const service = mapsLabel(values);
    sections.push({
      heading: de ? "Kartendienst" : "Map service",
      paragraphs: [
        de
          ? `Zur Darstellung unseres Standorts binden wir ${service} ein. Beim Laden der Karte wird Ihre IP-Adresse an den Anbieter übermittelt, der sie technisch benötigt, um die Kartenausschnitte an Ihr Gerät auszuliefern.`
          : `We embed ${service} to show our location. When the map loads, your IP address is transmitted to the provider, which technically needs it in order to deliver the map tiles to your device.`,
        de
          ? "Die Karte wird erst nach Ihrer Einwilligung geladen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. a DSGVO in Verbindung mit § 25 Abs. 1 TDDDG."
          : "The map is only loaded after you have given consent. The legal basis is Article 6 (1) (a) GDPR in conjunction with section 25 (1) TDDDG.",
      ],
    });
  }

  if (values.webfonts) {
    sections.push({
      heading: de ? "Schriftarten" : "Web fonts",
      paragraphs: [
        values.fontsMode === "local"
          ? de
            ? "Die auf dieser Website verwendeten Schriftarten liegen auf unserem eigenen Server und werden von dort ausgeliefert. Eine Verbindung zu einem Server Dritter wird dabei nicht aufgebaut, und es werden keine Daten an einen Schriftanbieter übermittelt."
            : "The fonts used on this website are stored on our own server and delivered from there. No connection to a third-party server is established, and no data is transmitted to a font provider."
          : de
            ? "Diese Website bindet Schriftarten von Google Fonts ein. Beim Aufruf einer Seite lädt Ihr Browser die Schriften von einem Server des Anbieters; dabei wird Ihre IP-Adresse übermittelt. Die Einbindung erfolgt erst nach Ihrer Einwilligung; Rechtsgrundlage ist Art. 6 Abs. 1 lit. a DSGVO in Verbindung mit § 25 Abs. 1 TDDDG."
            : "This website embeds fonts from Google Fonts. When a page is opened, your browser loads the fonts from a server operated by the provider, transmitting your IP address in the process. The fonts are only embedded after you have given consent; the legal basis is Article 6 (1) (a) GDPR in conjunction with section 25 (1) TDDDG.",
      ],
    });
  }

  if (values.videos) {
    const provider = clean(values.videoProvider) || (de ? "einem externen Anbieter" : "an external provider");
    sections.push({
      heading: de ? "Eingebettete Videos" : "Embedded videos",
      paragraphs: [
        de
          ? `Wir binden Videos von ${provider} ein. Ein Video wird erst geladen, nachdem Sie es angefordert und in die Einbindung eingewilligt haben. Mit dem Laden wird eine Verbindung zu den Servern des Anbieters aufgebaut, wobei unter anderem Ihre IP-Adresse übermittelt wird.`
          : `We embed videos from ${provider}. A video is only loaded once you have requested it and consented to the embedding. Loading it establishes a connection to the provider's servers, transmitting your IP address among other data.`,
        de
          ? "Rechtsgrundlage ist Art. 6 Abs. 1 lit. a DSGVO in Verbindung mit § 25 Abs. 1 TDDDG."
          : "The legal basis is Article 6 (1) (a) GDPR in conjunction with section 25 (1) TDDDG.",
      ],
    });
  }

  if (values.socialProfiles || values.socialPlugins) {
    const paragraphs: string[] = [];
    const networks = clean(values.socialNetworks);
    if (values.socialProfiles) {
      paragraphs.push(
        de
          ? `Wir unterhalten Profile in sozialen Netzwerken${networks ? ` (${networks})` : ""}. Wenn Sie ein solches Profil besuchen, verarbeitet der jeweilige Anbieter Ihre Daten in eigener Verantwortung nach seinen eigenen Bestimmungen. Auf diese Verarbeitung haben wir keinen Einfluss. Für die Verarbeitung, die wir gemeinsam mit dem Anbieter zu verantworten haben, ist Rechtsgrundlage Art. 6 Abs. 1 lit. f DSGVO.`
          : `We maintain profiles on social networks${networks ? ` (${networks})` : ""}. If you visit such a profile, the respective provider processes your data on its own responsibility and under its own terms. We have no influence over that processing. For the processing for which we are jointly responsible with the provider, the legal basis is Article 6 (1) (f) GDPR.`,
      );
    }
    if (values.socialPlugins) {
      paragraphs.push(
        de
          ? "Auf unseren Seiten sind Schaltflächen sozialer Netzwerke eingebunden. Sie stellen erst dann eine Verbindung zum jeweiligen Netzwerk her, wenn Sie sie aktiv anklicken; ohne diesen Klick werden keine Daten an das Netzwerk übertragen. Rechtsgrundlage für die anschließende Verarbeitung ist Art. 6 Abs. 1 lit. a DSGVO."
          : "Our pages contain buttons for social networks. They only establish a connection to the respective network once you actively click them; without that click, no data is transmitted to the network. The legal basis for the subsequent processing is Article 6 (1) (a) GDPR.",
      );
    }
    sections.push({ heading: de ? "Soziale Netzwerke" : "Social networks", paragraphs });
  }

  if (values.shop) {
    const payments = clean(values.paymentProviders);
    sections.push({
      heading: de ? "Bestellungen und Zahlungsabwicklung" : "Orders and payment processing",
      paragraphs: [
        de
          ? "Wenn Sie bei uns bestellen, verarbeiten wir die dafür erforderlichen Daten — Bestand, Anschrift, Kontaktdaten und die Angaben zur gewählten Zahlungsart. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO."
          : "When you place an order with us, we process the data required to do so: the items ordered, your address, your contact details and the information relating to the chosen payment method. The legal basis is Article 6 (1) (b) GDPR.",
        de
          ? `Die Zahlungsabwicklung erfolgt über Zahlungsdienstleister${payments ? ` (${payments})` : ""}, die die für die Zahlung erforderlichen Daten in eigener Verantwortung verarbeiten. Handels- und steuerrechtliche Aufbewahrungsfristen bleiben unberührt.`
          : `Payments are processed by payment service providers${payments ? ` (${payments})` : ""}, which process the data required for the payment on their own responsibility. Commercial and tax retention periods remain unaffected.`,
      ],
    });
  }

  if (values.booking) {
    const provider = clean(values.bookingProvider);
    sections.push({
      heading: de ? "Termin- und Buchungssystem" : "Appointment and booking system",
      paragraphs: [
        de
          ? `Für die Vereinbarung von Terminen setzen wir ein Buchungssystem ein${provider ? ` (${provider})` : ""}. Verarbeitet werden die Angaben, die Sie im Buchungsformular machen, sowie der gewünschte Termin. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.`
          : `We use a booking system to arrange appointments${provider ? ` (${provider})` : ""}. We process the details you enter in the booking form and the requested appointment. The legal basis is Article 6 (1) (b) GDPR.`,
      ],
    });
  }

  if (values.liveChat) {
    const provider = clean(values.chatProvider);
    sections.push({
      heading: de ? "Chat" : "Chat",
      paragraphs: [
        de
          ? `Auf unserer Website können Sie uns über einen Chat erreichen${provider ? ` (${provider})` : ""}. Der Chatverlauf und die dabei gemachten Angaben werden gespeichert, um Ihr Anliegen zu bearbeiten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b beziehungsweise lit. f DSGVO.`
          : `You can reach us through a chat on our website${provider ? ` (${provider})` : ""}. The conversation and the details you provide are stored in order to deal with your request. The legal basis is Article 6 (1) (b) or (f) GDPR.`,
      ],
    });
  }

  if (values.cdn) {
    const provider = clean(values.cdnProvider);
    sections.push({
      heading: de ? "Content Delivery Network" : "Content delivery network",
      paragraphs: [
        de
          ? `Wir liefern Teile dieser Website über ein Content Delivery Network aus${provider ? ` (${provider})` : ""}. Dabei wird Ihre IP-Adresse an den Anbieter übermittelt, der sie technisch benötigt, um die Inhalte auszuliefern. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO; unser berechtigtes Interesse liegt in einer schnellen und sicheren Auslieferung.`
          : `We deliver parts of this website through a content delivery network${provider ? ` (${provider})` : ""}. Your IP address is transmitted to the provider, which technically needs it in order to deliver the content. The legal basis is Article 6 (1) (f) GDPR; our legitimate interest lies in fast and secure delivery.`,
      ],
    });
  }

  if (values.applications) {
    sections.push({
      heading: de ? "Bewerbungen" : "Job applications",
      paragraphs: [
        de
          ? "Wenn Sie sich bei uns bewerben, verarbeiten wir Ihre Bewerbungsunterlagen zur Durchführung des Bewerbungsverfahrens. Rechtsgrundlage ist § 26 Abs. 1 BDSG in Verbindung mit Art. 6 Abs. 1 lit. b DSGVO."
          : "If you apply to us, we process your application documents in order to carry out the application procedure. The legal basis is section 26 (1) BDSG in conjunction with Article 6 (1) (b) GDPR.",
        de
          ? "Kommt es nicht zu einer Einstellung, löschen wir die Unterlagen sechs Monate nach Abschluss des Verfahrens, sofern Sie einer längeren Aufbewahrung nicht zugestimmt haben."
          : "If no employment relationship comes about, we delete the documents six months after the procedure has ended, unless you have agreed to longer storage.",
      ],
    });
  }

  if (values.thirdCountry) {
    sections.push({
      heading: de ? "Übermittlung in Drittländer" : "Transfers to third countries",
      paragraphs: [
        de
          ? `Einzelne der oben genannten Verarbeitungen bringen eine Übermittlung personenbezogener Daten in ein Land außerhalb der Europäischen Union mit sich: ${clean(values.thirdCountryDetails)}`
          : `Some of the processing described above involves transferring personal data to a country outside the European Union: ${clean(values.thirdCountryDetails)}`,
        de
          ? "Soweit für das Zielland kein Angemessenheitsbeschluss der Europäischen Kommission vorliegt, stützen wir die Übermittlung auf Standardvertragsklauseln nach Art. 46 Abs. 2 lit. c DSGVO oder auf Ihre ausdrückliche Einwilligung nach Art. 49 Abs. 1 lit. a DSGVO."
          : "Where no adequacy decision of the European Commission exists for the destination country, we base the transfer on standard contractual clauses pursuant to Article 46 (2) (c) GDPR or on your explicit consent pursuant to Article 49 (1) (a) GDPR.",
      ],
    });
  }

  sections.push({
    heading: de ? "Speicherdauer" : "Storage period",
    paragraphs: [
      clean(values.retention) ||
        (de
          ? "Nach dem Grundsatz der Speicherbegrenzung (Art. 5 Abs. 1 lit. e DSGVO) speichern wir personenbezogene Daten nur so lange, wie es für den jeweiligen Zweck erforderlich ist. Danach löschen wir sie, es sei denn, gesetzliche Aufbewahrungsfristen — insbesondere aus dem Handels- und Steuerrecht — verpflichten uns zu einer längeren Speicherung."
          : "Under the storage limitation principle (Article 5 (1) (e) GDPR) we store personal data only for as long as is necessary for the respective purpose. After that we delete it, unless statutory retention periods — in particular under commercial and tax law — oblige us to store it for longer."),
    ],
  });

  sections.push({
    heading: de ? "Ihre Rechte" : "Your rights",
    paragraphs: de
      ? [
          "Sie haben das Recht auf Auskunft über die zu Ihnen gespeicherten Daten (Art. 15 DSGVO), auf Berichtigung unrichtiger Daten (Art. 16 DSGVO), auf Löschung (Art. 17 DSGVO), auf Einschränkung der Verarbeitung (Art. 18 DSGVO) und auf Datenübertragbarkeit (Art. 20 DSGVO).",
          "Verarbeiten wir Daten auf Grundlage eines berechtigten Interesses, können Sie der Verarbeitung nach Art. 21 DSGVO widersprechen. Eine erteilte Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen; die Rechtmäßigkeit der bis dahin erfolgten Verarbeitung bleibt davon unberührt.",
        ]
      : [
          "You have the right to obtain information about the data stored about you (Article 15 GDPR), to have inaccurate data corrected (Article 16 GDPR), to erasure (Article 17 GDPR), to restriction of processing (Article 18 GDPR) and to data portability (Article 20 GDPR).",
          "Where we process data on the basis of a legitimate interest, you may object to that processing under Article 21 GDPR. You can withdraw consent you have given at any time with effect for the future; the lawfulness of processing carried out until then is unaffected.",
        ],
  });

  const authority = clean(values.supervisoryAuthority);
  sections.push({
    heading: de ? "Beschwerderecht bei einer Aufsichtsbehörde" : "Right to lodge a complaint",
    paragraphs: [
      de
        ? `Unabhängig von anderen Rechtsbehelfen steht Ihnen ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu (Art. 77 DSGVO). Zuständig ist die Behörde Ihres gewöhnlichen Aufenthaltsorts, Ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes${authority ? `. Für uns zuständig ist: ${authority}` : ""}.`
        : `Irrespective of other remedies, you have the right to lodge a complaint with a data protection supervisory authority (Article 77 GDPR). The competent authority is the one at your habitual residence, your place of work or the place of the alleged infringement${authority ? `. The authority responsible for us is: ${authority}` : ""}.`,
    ],
  });

  sections.push({
    heading: de ? "Verschlüsselte Übertragung" : "Encrypted transmission",
    paragraphs: [
      de
        ? "Diese Website nutzt eine verschlüsselte Verbindung (TLS). Sie erkennen das an der Adresszeile Ihres Browsers, die mit https:// beginnt. Bei aktiver Verschlüsselung können die Daten, die Sie an uns übermitteln, von Dritten nicht mitgelesen werden."
        : "This website uses an encrypted connection (TLS). You can recognise it by the address bar of your browser, which begins with https://. While encryption is active, the data you transmit to us cannot be read by third parties.",
    ],
  });

  return sections;
}
