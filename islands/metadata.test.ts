import { describe, expect, it } from "vitest";

import { crc32, embedJpegComment, embedPngText, isJpeg, isPng } from "./metadata";

/**
 * Die maschinenlesbare Hälfte der Kennzeichnung.
 *
 * Hier wird Bytearithmetik geprüft, und die hat zwei Fehlerbilder, die beide
 * schweigen: eine Datei, die kaputt ist, obwohl der Hinweis darin steht, und
 * ein Hinweis, der nicht darin steht, obwohl das Werkzeug es behauptet. Ein
 * PNG mit falscher Prüfsumme zeigen manche Betrachter noch an und andere
 * nicht — es gibt also nicht einmal ein verlässliches Fehlerbild.
 */

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Ein PNG-Abschnitt: Länge, Typ, Daten, Prüfsumme. */
function chunk(type: string, data: number[]): number[] {
  const length = data.length;
  const typeBytes = [...type].map((character) => character.charCodeAt(0));
  const checked = new Uint8Array([...typeBytes, ...data]);
  const sum = crc32(checked);
  return [
    (length >>> 24) & 0xff,
    (length >>> 16) & 0xff,
    (length >>> 8) & 0xff,
    length & 0xff,
    ...typeBytes,
    ...data,
    (sum >>> 24) & 0xff,
    (sum >>> 16) & 0xff,
    (sum >>> 8) & 0xff,
    sum & 0xff,
  ];
}

/** Das kleinstmögliche PNG-Gerüst: Signatur, IHDR, IDAT, IEND. */
function makePng(): Uint8Array<ArrayBuffer> {
  const ihdr = [0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0];
  return new Uint8Array([
    ...PNG_SIGNATURE,
    ...chunk("IHDR", ihdr),
    ...chunk("IDAT", [0x78, 0x9c, 0x63, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01]),
    ...chunk("IEND", []),
  ]);
}

/** Ein JPEG-Gerüst: SOI, ein APP0, EOI. */
function makeJpeg(): Uint8Array<ArrayBuffer> {
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xd9]);
}

/** Alle Abschnitte eines PNG in der Reihenfolge, in der sie stehen. */
function readChunks(bytes: Uint8Array): { type: string; data: Uint8Array; crcOk: boolean }[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const out: { type: string; data: Uint8Array; crcOk: boolean }[] = [];
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    const stored = view.getUint32(offset + 8 + length);
    const checked = new Uint8Array(bytes.subarray(offset + 4, offset + 8 + length));
    out.push({ type, data: new Uint8Array(data), crcOk: crc32(checked) === stored });
    offset += 12 + length;
  }
  return out;
}

const decode = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

describe("Formaterkennung", () => {
  it("erkennt PNG und JPEG an ihrer Signatur", () => {
    expect(isPng(makePng())).toBe(true);
    expect(isJpeg(makeJpeg())).toBe(true);
    expect(isPng(makeJpeg())).toBe(false);
    expect(isJpeg(makePng())).toBe(false);
  });

  it("hält eine zu kurze Datei nicht für ein Bild", () => {
    expect(isPng(new Uint8Array([0x89, 0x50]))).toBe(false);
    expect(isJpeg(new Uint8Array([0xff]))).toBe(false);
  });
});

