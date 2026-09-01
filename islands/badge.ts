import type { Lang } from "./shared";

/**
 * Die Geometrie der KI-Plakette.
 *
 * Getrennt von der Insel, weil das hier Rechnerei ist und der Fehler, den man
 * einer Plakette am wenigsten ansieht, ein Größenfehler ist: ein Badge mit
 * fester Pixelgröße ist auf einem 6000-Pixel-Foto eine Briefmarke und auf
 * einem Vorschaubild ein Balken. Alle Maße hängen deshalb an der Bildbreite,
 * und die Vorschau rechnet mit derselben Funktion wie die Ausgabe — sonst
 * sitzt das Badge im heruntergeladenen Bild woanders als in der Vorschau.
 */

export type Corner = "tl" | "tr" | "bl" | "br";
export type BadgeStyle = "dark" | "light";

export const CORNERS: Corner[] = ["tl", "tr", "bl", "br"];

export interface BadgeOptions {
  text: string;
  corner: Corner;
  /** Höhe des Badges in Prozent der Bildbreite. */
  scale: number;
  /** Deckkraft der Fläche, 0…1. */
  opacity: number;
  style: BadgeStyle;
}

export const defaultBadge: BadgeOptions = {
  text: "KI-generiert",
  corner: "br",
  scale: 4,
  opacity: 0.75,
  style: "dark",
};

/** Vorschläge für den Badge-Text; frei überschreibbar. */
export function presetTexts(lang: Lang): string[] {
  return lang === "de"
    ? ["KI-generiert", "Mit KI erstellt", "KI-bearbeitet", "AI-generated"]
    : ["AI-generated", "Created with AI", "AI-edited", "KI-generiert"];
}

/**
 * Schriftgröße aus der Bildbreite.
 *
 * Untergrenze 10 Pixel: darunter ist der Hinweis auf keinem Bildschirm mehr
 * lesbar, und ein unlesbarer Hinweis erfüllt die Offenlegung nicht.
 */
export function badgeFontSize(imageWidth: number, scale: number): number {
  return Math.max(10, Math.round((imageWidth * scale) / 100));
}

export interface BadgeRect {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  textX: number;
  textY: number;
}

/**
 * Lage und Größe der Fläche für einen bereits gemessenen Text.
 *
 * `textWidth` kommt aus `measureText` und damit aus dem Browser; die
 * Platzierung darum herum ist reine Arithmetik und wird als solche geprüft.
 */
export function badgeLayout(
  imageWidth: number,
  imageHeight: number,
  textWidth: number,
  fontSize: number,
  corner: Corner,
): BadgeRect {
  const paddingX = Math.round(fontSize * 0.6);
  const paddingY = Math.round(fontSize * 0.35);
  const width = Math.round(textWidth + paddingX * 2);
  const height = Math.round(fontSize + paddingY * 2);
  const margin = Math.round(fontSize * 0.6);

  const left = corner === "tl" || corner === "bl";
  const top = corner === "tl" || corner === "tr";

  const x = left ? margin : Math.max(margin, imageWidth - margin - width);
  const y = top ? margin : Math.max(margin, imageHeight - margin - height);

  return {
    x,
    y,
    width,
    height,
    radius: Math.round(height / 4),
    textX: x + paddingX,
    textY: y + paddingY + fontSize * 0.8,
  };
}

/** Flächen- und Schriftfarbe der beiden Stile. */
export function badgeColors(style: BadgeStyle, opacity: number): { fill: string; text: string } {
  const clamped = Math.min(1, Math.max(0, opacity));
  return style === "dark"
    ? { fill: `rgba(17, 24, 39, ${clamped})`, text: "#ffffff" }
    : { fill: `rgba(255, 255, 255, ${clamped})`, text: "#111827" };
}

/**
 * Die Plakette auf eine Zeichenfläche bringen.
 *
 * Abgerundete Ecken über `roundRect`, mit Rückfall auf ein Rechteck: die
 * Methode fehlt in älteren Browsern und in der Testumgebung, und ein Badge mit
 * eckigen Ecken ist immer noch eine Kennzeichnung — ein Absturz nicht.
 */
export function drawBadge(
  ctx: CanvasRenderingContext2D,
  imageWidth: number,
  imageHeight: number,
  options: BadgeOptions,
): void {
  const text = options.text.trim();
  if (!text) return;

  const fontSize = badgeFontSize(imageWidth, options.scale);
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textBaseline = "alphabetic";

  const textWidth = ctx.measureText(text).width;
  const rect = badgeLayout(imageWidth, imageHeight, textWidth, fontSize, options.corner);
  const colors = badgeColors(options.style, options.opacity);

  ctx.fillStyle = colors.fill;
  const rounded = ctx as CanvasRenderingContext2D & {
    roundRect?: (x: number, y: number, w: number, h: number, r: number) => void;
  };
  if (typeof rounded.roundRect === "function") {
    ctx.beginPath();
    rounded.roundRect(rect.x, rect.y, rect.width, rect.height, rect.radius);
    ctx.fill();
  } else {
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  }

  ctx.fillStyle = colors.text;
  ctx.fillText(text, rect.textX, rect.textY);
}

/**
 * Der Hinweis, der in die Datei geschrieben wird.
 *
 * Immer englisch beginnend, weil das die Zeichenkette ist, nach der Werkzeuge
 * und Plattformen suchen; der eingegebene Badge-Text hängt hinten an, damit
 * die Datei dasselbe sagt wie das Bild.
 */
export function machineNote(badgeText: string): string {
  const text = badgeText.trim();
  return text ? `AI-generated image. ${text}` : "AI-generated image.";
}

/** Ein fertiger Satz für Bildunterschrift oder Alternativtext. */
export function captionFor(badgeText: string, lang: Lang): string {
  const text = badgeText.trim() || (lang === "de" ? "KI-generiert" : "AI-generated");
  return lang === "de"
    ? `Dieses Bild wurde mit künstlicher Intelligenz erzeugt (${text}).`
    : `This image was generated using artificial intelligence (${text}).`;
}
