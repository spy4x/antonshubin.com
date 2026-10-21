import { define } from "../../lib/utils.ts";
import { NotFound } from "../../components/NotFound.tsx";
import { InstallLine } from "../../components/InstallLine.tsx";
import { ToolFrame } from "../../components/tool-frame/ToolFrame.tsx";
import { loadToolPage } from "../../components/tool-frame/tool-page.ts";
import { RostokCatalog } from "../../components/tools/rostok/RostokCatalog.tsx";

// The rostok page (#461): the shared frame (#454) with rostok's own middle,
// the three quick-start commands, the whole catalog and the project tree.
// Every line comes from rostok's README and the pinned catalog.

/** README "Quick start": each command with its comment. */
const COMMANDS = [
  { command: "rostok", text: "Wizard: init → server create → stack add" },
  { command: "rostok stack list", text: "Browse the bundled catalog" },
  { command: "rostok deploy home", text: "Deploy what you configured" },
];

/** README "What you get": the project folder after `rostok`, verbatim. */
const TREE = `.
├── deno.jsonc              # imports map for @rostok/cli
├── .gitignore              # ignores plaintext .env / .env.root
├── .env.root               # CLI-managed cross-server vars (gitignored)
├── .env.root.age           # encrypted — safe to commit
└── servers/
    └── home/
        ├── config.json     # which stacks (CLI-managed, committed)
        ├── .env            # per-server vars (gitignored)
        └── .env.age        # encrypted — safe to commit`;

function ThreeCommands() {
  return (
    <section aria-labelledby="commands">
      <h2 id="commands" class="text-2xl text-parchment">Three commands</h2>
      <ol class="mt-5 grid gap-3 sm:grid-cols-3">
        {COMMANDS.map((c, i) => (
          <li
            key={c.command}
            class="rounded-lg border border-rule bg-paper p-5"
          >
            <span aria-hidden="true" class="text-sm text-graphite">
              {i + 1}
            </span>
            <code class="mt-1 block text-parchment">{c.command}</code>
            <p class="mt-2 text-sm text-graphite leading-relaxed">{c.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function WhatYouGet() {
  return (
    <section aria-labelledby="what-you-get">
      <h2 id="what-you-get" class="text-2xl text-parchment">What you get</h2>
      <p class="mt-3 text-graphite">After rostok, your project folder holds:</p>
      {
        /* The tree keeps its alignment, so it scrolls inside its own box on a
        phone; the box is focusable so a keyboard can scroll it too. */
      }
      <pre
        tabindex={0}
        role="region"
        aria-label="The project folder"
        class="mt-4 overflow-x-auto rounded-lg border border-rule bg-paper p-5 text-sm leading-relaxed text-parchment"
      ><code>{TREE}</code></pre>
      <p class="mt-4 max-w-3xl text-graphite leading-relaxed">
        Every <code>.env</code> mutation is auto-encrypted to{" "}
        <code>.env.age</code>{" "}
        once a key exists (<code>rostok env setup</code>), so secrets are safe
        to commit.
      </p>
    </section>
  );
}

export default define.page(async function RostokPage(ctx) {
  const data = await loadToolPage("rostok");
  if (!data) return <NotFound pathname={ctx.url.pathname} />;
  return (
    <ToolFrame
      data={data}
      currentPath={ctx.url.pathname}
      hero={{ children: <InstallLine tool={data.tool} id="install-rostok" /> }}
    >
      <ThreeCommands />
      <RostokCatalog />
      <WhatYouGet />
    </ToolFrame>
  );
});
