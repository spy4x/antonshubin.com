import { IconCheck } from "@spy4x/preact-icons";
import { FACT_LINK } from "../../FactCard.tsx";
import { eventAttrs } from "../../../lib/analytics.ts";
import { BROWSERS, SERVERS, type TestedRow } from "./data.ts";

const COMPATIBILITY =
  "https://github.com/spy4x/caldav-tasks-web/blob/main/docs/compatibility.md";

/** One table of "What was tested": a name, its status word and the evidence. */
function Table(
  { caption, rows }: { caption: string; rows: readonly TestedRow[] },
) {
  return (
    <table class="w-full text-left text-sm">
      <caption class="pb-2 text-left font-semibold text-parchment">
        {caption}
      </caption>
      <thead class="sr-only">
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name} data-tested={r.status} class="border-t border-rule">
            <th scope="row" class="py-3 pr-4 align-top font-normal">
              <span class="text-parchment">{r.name}</span>
              {r.version && <span class="text-graphite">{` ${r.version}`}
              </span>}
              {r.evidence && (
                <span class="mt-1 block text-graphite">{r.evidence}</span>
              )}
            </th>
            <td class="py-3 align-top whitespace-nowrap">
              <span
                class={r.status === "Untested"
                  ? "text-graphite"
                  : "inline-flex items-center gap-1.5 text-parchment"}
              >
                {r.status === "Tested" && (
                  <IconCheck class="size-4 text-sage" aria-hidden="true" />
                )}
                {r.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * "What was tested" (#465): compatibility.md's servers and browsers tables,
 * where a row says "Tested" only when a test in the repository backs it.
 */
export function Tested() {
  return (
    <section aria-labelledby="tested" class="max-w-3xl">
      <h2 id="tested" class="text-2xl sm:text-3xl text-parchment">
        What was tested
      </h2>
      <p class="mt-3 text-graphite leading-relaxed">
        A row says "tested" only when a test in caldav-tasks-web's repository
        backs it. "In daily use" means the author runs it and no automated test
        does.
      </p>
      <div class="mt-6 space-y-8">
        <Table caption="CalDAV servers" rows={SERVERS} />
        <Table caption="Browsers" rows={BROWSERS} />
      </div>
      <p class="mt-5 text-graphite">
        <a
          href={COMPATIBILITY}
          {...eventAttrs("outbound", {
            to: "github",
            item: "caldav-tasks-web",
            place: "body",
          })}
          class={FACT_LINK}
        >
          The compatibility guide
        </a>{" "}
        has the evidence for each row.
      </p>
    </section>
  );
}
