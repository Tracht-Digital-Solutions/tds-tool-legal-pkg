// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ImprintGenerator from "./ImprintGenerator";

/**
 * Der Weg vom Formular zur Vorschau.
 *
 * Was die reinen Textbau-Tests nicht abdecken: dass die Bedienelemente
 * überhaupt an den Zustand gebunden sind. Ein Ankreuzfeld, dessen `onChange`
 * fehlt, sieht bedienbar aus, lässt sich anklicken und ändert nichts — und die
 * Vorschau darunter bleibt einfach, wie sie war.
 *
 * Und der Hinweis: er muss in der Oberfläche stehen und darf nicht im
 * erzeugten Text landen. Beide Hälften dieser Aussage werden hier gegen
 * dasselbe gerenderte Dokument geprüft.
 */

afterEach(cleanup);

const user = () => userEvent.setup({ delay: null });

const preview = () => document.querySelector("output")?.textContent ?? "";

describe("Oberfläche", () => {
  it("zeigt den Hinweis, dass der Text ein Muster ist", () => {
    render(<ImprintGenerator />);
    expect(screen.getByRole("note").textContent).toMatch(/keine Rechtsberatung/);
  });

  it("nimmt den Hinweis nicht in die Vorschau auf", () => {
    render(<ImprintGenerator />);
    expect(preview()).not.toMatch(/Rechtsberatung/);
  });

  it("rendert deutsch, wenn keine Sprache gesetzt ist", () => {
    // Der Default steht in der Shell UND in der Insel auf "de"; ein Aufrufer
    // ohne die Prop bekommt genau das Verhalten von vor dem englischen Baum.
    render(<ImprintGenerator />);
    expect(preview()).toContain("Impressum");
    expect(screen.getByText("Rechtsform")).toBeTruthy();
  });

  it("rendert englisch, wenn die Sprache gesetzt ist", () => {
    render(<ImprintGenerator lang="en" />);
    expect(preview()).toContain("Legal notice");
  });
});

describe("Eingaben landen in der Vorschau", () => {
  it("übernimmt Namen und Ort beim Tippen", async () => {
    render(<ImprintGenerator />);
    await user().type(screen.getByLabelText(/Name oder Firma/), "Beispiel Bau GmbH");
    await waitFor(() => expect(preview()).toContain("Beispiel Bau GmbH"));
  });

  it("schaltet mit dem Ankreuzfeld einen Abschnitt zu und wieder ab", async () => {
    render(<ImprintGenerator />);
    const box = screen.getByLabelText(/Umsatzsteuer-Identifikationsnummer vorhanden/);

    expect(preview()).not.toContain("Umsatzsteuer-Identifikationsnummer gemäß");
    await user().click(box);
    await waitFor(() => expect(preview()).toContain("Umsatzsteuer-Identifikationsnummer gemäß"));

    await user().click(box);
    await waitFor(() => expect(preview()).not.toContain("Umsatzsteuer-Identifikationsnummer gemäß"));
  });

  it("blendet die Zusatzfelder erst mit dem Ankreuzfeld ein", async () => {
    render(<ImprintGenerator />);
    expect(screen.queryByLabelText(/^USt-IdNr\./)).toBeNull();
    await user().click(screen.getByLabelText(/Umsatzsteuer-Identifikationsnummer vorhanden/));
    await waitFor(() => expect(screen.getByLabelText(/^USt-IdNr\./)).toBeTruthy());
  });

  it("belegt den Registereintrag mit der Rechtsform vor", async () => {
    // Eine GmbH ohne Registereintrag gibt es nicht. Die Vorbelegung nimmt dem
    // Nutzer die Entscheidung nicht ab, sie trifft nur die wahrscheinliche.
    render(<ImprintGenerator />);
    expect(preview()).not.toContain("Registereintrag");
    await user().selectOptions(
      screen.getByLabelText(/Rechtsform/),
      "Gesellschaft mit beschränkter Haftung (GmbH)",
    );
    await waitFor(() => expect(preview()).toContain("Registereintrag"));
  });

  it("dreht die Aussage zur Streitbeilegung über die Auswahl um", async () => {
    render(<ImprintGenerator />);
    expect(preview()).toContain("nicht bereit");
    await user().click(screen.getByLabelText(/Wir nehmen an einem Schlichtungsverfahren teil/));
    await waitFor(() => expect(preview()).not.toContain("nicht bereit"));
  });
});

describe("Hinweis auf fehlende Angaben", () => {
  it("nennt die leeren Pflichtfelder und verschwindet, wenn sie gefüllt sind", async () => {
    render(<ImprintGenerator />);
    expect(screen.getByText(/Für einen vollständigen Text fehlt noch/).textContent).toContain(
      "Name oder Firma",
    );

    await user().type(screen.getByLabelText(/Name oder Firma/), "Beispiel Bau GmbH");
    await waitFor(() =>
      expect(screen.getByText(/Für einen vollständigen Text fehlt noch/).textContent).not.toContain(
        "Name oder Firma",
      ),
    );
  });
});
