import { Fragment } from "preact";
import { Card } from "@spy4x/preact-ui/card";
import { IconChevronDown } from "@spy4x/preact-icons";
import CopyButton from "../../../islands/CopyButton.tsx";
import { FACT_LINK } from "../../FactCard.tsx";
import { eventAttrs } from "../../../lib/analytics.ts";
import {
  TS_LIBS_QUICK_START,
  type TsLibsPackage,
  tsLibsPackages,
  tsLibsReasons,
} from "../../../lib/ts-libs.ts";

const SLUG = "ts-libs";

/** `text` with each `backticked` span as `<code>`, the way the README renders it. */
export function WithCode({ text }: { text: string }) {
  return (
    <>
      {text.split("`").map((part, i) =>
        i % 2
          ? <code key={i} class="text-[0.9em] text-parchment">{part}</code>
          : <Fragment key={i}>{part}</Fragment>
      )}
    </>
  );
}

/**
 * A block of code that scrolls sideways inside itself instead of wrapping,
 * focusable so the keyboard can scroll it too.
 */
function CodeBlock(
  { id, code, label }: { id?: string; code: string; label: string },
) {
  return (
    <pre
      tabIndex={0}
      aria-label={label}
      class="overflow-x-auto rounded-lg border border-rule bg-paper p-4 text-sm leading-relaxed text-parchment"
    ><code id={id}>{code}</code></pre>
  );
}

/**
 * "Run the example": the README's quick start with a copy button
 * (`tool-install-copy`), and a link to the example it runs. `id` must be
 * unique on the page; the hero and the band each show one.
 */
export function RunExample({ id, repo }: { id: string; repo: string }) {
  return (
    // Its own width never stretches a grid column: the band's columns have
    // no min-w-0, and the commands' long lines would widen the page.
    <div data-run-example class="contain-inline-size">
      <div class="flex items-center justify-between gap-3">
        <p id={`${id}-label`} class="text-sm text-graphite">
          Run the example
        </p>
        <CopyButton
          elementId={id}
          label="Copy"
          title="Copy the commands"
          analytics={eventAttrs("tool-install-copy", { item: SLUG })}
        />
      </div>
      <div class="mt-2" role="group" aria-labelledby={`${id}-label`}>
        <CodeBlock id={id} code={TS_LIBS_QUICK_START} label="Commands" />
      </div>
      <p class="mt-2 text-sm text-graphite">
        main.ts is the example at the top of the{" "}
        <a
          href={`${repo}#readme`}
          {...eventAttrs("outbound", {
            to: "github",
            item: SLUG,
            place: "body",
          })}
          class={FACT_LINK}
        >
          README
        </a>.
      </p>
    </div>
  );
}

/** One package's disclosure: its name, line and where it runs; open, its example, install line and JSR link. */
function PackageItem({ pkg, open }: { pkg: TsLibsPackage; open: boolean }) {
  const full = `@spy4x/${pkg.name}`;
  const install = `deno add jsr:${full}`;
  const installId = `ts-libs-install-${pkg.name}`;
  return (
    <details
      name="ts-libs-package"
      open={open}
      id={`package-${pkg.name}`}
      data-package={pkg.name}
      class="group/pkg scroll-mt-16"
    >
      {
        /* Umami counts a click on the element that carries the event, so the
        summary's children let clicks through to it: a click on the name or
        the chevron still counts as the summary's. */
      }
      <summary
        {...eventAttrs("tool-try", { item: SLUG, part: pkg.name })}
        class="flex cursor-pointer list-none items-start gap-4 rounded-md py-4 [&::-webkit-details-marker]:hidden [&>*]:pointer-events-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-parchment"
      >
        <h3 class="min-w-0 flex-1 text-base">
          <code class="block text-parchment">{full}</code>
          <span class="mt-1 block font-sans text-sm font-normal text-graphite">
            <WithCode text={pkg.holds} />
          </span>
        </h3>
        <span class="shrink-0 pt-0.5 text-sm text-graphite">{pkg.runsOn}</span>
        <IconChevronDown
          class="mt-0.5 size-5 shrink-0 text-graphite motion-safe:transition-transform group-open/pkg:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div class="space-y-4 pb-6">
        <CodeBlock code={pkg.example} label={`${full} example`} />
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
          <code id={installId} class="text-sm text-parchment">{install}</code>
          <CopyButton
            elementId={installId}
            label="Copy"
            title="Copy the install command"
            analytics={eventAttrs("tool-install-copy", { item: SLUG })}
          />
        </div>
        <p>
          <a
            href={`https://jsr.io/${full}`}
            {...eventAttrs("outbound", {
              to: "registry",
              item: SLUG,
              place: "body",
            })}
            class={FACT_LINK}
          >
            On JSR<span class="sr-only">: {full}</span>{" "}
            <span aria-hidden="true">→</span>
          </a>
        </p>
      </div>
    </details>
  );
}

/**
 * "Pick a package": one native `<details>` per package, in one exclusive
 * group (`name`), so opening one closes the others with no JavaScript;
 * `@spy4x/validation`, the README example's first import, opens on load.
 */
export function PackagePicker() {
  return (
    <section aria-labelledby="pick" class="max-w-3xl">
      <h2 id="pick" class="text-2xl sm:text-3xl text-parchment">
        Pick a package
      </h2>
      <p class="mt-3 text-graphite">
        {tsLibsPackages.length}{" "}
        packages on JSR, each installed on its own. Each opens to an example
        from its own README.
      </p>
      <div class="mt-6 divide-y divide-rule border-y border-rule">
        {tsLibsPackages.map((pkg, i) => (
          <PackageItem key={pkg.name} pkg={pkg} open={i === 0} />
        ))}
      </div>
    </section>
  );
}

/** "Why ts-libs": four of the README's points as cards, two by two from 640px. */
export function Reasons() {
  return (
    <section aria-labelledby="why">
      <h2 id="why" class="text-2xl sm:text-3xl text-parchment">
        Why ts-libs
      </h2>
      <ul class="mt-6 grid gap-5 sm:grid-cols-2">
        {tsLibsReasons.map((r) => (
          <li key={r.title}>
            <Card data-reason class="h-full p-6">
              <h3 class="text-lg text-parchment">{r.title}</h3>
              <p class="mt-2 text-graphite leading-relaxed">
                <WithCode text={r.text} />
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** One project that imports ts-libs, with the file that proves it. */
export interface TsLibsUse {
  text: string;
  proof: { label: string; href: string };
}

/** "Where I use it": each line links the import list that proves it. */
export function WhereIUseIt({ uses }: { uses: TsLibsUse[] }) {
  return (
    <section aria-labelledby="use" class="max-w-3xl">
      <h2 id="use" class="text-2xl sm:text-3xl text-parchment">
        Where I use it
      </h2>
      <ul class="mt-4 space-y-3">
        {uses.map((u) => (
          <li key={u.text} class="pl-4 border-l-2 border-sage">
            <p class="text-parchment">{u.text}</p>
            <a
              href={u.proof.href}
              {...eventAttrs("outbound", {
                to: "github",
                item: SLUG,
                place: "body",
              })}
              class={`text-sm ${FACT_LINK}`}
            >
              {u.proof.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
