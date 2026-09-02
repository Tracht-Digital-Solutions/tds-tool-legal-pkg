# AGENTS.md — tds-tool-legal-pkg

Ein **Tool-Pack** für die TDS-Tools-Plattform: vier Werkzeuge für Pflichten, die
ein Betrieb auf der eigenen Website erfüllen muss. Das Plattform-Modell steht in
`tds-tools-contract-pkg/AGENTS.md`, die Schritt-für-Schritt-Anleitung in
`tds-tools-frontend/TOOLS-PLATFORM.md` (Abschnitt 5).

## Aufbau

- `src/index.ts` — das `ToolPackManifest` mit vier Werkzeugen. Die einzige
  Datei, die tsup baut und `tsc` prüft.
- `tools/*.astro` — die Shells, die die Site unter `/tools/<slug>` rendert.
- `islands/*.tsx` — hydratisierte React-Inseln, vollständig clientseitig, ohne
  Netzwerkaufruf und ohne Laufzeit-Dependency.
- `islands/imprint.ts`, `privacy.ts`, `accessibility.ts` — der **Textaufbau**
  als reine Funktionen, getrennt von der Oberfläche, damit die Klauselauswahl
  ohne DOM prüfbar ist.
- `islands/badge.ts`, `metadata.ts` — Geometrie und Dateiformate der
  KI-Kennzeichnung, ebenfalls DOM-frei.
- `islands/ui.tsx` — die geteilten Formularbausteine der drei Textgeneratoren.
- `islands/shared.ts` — Klartext-/HTML-Ausgabe, Download, Kopier-Zustand,
  Anbieterblock.

## Die vier Werkzeuge

| Slug | Was es erzeugt |
|---|---|
| `impressum-generator` | Muster nach § 5 DDG und § 18 Abs. 2 MStV |
| `datenschutzerklaerung-generator` | Muster nach DSGVO, modular über Ankreuzfelder |
| `barrierefreiheitserklaerung-generator` | Muster nach BFSG **oder** BITV 2.0 / § 12b BGG |
| `ki-kennzeichnung-bilder` | Sichtbares Badge plus maschinenlesbarer Hinweis (Art. 50 KI-VO) |

Alle vier sind **frei und ohne Anmeldung**: die Felder `premiumDefault`,
`requiresLoginDefault` und `priceCentsDefault` fehlen absichtlich. Ein
versehentlich gesetztes `premiumDefault` schöbe die Seite hinter das `ToolGate`,
ohne dass irgendwo etwas rot würde — deshalb prüft `src/index.test.ts` es.

## Regeln, die dieses Pack eigen hat

- **Der Muster-Hinweis steht in der Oberfläche, nie im erzeugten Text.** Er
  würde beim Einfügen mit auf die Seite des Nutzers wandern und dort als Teil
  des Pflichttextes gelesen. `islands/imprint.test.ts` prüft beide Hälften.
- **Kein Verweis auf die ODR-Plattform.** Die Europäische Kommission hat sie am
  20. Juli 2025 abgeschaltet. Der Verweis steht bis heute in fast jedem frei
  verfügbaren Muster und in jedem Generator, den seither niemand angefasst hat;
  er ist inzwischen ein toter Link mitten in einem Pflichttext. Ein Test hält
  ihn draußen.
- **Die Steuernummer gehört nicht ins Impressum.** § 5 DDG verlangt die
  USt-IdNr.; ein Formularfeld für die Steuernummer brächte Nutzer dazu, eine
  nicht öffentliche Angabe zu veröffentlichen.
- **Die Barrierefreiheitserklärung hat zwei Regime.** Eine öffentliche Stelle
  verweist am Ende auf die Schlichtungsstelle nach § 16 BGG, ein Unternehmen auf
  die Marktüberwachung. Vertauscht wären beide Texte falsch — am Ende eines
  Dokuments, das bis dahin vollkommen plausibel klingt. Das ist der Test, um den
  `islands/accessibility.test.ts` herum gebaut ist.
- **Jeder Datenschutz-Baustein nennt eine Rechtsgrundlage.** Ohne sie erfüllt
  der Text Art. 13 DSGVO nicht, sieht aber vollständig aus. Einwilligungs-
  pflichtige Dienste (Analyse, Karten, Videos, Google Fonts) dürfen **nicht**
  auf ein berechtigtes Interesse gestützt werden; ein Test prüft genau das.
- **WebP trägt keinen maschinenlesbaren Hinweis.** Ein XMP-Abschnitt in einem
  RIFF-Container wäre machbar, aber halbfertig. Die Insel sagt es dem Nutzer,
  statt es zu verschweigen — ein Werkzeug für eine Kennzeichnungspflicht darf
  nicht so tun, als hätte es gekennzeichnet.
- **Ein Canvas-Durchlauf verwirft die EXIF-Daten des Originals.** Das steht in
  der Oberfläche und im Ratgeber, nicht als Fußnote.

## Tests

```bash
npm run test:run    # vitest, 131 Tests
```

