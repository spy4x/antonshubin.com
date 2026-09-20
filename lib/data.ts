export interface Project {
  title: string;
  slug?: string;
  externalURL?: string;
  externalURLDead?: boolean;
  description: string;
  logoImageURL?: string;
  logoImageStyle?: string;
  logoText?: string;
  logoTextStyle?: string;
  role?: string;
  tags?: string[];
  screenshotURLs?: string[];
  videoURL?: string;
  madeForName?: string;
  madeForURL?: string;
  archived?: boolean;
  outcome?: string;
  /** GitHub repo path like "spy4x/caldav-mcp" for star badge */
  ghRepo?: string;
}

export interface BlogArticle {
  index: number;
  title: string;
  slug: string;
  description: string;
  readTime: number;
  publishedAt: string;
  updatedAt?: string;
  previewImageURL: string;
  youtubeVideoId?: string;
  category?: "startups" | "dev-tips" | "personal";
}

export const projects = {
  my: [
    {
      title: "Production Infrastructure Lab",
      slug: "homelab",
      description:
        "Sanitized production infrastructure case study demonstrating end-to-end operational ownership. Reusable infrastructure as code and Deno automation coordinate Docker Compose delivery behind Traefik, VictoriaMetrics and Gatus monitoring, Restic integrity checks, retention and restore tooling, and Authelia SSO with 2FA.",
      role: "Platform Engineering & Operations",
      logoImageURL: "/img/projects/homelab/logo.svg",
      tags: [
        "Deno",
        "TypeScript",
        "Docker",
        "Ansible",
        "Traefik",
        "VictoriaMetrics",
        "Gatus",
        "Restic",
        "Authelia",
      ],
    },
    {
      title: "Financy",
      slug: "financy",
      externalURL: "https://github.com/spy4x/financy",
      ghRepo: "spy4x/financy",
      description:
        "Open-source, self-hostable finance tracking for individuals, families, and small businesses. Features double-entry accounting, multi-currency support, real-time collaboration, and PWA capabilities.",
      logoImageURL: "/img/projects/financy/logo.svg",
      tags: [
        "Deno",
        "Preact",
        "Hono",
        "PostgreSQL",
        "Docker",
        "PWA",
      ],
    },
    {
      title: "Air Quality Sensor",
      slug: "air-quality-sensor",
      externalURL: "https://github.com/spy4x/air-quality-sensor",
      ghRepo: "spy4x/air-quality-sensor",
      description:
        "DIY ESP32-based air quality monitoring system measuring PM1.0, PM2.5, PM10 particles, CO2, temperature, and humidity. Integrates with Home Assistant for smart home automation and real-time alerts.",
      logoImageURL: "/img/projects/air-quality-sensor/logo.svg",
      tags: [
        "ESP32",
        "C++",
        "Svelte",
        "Firebase",
        "Home Assistant",
        "IoT",
      ],
    },
    {
      title: "YouTube Tech Channel",
      externalURL: "https://www.youtube.com/@anton-shubin",
      description: "Short tech videos about software development and SaaS.",
      logoImageURL: "/img/projects/youtube-channel/logo.svg",
    },
    {
      title: "Toread.Today",
      slug: "toread-today",
      externalURL: "https://toread-today.web.app",
      description:
        "A cloud tool to organise things to read/watch later. Priorities, tags, statuses and other fancy stuff. Web, Desktop & Mobile app, Google Chrome extension.",
      logoImageURL: "/img/projects/toread-today/logo.svg",
      tags: [
        "Angular",
        "Node.js",
        "Express.js",
        "GCP",
        "Firebase",
        "Firestore",
      ],
      screenshotURLs: ["1.webp", "2.webp", "3.webp"],
      archived: true,
    },
    {
      title: "The Seed",
      externalURL: "https://github.com/spy4x/seed",
      ghRepo: "spy4x/seed",
      description:
        "A one-person SaaS application codebase template. Ship your project idea in days instead of months. It is addictive.",
      logoImageURL: "/img/projects/seed/logo.webp",
      archived: true,
    },
    {
      title: "TodoApp — CalDAV Task Manager (PWA)",
      slug: "todoapp-caldav",
      externalURL: "https://github.com/spy4x/caldav-tasks-web",
      ghRepo: "spy4x/caldav-tasks-web",
      screenshotURLs: [
        "desktop-dashboard.png",
        "desktop-kanban.png",
        "desktop-settings.png",
        "mobile-dashboard.png",
      ],
      description:
        "My Android tasks live in Tasks.org. Tasks.org syncs them to CalDAV. Every desktop client I tried either pulled its own backend or fought Tasks.org for ownership of the data — I needed a thin UI on top of the same VTODO files. Built it on Deno + Hono + Preact Signals: a CQRS layer over a CalDAV adapter (one PROPFIND/PROPPATCH/PUT/DELETE interface that speaks both Radicale and Stalwart), AES-GCM at rest for server credentials, SQLite holding only user accounts and encryption keys — never for todos. Result: 5 calendars and 140+ todos on a single Hetzner box, deployed since June 2026, including a Radicale-to-Stalwart migration that moved zero VTODO data.",
      tags: [
        "Vite",
        "Preact",
        "Preact Signals",
        "Tailwind v4",
        "Hono",
        "SQLite",
        "CalDAV",
        "PWA",
        "CQRS",
      ],
      outcome:
        "5 calendars, 140+ todos, deployed since June 2026. Radicale to Stalwart migration moved zero VTODO data. Live at todos.antonshubin.com.",
    },
    {
      title: "caldav-mcp",
      slug: "caldav-mcp",
      externalURL: "https://github.com/spy4x/caldav-mcp",
      ghRepo: "spy4x/caldav-mcp",
      description:
        "Native Deno Model Context Protocol server for CalDAV. Events + tasks, zero npm dependencies, single binary. Works with OpenCode, Claude Desktop, Cursor, and Open WebUI.",
      tags: [
        "Deno",
        "TypeScript",
        "MCP",
        "CalDAV",
        "Zero npm deps",
        "Open source",
      ],
    },
    {
      title: "Zond",
      slug: "zond",
      externalURL: "https://github.com/spy4x/zond",
      ghRepo: "spy4x/zond",
      logoImageURL: "/img/projects/zond/logo.svg",
      description:
        "Internal health probe bridge for services behind SSO proxies. Originally Deno+TS, rewritten to Go as a single 10 MB distroless binary. Probes HTTP endpoints through Authelia-secured gateways — built for Gatus and other monitoring tools that lack SSO support.",
      tags: [
        "Go",
        "Docker",
        "Self-hosted",
        "Authelia",
        "Monitoring",
        "Health-check",
        "SSO",
      ],
    },
    {
      title: "rostok",
      slug: "rostok",
      externalURL: "https://github.com/spy4x/rostok",
      ghRepo: "spy4x/rostok",
      logoImageURL: "/img/projects/rostok/logo.svg",
      description:
        "росток (sprout) — one-command scaffolder for a self-hosted homelab from a curated service catalog. The CLI writes your servers/, config.json, and .env files; every secret mutation is auto-encrypted to .env.age via age64 so secrets stay safe to commit. Bridges my homelab IaC knowledge into a reusable tool others can run.",
      outcome:
        "Drives the deployment pipeline behind /infrastructure — same commands used to ship my own homelab.",
      tags: [
        "Deno",
        "TypeScript",
        "CLI",
        "IaC",
        "Self-hosted",
        "JSR",
        "age64",
        "Docker",
      ],
    },
    {
      title: "Deno Platform Template",
      slug: "template",
      externalURL: "https://github.com/spy4x/template",
      ghRepo: "spy4x/template",
      logoImageURL: "/img/projects/template/logo.svg",
      description:
        "Reusable Deno repository baseline for SaaS products. API + SPA + MPA + worker + persistence + offline sync foundations, with libs/platform and libs/domain splits, group-core DDL with idempotent backfill, and a real outbox processor — distilled from 80+ client projects, with zero product code. Spec-driven, agent-assisted scaffolding compatible.",
      outcome:
        "Foundation for new SaaS MVPs I ship on fixed-price milestones — saves weeks of platform decisions per project.",
      tags: [
        "Deno",
        "TypeScript",
        "CQRS",
        "PostgreSQL",
        "Offline sync",
        "Outbox",
        "Template",
        "SPA",
        "MPA",
        "Worker",
      ],
    },
    {
      title: "mig",
      slug: "mig",
      externalURL: "https://github.com/spy4x/mig",
      ghRepo: "spy4x/mig",
      logoImageURL: "/img/projects/mig/logo.svg",
      description:
        "миг (moment) — tiny self-hosted meeting scheduler. One owner, one URL, one feature: book a time slot. Single Deno binary, JSON-file storage, SMTP for confirmations with ICS attachment, SHA-256 HMAC for cancellable links, timezone-aware. Built because Calendly alternatives are heavyweight — I needed a static meeting link without a Next.js + Postgres deployment.",
      outcome:
        "Powers my own booking link at meet.antonshubin.com — dogfooded daily for client intros.",
      tags: [
        "Deno",
        "Fresh",
        "TypeScript",
        "Tailwind v4",
        "Self-hosted",
        "SMTP",
        "ICS",
        "Single binary",
      ],
    },
  ] as Project[],
  freelance: [
    {
      title: "SmartLite",
      slug: "smartlite",
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
        "01-dashboard.png",
        "02-lampboxes.png",
        "03-alerts.png",
        "04-schedules.png",
        "05-zones.png",
        "06-users.png",
        "07-gateways.png",
        "08-sensors.png",
        "09-regions.png",
        "10-lamp-profiles.png",
        "11-admin-settings.png",
        "12-profile.png",
      ],
      madeForName: "Yumetronics",
      madeForURL: "https://yumetronics.com.sg/",
      outcome:
        "Built solo in 3 months; ~200 lamp poles in production since 2024",
    },
    {
      title: "Truth or Dare (DareChat)",
      slug: "truth-or-dare",
      externalURL: "https://darechat.me",
      role: "Tech Lead & Architect",
      description:
        "Real-time multiplayer Truth or Dare game for Russian-speaking audiences, live at darechat.me. Built for founder Rustam Zaripov in 2022 with a backend-first architecture in one Nx monorepo: two NestJS APIs on Express (public REST + admin) using CQRS handlers, Swagger-documented at darechat.me/api, Socket.IO chat scaled across nodes via the Redis pub/sub adapter, Firebase auth + storage + FCM push notifications, Google Cloud Vision for user-uploaded image moderation, and Prisma on PostgreSQL with backup infrastructure on Postgres 18. JWT-bearer auth across both APIs, custom Nx libraries for shared command/query handlers, and MinIO-compatible media storage. The marketing site (SvelteKit) and an Angular web app consume the same public REST API that mobile clients do — iOS and Android apps live in the founder's separate repos.",
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
      madeForName: "Rustam Zaripov",
      madeForURL: "https://www.linkedin.com/in/rustam-zaripov-69436559/",
      outcome:
        "~40K monthly active users — live at darechat.me with Swagger-documented public REST API at darechat.me/api",
    },
    {
      title: "FoodRazor",
      slug: "foodrazor",
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
      ],
      videoURL: "https://youtube.com/embed/IL3M0A7g0SE",
      madeForName: "Michael Distel",
      madeForURL: "https://www.linkedin.com/in/michaeldistel/",
      outcome:
        "Scaled across 10 countries and hundreds of restaurants; acquired in 2023",
    },
    {
      title: "Corecircle",
      slug: "corecircle",
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
      description:
        "Fitness-focused social network with exercise tracking features and ML for recommendation system.",
      externalURL: "https://corecircle.com",
      madeForName: "Nastassia Ponomarenko",
      madeForURL: "https://www.linkedin.com/in/nastassia-ponomarenko/",
      outcome: "Scaled to 200K+ online users; acquired in 2024",
    },
    {
      title: "Roley — Make a Movie!",
      slug: "roley",
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
      logoText: "Roley",
      screenshotURLs: [
        "01-home-mobile.png",
        "02-scripts-mobile.png",
        "03-script-detail-mobile.png",
        "04-my-movies-mobile.png",
        "05-editor-mobile.png",
        "06-recorder-mobile.png",
        "07-processing-mobile.png",
        "08-watch-mobile.png",
        "09-auth-mobile.png",
      ],
      madeForName: "Lila King",
      madeForURL: "https://www.linkedin.com/in/lila-king-66b94b",
      outcome:
        "Shipped the whole app end-to-end. Client went quiet before launch, so I rebuilt it as a portfolio piece — the originals belonged to them, this one's mine.",
    },
    {
      title: "Sogroya Dose Reminder",
      slug: "sogroya",
      logoImageURL: "/img/projects/sogroya/logo.svg",
      logoImageStyle: "background: white; border-radius: 0.5rem;",
      externalURL: "https://www.sogroyadosereminder.com/",
      externalURLDead: true,
      description:
        "A four-step multilingual web app for setting once-weekly Sogroya medication reminders on mobile and desktop calendars. I built the SvelteKit + TypeScript SPA, five-language flow (English, French, German, Portuguese, and Japanese), privacy consent, dose/day/time selection, and in-browser ICS generation. Static deployment kept the experience fast, backend-free, and easy to distribute globally. Completed in 2023 and remained publicly accessible on its branded domain through at least July 2025. The original project site is now offline.",
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
      madeForName: "Novo Nordisk",
      madeForURL: "https://www.novonordisk.com/",
      outcome: "Launched in 2023 for worldwide Novo Nordisk client use",
    },
    {
      title: "Connectful",
      slug: "connectful",
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
      description:
        "Networking app with Tinder-like UI and Machine Learning algorithm to match like-minded people.",
      externalURL: "https://connectful.com",
      externalURLDead: true,
      madeForName: "Nastassia Ponomarenko",
      madeForURL: "https://www.linkedin.com/in/nastassia-ponomarenko/",
      outcome: "Showed fast growth during the COVID-19 pandemic",
    },
    {
      title: "GoPingu",
      slug: "gopingu",
      role: "Full-stack",
      tags: ["Angular", "Node.js", "Express.js", "Firebase", "Firestore"],
      logoImageURL: "/img/projects/gopingu/logo.svg",
      screenshotURLs: ["1.webp", "2.webp", "3.webp", "4.webp", "5.webp"],
      description:
        "Manage marketing teams via a Trello-like app that utilized a marketplace for project templates.",
      externalURL: "https://app.gopingu.com",
      externalURLDead: true,
      madeForName: "Peter Visser",
      madeForURL: "https://www.linkedin.com/in/peter-visser-04331820a/",
      outcome:
        "Architected a real-time collaborative SaaS platform; delivered task orchestration modules",
    },
    {
      title: "Microwork",
      slug: "microwork",
      externalURL: "https://microwork.io",
      externalURLDead: true,
      description:
        "Human text classification service freelance platform. Earn money by classifying things.",
      role: "Full-stack",
      tags: ["Angular", "Node.js", "Express.js", "Firebase", "Firestore"],
      logoImageURL: "/img/projects/microwork/logo.svg",
      screenshotURLs: ["1.webp", "2.webp", "3.webp", "4.webp", "5.webp"],
      madeForName: "Andy Gough",
      madeForURL: "https://www.linkedin.com/in/andy-gough-bb262b55/",
    },
    {
      title: "CallTrack",
      slug: "calltrack",
      externalURL: "https://ctrk.net",
      description:
        "Analyze calls data from your call center and manage phone numbers based on various rules.",
      role: "Frontend",
      tags: ["Angular"],
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
      tags: ["Angular"],
      logoImageURL: "/img/projects/sajari/logo.svg",
      screenshotURLs: ["1.webp", "2.webp", "3.webp"],
      madeForName: "Hamish Ogilvy",
      madeForURL: "https://www.linkedin.com/in/hamishogilvy/",
    },
    {
      title: "Code Review & Architecture Audit",
      slug: "code-review",
      externalURL: "https://spy4x.github.io/pb-code-review",
      description:
        "Code review report for a Node.js REST API codebase. Callback hell, code inconsistency and fun.",
      role: "Audit",
      tags: ["Node.js", "Express.js"],
      logoImageURL: "/img/projects/code-review/logo.svg",
      screenshotURLs: ["1.webp", "2.webp", "3.webp"],
    },
  ] as Project[],
};

