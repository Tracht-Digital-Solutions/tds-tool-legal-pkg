import { useEffect, useRef, useState } from "react";

import {
  captionFor,
  CORNERS,
  defaultBadge,
  drawBadge,
  machineNote,
  presetTexts,
  type BadgeOptions,
  type BadgeStyle,
  type Corner,
} from "./badge";
import { embedNote } from "./metadata";
import { safeFilename, useCopyFlag, type Lang } from "./shared";

/**
 * KI-Kennzeichnung für Bilder.
 *
 * Zwei Hälften, weil die Pflicht zwei Hälften hat: ein sichtbarer Hinweis für
 * den Menschen, der das Bild sieht, und ein maschinenlesbarer für alles, was
 * das Bild später verarbeitet. Beide entstehen hier im Browser; hochgeladen
 * wird nichts.
 *
 * Was das Werkzeug nebenbei tut und was es deshalb auch sagt: ein Durchlauf
 * über die Zeichenfläche verwirft die vorhandenen EXIF-Daten des Originals.
 * Bei einem Kennzeichnungswerkzeug ist das keine Fußnote — wer ein Bild
 * kennzeichnet, verliert dabei möglicherweise die Aufnahmedaten.
 */

/** Die Kanten des Vorschaubilds. Größere Bilder werden nur für die ANZEIGE verkleinert. */
const PREVIEW_MAX = 1200;

const SOFTWARE = "TD Tools — KI-Kennzeichnung (tools.tracht-digital.de)";

type Format = "image/png" | "image/jpeg" | "image/webp";

interface Strings {
  chooseImage: string;
  chooseHint: string;
  loadFailed: string;
  noCanvas: string;
  renderFailed: string;
  badgeText: string;
  presets: string;
  corner: string;
  corners: Record<Corner, string>;
  size: string;
  opacity: string;
  style: string;
  styleDark: string;
  styleLight: string;
  format: string;
  quality: string;
  embed: string;
  embedHint: string;
  embedWebp: string;
  build: string;
  building: string;
  download: string;
  downloadName: string;
  preview: string;
  result: string;
  resultAlt: string;
  embedded: string;
  notEmbedded: string;
  caption: string;
  copyCaption: string;
  copied: string;
  exifNote: string;
  privacyNote: string;
}

/** Deutsch ist der Default, hier wie in der Shell. */
const STRINGS = {
  de: {
    chooseImage: "Bild auswählen",
    chooseHint: "PNG, JPEG oder WebP. Das Bild verlässt Ihr Gerät nicht.",
    loadFailed: "Bild konnte nicht geladen werden.",
    noCanvas: "Zeichenfläche nicht verfügbar.",
    renderFailed: "Das Bild konnte nicht erzeugt werden.",
    badgeText: "Text auf der Plakette",
    presets: "Vorschläge",
    corner: "Ecke",
    corners: {
      tl: "Oben links",
      tr: "Oben rechts",
      bl: "Unten links",
      br: "Unten rechts",
    },
    size: "Größe",
    opacity: "Deckkraft",
    style: "Stil",
    styleDark: "Hell auf Dunkel",
    styleLight: "Dunkel auf Hell",
    format: "Format",
    quality: "Qualität",
    embed: "Maschinenlesbaren Hinweis einbetten",
    embedHint: "Wird als Textabschnitt (PNG) oder Kommentarsegment (JPEG) in die Datei geschrieben.",
    embedWebp: "WebP kann den maschinenlesbaren Hinweis nicht tragen — wählen Sie PNG oder JPEG.",
    build: "Bild erzeugen",
    building: "Erzeuge …",
    download: "Herunterladen",
    downloadName: "ki-gekennzeichnet",
    preview: "Vorschau",
    result: "Ergebnis",
    resultAlt: "Gekennzeichnetes Bild",
    embedded: "Hinweis in der Datei eingebettet.",
    notEmbedded: "Nur sichtbare Kennzeichnung — die Datei trägt keinen maschinenlesbaren Hinweis.",
    caption: "Bildunterschrift zum Mitkopieren",
    copyCaption: "Text kopieren",
    copied: "Kopiert ✓",
    exifNote:
      "Beim Erzeugen wird das Bild neu gezeichnet. Vorhandene Aufnahmedaten des Originals (EXIF) gehen dabei verloren.",
    privacyNote: "Das Bild wird ausschließlich in Ihrem Browser verarbeitet und niemals hochgeladen.",
  },
  en: {
    chooseImage: "Choose an image",
    chooseHint: "PNG, JPEG or WebP. The image never leaves your device.",
    loadFailed: "The image could not be loaded.",
    noCanvas: "Canvas is not available.",
    renderFailed: "The image could not be produced.",
    badgeText: "Text on the badge",
    presets: "Suggestions",
    corner: "Corner",
    corners: {
      tl: "Top left",
      tr: "Top right",
      bl: "Bottom left",
      br: "Bottom right",
    },
    size: "Size",
    opacity: "Opacity",
    style: "Style",
    styleDark: "Light on dark",
    styleLight: "Dark on light",
    format: "Format",
    quality: "Quality",
    embed: "Embed a machine-readable note",
    embedHint: "Written into the file as a text chunk (PNG) or a comment segment (JPEG).",
    embedWebp: "WebP cannot carry the machine-readable note — choose PNG or JPEG.",
    build: "Produce the image",
    building: "Producing …",
    download: "Download",
    downloadName: "ai-labelled",
    preview: "Preview",
    result: "Result",
    resultAlt: "Labelled image",
    embedded: "Note embedded in the file.",
    notEmbedded: "Visible label only — the file carries no machine-readable note.",
    caption: "Caption to copy",
    copyCaption: "Copy the text",
    copied: "Copied ✓",
    exifNote:
      "Producing the image redraws it. Any capture data (EXIF) held by the original is lost in the process.",
    privacyNote: "The image is processed entirely in your browser and is never uploaded.",
  },
} satisfies Record<Lang, Strings>;

