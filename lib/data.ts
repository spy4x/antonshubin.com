import { type BlogArticle, loadBlogArticles } from "./blog-posts.ts";

export type { BlogArticle };

export interface Project {
  title: string;
  slug?: string;
  externalURL?: string;
  externalURLDead?: boolean;
  description: string;
  logoImageURL?: string;
  /**
   * The logo was drawn for a light background and nearly disappears on the
   * dark cards: render it on a light Parchment plate (`bg-parchment`).
   */
  logoPlate?: boolean;
  logoText?: string;
  logoTextStyle?: string;
  role?: string;
  tags?: string[];
  screenshotURLs?: string[];
  /**
   * Intrinsic pixel size shared by every file in `screenshotURLs`, used to
   * set `width`/`height` on the `<img>` so the layout doesn't jump while it
   * loads. Optional — galleries whose files vary in size leave this unset.
   */
  screenshotSize?: { width: number; height: number };
  /**
   * The picture on the project's `/work` highlight card (#270): a WebP about
   * 720px wide made from the first screenshot, with its pixel size. A phone
   * screenshot is its own narrow file, centred on a Lamp panel in the card's
   * 16:10 frame. Without one the frame shows the logo.
   */
  cardImage?: { src: string; width: number; height: number };
  videoURL?: string;
  madeForName?: string;
  madeForURL?: string;
  archived?: boolean;
  outcome?: string;
  /** Margin note id (`lib/notes.ts`) that sources `outcome`. */
  outcomeNote?: string;
  /** Margin note id (`lib/notes.ts`) that sources the live `externalURL`. */
  externalURLNote?: string;
  /**
   * The live link's text in the project page's fact card, when the link is
   * not the product itself (the code review's `externalURL` is the published
   * report). Without it the card shows the bare host.
   */
  externalURLLabel?: string;
  /**
   * The `lib/catalog.ts` item closest to this work today, by its role and
   * scope: the project page links it as "Similar work today". A typo throws
   * in `catalogItem()` when the page renders (`lib/data.test.ts` checks
   * every client project).
   */
  catalogSlug?: string;
  /**
   * When the work happened, in whole years. Every client project carries
   * one (`lib/data.test.ts`); `formatPeriod()` renders it.
   */
  period?: Period;
  /**
   * Something the client company achieved later, without Anton: shown on the
   * project's /work archive row, worded as the company's outcome.
   */
  companyOutcome?: { text: string; href: string };
  /** GitHub repo path like "spy4x/caldav-mcp" for star badge */
  ghRepo?: string;
}

/** Years a project ran: `to` omitted means one year, `ongoing` means still running. */
export interface Period {
  from: number;
  to?: number;
  ongoing?: boolean;
}

/** "2021", "2018–2019" or "2024–now", with an en dash. */
export function formatPeriod(period: Period): string {
  if (period.ongoing) return `${period.from}–now`;
  if (period.to && period.to !== period.from) {
    return `${period.from}–${period.to}`;
  }
  return `${period.from}`;
}