export const blogArticles: BlogArticle[] = [
  {
    index: 0,
    title:
      "Why you have to ship your idea today and with shittiest code possible",
    slug: "ship-it-today",
    description:
      "Or why so many developers abandon their attempts to release a product",
    readTime: 5,
    publishedAt: "2022-04-27",
    previewImageURL: "preview.webp",
    category: "startups",
  },
  {
    index: 1,
    title: "My journey from an office job to freelance to my startups",
    slug: "from-office-job-to-freelance-to-my-startups",
    description: "While traveling and enjoying life",
    readTime: 15,
    publishedAt: "2022-06-07",
    previewImageURL: "preview2.webp",
    category: "personal",
  },
  {
    index: 2,
    title:
      "How to Keep Sane When Developing a SaaS Startup Solo? Part 1: Mindset and Mental Health",
    slug: "how-to-keep-sane-while-developing-saas-alone-part-1-mental-health",
    description: "Take care of yourself first and work hard then",
    readTime: 7,
    publishedAt: "2022-12-15",
    previewImageURL: "preview.webp",
    category: "personal",
  },
  {
    index: 3,
    title:
      "Dev tricks, Part 1: The Importance of Code Formatting with Prettier",
    slug: "the-importance-of-code-formatting-with-prettier",
    description:
      "Are you tired of staring at messy, unformatted code that looks like it was written by a herd of chaotic monkeys? Fear not, because Prettier is here to save the day!",
    readTime: 7,
    publishedAt: "2022-12-21",
    previewImageURL: "preview.webp",
    youtubeVideoId: "uaqFYlfOZeE",
    category: "dev-tips",
  },
  {
    index: 5,
    title: "Setting Up Your Own CI/CD Server with Drone CI",
    slug: "setting-up-your-own-ci-cd-server-with-drone-ci",
    description:
      "Running your own CI/CD with Drone CI on a $10 VPS. Docker Compose setup, pipeline config, GitHub integration — skip vendor lock-in, keep your builds private.",
    readTime: 5,
    publishedAt: "2023-02-12",
    previewImageURL: "preview.webp",
    category: "dev-tips",
  },
  {
    index: 6,
    title:
      "How ChatGPT Can Help You Design System Architecture for Your Applications",
    slug: "how-chatgpt-can-help-you-design-system-architecture",
    description:
      "ChatGPT as your architecture copilot: generate system diagrams, compare databases, spot security gaps before they ship. Real prompts that work.",
    readTime: 5,
    publishedAt: "2023-04-18",
    previewImageURL: "preview.webp",
    youtubeVideoId: "Ri3TLTKvSYQ",
    category: "dev-tips",
  },
  {
    index: 7,
    title:
      "Cost-Disciplined SaaS Infrastructure: Managed Cloud, Dedicated, or Hybrid?",
    slug: "cost-optimization-laboratory",
    description:
      "A founder-readable framework for choosing managed cloud, dedicated, or hybrid SaaS infrastructure based on workload, team, compliance, recovery, and total cost.",
    readTime: 9,
    publishedAt: "2026-06-15",
    updatedAt: "2026-08-20",
    previewImageURL: "cover.svg",
    category: "startups",
  },
  {
    index: 8,
    title: "Building MCP Servers with Deno: A Practical Guide",
    slug: "building-mcp-servers-with-deno",
    description:
      "Why Deno is the right runtime for Model Context Protocol servers, the architecture I use, a working CalDAV example, and what I learned shipping four MCP servers in production.",
    readTime: 15,
    publishedAt: "2026-06-23",
    previewImageURL: "cover.svg",
    category: "dev-tips",
  },
  {
    index: 9,
    title:
      "The missing piece in a self-hosted CalDAV stack: a web UI for Tasks.org",
    slug: "self-hosted-caldav-web-ui-tasks-org",
    description:
      "Tasks.org syncs Android tasks to CalDAV. There is no web UI for that data. The fix is a stateless PWA on top of the CalDAV server you already run — and the architecture that made it boring to ship.",
    readTime: 9,
    publishedAt: "2026-07-22",
    previewImageURL: "cover.svg",
    category: "dev-tips",
  },
  {
    index: 10,
    title:
      "rostok: scaffold a self-hosted homelab from a curated service catalog",
    slug: "rostok-self-hosted-scaffolder",
    description:
      "The CLI I built to remove 80% of the friction between 'I want to self-host X' and 'X is running, secrets are committed, deploy is one command'. One wizard, a few prompts, and the same IaC structure I use for my own infrastructure.",
    readTime: 8,
    publishedAt: "2026-08-26",
    previewImageURL: "cover.svg",
    category: "dev-tips",
  },
  {
    index: 11,
    title:
      "Deno Platform Template: distilling 80+ client projects into one repo",
    slug: "deno-platform-template",
    description:
      "What I learned shipping the same SaaS skeleton over and over for paying clients. Group core, personal groups, REST + CQRS, offline sync, an outbox processor — and a deliberate decision to ship it as a template, not a framework.",
    readTime: 11,
    publishedAt: "2026-08-26",
    previewImageURL: "cover.svg",
    category: "startups",
  },
  {
    index: 12,
    title: "zond: a 10 MB probe bridge so Gatus can see through your SSO proxy",
    slug: "zond-sso-probe-bridge",
    description:
      "Health checks behind Authelia fail because Gatus cannot follow SSO redirects. Zond sits beside your services on the Docker network and answers 200 or 503 — no auth bypass, no internal URLs leaked, one config file.",
    readTime: 6,
    publishedAt: "2026-08-26",
    previewImageURL: "cover.svg",
    category: "dev-tips",
  },
  {
    index: 13,
    title:
      "mig: a 200-line meeting scheduler because Calendly alternatives are overkill",
    slug: "mig-tiny-self-hosted-scheduler",
    description:
      "One owner, one URL, one feature: book a time slot. A single Deno binary, JSON-file storage, SMTP confirmations with ICS attachments, cancellable links signed with SHA-256 HMAC. Built because I needed a static meeting link, not a database.",
    readTime: 7,
    publishedAt: "2026-08-26",
    previewImageURL: "cover.svg",
    category: "dev-tips",
  },
];

