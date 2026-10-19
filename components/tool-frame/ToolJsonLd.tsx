import { toJsonLd } from "../../lib/json-ld.ts";
import { clipSources, type Tool, toolLicence } from "../../lib/tools.ts";
import { heroStill, SITE, type ToolPageData } from "./tool-page.ts";

/**
 * The tool's `SoftwareSourceCode` JSON-LD node, from registry fields only.
 * A field the entry has no data for is left out, never guessed: `version`
 * until the version is really on its registry, `programmingLanguage` when it
 * is not written down, `license` when neither the entry nor GitHub names one.
 * `image` is the hero still, `sameAs` the repository and the website, and,
 * on a page with a `headline`, `subjectOf` the posts. No rating, review or offer.
 */
export function sourceCodeJsonLd(
  { tool, repo, canonical: url, posts }: ToolPageData,
) {
  const licence = toolLicence(tool);
  const still = heroStill(tool);
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    "@id": `${url}#tool`,
    "name": tool.name,
    "description": tool.summary,
    "url": url,
    "codeRepository": repo,
    ...(tool.programmingLanguage
      ? { "programmingLanguage": tool.programmingLanguage }
      : {}),
    ...(licence ? { "license": `https://spdx.org/licenses/${licence}` } : {}),
    ...(tool.registry?.published ? { "version": tool.registry.version } : {}),
    ...(still ? { "image": `${SITE}${still.src}` } : {}),
    ...(tool.website && repo ? { "sameAs": [repo, tool.website] } : {}),
    ...(tool.headline && posts.length
      ? {
        "subjectOf": posts.map((p) => ({
          "@id": `${SITE}/blog/${p.slug}#article`,
        })),
      }
      : {}),
    "author": { "@id": `${SITE}/#person` },
    "mainEntityOfPage": { "@type": "WebPage", "@id": url },
  };
}

/**
 * `SoftwareApplication` for a tool someone can run. Its `url` is only ever a
 * running public instance (`live`), never the repository.
 */
export function applicationJsonLd(tool: Tool, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${url}#app`,
    "name": tool.name,
    "description": tool.summary,
    ...(tool.appCategory ? { "applicationCategory": tool.appCategory } : {}),
    ...(tool.live
      ? {
        "url": tool.live.href.startsWith("/")
          ? `${SITE}${tool.live.href}`
          : tool.live.href,
      }
      : {}),
    "author": { "@id": `${SITE}/#person` },
    "mainEntityOfPage": { "@type": "WebPage", "@id": url },
  };
}

/**
 * A `VideoObject` for the hero clip, only once its files exist (`video` is
 * set) and only with real values: the committed `duration` and
 * `uploadDate`, the poster as `thumbnailUrl` and the MP4 as `contentUrl`.
 */
export function videoJsonLd(tool: Tool, url: string) {
  const clip = tool.clip;
  if (!clip?.video) return null;
  const mp4 = clipSources(tool.slug).find((s) => s.type === "video/mp4")!;
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "@id": `${url}#demo`,
    "name": clip.title,
    "description": clip.caption,
    "thumbnailUrl": `${SITE}${clip.poster.src}`,
    "contentUrl": `${SITE}${mp4.src}`,
    "uploadDate": clip.video.uploadDate,
    "duration": clip.video.duration,
    "about": { "@id": `${url}#tool` },
  };
}

/** One structured-data script tag. */
function Script({ node }: { node: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toJsonLd(node) }}
    />
  );
}

/**
 * Every structured-data block a tool page carries: `SoftwareSourceCode` when the code
 * is public, `SoftwareApplication` for a deployable tool, `VideoObject` for a
 * committed clip.
 */
export function ToolJsonLd({ data }: { data: ToolPageData }) {
  const { tool, repo, canonical } = data;
  const video = videoJsonLd(tool, canonical);
  return (
    <>
      {repo && <Script node={sourceCodeJsonLd(data)} />}
      {tool.deployable && <Script node={applicationJsonLd(tool, canonical)} />}
      {video && <Script node={video} />}
    </>
  );
}
