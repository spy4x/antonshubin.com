import { defineConfig, type Plugin } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import { PRESET_CSS } from "@spy4x/preact-theme";

const STYLESHEET = "/assets/styles.css";
const PRESET_IMPORT = `@import "@spy4x/preact-theme/preset.css";`;

/**
 * Splices `@spy4x/preact-theme`'s `preset.css` (the utilities the library's
 * components render, such as `text-success` and `ring-focus`) into
 * `assets/styles.css` before Tailwind compiles it. JSR cannot export a CSS
 * file, so the package exports its text instead.
 *
 * Not the package's own `preactThemeCss()` plugin: that one also requires
 * `tokens.css`, whose `:root` redefines this site's `--color-accent` and
 * `--font-sans` above the `@theme` layer, and appends every component's
 * classes (`COMPONENT_CLASSES`), which more than doubled the stylesheet.
 * `assets/styles.css` sets the tokens itself and lists, in its own
 * `@source inline(...)`, only the classes of the components the site uses.
 */
function preactPreset(): Plugin {
  return {
    name: "preact-preset",
    enforce: "pre",
    transform(code, id) {
      if (!id.split("?")[0].endsWith(STYLESHEET)) return;
      if (!code.includes(PRESET_IMPORT)) {
        throw new Error(`${STYLESHEET} must contain ${PRESET_IMPORT}`);
      }
      return code.replace(PRESET_IMPORT, () => PRESET_CSS);
    },
  };
}

export default defineConfig({
  plugins: [fresh(), preactPreset(), tailwindcss()],
});