// Hand-picked, not date-sorted: these speak to cost control, AI integration,
// and delivery speed — what the home page sells. Order is the display order.
export const homeBlogSlugs: string[] = [
  "cost-optimization-laboratory",
  "building-mcp-servers-with-deno",
  "rostok-self-hosted-scaffolder",
];

export interface YouTubeVideo {
  title: string;
  videoId: string;
  publishedAt: string;
}

// Not shown on the home page until there are three new videos (issue #116):
// the current list is from early 2024 and undercuts the pitch. Kept here so
// it can come back once refreshed.
export const youtubeVideos: YouTubeVideo[] = [
  {
    title: "Working on my GPT4 chatbot improvements (SvelteKit, SSE)",
    videoId: "8a6LdZPki-s",
    publishedAt: "2024-02-26",
  },
  {
    title:
      "Walking and Coding: Remaking my Air Quality dashboard with Bun, Turborepo, SvelteKit, Hono, Chart.js",
    videoId: "opKoHblF7vE",
    publishedAt: "2024-01-28",
  },
  {
    title: "Working on my ChatGPT app (first 2 minutes are mute 😅)",
    videoId: "KFIm-O8cJ20",
    publishedAt: "2024-01-20",
  },
];

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

export function prettyDate(dateString: string): string {
  const date = new Date(dateString);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const d = date.getDate();
  const m = monthNames[date.getMonth()];
  const y = date.getFullYear();
  return `${d} ${m} ${y}`;
}
