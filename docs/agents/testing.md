# Tests

`npm run test:run` startet vitest. Die Inseln opten einzeln per
`@vitest-environment`-Docblock in jsdom. Ein jsdom-Default kostete den ganzen Lauf; die
node-Suiten brauchen kein DOM.

| Suite | Prüft |
|---|---|
| `src/index.test.ts` | Manifest-Vertrag: Slugs, Budgets, Verdrahtung, i18n; keine Premium-Felder |
| `islands/imprint.test.ts`, `privacy.test.ts`, `accessibility.test.ts` | Klauselauswahl im node-Umfeld, **beide Richtungen** |
| `islands/metadata.test.ts` | Bytearithmetik; `crc32` gegen den Katalogwert `0xCBF43926` |
| `islands/badge.test.ts` | Die Plakette wächst mit der Bildbreite und bleibt im Bild |
| `islands/ImprintGenerator.test.tsx` | Weg vom Bedienelement zur Vorschau (jsdom) |

Warum so:

- **Beide Richtungen:** Eine gesetzte Ankreuzung bringt den Abschnitt, eine gelöschte
  nimmt ihn wieder weg. Ein Abschnitt, der nach dem Abwählen stehen bleibt, ist in einem
  Baukasten der Fehler, der am längsten unbemerkt bleibt: Der Text sieht richtig aus, ist
  aber nicht mehr wahr.
- **Fester CRC-Wert:** Ohne ihn prüfte der Test nur, dass die Funktion mit sich selbst
  übereinstimmt, und das täte sie auch mit einem falschen Polynom.
