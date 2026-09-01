import { defineConfig } from "vitest/config";

/**
 * Tool packs publish `islands/` and `tools/` as raw source (only `src/` is
 * bundled), so the tests run against exactly the files the tools site composes.
 * Islands opt into jsdom with a `@vitest-environment` docblock.
 */
export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}", "islands/**/*.test.{ts,tsx}"],
    environment: "node",
    restoreMocks: true,
  },
});