interface Props {
  lang?: Lang;
}

export default function AiImageBadge({ lang = "de" }: Props) {
  const t = STRINGS[lang];
  const [badge, setBadge] = useState<BadgeOptions>({
    ...defaultBadge,
    text: presetTexts(lang)[0] ?? defaultBadge.text,
  });
  const [format, setFormat] = useState<Format>("image/png");
  const [quality, setQuality] = useState(0.9);
  const [embed, setEmbed] = useState(true);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; embedded: boolean } | null>(null);

  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const { copied, copy } = useCopyFlag();

  /**
   * Jede Object-URL, die diese Insel erzeugt hat.
   *
   * Eine Object-URL hält ihren Blob bis zum Ende des DOKUMENTS am Leben, nicht
   * bis zum Ende der Komponente — die letzte Referenz fallen zu lassen gibt
   * nichts frei. Ein Refs statt State, weil das Freigeben keinen Rendervorgang
   * auslösen darf und das Aufräumen beim Aushängen den aktuellen Wert sehen
   * muss.
   */
  const sourceUrl = useRef<string | null>(null);
  const resultUrl = useRef<string | null>(null);

  const releaseSource = () => {
    if (sourceUrl.current) URL.revokeObjectURL(sourceUrl.current);
    sourceUrl.current = null;
  };
  const releaseResult = () => {
    if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    resultUrl.current = null;
  };

  useEffect(
    () => () => {
      releaseSource();
      releaseResult();
    },
    [],
  );

  const onFile = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setResult(null);
    releaseResult();
    releaseSource();

    const element = new Image();
    const url = URL.createObjectURL(file);
    sourceUrl.current = url;
    element.onload = () => setImage(element);
    element.onerror = () => setError(t.loadFailed);
    element.src = url;
  };

  // Vorschau neu zeichnen, sobald sich Bild oder Einstellung ändert. Die
  // Vorschau rechnet mit derselben `drawBadge`-Funktion wie die Ausgabe, nur
  // auf einer verkleinerten Fläche — die Maße hängen an der Breite, also sitzt
  // das Badge in beiden Fassungen an derselben Stelle.
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas || !image) return;
    const scale = image.width > PREVIEW_MAX ? PREVIEW_MAX / image.width : 1;
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    drawBadge(ctx, width, height, badge);
  }, [image, badge]);

  const extension = format === "image/png" ? "png" : format === "image/webp" ? "webp" : "jpg";
  const canEmbed = format !== "image/webp";

  const produce = async () => {
    if (!image) return;
    setBusy(true);
    setError(null);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error(t.noCanvas);
      ctx.drawImage(image, 0, 0);
      drawBadge(ctx, image.width, image.height, badge);

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, format, format === "image/png" ? undefined : quality),
      );
      if (!blob) throw new Error(t.renderFailed);

      const marked =
        embed && canEmbed
          ? await embedNote(blob, machineNote(badge.text), SOFTWARE)
          : { blob, embedded: false };

      releaseResult();
      const url = URL.createObjectURL(marked.blob);
      resultUrl.current = url;
      setResult({ url, embedded: marked.embedded });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.renderFailed);
    } finally {
      setBusy(false);
    }
  };

  const field = "field-boxed w-full";
  const caption = captionFor(badge.text, lang);

  return (
    <div className="ai-badge-tool space-y-5">
      <label className="block">
        <span className="mb-1 block text-sm opacity-80">{t.chooseImage}</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className={field}
          onChange={(event) => onFile(event.target.files?.[0])}
        />
        <span className="mt-1 block text-xs opacity-60">{t.chooseHint}</span>
      </label>

      {image && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block opacity-80">{t.badgeText}</span>
              <input
                className={field}
                value={badge.text}
                onChange={(event) => setBadge((prev) => ({ ...prev, text: event.target.value }))}
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block opacity-80">{t.corner}</span>
              <select
                className={field}
                value={badge.corner}
                onChange={(event) =>
                  setBadge((prev) => ({ ...prev, corner: event.target.value as Corner }))
                }
              >
                {CORNERS.map((corner) => (
                  <option key={corner} value={corner}>
                    {t.corners[corner]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs opacity-60">{t.presets}:</span>
            {presetTexts(lang).map((preset) => (
              <button
                key={preset}
                type="button"
                className="chip"
                onClick={() => setBadge((prev) => ({ ...prev, text: preset }))}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="mb-1 block opacity-80">
                {t.size}: {badge.scale}%
              </span>
              <input
                type="range"
                min={2}
                max={12}
                step={0.5}
                value={badge.scale}
                className="w-full"
                onChange={(event) =>
                  setBadge((prev) => ({ ...prev, scale: Number(event.target.value) }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block opacity-80">
                {t.opacity}: {Math.round(badge.opacity * 100)}%
              </span>
              <input
                type="range"
                min={0.2}
                max={1}
                step={0.05}
                value={badge.opacity}
                className="w-full"
                onChange={(event) =>
                  setBadge((prev) => ({ ...prev, opacity: Number(event.target.value) }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block opacity-80">{t.style}</span>
              <select
                className={field}
                value={badge.style}
                onChange={(event) =>
                  setBadge((prev) => ({ ...prev, style: event.target.value as BadgeStyle }))
                }
              >
                <option value="dark">{t.styleDark}</option>
                <option value="light">{t.styleLight}</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block opacity-80">{t.format}</span>
              <select
                className={field}
                value={format}
                onChange={(event) => setFormat(event.target.value as Format)}
              >
                <option value="image/png">PNG</option>
                <option value="image/jpeg">JPEG</option>
                <option value="image/webp">WebP</option>
              </select>
            </label>
            {format !== "image/png" && (
              <label className="block text-sm">
                <span className="mb-1 block opacity-80">
                  {t.quality}: {Math.round(quality * 100)}%
                </span>
                <input
                  type="range"
                  min={0.5}
                  max={1}
                  step={0.05}
                  value={quality}
                  className="w-full"
                  onChange={(event) => setQuality(Number(event.target.value))}
                />
              </label>
            )}
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={embed}
              onChange={(event) => setEmbed(event.target.checked)}
            />
            <span>
              {t.embed}
              <span className="mt-0.5 block text-xs opacity-60">{t.embedHint}</span>
            </span>
          </label>
          {embed && !canEmbed && <p className="text-xs opacity-70">{t.embedWebp}</p>}

          <div className="tds-card p-4">
            <p className="mb-2 text-xs opacity-60">{t.preview}</p>
            <canvas ref={previewRef} className="h-auto max-w-full" />
          </div>

          <button type="button" className="btn btn-primary" onClick={() => void produce()} disabled={busy}>
            {busy ? t.building : t.build}
          </button>
        </>
      )}

      {error && (
        <p className="tds-alert tds-alert--danger" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="tds-card space-y-3 p-4">
          <p className="text-xs opacity-60">{t.result}</p>
          <img src={result.url} alt={t.resultAlt} className="h-auto max-h-64 max-w-full" />
          <p className="text-sm opacity-80">{result.embedded ? t.embedded : t.notEmbedded}</p>
          {/* Ein Anker mit fertiger Object-URL lädt selbst herunter; der
              Blob-Helfer aus shared.ts ist für die Textwerkzeuge da, die
              keine stehende URL haben. */}
          <a href={result.url} download={safeFilename(t.downloadName, extension)} className="btn btn-ghost">
            {t.download}
          </a>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm opacity-80">{t.caption}</p>
        <div className="tds-card p-3">
          <output className="block text-sm">{caption}</output>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => void copy(caption)}>
          {copied ? t.copied : t.copyCaption}
        </button>
      </div>

      <p className="text-xs opacity-60">{t.exifNote}</p>
      <p className="text-xs opacity-60">{t.privacyNote}</p>
    </div>
  );
}