export const projects = {
  /**
   * My own projects that are not tools: the video channel. Every other own
   * project lives in `lib/tools.ts` (#273) and has its page under `/tools`.
   */
  my: [
    {
      title: "YouTube Tech Channel",
      externalURL: "https://www.youtube.com/@anton-shubin",
      description: "Short tech videos about software development and SaaS.",
      logoImageURL: "/img/projects/youtube-channel/logo.svg",
    },
  ] as Project[],
  freelance: [
    {
      title: "SmartLite",
      slug: "smartlite",
      cardImage: {
        src: "/img/projects/smartlite/card.webp",
        width: 720,
        height: 450,
      },
      catalogSlug: "zero-to-production-saas-mvp",
      role: "Full-stack (web app + backend + infrastructure)",
      logoImageURL: "/img/projects/smartlite/logo.svg",
      description:
        "Real-time IoT control platform running in production at Gardens by the Bay, Singapore — about 200 lamp poles managed across the public-facing park, live since 2024 and still under my maintenance. Yumetronics handled the hardware and on-site pole integrations; I built the software side end-to-end: the operator web app, the backend services, the AWS infrastructure, and the deploy pipeline. Three months from kickoff to production, no prior code.\n\nThe platform bridges MQTT-driven hardware control with an operator-friendly web dashboard. Pole state, sensor readings, and command acknowledgements flow over MQTT for low-latency control; database changes propagate to connected clients via PostgreSQL LISTEN/NOTIFY for a live multi-user dashboard without polling. Operators see a geographic map of every pole, scheduled automation (time-of-day, sensor-triggered, manual override), motion and ambient-light triggers, failure detection with automatic alerts through PWA push, Telegram, and WhatsApp — plus CSV and Excel exports, charts for incident reporting, role-based access (admin / operator / viewer), TOTP 2FA, and a mobile PWA so on-site staff can act from the field.\n\nWhat this demonstrates: shipping a full real-time control system solo — web app, backend, MQTT broker, relational store, AWS deployment, observability stack — in three months, then keeping it running for a venue where downtime is not an option. The screenshots below cover every operator page: the dashboard with the per-device detail panel, the lamp, gateway, sensor, zone, region, and lamp-profile management tables, the schedule editor, the alerts feed, and the admin views.",
      tags: [
        "IoT",
        "Real-time",
        "Dashboard",
        "MQTT",
        "WebSockets",
        "Leaflet",
        "AWS",
        "Deno",
        "TypeScript",
        "PostgreSQL",
        "Docker",
        "PWA",
      ],
      screenshotURLs: [
        "01-dashboard.webp",
        "02-lampboxes.webp",
        "03-alerts.webp",
        "04-schedules.webp",
        "05-zones.webp",
        "06-users.webp",
        "07-gateways.webp",
        "08-sensors.webp",
        "09-regions.webp",
        "10-lamp-profiles.webp",
        "11-admin-settings.webp",
        "12-profile.webp",
      ],
      screenshotSize: { width: 1440, height: 1000 },
      period: { from: 2024, ongoing: true },
      madeForName: "Yumetronics",
      madeForURL: "https://yumetronics.com.sg/",
      outcome:
        "Built solo in 3 months; about 200 lamp poles in production since 2024.",
    },
    {
      title: "Truth or Dare (DareChat)",
      slug: "truth-or-dare",
      cardImage: {
        src: "/img/projects/truth-or-dare/card.webp",
        width: 720,
        height: 450,
      },
      catalogSlug: "cto-advisory-retainer",
      externalURL: "https://darechat.me",
      role: "Tech Lead & Architect",
      description:
        "Real-time multiplayer Truth or Dare game for Russian-speaking audiences, live at darechat.me. Built for founder Rustam Zaripov in 2022 with a backend-first architecture in one Nx monorepo: two NestJS APIs on Express (public REST + admin) using CQRS handlers, Swagger-documented at darechat.me/api, Socket.IO chat scaled across nodes via the Redis pub/sub adapter, Firebase auth + storage + FCM push notifications, Google Cloud Vision for user-uploaded image moderation, and Prisma on PostgreSQL. JWT-bearer auth across both APIs, custom Nx libraries for shared command/query handlers, and MinIO-compatible media storage. The marketing site (SvelteKit) and an Angular web app consume the same public REST API that mobile clients do — iOS and Android apps live in the founder's separate repos.",
      tags: [
        "Nest.js",
        "Express.js",
        "Nx monorepo",
        "CQRS",
        "Microservices",
        "PostgreSQL",
        "Prisma",
        "Redis",
        "Socket.IO",
        "WebSockets",
        "Swagger",
        "JWT",
        "TypeScript",
        "Firebase",
        "FCM",
        "Google Cloud Vision",
        "Docker",
      ],
      logoImageURL: "/img/projects/truth-or-dare/logo.svg",
      screenshotURLs: [
        "01-home.png",
        "03-swagger-overview.png",
        "04-game-modes.webp",
        "05-truth-or-dare.webp",
        "06-players-list.webp",
      ],
      period: { from: 2022 },
      madeForName: "Rustam Zaripov",
      madeForURL: "https://www.linkedin.com/in/rustam-zaripov-69436559/",
      outcome:
        "~40K monthly active users — live at darechat.me with a Swagger-documented public REST API at darechat.me/api.",
    },
    {
      title: "FoodRazor",
      slug: "foodrazor",
      cardImage: {
        src: "/img/projects/foodrazor/card.webp",
        width: 720,
        height: 450,
      },
      catalogSlug: "cto-advisory-retainer",
      externalURL: "https://foodrazor.com",
      description:
        "Digitize paper invoices, automating orders to suppliers, and tracking price fluctuations.",
      role: "Tech Lead",
      tags: [
        "Angular",
        "Node.js",
        "Express.js",
        "GCP",
        "Firebase",
        "Firestore",
      ],
      logoImageURL: "/img/projects/foodrazor/logo.svg",
      screenshotURLs: [
        "1.webp",
        "2.webp",
        "3.webp",
        "4.webp",
        "5.webp",
        "6.webp",
        "7.webp",
        "8.webp",
        "9.webp",
        "10.webp",
        "11.webp",
        "12.webp",
      ],
      videoURL: "https://youtube.com/embed/IL3M0A7g0SE",
      period: { from: 2018, to: 2019 },
      madeForName: "Michael Distel",
      madeForURL: "https://www.linkedin.com/in/michaeldistel/",
      outcome:
        "Scaled across 10 countries and hundreds of restaurants; acquired in 2023",
      outcomeNote: "foodrazor-acquired",
    },
    {
      title: "Corecircle",
      slug: "corecircle",
      cardImage: {
        src: "/img/projects/corecircle/card.webp",
        width: 208,
        height: 450,
      },
      catalogSlug: "cto-advisory-retainer",
      role: "Tech Lead",
      tags: [
        "Node.js",
        "Nest.js",
        "Nx monorepo",
        "GCP",
        "Firebase",
        "PostgreSQL",
        "Redis",
      ],
      logoImageURL: "/img/projects/corecircle/logo.svg",
      screenshotURLs: ["1.webp", "2.webp", "3.webp", "4.webp"],
      screenshotSize: { width: 460, height: 996 },
      description:
        "Fitness-focused social network with exercise tracking features and ML for recommendation system.",
      externalURL: "https://corecircle.com",
      madeForName: "Nastassia Ponomarenko",
      madeForURL: "https://www.linkedin.com/in/nastassia-ponomarenko/",
      period: { from: 2021 },
      outcome: "Scaled to 200K+ users; acquired in 2024",
      outcomeNote: "corecircle-users",
    },
    {
      title: "Roley — Make a Movie!",
      slug: "roley",
      cardImage: {
        src: "/img/projects/roley/card.webp",
        width: 208,
        height: 450,
      },
      catalogSlug: "zero-to-production-saas-mvp",
      externalURL: "https://makearoley.com",
      description:
        "Multi-video recorder for kids. Pick a script, record scene-by-scene, and the app stitches the clips into a finished movie — with intro/ending credits and 50+ transitions. Full stack: SvelteKit app, ffmpeg.wasm video pipeline, Postgres, AWS S3 + SES, Slack + Mailchimp webhooks. Paired physical craft boxes (scripts, props, costumes) with a digital recorder so the founder's vision of physical play + digital creativity just worked. The visuals below are a portfolio re-imagination I built later — the original client's branding wasn't mine to share.",
      role: "Full-stack",
      tags: [
        "SvelteKit",
        "ffmpeg.wasm",
        "PostgreSQL",
        "AWS S3",
        "AWS SES",
        "TypeScript",
        "TailwindCSS",
        "Docker",
        "Deno",
        "Fresh",
      ],
      logoImageURL: "/img/projects/roley/logo.svg",
      logoPlate: true,
      logoText: "Roley",
      screenshotURLs: [
        "01-home-mobile.webp",
        "02-scripts-mobile.webp",
        "03-script-detail-mobile.webp",
        "04-my-movies-mobile.webp",
        "05-editor-mobile.webp",
        "06-recorder-mobile.webp",
        "07-processing-mobile.webp",
        "08-watch-mobile.webp",
        "09-auth-mobile.webp",
      ],
      screenshotSize: { width: 780, height: 1688 },
      period: { from: 2023, to: 2025 },
      madeForName: "Lila King",
      madeForURL: "https://www.linkedin.com/in/lila-king-66b94b",
      outcome:
        "Built the MVP end to end. The client changed course to an offline business just before launch.",
    },
    {
      title: "Sogroya Dose Reminder",
      slug: "sogroya",
      catalogSlug: "zero-to-production-saas-mvp",
      logoImageURL: "/img/projects/sogroya/logo.svg",
      logoPlate: true,
      externalURL: "https://sogroyadosereminder.com",
      externalURLNote: "sogroya-live",
      description:
        "A four-step multilingual web app for setting once-weekly Sogroya medication reminders on mobile and desktop calendars. I built the SvelteKit + TypeScript SPA, five-language flow (English, French, German, Portuguese, and Japanese), privacy consent, dose/day/time selection, and in-browser ICS generation. Static deployment kept the experience fast, backend-free, and easy to distribute globally.",
      role: "Full-stack",
      tags: [
        "SvelteKit",
        "TypeScript",
        "Tailwind CSS",
        "i18n",
        "ICS",
        "Vercel",
      ],
      screenshotURLs: [
        "01-home.png",
        "02-consent.png",
        "03-schedule.png",
        "04-download.png",
      ],
      screenshotSize: { width: 780, height: 1688 },
      period: { from: 2023 },
      madeForName: "Novo Nordisk",
      madeForURL: "https://www.novonordisk.com/",
      outcome: "Launched in 2023 for worldwide Novo Nordisk client use.",
    },
    {
      title: "Connectful",
      slug: "connectful",
      cardImage: {
        src: "/img/projects/connectful/card.webp",
        width: 208,
        height: 450,
      },
      catalogSlug: "cto-advisory-retainer",
      role: "Tech Lead",
      tags: [
        "Node.js",
        "Nest.js",
        "Nx monorepo",
        "GCP",
        "Firebase",
        "Firestore",
      ],
      logoImageURL: "/img/projects/connectful/logo.svg",
      screenshotURLs: ["1.webp", "2.webp", "3.webp"],
      screenshotSize: { width: 460, height: 996 },
      description:
        "Networking app with Tinder-like UI and Machine Learning algorithm to match like-minded people.",
      externalURL: "https://connectful.com",
      externalURLDead: true,
      madeForName: "Nastassia Ponomarenko",
      madeForURL: "https://www.linkedin.com/in/nastassia-ponomarenko/",
      period: { from: 2020, to: 2021 },
      outcome: "Showed fast growth during the COVID-19 pandemic",
    },
    {
      title: "GoPingu",
      slug: "gopingu",
      catalogSlug: "cto-advisory-retainer",
      role: "Team lead & tech lead (full-stack)",
      tags: ["Angular", "Node.js", "Firebase", "Firestore"],
      logoImageURL: "/img/projects/gopingu/logo.svg",
      screenshotURLs: ["1.webp", "2.webp", "3.webp", "4.webp", "5.webp"],
      description:
        "Manage marketing teams via a Trello-like app that utilized a marketplace for project templates.",
      externalURL: "https://app.gopingu.com",
      externalURLDead: true,
      period: { from: 2018 },
      madeForName: "Peter Visser",
      madeForURL: "https://www.linkedin.com/in/peter-visser-04331820a/",
      outcome:
        "Architected a real-time collaborative SaaS platform; delivered task orchestration modules",
    },
    {
      title: "Microwork",
      slug: "microwork",
      catalogSlug: "cto-advisory-retainer",
      externalURL: "https://microwork.io",
      externalURLDead: true,
      description:
        "Human text classification service freelance platform. Earn money by classifying things.",
      role: "Team lead & tech lead (full-stack)",
      tags: ["AngularJS", "Node.js", "Express.js", "MongoDB", "AWS EC2"],
      logoImageURL: "/img/projects/microwork/logo.svg",
      screenshotURLs: [
        "1.webp",
        "2.webp",
        "3.webp",
        "7.webp",
        "4.webp",
        "5.webp",
        "6.webp",
      ],
      period: { from: 2015, to: 2016 },
      madeForName: "Andy Gough",
      madeForURL: "https://www.linkedin.com/in/andy-gough-bb262b55/",
    },
    {
      title: "CallTrack",
      slug: "calltrack",
      externalURL: "https://ctrk.net",
      externalURLDead: true,
      description:
        "Analyze calls data from your call center and manage phone numbers based on various rules.",
      role: "Frontend",
      tags: ["AngularJS"],
      logoImageURL: "/img/projects/calltrack/logo.svg",
      screenshotURLs: [
        "1.webp",
        "2.webp",
        "3.webp",
        "4.webp",
        "5.webp",
        "6.webp",
        "7.webp",
      ],
      period: { from: 2014 },
      madeForName: "Thomas Wusatiuk",
      madeForURL: "https://www.linkedin.com/in/wusatiuk/",
    },
    {
      title: "Sajari",
      slug: "sajari",
      role: "Frontend",
      externalURL: "https://sajari.com",
      externalURLDead: true,
      description:
        "Dashboard single-page application for search and recommendations engine as a service.",
      tags: ["AngularJS"],
      logoImageURL: "/img/projects/sajari/logo.svg",
      screenshotURLs: ["1.webp", "2.webp", "3.webp", "4.webp", "5.webp"],
      period: { from: 2014 },
      companyOutcome: {
        text: "Later renamed Search.io and acquired by Algolia in 2022",
        href:
          "https://www.algolia.com/about/news/algolia-disrupts-market-with-search-io-acquisition-ushering-in-a-new-era-of-search-and-discovery",
      },
      madeForName: "Hamish Ogilvy",
      madeForURL: "https://www.linkedin.com/in/hamishogilvy/",
    },
    {
      title: "Code Review & Architecture Audit",
      slug: "code-review",
      catalogSlug: "codebase-health-audit",
      externalURL: "https://spy4x.github.io/pb-code-review",
      externalURLLabel: "Read the audit report",
      description:
        "Code review report for a Node.js REST API codebase. Callback hell, code inconsistency and fun. After the report I interviewed seven Node.js developers in two weeks and hired the one who took the code forward.",
      role: "Audit and hiring",
      period: { from: 2017 },
      tags: ["Node.js", "Express.js"],
      logoImageURL: "/img/projects/code-review/logo.svg",
      screenshotURLs: ["1.webp", "2.webp", "3.webp"],
    },
  ] as Project[],
};

