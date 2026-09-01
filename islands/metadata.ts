/**
 * Der maschinenlesbare Teil der KI-Kennzeichnung.
 *
 * Art. 50 der KI-Verordnung verlangt von den Anbietern generativer Systeme,
 * dass die Ausgabe in einem **maschinenlesbaren Format** als künstlich erzeugt
 * markiert wird; die Offenlegungspflicht für denjenigen, der das Bild
 * einsetzt, ist die zweite, sichtbare Hälfte. Ein Badge allein erfüllt also
 * nur die eine Hälfte, und ein Werkzeug, das eine Kennzeichnungspflicht
 * bedient, darf nicht so tun, als hätte es beide erfüllt.
 *
 * Dependency-frei: PNG bekommt einen Textabschnitt, JPEG ein Kommentarsegment.
 * Beides sind ein paar Dutzend Zeilen mit einer `DataView`, und beides liest
 * jedes gängige Metadatenwerkzeug. C2PA — kryptografisch signierte Herkunft —
 * wäre die vollständige Antwort, braucht aber einen Signaturschlüssel und eine
 * schwere Bibliothek und passt damit nicht in ein kostenloses Werkzeug, das
 * ausschließlich im Browser läuft.
 *
 * **WebP bekommt nichts.** Ein XMP-Abschnitt in einem RIFF-Container wäre
 * machbar, aber halbfertig; die Insel sagt stattdessen deutlich, dass der
 * maschinenlesbare Hinweis nur in PNG und JPEG landet.
 */

/**
 * Ein Bytepuffer über einem echten `ArrayBuffer`.
 *
 * Ausgeschrieben, weil das blosse `Uint8Array` seit TypeScript 5.7 auch
 * einen `SharedArrayBuffer` bedeuten kann — und ein solcher Puffer ist kein
 * gültiger Bestandteil eines `Blob`. Ohne die Einschränkung scheitert erst
 * der Site-Build an der letzten Zeile dieser Datei, nicht der Typcheck hier:
 * die Inseln werden im Pack nicht geprüft.
 */
type Bytes = Uint8Array<ArrayBuffer>;

let table: Uint32Array | null = null;

function crcTable(): Uint32Array {
  if (table) return table;
  const built = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    built[n] = c >>> 0;
  }
  table = built;
  return built;
}

/** CRC-32 wie in PNG (RFC 1952, gespiegeltes Polynom 0xEDB88320). */
export function crc32(bytes: Bytes): number {
  const t = crcTable();
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    const index = (c ^ (bytes[i] ?? 0)) & 0xff;
    c = (t[index] ?? 0) ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/** Latin-1-Bytes, oder `null`, wenn der Text darin nicht darstellbar ist. */
function latin1(text: string): Bytes | null {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code > 0xff) return null;
    out[i] = code;
  }
  return out;
}

const utf8 = (text: string): Bytes => new TextEncoder().encode(text) as Bytes;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Trägt die Datei die PNG-Signatur? */
export function isPng(bytes: Bytes): boolean {
  if (bytes.length < 8) return false;
  return PNG_SIGNATURE.every((byte, index) => bytes[index] === byte);
}

/** Beginnt die Datei mit einem JPEG-SOI-Marker? */
export function isJpeg(bytes: Bytes): boolean {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8;
}

/** Ein vollständiger PNG-Abschnitt: Länge, Typ, Daten, Prüfsumme. */
function pngChunk(type: string, data: Bytes): Bytes {
  const typeBytes = new Uint8Array(4);
  for (let i = 0; i < 4; i++) typeBytes[i] = type.charCodeAt(i);

  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(typeBytes, 4);
  out.set(data, 8);

  const checked = new Uint8Array(4 + data.length);
  checked.set(typeBytes, 0);
  checked.set(data, 4);
  view.setUint32(8 + data.length, crc32(checked));
  return out;
}

/**
 * Ein Textabschnitt für PNG.
 *
 * `tEXt` speichert Latin-1 und wird von jedem Betrachter gelesen; sobald der
 * Text ein Zeichen außerhalb davon enthält, wird daraus ein `iTXt` mit UTF-8.
 * Ein `tEXt` mit abgeschnittenen Zeichen wäre die schlechtere Variante: der
 * Hinweis stünde dann zwar in der Datei, aber verstümmelt.
 */
