import { define } from "../../lib/utils.ts";
import { eventAttrs } from "../../lib/analytics.ts";
import { NotFound } from "../../components/NotFound.tsx";
import { COPY_INSTALL_TITLE } from "../../components/tool-frame/ToolBand.tsx";
import { ToolFrame } from "../../components/tool-frame/ToolFrame.tsx";
import { loadToolPage } from "../../components/tool-frame/tool-page.ts";
import { AskZond } from "../../components/tools/zond/AskZond.tsx";
import CopyButton from "../../islands/CopyButton.tsx";

// The zond page (#462): the shared frame (#454) with zond's own middle, its
// diagram, the "Ask zond" simulator and the README's quick start. Every
// sentence and block comes from zond's README.

/** zond's README diagram (docs/diagram-dark.svg) and its alt text. */
const DIAGRAM = {
  src: "/img/tools/zond/diagram.svg",
  alt:
    "You reach metube through the SSO proxy. Gatus, in the cloud, asks zond for /health/metube instead. zond runs on the same Docker network as metube, sends it a plain HTTP GET without logging in, and answers Gatus with 200 ok or 503.",
  width: 1000,
  height: 400,
};

/** README "Quick start" and "Point your monitor at it", verbatim. */
const BLOCKS = {
  compose: `# compose.yml
services:
  zond:
    image: ghcr.io/spy4x/zond:latest
    restart: unless-stopped
    ports: ["8080:8080"]
    volumes: ["./zond.yml:/app/zond.yml:ro,z"]`,
  config: `# zond.yml
targets:
  - name: metube
    url: http://hl-metube:8081/`,
  command:
    `docker compose up -d && curl http://localhost:8080/health/metube   # ok`,
  gatus: `# Gatus
- name: Metube
  url: "https://zond.example.com/health/metube"
  conditions:
    - "[STATUS] == 200"`,
};

function ProblemPicture() {
  return (
    <section aria-labelledby="problem">
      <h2 id="problem" class="text-2xl text-parchment">
        The problem, in one picture
      </h2>
      <figure class="mt-6">
        <img
          src={DIAGRAM.src}
          alt={DIAGRAM.alt}
          width={DIAGRAM.width}
          height={DIAGRAM.height}
          loading="lazy"
          decoding="async"
          class="mx-auto block h-auto w-full max-w-[800px]"
        />
        <figcaption class="mx-auto mt-4 max-w-3xl text-graphite leading-relaxed">
          Put an SSO proxy such as Authelia or Authentik in front of your
          services, and an outside monitor like Gatus sees a <code>302</code>
          {" "}
          to the login page for every one of them. zond checks each service from
          beside it instead.
        </figcaption>
      </figure>
    </section>
  );
}

/** One copyable block: the text in a box that scrolls sideways on its own, and its copy button. */
function CodeBlock(
  { id, label, text, wrap, class: className }: {
    id: string;
    label: string;
    text: string;
    /** Wraps a one-line command instead of scrolling it. */
    wrap?: boolean;
    class?: string;
  },
) {
  return (
    <div
      class={`min-w-0 rounded-lg border border-rule bg-paper ${
        className ?? ""
      }`}
    >
      <div class="flex items-center justify-between gap-3 border-b border-rule px-4 py-1">
        <span class="text-sm text-graphite">{label}</span>
        <CopyButton
          elementId={id}
          label="Copy"
          title={COPY_INSTALL_TITLE}
          analytics={eventAttrs("tool-install-copy", { item: "zond" })}
        />
      </div>
      {
        /* The YAML keeps its indentation, so a long line scrolls inside the
        box on a phone; the box is focusable so a keyboard can scroll it. */
      }
      {wrap
        ? (
          <pre class="whitespace-pre-wrap break-words p-4 text-sm leading-relaxed text-parchment"><code id={id}>{text}</code></pre>
        )
        : (
          <pre
            tabindex={0}
            role="region"
            aria-label={label}
            class="overflow-x-auto p-4 text-sm leading-relaxed text-parchment"
          ><code id={id}>{text}</code></pre>
        )}
    </div>
  );
}

function QuickStartBlocks() {
  return (
    <section aria-labelledby="quick-start">
      <h2 id="quick-start" class="text-2xl text-parchment">Quick start</h2>
      <p class="mt-3 max-w-3xl text-graphite leading-relaxed">
        Add zond to the Compose file that runs your services, so it shares their
        network:
      </p>
      <div class="mt-5 grid gap-4 lg:grid-cols-2">
        <CodeBlock
          id="zond-compose"
          label="compose.yml"
          text={BLOCKS.compose}
        />
        <CodeBlock id="zond-config" label="zond.yml" text={BLOCKS.config} />
        <CodeBlock
          id="zond-command"
          label="Start it and ask it"
          text={BLOCKS.command}
          wrap
          class="lg:col-span-2"
        />
      </div>
      <div class="mt-10 grid gap-4 lg:grid-cols-2 lg:items-start">
        <div>
          <h3 class="text-xl text-parchment">Point your monitor at it</h3>
          <p class="mt-2 text-graphite leading-relaxed">
            Then publish zond through your reverse proxy, outside the SSO, and
            point your monitor at it.
          </p>
        </div>
        <CodeBlock id="zond-gatus" label="Gatus" text={BLOCKS.gatus} />
      </div>
    </section>
  );
}

export default define.page(async function ZondPage(ctx) {
  const data = await loadToolPage("zond");
  if (!data) return <NotFound pathname={ctx.url.pathname} />;
  return (
    <ToolFrame
      data={data}
      currentPath={ctx.url.pathname}
    >
      <ProblemPicture />
      <AskZond />
      <QuickStartBlocks />
    </ToolFrame>
  );
});