describe("PNG-Textabschnitte", () => {
  const note = "AI-generated image. KI-generiert";
  const marked = embedPngText(makePng(), [{ keyword: "Description", text: note }]);

  it("bleibt ein PNG", () => {
    expect(isPng(marked)).toBe(true);
    const types = readChunks(marked).map((entry) => entry.type);
    expect(types[0]).toBe("IHDR");
    expect(types[types.length - 1]).toBe("IEND");
  });

  it("setzt den Textabschnitt hinter den IHDR", () => {
    // Der IHDR MUSS der erste Abschnitt sein. Davor eingefügt wäre die Datei
    // ungültig — und manche Betrachter zeigten sie trotzdem noch an.
    const types = readChunks(marked).map((entry) => entry.type);
    expect(types.indexOf("tEXt")).toBe(1);
    expect(types.indexOf("tEXt")).toBeLessThan(types.indexOf("IDAT"));
  });

  it("rechnet für jeden Abschnitt eine gültige Prüfsumme", () => {
    for (const entry of readChunks(marked)) {
      expect(entry.crcOk, `Prüfsumme von ${entry.type}`).toBe(true);
    }
  });

  it("schreibt Schlüsselwort und Text mit Nulltrenner", () => {
    const text = readChunks(marked).find((entry) => entry.type === "tEXt");
    if (!text) throw new Error("kein tEXt-Abschnitt");
    const separator = text.data.indexOf(0);
    expect(separator).toBeGreaterThan(0);
    expect(decode(text.data.subarray(0, separator))).toBe("Description");
    expect(decode(text.data.subarray(separator + 1))).toBe(note);
  });

  it("weicht auf iTXt aus, sobald der Text Latin-1 verlässt", () => {
    // „KI-generiert“ passt in Latin-1, ein Emoji oder kyrillische Schrift
    // nicht. Ein tEXt mit gekappten Zeichen stünde zwar in der Datei, aber
    // verstümmelt — der Hinweis wäre dann da und trotzdem unbrauchbar.
    const wide = embedPngText(makePng(), [{ keyword: "Description", text: "KI-generiert ✨ ИИ" }]);
    const types = readChunks(wide).map((entry) => entry.type);
    expect(types).toContain("iTXt");
    expect(types).not.toContain("tEXt");
    for (const entry of readChunks(wide)) expect(entry.crcOk, entry.type).toBe(true);
  });

  it("schreibt mehrere Abschnitte in der übergebenen Reihenfolge", () => {
    const many = embedPngText(makePng(), [
      { keyword: "Description", text: "eins" },
      { keyword: "Software", text: "zwei" },
    ]);
    const keywords = readChunks(many)
      .filter((entry) => entry.type === "tEXt")
      .map((entry) => decode(entry.data.subarray(0, entry.data.indexOf(0))));
    expect(keywords).toEqual(["Description", "Software"]);
  });

  it("überspringt leere Einträge, statt einen leeren Abschnitt zu schreiben", () => {
    const partial = embedPngText(makePng(), [
      { keyword: "Description", text: "" },
      { keyword: "", text: "ohne Schlüsselwort" },
    ]);
    expect(partial.length).toBe(makePng().length);
  });

  it("lässt eine Datei, die kein PNG ist, unverändert", () => {
    const jpeg = makeJpeg();
    expect(embedPngText(jpeg, [{ keyword: "Description", text: "x" }])).toBe(jpeg);
  });
});

describe("JPEG-Kommentarsegment", () => {
  const marked = embedJpegComment(makeJpeg(), "AI-generated image.");

  it("bleibt ein JPEG und behält den SOI vorn", () => {
    expect(isJpeg(marked)).toBe(true);
    expect(marked[0]).toBe(0xff);
    expect(marked[1]).toBe(0xd8);
  });

  it("setzt das Segment direkt hinter den SOI", () => {
    expect(marked[2]).toBe(0xff);
    expect(marked[3]).toBe(0xfe);
  });

  it("zählt die Längenbytes mit", () => {
    // Die Segmentlänge in JPEG schließt die beiden Längenbytes ein. Ein um
    // zwei zu kurzer Wert verschiebt alles Folgende, und der Decoder liest
    // dann mitten in der Bilddatei einen Marker.
    const length = ((marked[4] ?? 0) << 8) | (marked[5] ?? 0);
    const body = decode(marked.subarray(6, 4 + length));
    expect(body).toBe("AI-generated image.");
    expect(length).toBe(body.length + 2);
  });

  it("behält den Rest der Datei", () => {
    const original = makeJpeg();
    expect(marked.subarray(marked.length - 2)).toEqual(original.subarray(original.length - 2));
  });

  it("lässt eine Datei, die kein JPEG ist, und einen leeren Text unverändert", () => {
    const png = makePng();
    expect(embedJpegComment(png, "x")).toBe(png);
    const jpeg = makeJpeg();
    expect(embedJpegComment(jpeg, "   ")).toBe(jpeg);
  });
});

describe("crc32", () => {
  it("stimmt mit dem bekannten Wert für „123456789“ überein", () => {
    // Der Prüfwert aus der CRC-Katalogliteratur. Ohne einen festen Wert prüft
    // ein Test nur, dass die Funktion mit sich selbst übereinstimmt — und
    // genau das täte sie auch mit einem falschen Polynom.
    expect(crc32(new TextEncoder().encode("123456789") as Uint8Array<ArrayBuffer>)).toBe(0xcbf43926);
  });
});