/**
 * The client projects a buyer sees first, in the order /work shows them;
 * the home page's work cards take the first three and llms.txt the first two.
 * The order puts the kind of work a buyer hires for today first (#270).
 *
 * The rule (#232): a project is a highlight when it is from 2018 or later and
 * has either an outcome a visitor can check (a live product, a public
 * acquisition, scale with a source) or a client review about work a buyer
 * would hire for today. Corecircle stays one even if its acquisition claim is
 * dropped: its review is the best rescue story on the site.
 *
 * Every other client project is in the archive (`archiveProjects()`).
 */
export const highlightSlugs: string[] = [
  "smartlite",
  "foodrazor",
  "corecircle",
  "truth-or-dare",
  "roley",
  "connectful",
];

/** The highlight projects in `highlightSlugs` order; throws on a typo. */
export function highlightProjects(): Project[] {
  return highlightSlugs.map((slug) => {
    const project = projects.freelance.find((p) => p.slug === slug);
    if (!project) {
      throw new Error(`highlightSlugs: no client project "${slug}"`);
    }
    return project;
  });
}

/**
 * Every client project that is not a highlight, newest first by
 * `period.from`. Projects that start in the same year keep the order they
 * have in `projects.freelance` (the sort is stable). Derived, never listed by
 * hand, so a new client project lands in the archive until it is promoted.
 */
