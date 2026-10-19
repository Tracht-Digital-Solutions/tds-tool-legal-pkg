/**
 * Gemeinsame Helfer der vier Werkzeuge dieses Packs.
 *
 * Bewusst eine `.ts`-Datei ohne JSX: die Textaufbau-Funktionen sollen im
 * node-Umfeld getestet werden können, ohne dass vitest dafür jsdom hochfährt.
 */

import { downloadText as downloadAny } from "@tracht-digital-solutions/tds-shared/download";

/**
 * Die Sprachen, die die Tools-Site veröffentlicht.
 *
 * Lokal deklariert statt aus dem Contract importiert — die Packs erscheinen
 * unabhängig voneinander, und ein geteilter Typ machte aus jeder
 * Sprachänderung einen Contract-Minor, den anschließend alle Packs nachziehen
 * müssten. Zwei String-Literale sind diese Kopplung nicht wert.
 */
export type Lang = "de" | "en";

/**
 * Downloads and the "Kopiert ✓" flag come from tds-shared (`./download`,
 * `./clipboard`): the timer is cleared on unmount and only a real copy raises
 * the flag.
 */
export { downloadBlob } from "@tracht-digital-solutions/tds-shared/download";
export { useCopyFlag } from "@tracht-digital-solutions/tds-shared/clipboard";

/** Klartext als `.txt` herunterladen. */
export function downloadText(text: string, filename: string): void {
  downloadAny(text, filename);
}

/** HTML-Bruchstück als `.html` herunterladen. */
export function downloadHtml(html: string, filename: string): void {
  downloadAny(html, filename, "text/html;charset=utf-8");
}

/**
 * Ein Abschnitt des erzeugten Dokuments.
 *
 * Überschrift plus Absätze — dieselbe Struktur speist die Klartext- und die
 * HTML-Ausgabe, damit die beiden nicht auseinanderlaufen. Ein leerer
 * `paragraphs`-Array ist zulässig (eine reine Zwischenüberschrift), ein
 * Abschnitt ohne Überschrift ist es nicht.
 */
export interface Section {
  heading: string;
  paragraphs: string[];
}

/** Leerwerte aussortieren und Zeilen trimmen — Formulareingaben sind roh. */
export const clean = (value: string | undefined | null): string => (value ?? "").trim();

/** Nur die belegten Teile, mit dem Trenner verbunden. */
export const join = (parts: (string | undefined | null)[], separator = ", "): string =>
  parts.map(clean).filter(Boolean).join(separator);

/** Klartextfassung: Titel, dann je Abschnitt Überschrift und Absätze. */
export function renderText(title: string, sections: Section[]): string {
  const blocks: string[] = [clean(title)];
  for (const section of sections) {
    const paragraphs = section.paragraphs.map(clean).filter(Boolean);
    blocks.push([clean(section.heading), ...paragraphs].join("\n\n"));
  }
  return blocks.filter(Boolean).join("\n\n") + "\n";
}

/** Für die HTML-Ausgabe: die vier Zeichen, die in Textinhalt gefährlich sind. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * HTML-Fassung zum Einfügen in ein CMS.
 *
 * Ohne Inline-Styles und ohne Klassen: der Text soll die Typografie der
 * Zielseite erben. Zeilenumbrüche innerhalb eines Absatzes werden zu
 * Zeilenumbruch-Elementen, weil die Anschriftenblöcke sonst zu einer Zeile
 * zusammenlaufen.
 */
export function renderHtml(title: string, sections: Section[]): string {
  const lines: string[] = ["<section>", `  <h1>${escapeHtml(clean(title))}</h1>`];
  for (const section of sections) {
    lines.push(`  <h2>${escapeHtml(clean(section.heading))}</h2>`);
    for (const paragraph of section.paragraphs.map(clean).filter(Boolean)) {
      lines.push(`  <p>${escapeHtml(paragraph).split("\n").join("<br />\n  ")}</p>`);
    }
  }
  lines.push("</section>");
  return lines.join("\n") + "\n";
}

/**
 * Der Anbieterblock, den alle drei Textgeneratoren brauchen.
 *
 * Eine gemeinsame Form statt dreier Kopien: wer das Impressum ausgefüllt hat,
 * soll die Datenschutzerklärung nicht mit denselben Feldern von vorn beginnen
 * müssen, und der Verantwortliche im Sinne der DSGVO ist derselbe Betrieb wie
 * der Anbieter im Sinne des DDG.
 */
export interface Provider {
  company: string;
  represented: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
}

export const emptyProvider: Provider = {
  company: "",
  represented: "",
  street: "",
  postalCode: "",
  city: "",
  country: "",
  phone: "",
  email: "",
  website: "",
};

/** Anschrift als Block, wie sie in jedem der drei Dokumente steht. */
export function addressBlock(provider: Provider): string {
  return [
    clean(provider.company),
    clean(provider.street),
    join([provider.postalCode, provider.city], " "),
    clean(provider.country),
  ]
    .filter(Boolean)
    .join("\n");
}

/** Kontaktzeilen, beschriftet in der Sprache des Dokuments. */
export function contactBlock(provider: Provider, lang: Lang): string {
  const labels = lang === "de" ? { phone: "Telefon", email: "E-Mail", web: "Web" } : { phone: "Phone", email: "Email", web: "Web" };
  return [
    clean(provider.phone) && `${labels.phone}: ${clean(provider.phone)}`,
    clean(provider.email) && `${labels.email}: ${clean(provider.email)}`,
    clean(provider.website) && `${labels.web}: ${clean(provider.website)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Ein Dateiname ohne Zeichen, an denen ein Dateisystem oder ein Browser stolpert. */
export function safeFilename(base: string, extension: string): string {
  const slug = base
    .toLowerCase()
    .replace(/[äàáâ]/g, "a")
    .replace(/[öòóô]/g, "o")
    .replace(/[üùúû]/g, "u")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "dokument"}.${extension}`;
}
