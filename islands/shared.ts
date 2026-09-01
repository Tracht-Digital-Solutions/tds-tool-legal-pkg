import { useEffect, useRef, useState } from "react";

/**
 * Gemeinsame Helfer der vier Werkzeuge dieses Packs.
 *
 * Bewusst eine `.ts`-Datei ohne JSX: die Textaufbau-Funktionen sollen im
 * node-Umfeld getestet werden können, ohne dass vitest dafür jsdom hochfährt.
 */

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
 * Eine Datei zum Herunterladen anbieten.
 *
 * Die Object-URL wird verzögert freigegeben: ein sofortiges `revoke` nach dem
 * Klick kommt in Firefox dem Download zuvor, und eine nie freigegebene URL
 * hält ihren Blob bis zum Schließen des Tabs am Leben.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Klartext als `.txt` herunterladen. */
export function downloadText(text: string, filename: string): void {
  downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), filename);
}

/** HTML-Bruchstück als `.html` herunterladen. */
export function downloadHtml(html: string, filename: string): void {
  downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), filename);
}

/**
 * Der „Kopiert ✓“-Zustand mit aufgeräumtem Timer.
 *
 * Der Reset wird in einem Ref geführt, damit das Aushängen der Insel ihn
 * löschen kann — eine Astro-Insel wird bei der Navigation abgebaut, und ein
 * laufender Timer setzt sonst den Zustand einer verschwundenen Komponente.
 */
export function useCopyFlag(delayMs = 1500) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  const copy = async (text: string): Promise<void> => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), delayMs);
    } catch {
      setCopied(false);
    }
  };

  return { copied, copy, reset: () => setCopied(false) };
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