export function archiveProjects(): Project[] {
  return projects.freelance
    .filter((p) => !highlightSlugs.includes(p.slug ?? ""))
    .sort((a, b) => (b.period?.from ?? 0) - (a.period?.from ?? 0));
}

/**
 * Every blog post, newest first, read from each post's front matter by
 * `lib/blog-posts.ts` (#191): `content/blog/<slug>.md` is the one place a
 * post's metadata is written.
 */
export const blogArticles: BlogArticle[] = loadBlogArticles();

export interface Hackathon {
  slug: string;
  title: string;
  event: string;
  date: string;
  description: string;
  projectIdea: string;
  achievement: string;
  won: boolean;
  place?: string;
  prize?: string;
  photos: string[];
  techStack: string[];
  learnings: string;
  /** Override default CTA ("Let's build something similar") link */
  ctaLabel?: string;
  ctaLink?: string;
}

// Real hackathon entries only. The list is empty until they are written up,
// and while it is empty /hackathons returns 404 and stays out of the sitemap
// and llms files.
export const hackathons: Hackathon[] = [];

/**
 * A screenshot's caption, from its file name when the name says what it
 * shows ("01-dashboard.png" → "Dashboard", "05-editor-mobile.webp" →
 * "Editor (mobile)"), otherwise "Screenshot 3 of 12". Captions are never
 * written by hand: a hand-written caption would be new copy.
 */
