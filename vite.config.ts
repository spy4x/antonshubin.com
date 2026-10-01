import { defineConfig, type Plugin } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import { PRESET_CSS } from "@spy4x/preact-theme";

const STYLESHEET = "/assets/styles.css";
const PRESET_IMPORT = `@import "@spy4x/preact-theme/preset.css";`;

/**
 * The `#region` blocks of the preset the site takes. "Colour atoms" holds
 * every colour, focus and selection utility the components used here read.
 * Add a region (Typography, Buttons, Forms, Surfaces, ...) when a component
 * that needs it is adopted.
 */
const PRESET_REGIONS = ["Colour atoms"];

/** One `#region` block of the preset's text, or a thrown error naming it. */
function presetRegion(css: string, name: string): string {
  const start = `/* #region ${name} */`;
  const end = `/* #endregion ${name} */`;
  const from = css.indexOf(start);
  const to = css.indexOf(end);
  if (from === -1 || to < from) {
    throw new Error(`@spy4x/preact-theme's preset has no "${name}" region`);
  }
  return css.slice(from, to + end.length);
}

/**
 * Splices the needed regions of `@spy4x/preact-theme`'s `preset.css` into
 * `assets/styles.css` before Tailwind compiles it. JSR cannot export a CSS
 * file, so the package exports its text instead.
 *
 * Not the package's own `preactThemeCss()` plugin: that one also requires
 * `tokens.css`, whose defaults this site maps over anyway (see the `:root`
 * block in `assets/styles.css`), and appends every component's classes
 * (`COMPONENT_CLASSES`), which more than doubled the stylesheet.
 * `assets/styles.css` lists, in its own `@source inline(...)`, only the
 * classes of the components the site uses.
 *
 * Only `PRESET_REGIONS` go in: the other regions define utilities the site
 * already names for itself (`font-heading` from its `@theme`, `page-layout`
 * in a code comment, which Tailwind scans too), and the head of the file holds the `.theme-base`
 * document rules. The text goes in as `@media reference`,
 * Tailwind's form of `@import "…" reference`, so nothing in it is emitted
 * unless a class asks for it.
 */
function preactPreset(): Plugin {
  const preset = PRESET_REGIONS.map((name) => presetRegion(PRESET_CSS, name))
    .join("\n");
  return {
    name: "preact-preset",
    enforce: "pre",
    transform(code, id) {
      if (!id.split("?")[0].endsWith(STYLESHEET)) return;
      if (!code.includes(PRESET_IMPORT)) {
        throw new Error(`${STYLESHEET} must contain ${PRESET_IMPORT}`);
      }
      return code.replace(
        PRESET_IMPORT,
        () => `@media reference {\n${preset}\n}`,
      );
    },
  };
}

export default defineConfig({
  plugins: [fresh(), preactPreset(), tailwindcss()],
});
