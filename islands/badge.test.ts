import { describe, expect, it } from "vitest";

import {
  badgeColors,
  badgeFontSize,
  badgeLayout,
  captionFor,
  CORNERS,
  defaultBadge,
  machineNote,
  presetTexts,
} from "./badge";

/**
 * Die Geometrie der Plakette.
 *
 * Geprüft wird, was man einem Badge nicht ansieht: dass es mit dem Bild
 * mitwächst und dass es innerhalb des Bildes bleibt. Eine feste Pixelgröße
 * sieht auf dem Testbild richtig aus und ist auf dem 6000-Pixel-Foto des
 * Nutzers eine Briefmarke — ein Hinweis, den niemand mehr lesen kann, erfüllt
 * die Offenlegung nicht.
 */

describe("Schriftgröße", () => {
  it("wächst mit der Bildbreite", () => {
    expect(badgeFontSize(1000, 4)).toBe(40);
    expect(badgeFontSize(6000, 4)).toBe(240);
  });

  it("bleibt auch bei winzigen Bildern lesbar", () => {
    // Ohne Untergrenze bekäme ein 120-Pixel-Vorschaubild eine Schrift von
    // fünf Pixeln — vorhanden, aber nicht lesbar.
    expect(badgeFontSize(120, 4)).toBe(10);
    expect(badgeFontSize(1, 1)).toBe(10);
  });
});

describe("Platzierung", () => {
  const layoutFor = (corner: (typeof CORNERS)[number]) =>
    badgeLayout(1000, 800, 200, 40, corner);

  it("setzt jede Ecke an eine andere Stelle", () => {
    const positions = CORNERS.map((corner) => {
      const rect = layoutFor(corner);
      return `${rect.x}/${rect.y}`;
    });
    expect(new Set(positions).size).toBe(4);
  });

  it("hält jede Ecke vollständig im Bild", () => {
    for (const corner of CORNERS) {
      const rect = layoutFor(corner);
      expect(rect.x, `${corner} links`).toBeGreaterThanOrEqual(0);
      expect(rect.y, `${corner} oben`).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width, `${corner} rechts`).toBeLessThanOrEqual(1000);
      expect(rect.y + rect.height, `${corner} unten`).toBeLessThanOrEqual(800);
    }
  });

  it("legt die oberen Ecken über die unteren", () => {
    expect(layoutFor("tl").y).toBeLessThan(layoutFor("bl").y);
    expect(layoutFor("tr").y).toBeLessThan(layoutFor("br").y);
  });

  it("legt die linken Ecken links von den rechten", () => {
    expect(layoutFor("tl").x).toBeLessThan(layoutFor("tr").x);
    expect(layoutFor("bl").x).toBeLessThan(layoutFor("br").x);
  });

  it("setzt den Text innerhalb der Fläche", () => {
    for (const corner of CORNERS) {
      const rect = layoutFor(corner);
      expect(rect.textX, `${corner}`).toBeGreaterThan(rect.x);
      expect(rect.textY, `${corner}`).toBeGreaterThan(rect.y);
      expect(rect.textY, `${corner}`).toBeLessThanOrEqual(rect.y + rect.height);
    }
  });

  it("quetscht ein zu breites Badge nicht aus dem Bild", () => {
    // Ein langer Text auf einem schmalen Bild: die Fläche wird breiter als
    // das Bild. Sie darf dann links anliegen statt in den negativen Bereich
    // zu rutschen, wo die halbe Kennzeichnung abgeschnitten wäre.
    const rect = badgeLayout(300, 200, 900, 40, "br");
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.y).toBeGreaterThanOrEqual(0);
  });
});

describe("Farben", () => {
  it("kehrt Fläche und Schrift zwischen den Stilen um", () => {
    const dark = badgeColors("dark", 0.75);
    const light = badgeColors("light", 0.75);
    expect(dark.text).not.toBe(light.text);
    expect(dark.fill).not.toBe(light.fill);
  });

  it("hält die Deckkraft im gültigen Bereich", () => {
    expect(badgeColors("dark", 2).fill).toContain("1)");
    expect(badgeColors("dark", -1).fill).toContain("0)");
  });
});

describe("Texte", () => {
  it("schlägt in beiden Sprachen etwas vor und beginnt mit der Landessprache", () => {
    expect(presetTexts("de")[0]).toBe("KI-generiert");
    expect(presetTexts("en")[0]).toBe("AI-generated");
    expect(presetTexts("de").length).toBeGreaterThan(2);
    expect(presetTexts("en").length).toBe(presetTexts("de").length);
  });

  it("beginnt den maschinenlesbaren Hinweis immer englisch", () => {
    // Das ist die Zeichenfolge, nach der Werkzeuge und Plattformen suchen.
    // Ein rein deutscher Hinweis stünde zwar in der Datei, würde aber von
    // nichts gefunden.
    expect(machineNote("KI-generiert")).toMatch(/^AI-generated/);
    expect(machineNote("KI-generiert")).toContain("KI-generiert");
    expect(machineNote("   ")).toBe("AI-generated image.");
  });

  it("bildet eine Bildunterschrift in beiden Sprachen", () => {
    expect(captionFor("KI-generiert", "de")).toContain("künstlicher Intelligenz");
    expect(captionFor("AI-generated", "en")).toContain("artificial intelligence");
    expect(captionFor("", "de")).toContain("KI-generiert");
  });

  it("startet mit einer sinnvollen Voreinstellung", () => {
    expect(defaultBadge.text.trim()).not.toBe("");
    expect(CORNERS).toContain(defaultBadge.corner);
    expect(defaultBadge.opacity).toBeGreaterThan(0);
    expect(defaultBadge.opacity).toBeLessThanOrEqual(1);
  });
});