export function screenshotCaption(
  file: string,
  index: number,
  total: number,
): string {
  const words = file
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/^\d+[-_]?/, "")
    .replace(/[-_]mobile$/i, " (mobile)")
    .replace(/[-_]+/g, " ")
    .trim();
  if (!/[a-z]/i.test(words)) return `Screenshot ${index + 1} of ${total}`;
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Build the gallery image list for a project: one entry per screenshot, with
 * `width`/`height` carried over from `screenshotSize` when the project has
 * one. Used by the project detail page to feed `<ImageGallery>` without
 * repeating the src/alt convention inline. The caption doubles as the `alt`
 * text (`screenshotCaption()`).
 */
export function projectScreenshots(
  project: Project,
): { src: string; alt: string; width?: number; height?: number }[] {
  if (!project.screenshotURLs) return [];
  const total = project.screenshotURLs.length;
  return project.screenshotURLs.map((file, index) => ({
    src: `/img/projects/${project.slug}/${file}`,
    alt: screenshotCaption(file, index, total),
    width: project.screenshotSize?.width,
    height: project.screenshotSize?.height,
  }));
}

/**
 * Other client projects to show under "More work" on a project page: ranked
 * by how many `tags` they share with `project`, with the /work order
 * (the highlights, then the archive) breaking ties. `project` itself is
 * never in the list.
 */
export function relatedProjects(project: Project, count = 3): Project[] {
  const order = [...highlightProjects(), ...archiveProjects()];
  const tags = new Set(project.tags ?? []);
  const shared = (p: Project) =>
    (p.tags ?? []).filter((t) => tags.has(t)).length;
  return order
    .filter((p) => p.slug !== project.slug)
    .map((p, i) => ({ p, i, score: shared(p) }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, count)
    .map(({ p }) => p);
}