function pngTextChunk(keyword: string, text: string): Bytes {
  const keywordBytes = latin1(keyword.slice(0, 79));
  const textBytes = latin1(text);
  if (keywordBytes && textBytes) {
    const data = new Uint8Array(keywordBytes.length + 1 + textBytes.length);
    data.set(keywordBytes, 0);
    data[keywordBytes.length] = 0;
    data.set(textBytes, keywordBytes.length + 1);
    return pngChunk("tEXt", data);
  }

  // iTXt: Schlüsselwort, 0, Kompressionsflag, Kompressionsverfahren,
  // Sprachkennung, 0, übersetztes Schlüsselwort, 0, Text (UTF-8).
  const kw = keywordBytes ?? utf8(keyword.slice(0, 79));
  const body = utf8(text);
  const data = new Uint8Array(kw.length + 5 + body.length);
  data.set(kw, 0);
  data[kw.length] = 0;
  data[kw.length + 1] = 0;
  data[kw.length + 2] = 0;
  data[kw.length + 3] = 0;
  data[kw.length + 4] = 0;
  data.set(body, kw.length + 5);
  return pngChunk("iTXt", data);
}

export interface TextEntry {
  keyword: string;
  text: string;
}

/**
 * Textabschnitte hinter den IHDR eines PNG setzen.
 *
 * Hinter den IHDR, weil der PNG-Standard verlangt, dass er der erste Abschnitt
 * ist — davor eingefügt wäre die Datei kaputt, und zwar in einer Weise, die
 * mancher Betrachter noch anzeigt und mancher nicht. Ist die Eingabe kein PNG,
 * kommt sie unverändert zurück: der Aufrufer soll nicht raten müssen.
 */
export function embedPngText(bytes: Bytes, entries: TextEntry[]): Bytes {
  if (!isPng(bytes) || entries.length === 0) return bytes;

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ihdrLength = view.getUint32(8);
  const insertAt = 8 + 12 + ihdrLength;
  if (insertAt > bytes.length) return bytes;

  const chunks = entries
    .filter((entry) => entry.keyword.trim() !== "" && entry.text.trim() !== "")
    .map((entry) => pngTextChunk(entry.keyword, entry.text));
  if (chunks.length === 0) return bytes;

  const added = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(bytes.length + added);
  out.set(bytes.subarray(0, insertAt), 0);
  let offset = insertAt;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  out.set(bytes.subarray(insertAt), offset);
  return out;
}

/**
 * Ein Kommentarsegment (COM, 0xFFFE) direkt hinter den SOI-Marker eines JPEG.
 *
 * Die Segmentlänge zählt sich selbst mit und passt in zwei Bytes, also wird
 * ein übermäßig langer Text gekürzt statt eine unlesbare Datei zu erzeugen.
 */
export function embedJpegComment(bytes: Bytes, text: string): Bytes {
  if (!isJpeg(bytes) || text.trim() === "") return bytes;

  let body = utf8(text);
  if (body.length > 65533) body = body.subarray(0, 65533);
  const segment = new Uint8Array(4 + body.length);
  segment[0] = 0xff;
  segment[1] = 0xfe;
  const length = body.length + 2;
  segment[2] = (length >> 8) & 0xff;
  segment[3] = length & 0xff;
  segment.set(body, 4);

  const out = new Uint8Array(bytes.length + segment.length);
  out.set(bytes.subarray(0, 2), 0);
  out.set(segment, 2);
  out.set(bytes.subarray(2), 2 + segment.length);
  return out;
}

/**
 * Den Hinweis in das Format einbetten, das ihn tragen kann.
 *
 * Gibt zurück, ob das gelungen ist — die Insel sagt es dem Nutzer, statt ein
 * WebP stillschweigend ohne Metadaten auszuliefern.
 */
export async function embedNote(
  blob: Blob,
  note: string,
  software: string,
): Promise<{ blob: Blob; embedded: boolean }> {
  const bytes = new Uint8Array(await blob.arrayBuffer());

  if (isPng(bytes)) {
    const out = embedPngText(bytes, [
      { keyword: "Description", text: note },
      { keyword: "Comment", text: note },
      { keyword: "Software", text: software },
    ]);
    return { blob: new Blob([out], { type: "image/png" }), embedded: out.length > bytes.length };
  }

  if (isJpeg(bytes)) {
    const out = embedJpegComment(bytes, `${note} — ${software}`);
    return { blob: new Blob([out], { type: "image/jpeg" }), embedded: out.length > bytes.length };
  }

  return { blob, embedded: false };
}
