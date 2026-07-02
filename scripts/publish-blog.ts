#!/usr/bin/env -S deno run -A
/**
 * Publish a new blog post from markdown.
 *
 * Usage:
 *   deno run -A scripts/publish-blog.ts ./path/to/content.md
 *
 * Front matter format in the markdown file:
 *   ---
 *   title: "Your Title"
 *   description: "Meta description for SEO"
 *   category: "dev-tips"  # dev-tips | startups | personal
 *   publishedAt: "2026-07-02"
 *   ---
 */

const DATA_FILE = "lib/data.ts";
const CONTENT_DIR = "content/blog";

interface FrontMatter {
  title: string;
  description: string;
  category: "dev-tips" | "startups" | "personal";
  publishedAt: string;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function estimateReadTime(markdown: string): number {
  const words = markdown.split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function parseMarkdown(filePath: string): { front: FrontMatter; body: string } {
  const raw = Deno.readTextFileSync(filePath);
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    console.error("No YAML front matter found. Must start with ---");
    Deno.exit(1);
  }

  const yaml = match[1];
  const body = match[2].trim();

  // Manual YAML parse (no deps)
  const fields: Record<string, string> = {};
  for (const line of yaml.split("\n")) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (m) fields[m[1]] = m[2].replace(/^"|"$/g, "").trim();
  }

  if (
    !fields.title || !fields.description || !fields.category ||
    !fields.publishedAt
  ) {
    console.error(
      "Missing required front matter: title, description, category, publishedAt",
    );
    Deno.exit(1);
  }

  if (!["dev-tips", "startups", "personal"].includes(fields.category)) {
    console.error(
      `Invalid category: ${fields.category}. Use dev-tips, startups, or personal.`,
    );
    Deno.exit(1);
  }

  return {
    front: fields as unknown as FrontMatter,
    body,
  };
}

function updateDataTS(
  slug: string,
  front: FrontMatter,
  readTime: number,
): number {
  const data = Deno.readTextFileSync(DATA_FILE);

  // Find the blogArticles array and insert at the right position
  // Find the last article's index
  const articleMatch = data.match(/index:\s*(\d+)/g);
  const indices =
    articleMatch?.map((m) => parseInt(m.match(/\d+/)?.[0] || "0")) || [0];
  const maxIndex = Math.max(...indices);
  const newIndex = maxIndex + 1;

  // Find insertion point: the last '];' that closes blogArticles
  const blogEnd = data.match(/\n];\n\nexport interface/);
  if (!blogEnd) {
    console.error("Could not find blogArticles end in data.ts");
    Deno.exit(1);
  }

  const insertPos = data.indexOf("];", blogEnd.index!) + 2;

  const newEntry = `,\n  {
    index: ${newIndex},
    title: "${front.title}",
    slug: "${slug}",
    description:
      "${front.description.replace(/"/g, '\\"')}",
    readTime: ${readTime},
    publishedAt: "${front.publishedAt}",
    previewImageURL: "cover.svg",
    category: "${front.category}",
  }`;

  const updated = data.slice(0, insertPos) + newEntry + data.slice(insertPos);
  Deno.writeTextFileSync(DATA_FILE, updated);
  console.log(`  ✓ data.ts updated (index ${newIndex})`);

  return newIndex;
}

function sendNewsletter(slug: string, title: string) {
  const BASE_URL = "https://antonshubin.com";
  const body = `<h2>New article: ${title}</h2>
<p>Just published. Read the full article here:</p>
<p><a href="${BASE_URL}/blog/${slug}">${BASE_URL}/blog/${slug}</a></p>`;

  const cmd = new Deno.Command("deno", {
    args: [
      "run",
      "-A",
      "scripts/send-newsletter.ts",
      `New: ${title}`,
      body,
    ],
  });
  cmd.output().then((o) => {
    if (o.code === 0) {
      console.log("  ✓ Newsletter sent to subscribers");
    } else {
      console.error("  ✗ Newsletter send failed");
    }
  });
}

// ── Main ──────────────────────────────────────────────
const filePath = Deno.args[0];
if (!filePath) {
  console.error(
    "Usage: deno run -A scripts/publish-blog.ts ./path/to/content.md",
  );
  Deno.exit(1);
}

console.log(`\n  📝 Publishing blog post...`);

const { front, body } = parseMarkdown(filePath);
const slug = slugify(front.title);
const readTime = estimateReadTime(body);

console.log(`  Title: ${front.title}`);
console.log(`  Slug: ${slug}`);
console.log(`  Read time: ${readTime} min`);

// Copy markdown
const destDir = `${CONTENT_DIR}/${slug}`;
Deno.mkdirSync(destDir, { recursive: true });
const destFile = `${destDir}.md`;
let rawFile = Deno.readTextFileSync(filePath);
// If it already has front matter, keep it; otherwise add it
if (!rawFile.startsWith("---")) {
  rawFile =
    `---\ntitle: "${front.title}"\ndescription: "${front.description}"\ncategory: "${front.category}"\npublishedAt: "${front.publishedAt}"\n---\n\n${body}`;
}
Deno.writeTextFileSync(destFile, rawFile);
console.log(`  ✓ Copied to ${destFile}`);

// Update data.ts
updateDataTS(slug, front, readTime);

// Send newsletter
sendNewsletter(slug, front.title);

console.log(`\n  ✅ Published: /blog/${slug}\n`);
console.log("  Next steps:");
console.log("  1. Add a preview image to /static/img/blog/<slug>/");
console.log("  2. git add . && git commit -m 'feat(blog): add <title>'");
console.log("  3. git push origin main");
console.log("  4. deno task deploy");
