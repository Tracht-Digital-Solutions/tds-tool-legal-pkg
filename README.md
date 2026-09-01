# @tracht-digital-solutions/tds-tool-legal

Werkzeuge für Rechts- und Kennzeichnungspflichten auf der **TDS-Tools-Plattform**
(`tds-tools-frontend`). Vollständig clientseitig — nichts verlässt den Browser,
und das Pack hat keine Laufzeit-Dependency.

## Werkzeuge

| id | slug | premium | erzeugt |
|---|---|---|---|
| `imprint-generator` | `impressum-generator` | nein | Muster-Impressum nach § 5 DDG und § 18 Abs. 2 MStV |
| `privacy-policy-generator` | `datenschutzerklaerung-generator` | nein | Muster-Datenschutzerklärung nach DSGVO, aus Bausteinen |
| `accessibility-statement-generator` | `barrierefreiheitserklaerung-generator` | nein | Barrierefreiheitserklärung nach BFSG oder BITV 2.0 |
| `ai-image-badge` | `ki-kennzeichnung-bilder` | nein | KI-Kennzeichnung: sichtbares Badge plus Hinweis in der Datei |

Die drei Textgeneratoren liefern **Muster, keine Rechtsberatung**. Der Hinweis
darauf steht in der Oberfläche über und unter dem Formular — und bewusst nicht
im erzeugten Text, damit er beim Einfügen nicht auf der Seite des Nutzers
landet.

## Ausgabe

Die Textgeneratoren zeigen eine Vorschau und bieten Kopieren, `.txt` und
`.html` an; Klartext und HTML entstehen aus derselben Abschnittsliste wie die
Vorschau. Die KI-Kennzeichnung zeichnet die Plakette auf eine Zeichenfläche und
schreibt den maschinenlesbaren Hinweis als `tEXt`-/`iTXt`-Abschnitt (PNG) oder
als Kommentarsegment (JPEG) in die Datei. WebP kann ihn nicht tragen; die Insel
sagt das.

## Entwickeln

```bash
npm install --no-package-lock
npm run type-check
npm run lint:primitives
npm run test:run     # vitest — 131 Tests
npm run build
```

## Tests

- **`src/index.test.ts`** — Manifest-Vertrag: eindeutige und URL-sichere
  Kennungen und Slugs, die SEO-Budgets, dass alle vier Werkzeuge frei bleiben,
  und dass jede `component` auf eine Datei zeigt, die `files` auch
  veröffentlicht.
- **`islands/imprint.test.ts` · `privacy.test.ts` · `accessibility.test.ts`** —
  der Textaufbau ohne DOM. Geprüft wird die Klauselauswahl in beiden
  Richtungen, die Sprachparität der Struktur und drei Dinge, die man einem
  fertigen Text nicht ansieht: dass nirgends auf die 2025 abgeschaltete
  ODR-Plattform verwiesen wird, dass jeder Datenschutz-Baustein eine
  Rechtsgrundlage nennt, und dass eine öffentliche Stelle auf die
  Schlichtungsstelle nach § 16 BGG und ein Unternehmen auf die Marktüberwachung
  verwiesen wird.
- **`islands/metadata.test.ts`** — die eingebetteten Hinweise: gültige
  Prüfsummen, der Textabschnitt hinter dem IHDR, die mitgezählten JPEG-
  Längenbytes, und `crc32` gegen den Katalogwert `0xCBF43926`.
- **`islands/badge.test.ts`** — die Plakette wächst mit der Bildbreite und
  bleibt in jeder Ecke vollständig im Bild.
- **`islands/ImprintGenerator.test.tsx`** — der Weg vom Bedienelement zur
  Vorschau (jsdom).

Die `.astro`-Shells und die `.tsx`-Inseln werden erst im **Site**-Build
typgeprüft und kompiliert. Release beim Push auf `main` (automatischer Patch
@latest; der manuelle Knopf ist für Minor und Major). Das Plattform-Modell steht
in `tds-tools-contract-pkg`.
