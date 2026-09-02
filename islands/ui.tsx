import type { ReactNode } from "react";

import {
  downloadHtml,
  downloadText,
  renderHtml,
  renderText,
  safeFilename,
  useCopyFlag,
  type Lang,
  type Section,
} from "./shared";

/**
 * Die Formularbausteine der drei Textgeneratoren.
 *
 * An einer Stelle statt dreimal: die Generatoren unterscheiden sich in ihren
 * Klauseln, nicht in ihrer Bedienung, und drei Kopien desselben Eingabefeldes
 * driften auseinander, sobald eines davon einen Hinweis bekommt.
 *
 * Die Geometrie kommt vollständig aus tds-shared. Das Pack liefert kein CSS,
 * also trägt jedes Bedienelement eine geteilte Klasse: ohne `field-boxed`
 * rendert ein Eingabefeld unsichtbar, weil Tailwinds Preflight die Rahmen
 * nullt, und ohne `btn` hat eine Schaltfläche weder Innenabstand noch
 * Berührungsfläche.
 */
const field = "field-boxed w-full";

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "url" | "date";
  hint?: string;
  required?: boolean;
}

export function Field({ label, value, onChange, placeholder, type = "text", hint, required }: FieldProps) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block opacity-80">
        {label}
        {required ? <span className="text-[color:var(--color-danger)]"> *</span> : null}
      </span>
      <input
        className={field}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <span className="mt-1 block text-xs opacity-60">{hint}</span> : null}
    </label>
  );
}

interface AreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: string;
}

export function Area({ label, value, onChange, placeholder, rows = 4, hint }: AreaProps) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block opacity-80">{label}</span>
      <textarea
        className={field}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <span className="mt-1 block text-xs opacity-60">{hint}</span> : null}
    </label>
  );
}

interface ChoiceProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  hint?: string;
}

export function Choice<T extends string>({ label, value, options, onChange, hint }: ChoiceProps<T>) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block opacity-80">{label}</span>
      <select className={field} value={value} onChange={(event) => onChange(event.target.value as T)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <span className="mt-1 block text-xs opacity-60">{hint}</span> : null}
    </label>
  );
}

interface CheckProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}

export function Check({ label, checked, onChange, hint }: CheckProps) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input
        type="checkbox"
        className="mt-1"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        {label}
        {hint ? <span className="mt-0.5 block text-xs opacity-60">{hint}</span> : null}
      </span>
    </label>
  );
}

interface RadiosProps<T extends string> {
  legend: string;
  name: string;
  value: T;
  options: { value: T; label: string; hint?: string }[];
  onChange: (value: T) => void;
}

export function Radios<T extends string>({ legend, name, value, options, onChange }: RadiosProps<T>) {
  return (
    <fieldset className="text-sm">
      <legend className="mb-2 opacity-80">{legend}</legend>
      <div className="grid gap-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-start gap-2">
            <input
              type="radio"
              className="mt-1"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>
              {option.label}
              {option.hint ? <span className="mt-0.5 block text-xs opacity-60">{option.hint}</span> : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Ein beschrifteter Abschnitt des Formulars. */
export function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold tracking-wide uppercase opacity-70">{title}</h3>
      {children}
    </section>
  );
}

interface Notes {
  disclaimer: string;
  missing: (fields: string) => string;
  preview: string;
  copy: string;
  copied: string;
  txt: string;
  html: string;
  footer: string;
}

const NOTE = {
  de: {
    disclaimer:
      "Dieses Werkzeug erzeugt ein Muster zur Orientierung. Es ersetzt keine Rechtsberatung und keine Prüfung Ihres konkreten Falls durch eine Anwältin oder einen Anwalt.",
    missing: (fields: string) => `Für einen vollständigen Text fehlt noch: ${fields}.`,
    preview: "Vorschau",
    copy: "Kopieren",
    copied: "Kopiert ✓",
    txt: "Als .txt speichern",
    html: "Als .html speichern",
    footer:
      "Prüfen Sie den Text vor der Veröffentlichung. Die Pflichtangaben hängen an Ihrem Betrieb, nicht an diesem Formular — und dieses Werkzeug kennt Ihren Betrieb nicht.",
  },
  en: {
    disclaimer:
      "This tool produces a sample for orientation. It is not legal advice and does not replace having your specific case reviewed by a lawyer.",
    missing: (fields: string) => `Still missing for a complete text: ${fields}.`,
    preview: "Preview",
    copy: "Copy",
    copied: "Copied ✓",
    txt: "Save as .txt",
    html: "Save as .html",
    footer:
      "Review the text before you publish it. Which details are mandatory depends on your business, not on this form — and this tool does not know your business.",
  },
} satisfies Record<Lang, Notes>;

/**
 * Der Rechtshinweis. Steht über dem Formular und noch einmal unter der Ausgabe.
 *
 * `.tds-alert` und nicht `.status-pill`: die Plakette ist ein kurzes
 * Zustandsetikett mit `white-space: nowrap` und Versalien, gedacht für ein
 * Wort. Ein ganzer Satz darin bricht nicht um, sondern schiebt das Dokument
 * auseinander — auf einem 390 Pixel breiten Fenster auf über 1100 Pixel. Zu
 * sehen ist davon nichts, weil `body { overflow-x: hidden }` den Überhang
 * abschneidet; man merkt es erst, wenn man die Dokumentbreite misst.
 */
export function Disclaimer({ lang }: { lang: Lang }) {
  return (
    <p className="tds-alert tds-alert--warning" role="note">
      {NOTE[lang].disclaimer}
    </p>
  );
}

interface OutputProps {
  lang: Lang;
  title: string;
  sections: Section[];
  missing: string[];
  filenameBase: string;
}

/**
 * Vorschau und Ausgabe.
 *
 * Klartext und HTML entstehen aus derselben Abschnittsliste wie die Vorschau —
 * eine zweite Quelle für dieselben Sätze wäre die Stelle, an der die
 * heruntergeladene Fassung von der angezeigten abweicht, und zwar erst
 * Wochen später und ohne Fehlermeldung.
 *
 * Der Rechtshinweis steht bewusst NICHT im erzeugten Text: er würde beim
 * Einfügen mit auf die Seite des Nutzers wandern und dort als Teil des
 * Pflichttextes gelesen.
 */
export function DocumentOutput({ lang, title, sections, missing, filenameBase }: OutputProps) {
  const t = NOTE[lang];
  const { copied, copy } = useCopyFlag();
  const text = renderText(title, sections);
  const html = renderHtml(title, sections);

  return (
    <div className="space-y-3">
      {missing.length > 0 && <p className="text-xs opacity-70">{t.missing(missing.join(", "))}</p>}

      <h3 className="text-sm font-semibold tracking-wide uppercase opacity-70">{t.preview}</h3>

      {/* Die Utilities sitzen auf dem inneren Element: ungelayertes CSS aus
          tds-shared schlaegt jede Tailwind-Utility auf DEMSELBEN Element, und
          `.tds-card` bringt seine eigene Flaeche mit. */}
      <div className="tds-card p-4">
        <output className="block max-h-96 w-full overflow-auto text-sm whitespace-pre-wrap">
          {text}
        </output>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={() => void copy(text)}>
          {copied ? t.copied : t.copy}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => downloadText(text, safeFilename(filenameBase, "txt"))}
        >
          {t.txt}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => downloadHtml(html, safeFilename(filenameBase, "html"))}
        >
          {t.html}
        </button>
      </div>

      <p className="text-xs opacity-60">{t.footer}</p>
    </div>
  );
}