- `src/index.test.ts` — Manifest-Vertrag: Slugs, Budgets, Verdrahtung, i18n.
- `islands/imprint.test.ts`, `privacy.test.ts`, `accessibility.test.ts` — die
  Klauselauswahl im node-Umfeld, **beide Richtungen**: eine gesetzte Ankreuzung
  bringt den Abschnitt, eine gelöschte nimmt ihn wieder weg. Ein Abschnitt, der
  nach dem Abwählen stehen bleibt, ist in einem Baukasten der Fehler, der am
  längsten unbemerkt bleibt — der Text sieht weiterhin richtig aus, er ist nur
  nicht mehr wahr.
- `islands/metadata.test.ts` — Bytearithmetik. Der `crc32`-Test vergleicht gegen
  den Katalogwert `0xCBF43926`; ohne einen festen Wert prüfte er nur, dass die
  Funktion mit sich selbst übereinstimmt, und das täte sie auch mit einem
  falschen Polynom.
- `islands/badge.test.ts` — die Plakette wächst mit der Bildbreite und bleibt
  im Bild.
- `islands/ImprintGenerator.test.tsx` — der Weg vom Bedienelement zur Vorschau
  (jsdom über einen `@vitest-environment`-Docblock).

Die Inseln opten einzeln in jsdom. Ein Default auf jsdom kostete den ganzen
Lauf: die sechs node-Suiten brauchen kein DOM.

## Gotchas

- **Jede Insel nimmt eine optionale `lang`-Prop, und Deutsch ist der Default —
  in der Shell UND in der Insel.** Ein Aufrufer ohne die Prop bekommt genau das
  Verhalten von vor dem englischen Baum, und die gesamte deutsche Testreihe ist
  damit zugleich der Regressionstest dafür.
- **`type Lang = "de" | "en"` steht lokal in `islands/shared.ts`**, nicht im
  Contract. Die Packs erscheinen unabhängig; ein geteilter Typ machte aus jeder
  Sprachänderung einen Contract-Minor, den alle Packs nachziehen müssten.
- **Übersetzt werden Sätze, nicht die Auswahl.** Welche Klausel bei welcher
  Ankreuzung erscheint, ist in beiden Sprachen identisch; je ein Test pinnt die
  strukturelle Parität.
- **Dieses Pack liefert kein CSS.** Jedes Bedienelement trägt eine Klasse aus
  tds-shared: `field-boxed` an Eingabefeldern und Auswahllisten, `btn` plus
  Variante an Schaltflächen, `chip` an den Vorschlagsknöpfen, `tds-card` an
  Ergebnisflächen, `tds-alert` an Blockhinweisen. Ohne `field-boxed` rendert ein
  Eingabefeld **unsichtbar**, weil Tailwinds Preflight die Rahmen nullt.
  `npm run lint:primitives` läuft in CI.
- **`status-pill` ist ein Etikett, keine Blockmeldung.** Die Plakette hat
  `white-space: nowrap` und Versalien und ist für ein Wort gedacht. Ein ganzer
  Satz darin bricht nicht um: auf einem 390 Pixel breiten Fenster schob der
  Rechtshinweis das Dokument auf über 1100 Pixel. Sichtbar ist das nicht,
  weil `body { overflow-x: hidden }` den Überhang abschneidet — man findet es
  nur, indem man `document.documentElement.scrollWidth` misst. Für eine
  Meldung über mehrere Zeilen ist `tds-alert` (mit `--success` / `--warning` /
  `--danger`) die richtige Klasse; die Bibliothek sagt das im Kommentar über
  `.status-pill` auch selbst.
- **Nie einen Radius handschreiben.** Tailwind erzeugt aus einem Paket in
  `node_modules` keine Arbitrary Values; aus dieser Datei heraus wäre das keine
  Regel, sondern gar nichts. Immer die geteilte Klasse nehmen.
- **Eine Tailwind-Utility schlägt eine tds-shared-Klasse auf DEMSELBEN Element
  nicht.** tds-shared ist ungelayertes CSS. Utilities gehören auf einen
  Wrapper — siehe die Vorschaufläche in `islands/ui.tsx`.
- **Keine Arbitrary-Value-Klasse als Beispiel in diese Dokumentation
  schreiben.** Die Site scannt das Paket nach Utility-Klassen, extrahiert das
  Beispiel und erzeugt daraus eine ungültige CSS-Regel — sichtbar nur als
  „Found 1 warning while optimizing generated CSS".
- **`islands/` wird hier NICHT typgeprüft** (`tsconfig` deckt nur `src/**/*`
  ab). Der Site-Build ist die eigentliche Schranke für eine Markup-Änderung.
  Für die Byte-Arbeit in `metadata.ts` ist der Typ deshalb ausgeschrieben:
  `Uint8Array<ArrayBuffer>`. Ein blankes `Uint8Array` kann seit TypeScript 5.7
  auch über einem `SharedArrayBuffer` liegen und ist dann kein gültiger
  Bestandteil eines `Blob` — das fiele erst im Site-Build auf.
- `component` ist ein Paket-Subpfad über `exports`, nie ein relativer Pfad.
- Tool-`id` und `slug` sind global eindeutig über alle komponierten Packs.

## Kommandos

```bash
npm install --no-package-lock
npm run type-check
npm run lint:primitives
npm run test:run
npm run build
```

Ein Push auf `main` veröffentlicht automatisch einen Patch @latest und stößt
einen Rebuild von `tds-tools-frontend` an; der manuelle Release-Knopf ist für
Minor und Major.
