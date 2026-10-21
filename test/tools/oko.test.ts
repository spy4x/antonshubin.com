// #464: /tools/oko keeps the tool frame and adds "From config to card" (a
// config entry, its numbered fields and the card's three real states), "What
// it is not" and the README's quick start.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { startSite } from "../harness.ts";
import { assertToolFrame } from "../tool-frame.ts";
import { visibleText } from "../html.ts";
import { tool } from "../../lib/tools.ts";

async function okoPage(): Promise<string> {
  const site = await startSite({
    // Book renders only with a booking URL; RFC 2606 host.
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  });
  try {
    return await site.html("/tools/oko");
  } finally {
    await site.stop();
  }
}

/** The visible text of the `<code>` with this id. */
function codeText(page: string, id: string): string {
  const m = page.match(new RegExp(`<code id="${id}">([\\s\\S]*?)</code>`));
  assert(m, `no <code id="${id}">`);
  return visibleText(m[1]);
}

Deno.test("the oko page wears the tool frame and plays its committed clip", async () => {
  const html = await okoPage();
  assertToolFrame(tool("oko"), html);
  assert(html.includes("/video/tools/oko/demo.webm"), "no clip");
});

Deno.test("From config to card offers up, down and no answer, with Up chosen, only its picture shown and each choice counted on its radio alone", async () => {
  const page = await okoPage();
  const radios = [...page.matchAll(/<input[^>]*name="oko-card-state"[^>]*>/g)]
    .map(([tag]) => tag);
  assertEquals(radios.length, 3);
  // A label click is passed on to its radio as a second click, so an event
  // on the label would count every choice twice.
  const labels = [
    ...page.matchAll(
      /<label[^>]*>(?:(?!<\/label>)[\s\S])*?name="oko-card-state"/g,
    ),
  ]
    .map(([match]) => match.slice(0, match.indexOf(">") + 1));
  assertEquals(labels.length, 3);
  for (const label of labels) {
    assert(!label.includes("data-umami"), `label sends an event: ${label}`);
  }
  for (const state of ["up", "down", "unknown"]) {
    const radio = radios.find((r) => r.includes(`value="${state}"`));
    assert(radio, `no ${state} radio`);
    assertEquals(radio.includes("checked"), state === "up", `${state} checked`);
    assert(
      radio.includes(`data-umami-event="tool-try"`) &&
        radio.includes(`data-umami-event-part="state:${state}"`) &&
        radio.includes(`data-umami-event-item="oko"`),
      `${state} radio sends no tool-try`,
    );
    const img = page.match(
      new RegExp(`<img[^>]*card-${state}\\.webp[^>]*>`),
    )?.[0];
    assert(img, `no ${state} picture`);
    assert(img.includes(`loading="lazy"`), `${state} picture is not lazy`);
    // Only Up starts displayed; the others are display:none until chosen.
    assertEquals(
      /class="(?:[^"]*\s)?hidden[\s"]/.test(img),
      state !== "up",
      `${state} picture's starting display`,
    );
  }
});

Deno.test("the config entry and the quick start's config.json are valid JSON that oko can read", async () => {
  const page = await okoPage();
  const entry = JSON.parse(codeText(page, "oko-config-entry"));
  assertEquals(entry.name, "Audiobooks");
  assertEquals(entry.icon, "\u{1F4DA}");
  const config = JSON.parse(codeText(page, "oko-config"));
  assertEquals(config.servers[0].services[0].endpoint, "home_photos");
});

Deno.test("every numbered marker on the config lines has its line in the legend", async () => {
  const page = await okoPage();
  const fields = new Set(
    [...page.matchAll(/data-line="(\d)"/g)].map(([, n]) => Number(n)),
  );
  assertEquals([...fields].sort(), [1, 2, 3, 4, 5, 6]);
  const legend = page.slice(
    page.indexOf("<ol", page.indexOf("config-to-card")),
  );
  assertEquals(
    [...legend.slice(0, legend.indexOf("</ol>")).matchAll(/<li/g)].length,
    6,
  );
});
