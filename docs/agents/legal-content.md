# Regeln für die erzeugten Rechtstexte

Diese Regeln gehören nur diesem Pack. Jede ist durch einen Test abgesichert.

## Muster-Hinweis nur in der Oberfläche

Der Hinweis, dass es sich um ein Muster handelt, steht in der Oberfläche, **nie im
erzeugten Text**. Sonst wandert er beim Einfügen mit auf die Seite des Nutzers und wird
dort als Teil des Pflichttextes gelesen. `islands/imprint.test.ts` prüft beide Hälften.

## Impressum

- **Kein Verweis auf die ODR-Plattform.** Die EU-Kommission hat sie am 20. Juli 2025
  abgeschaltet. Der Verweis steht noch in fast jedem frei verfügbaren Muster und ist ein
  toter Link mitten im Pflichttext. Ein Test hält ihn draußen.
- **Keine Steuernummer.** § 5 DDG verlangt die USt-IdNr. Ein Feld für die Steuernummer
  brächte Nutzer dazu, eine nicht öffentliche Angabe zu veröffentlichen.

## Datenschutzerklärung

- **Jeder Baustein nennt eine Rechtsgrundlage.** Ohne sie erfüllt der Text Art. 13 DSGVO
  nicht, sieht aber vollständig aus.
- Einwilligungspflichtige Dienste (Analyse, Karten, Videos, Google Fonts) dürfen **nicht**
  auf ein berechtigtes Interesse gestützt werden. Ein Test prüft genau das.

## Barrierefreiheitserklärung: zwei Regime

Eine öffentliche Stelle verweist am Ende auf die Schlichtungsstelle nach § 16 BGG, ein
Unternehmen auf die Marktüberwachung. Vertauscht wären beide Texte falsch, und zwar am
Ende eines Dokuments, das bis dahin plausibel klingt. `islands/accessibility.test.ts`
ist um diesen Fall herum gebaut.

## KI-Kennzeichnung von Bildern

- **WebP trägt keinen maschinenlesbaren Hinweis.** XMP in einem RIFF-Container wäre
  machbar, aber halbfertig. Die Insel sagt es dem Nutzer, statt es zu verschweigen. Ein
  Werkzeug für eine Kennzeichnungspflicht darf nicht so tun, als hätte es gekennzeichnet.
- **Ein Canvas-Durchlauf verwirft die EXIF-Daten des Originals.** Das steht in der
  Oberfläche und im Ratgeber, nicht als Fußnote.
