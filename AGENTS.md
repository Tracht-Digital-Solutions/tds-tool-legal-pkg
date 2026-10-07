# AGENTS.md — tds-tool-legal-pkg

Tool-Pack für die öffentliche Tools-Plattform: vier Werkzeuge für Pflichten, die ein
Betrieb auf der eigenen Website erfüllen muss (Impressum, Datenschutzerklärung,
Barrierefreiheitserklärung, KI-Kennzeichnung). Gebaut gegen
`@tracht-digital-solutions/tds-tools-contract`, zur Build-Zeit in `tds-tools-frontend`
komponiert. Alles läuft im Browser, ohne Netzwerkaufruf und ohne Laufzeit-Dependency.

Plattform-Modell: `tds-tools-contract-pkg/AGENTS.md`. Schritt-für-Schritt-Anleitung:
`tds-tools-frontend/TOOLS-PLATFORM.md` (Abschnitt 5).

## Kommandos

```bash
npm install --no-package-lock   # nie npm ci; CI hat keinen Lockfile
npm run type-check              # tsc, nur src/**
npm run lint:primitives         # schlägt bei Bedienelement ohne geteilte Klasse fehl
npm run test:run                # vitest
npm run build                   # tsup
```

## Harte Regeln

- **Jeder Push auf `main` veröffentlicht einen Patch `@latest`** und baut `tds-tools-frontend` neu.
  Der manuelle Release-Knopf ist für Minor/Major. Reine Doku-Commits tragen `[skip ci]`.
- Alle vier Werkzeuge sind frei: `premiumDefault`, `requiresLoginDefault`, `priceCentsDefault` fehlen absichtlich.
- Der Muster-Hinweis steht in der Oberfläche, nie im erzeugten Text.
- Kein Verweis auf die ODR-Plattform, keine Steuernummer im Impressum.
- Übersetzt werden Sätze, nie die Klauselauswahl.
- Kein CSS ausliefern. `component` ist ein Paket-Subpfad. `id` und `slug` bleiben global eindeutig.
- Bleibt in der `0.1.x`-Linie. Die Site pinnt `^0.1.3`, ein 0.x-Caret ist minor-gesperrt.

## Themen-Dateien

| Datei | Lesen vor |
|---|---|
| [docs/agents/architecture.md](docs/agents/architecture.md) | Änderungen an Manifest, Dateiaufbau, Sprachen |
| [docs/agents/legal-content.md](docs/agents/legal-content.md) | Änderungen an Klauseln, Feldern oder erzeugten Texten |
| [docs/agents/conventions.md](docs/agents/conventions.md) | Markup oder Styling in `islands/` oder `tools/` |
| [docs/agents/testing.md](docs/agents/testing.md) | Tests schreiben oder ändern |

Workspace-Regeln: `../CLAUDE.md`. Repo-übergreifender Stand: `../MIGRATION-STATUS.md`.
