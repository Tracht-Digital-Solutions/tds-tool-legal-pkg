import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  // Only the manifest is compiled here; the .astro shells + .tsx islands ship as
  // raw source and are compiled by the consuming site's Astro/Vite (see exports).
  external: ["@tracht-digital-solutions/tds-tools-contract"],
});
