// Guards the project JSON-LD added for issue #167: every /projects/<slug>
// page must carry exactly one project node (SoftwareSourceCode when the
// project has a repo, CreativeWork otherwise) whose author points at the
// site-wide Person node.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { jsonLd } from "./html.ts";
import { projects } from "../lib/data.ts";

const PERSON_ID = "https://antonshubin.com/#person";

function siteTest(name: string, fn: (site: Site) => Promise<void>) {
  Deno.test(name, async () => {
    const site = await startSite();
    try {
      await fn(site);
    } finally {
      await site.stop();
    }
  });
}

// A project without a `slug` has no /projects/<slug> route (e.g. an entry
// only shown inline, like "YouTube Tech Channel" or "The Seed") — skip it.
const allProjects = [...projects.my, ...projects.freelance].filter((p) =>
  p.slug
);

function findProjectNode(blocks: unknown[]) {
  return blocks.find((d) => {
    const type = (d as { "@type"?: string })["@type"];
    return type === "SoftwareSourceCode" || type === "CreativeWork";
  }) as
    | {
      "@type": string;
      name: string;
      url: string;
      image?: string[];
      author?: { "@id"?: string };
      codeRepository?: string;
      sameAs?: string[];
      sourceOrganization?: unknown;
    }
    | undefined;
}

siteTest(
  "every project page has exactly one project JSON-LD node",
  async (site) => {
    // If lib/data.ts's filter above ever drops every project, the loop below
    // would run zero times and the test would pass having checked nothing.
    assert(allProjects.length > 0, "no project has a slug to test");

    for (const project of allProjects) {
      const html = await site.html(`/projects/${project.slug}`);
      const blocks = jsonLd(html);
      const projectNodes = blocks.filter((d) => {
        const type = (d as { "@type"?: string })["@type"];
        return type === "SoftwareSourceCode" || type === "CreativeWork";
      });
      assertEquals(
        projectNodes.length,
        1,
        `/projects/${project.slug}: expected exactly one project JSON-LD node`,
      );

      const node = projectNodes[0] as {
        "@type": string;
        name: string;
        url: string;
        image?: string[];
        author?: { "@id"?: string };
        codeRepository?: string;
        sameAs?: string[];
        sourceOrganization?: unknown;
      };

      assertEquals(
        node["@type"],
        project.ghRepo ? "SoftwareSourceCode" : "CreativeWork",
        project.slug,
      );
      assertEquals(node.author?.["@id"], PERSON_ID, project.slug);
      assertEquals(node.name, project.title, project.slug);
      assert(
        /^https:\/\//.test(node.url),
        `/projects/${project.slug}: url is not absolute (${node.url})`,
      );

      // madeForName is mostly a person, not an organization — see the doc
      // comment on projectJsonLd() in routes/projects/[slug].tsx.
      assertEquals(
        node.sourceOrganization,
        undefined,
        `/projects/${project.slug}: must not invent a sourceOrganization`,
      );

      for (const url of node.image ?? []) {
        assert(
          url.startsWith("https://"),
          `/projects/${project.slug}: image URL is not absolute (${url})`,
        );
      }

      if (project.ghRepo) {
        assertEquals(
          node.codeRepository,
          `https://github.com/${project.ghRepo}`,
          project.slug,
        );
      } else {
        assertEquals(node.codeRepository, undefined, project.slug);
      }
    }
  },
);

siteTest(
  "a dead external link produces no sameAs",
  async (site) => {
    const project = allProjects.find((p) => p.slug === "connectful")!;
    assert(
      project.externalURL && project.externalURLDead,
      "fixture project is no longer externalURLDead — pick another slug",
    );
    const html = await site.html(`/projects/${project.slug}`);
    const node = findProjectNode(jsonLd(html));
    assert(node, "no project JSON-LD node found");
    assertEquals(node.sameAs, undefined, project.slug);
  },
);

siteTest(
  "a project page's JSON-LD carries the required schema.org fields",
  async (site) => {
    const project = allProjects.find((p) => p.slug === "smartlite")!;
    const html = await site.html(`/projects/${project.slug}`);
    const node = findProjectNode(jsonLd(html));
    assert(node, "no project JSON-LD node found");
    const record = node as unknown as Record<string, unknown>;

    assertEquals(record["@context"], "https://schema.org");
    assert(typeof record["@type"] === "string" && record["@type"].length > 0);
    assert(
      typeof record["@id"] === "string" &&
        (record["@id"] as string).startsWith("https://"),
    );
    assertEquals(record.name, project.title);
    assertEquals(record.description, project.description);
    assert(
      typeof record.url === "string" &&
        (record.url as string).startsWith("https://"),
    );
    assertEquals(
      (record.author as { "@id"?: string } | undefined)?.["@id"],
      PERSON_ID,
    );
    assertEquals(
      record.mainEntityOfPage,
      { "@type": "WebPage", "@id": record.url },
    );
    if (project.tags && project.tags.length > 0) {
      assertEquals(record.keywords, project.tags.join(", "));
    }
  },
);

siteTest(
  "a client project's JSON-LD dateCreated is the first year of its period",
  async (site) => {
    let checked = 0;
    for (const project of projects.freelance) {
      const html = await site.html(`/projects/${project.slug}`);
      const node = findProjectNode(jsonLd(html));
      assert(node, `${project.slug}: no project JSON-LD node found`);
      assertEquals(
        (node as unknown as Record<string, unknown>).dateCreated,
        String(project.period!.from),
        project.slug,
      );
      checked++;
    }
    assert(checked > 0, "no client project checked");
  },
);
