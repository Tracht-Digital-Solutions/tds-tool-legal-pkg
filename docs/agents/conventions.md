# Markup- und Styling-Regeln

Die Tools-Site rendert die `blog`-Oberfläche in der flachen Variante (`data-flat`). Eine
Oberflächen-Schicht setzt nur Tokens; sie erreichen ein Element über geteilte Klassen.

## Jedes Bedienelement trägt eine tds-shared-Klasse

Dieses Pack liefert **kein CSS**.

| Element | Klasse |
|---|---|
| Eingabefelder, Auswahllisten | `field-boxed` |
| Schaltflächen | `btn` plus Variante |
| Vorschlagsknöpfe | `chip` |
| Ergebnisflächen | `tds-card` |
| Blockhinweise | `tds-alert` |

- Ohne `field-boxed` rendert ein Eingabefeld **unsichtbar**, weil Tailwinds Preflight die
  Rahmen nullt.
- `npm run lint:primitives` läuft in CI. Das Skript ist eine Kopie des Seeds
  in `tds-ext-template-pkg`; Änderungen gehören dorthin (siehe
  `tds-ext-template-pkg/docs/agents/lint-primitives.md`).

## Radien, Utilities, Linien

- **Nie einen Radius handschreiben.** Tailwind erzeugt aus einem Paket in `node_modules`
  keine Arbitrary Values; das wäre keine Regel, sondern gar nichts. Immer die geteilte
  Klasse nehmen.
- **Eine Tailwind-Utility schlägt eine tds-shared-Klasse auf demselben Element nicht.**
  tds-shared ist ungelayertes CSS. Utilities gehören auf einen Wrapper, siehe die
  Vorschaufläche in `islands/ui.tsx`.
- **Keine Linien ziehen.** Die Site ist randlos (`data-flat`). Trennung über Fläche, Ton
  und Abstand.
- **Keine Arbitrary-Value-Klasse als Beispiel in README oder Quelltext-Kommentare
  schreiben.** Die Site scannt das Paket nach Utility-Klassen, extrahiert das Beispiel
  und erzeugt eine ungültige CSS-Regel, sichtbar nur als
  „Found 1 warning while optimizing generated CSS".

## Status und Rückmeldungen

- **`status-pill` ist ein Etikett für ein Wort, keine Blockmeldung.** Die Plakette hat
  `white-space: nowrap` und Versalien. Ein ganzer Satz darin bricht nicht um: auf einem
  390 px breiten Fenster schob der Rechtshinweis das Dokument auf über 1100 px. Sichtbar
  ist das nicht, weil `body { overflow-x: hidden }` den Überhang abschneidet; man findet
  es nur über `document.documentElement.scrollWidth`.
- Für eine Meldung über mehrere Zeilen ist `tds-alert` (`--success` / `--warning` /
  `--danger`) die richtige Klasse.
- **`tds-appear` gehört tds-shared (ab 0.38.8).** Die Klasse blendet ein Ergebnis beim
  **Einfügen** ein, ohne Skript; das ist die einzige Bewegung, die ein öffentliches
  Werkzeug tragen darf. Ein Element, das nur seinen Text ändert, animiert nicht erneut;
  eine dauerhafte Ausgabebox braucht deshalb einen `key` auf dem Wert.
