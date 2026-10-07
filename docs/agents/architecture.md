# Architektur

## Aufbau

- `src/index.ts` — das `ToolPackManifest` mit vier Werkzeugen. Die einzige Datei, die
  tsup baut und `tsc` prüft.
- `tools/*.astro` — die Shells, die die Site unter `/tools/<slug>` rendert.
- `islands/*.tsx` — hydratisierte React-Inseln, vollständig clientseitig.
- `islands/imprint.ts`, `privacy.ts`, `accessibility.ts` — der **Textaufbau** als reine
  Funktionen, getrennt von der Oberfläche, damit die Klauselauswahl ohne DOM prüfbar ist.
- `islands/badge.ts`, `metadata.ts` — Geometrie und Dateiformate der KI-Kennzeichnung,
  ebenfalls DOM-frei.
- `islands/ui.tsx` — die geteilten Formularbausteine der drei Textgeneratoren.
- `islands/shared.ts` — Klartext-/HTML-Ausgabe, Download, Kopier-Zustand, Anbieterblock.

## Die vier Werkzeuge

| Slug | Was es erzeugt |
|---|---|
| `impressum-generator` | Muster nach § 5 DDG und § 18 Abs. 2 MStV |
| `datenschutzerklaerung-generator` | Muster nach DSGVO, modular über Ankreuzfelder |
| `barrierefreiheitserklaerung-generator` | Muster nach BFSG **oder** BITV 2.0 / § 12b BGG |
| `ki-kennzeichnung-bilder` | Sichtbares Badge plus maschinenlesbarer Hinweis (Art. 50 KI-VO) |

## Manifest-Vertrag

- `component` ist ein Paket-Subpfad über `exports`, nie ein relativer Pfad.
- Tool-`id` und `slug` sind global eindeutig über alle komponierten Packs.
- Alle vier sind **frei und ohne Anmeldung**. Die Felder `premiumDefault`,
  `requiresLoginDefault` und `priceCentsDefault` fehlen absichtlich. Ein versehentlich
  gesetztes `premiumDefault` schöbe die Seite hinter das `ToolGate`, ohne dass etwas
  rot würde; `src/index.test.ts` prüft es.

## Sprachen (DE/EN)

- **Jede Insel nimmt eine optionale `lang`-Prop, Deutsch ist der Default, in der Shell
  UND in der Insel.** Ein Aufrufer ohne die Prop bekommt das bisherige Verhalten. Die
  deutsche Testreihe ist damit zugleich der Regressionstest dafür.
- **`type Lang = "de" | "en"` steht lokal in `islands/shared.ts`**, nicht im Contract. Die
  Packs erscheinen unabhängig; ein geteilter Typ machte aus jeder Sprachänderung einen
  Contract-Minor, den alle Packs nachziehen müssten.
- **Übersetzt werden Sätze, nicht die Auswahl.** Welche Klausel bei welcher Ankreuzung
  erscheint, ist in beiden Sprachen identisch; je ein Test pinnt die strukturelle Parität.

## Typprüfung

`islands/` wird hier **nicht** typgeprüft (`tsconfig` deckt nur `src/**` ab). Der
Site-Build ist die eigentliche Schranke für eine Markup-Änderung.

Für die Byte-Arbeit in `metadata.ts` ist der Typ deshalb ausgeschrieben:
`Uint8Array<ArrayBuffer>`. Ein blankes `Uint8Array` kann seit TypeScript 5.7 auch über
einem `SharedArrayBuffer` liegen und ist dann kein gültiger Bestandteil eines `Blob`.
Das fiele erst im Site-Build auf.
