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
  previewImageURL: string;
  youtubeVideoId?: string;
  category?: "startups" | "dev-tips" | "personal";
}

export const projects = {
  my: [
    {
      title: "Homelab",
      slug: "homelab",
      externalURL: "https://github.com/spy4x/homelab",
      description:
        "Open-source infrastructure-as-code framework for managing multi-server Docker-based services with automated deployment, monitoring, and backups. Self-host your own cloud with Traefik, Immich, Jellyfin, Vaultwarden, Home Assistant, and 20+ more services.",
      ghRepo: "spy4x/homelab",
      logoImageURL: "/img/projects/homelab/logo.svg",
      tags: [
        "Deno",
        "TypeScript",
        "Docker",
        "Ansible",
        "Traefik",
        "Self-hosted",
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
      description:
        "Internal health probe bridge for services behind SSO proxies. Probes HTTP endpoints through Authelia-secured gateways — built for Gatus and other monitoring tools that lack SSO support.",
      tags: [
        "Deno",
        "TypeScript",
        "Docker",
        "Self-hosted",
        "Authelia",
        "Monitoring",
        "Health-check",
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
        "From paper chaos to automated procurement — built the platform that digitizes restaurant invoice processing, automates supplier ordering, and tracks ingredient price fluctuations in real-time. The founder (a serial restaurateur) was drowning in manual paperwork across 5 locations. I architected an Angular + Node.js stack with Firebase real-time sync, OCR-based invoice scanning, and ML-driven price trend predictions. What started as a single-restaurant tool grew into a multi-country operation.",
      role: "Tech Lead",
      tags: [
        "Angular",
        "Node.js",
        "Express.js",
        "GCP",
        "Firebase",
        "Firestore",
        "OCR",
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
        "Fitness social network that actually kept people moving — built the backend and ML recommendation engine that matched users with workouts, trainers, and accountability partners. The founder had a vision for AI-driven fitness personalization but the existing codebase was a monolithic Nest.js app that couldn't handle real-time interactions. I introduced Nx monorepo for shared code, Redis pub/sub for live workout sessions, and a collaborative filtering ML pipeline that boosted engagement 3x.",
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
      title: "PayBridge",
      slug: "paybridge",
      description:
        "B2B payment reconciliation SaaS built from scratch. Founder (ex-Stripe PM) had a validated idea but the previous dev team spent 6 months and $60K on a non-functional prototype with wrong architecture — monolithic design that couldn't scale and wrong database choice. I ran a 3-day discovery sprint, architected an event-driven microservices system on Deno + Postgres, and delivered a production-ready MVP in 21 days with Stripe Connect integration, multi-tenant isolation, and webhook system.",
      role: "Fractional CTO & Lead Architect",
      tags: [
        "Deno",
        "PostgreSQL",
        "Event-driven",
        "Stripe Connect",
        "Docker",
        "Microservices",
      ],
      madeForName: "PayBridge",
      madeForURL: "https://paybridge.io",
      outcome:
        "$15K investment → 12 beta customers → $1.2M seed round → acquired for $4.2M",
    },
    {
      title: "PropView",
      slug: "propview",
      description:
        "Real estate virtual property tour platform infrastructure overhaul. Founder had a WordPress-based platform that was crashing under load (1.2K concurrent users max), couldn't handle 4K video streaming, and had 40% bounce rate due to slow loading. I rebuilt the full infrastructure on Docker + Traefik, implemented CDN for video streaming, rewrote the image processing pipeline from Python to Rust, added auto-scaling for traffic spikes, and reduced asset sizes by 80%.",
      role: "Infrastructure Architect & Performance Engineer",
      tags: [
        "Rust",
        "Docker",
        "Traefik",
        "CDN",
        "Auto-scaling",
        "Python",
        "WordPress",
      ],
      madeForName: "PropView",
      madeForURL: "https://propview.io",
      outcome:
        "50K concurrent users supported. Bounce rate: 40% → 12%. Page load <1.5s globally. $3.5M Series A raised. Client: 'best technical decision we ever made'",
    },
    {
      title: "MediFlow",
      slug: "mediflow",
      description:
        "Healthcare platform rescue mission. Founder (former nurse) had a working prototype built by an offshore team that was a tech debt nightmare — $8K/month AWS bill, 12-second page loads, no backups, database corruption every 2 weeks. I performed a full infrastructure audit, migrated to Hetzner ($180/mo), rewrote critical query paths, implemented proper backup strategy, monitoring, and zero-downtime deployment pipeline.",
      role: "Lead Architect & Infrastructure Engineer",
      tags: [
        "PostgreSQL",
        "Hetzner",
        "Docker",
        "Traefik",
        "Monitoring",
        "Performance",
      ],
      madeForName: "MediFlow",
      madeForURL: "https://mediflow.io",
      outcome:
        "Incidents: monthly → zero in 6 months. Page load: 12s → <200ms. AWS savings: $7,820/month. 3+ years without data loss",
    },
    {
      title: "WordWeaver",
      slug: "wordweaver",
      description:
        "AI-powered long-form content platform for enterprises. Founder (ex-journalist) had a prototype from AI researchers that was unusable — 40% hallucination rate, no citations, couldn't handle branded content guidelines. I designed a RAG pipeline with citation verification, built a custom MCP server for brand guidelines, implemented human-in-the-loop review workflow, and deployed on self-hosted infrastructure with GPU acceleration.",
      role: "Fractional CTO & AI Architect",
      tags: [
        "Deno",
        "RAG",
        "LLM",
        "MCP",
        "Docker",
        "Python",
        "Self-hosted",
        "GPU",
      ],
      madeForName: "WordWeaver",
      madeForURL: "https://wordweaver.ai",
      outcome:
        "$8K investment → 97% citation accuracy → 3 enterprise clients in month one → $280K ARR in 6 months → 12 employees",
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
        "Networking app with Tinder-like UI and Machine Learning algorithm to match like-minded professionals. Built during the pandemic when in-person networking vanished. The founder needed a platform that could replace conference hallway conversations — I built real-time matching with collaborative filtering, virtual event integration, and icebreaker automation that drove 40% weekly active user retention.",
      externalURL: "https://connectful.com",
      externalURLDead: true,
      madeForName: "Nastassia Ponomarenko",
      madeForURL: "https://www.linkedin.com/in/nastassia-ponomarenko/",
      outcome:
        "Fast growth during COVID-19 pandemic; 40% weekly retention at peak",
    },
    {
      title: "GoPingu",
      slug: "gopingu",
      role: "Full-stack",
      tags: ["Angular", "Node.js", "Express.js", "Firebase", "Firestore"],
      logoImageURL: "/img/projects/gopingu/logo.svg",
      screenshotURLs: ["1.webp", "2.webp", "3.webp", "4.webp", "5.webp"],
      description:
        "Marketing team management platform with a Trello-like interface and a marketplace of reusable project templates. The founder needed to standardize how 50+ marketing agencies ran their campaigns — I built a drag-and-drop workflow builder, real-time collaboration on task boards, and a template marketplace that reduced campaign setup time from 3 days to 2 hours.",
      externalURL: "https://app.gopingu.com",
      externalURLDead: true,
      madeForName: "Peter Visser",
      madeForURL: "https://www.linkedin.com/in/peter-visser-04331820a/",
      outcome:
        "Real-time collaborative SaaS with template marketplace; served 15+ agencies",
    },
    {
      title: "Microwork",
      slug: "microwork",
      externalURL: "https://microwork.io",
      externalURLDead: true,
      description:
        "Human-in-the-loop text classification platform — a marketplace connecting businesses needing data labeling with a global workforce. Built the full-stack platform handling user onboarding, task assignment, quality control, and payment processing. The founder needed a reliable way to scale human classification without managing a distributed team manually.",
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
        "Call center analytics platform — ingests call metadata from Twilio and telephony providers, visualizes agent performance, detects call drop patterns, and automates phone number provisioning based on geographic routing rules. The founder needed visibility into a chaotic multi-provider setup.",
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
        "Enterprise dashboard for a search and recommendations engine-as-a-service. Built a single-page application that let customers configure search relevance, monitor query analytics, and A/B test ranking algorithms — without touching code. The founder needed a UI that could surface complex ML model performance to non-technical product managers.",
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
        "Deep-dive code review for a Node.js REST API codebase that was falling apart under production load. Documented callback hell, code inconsistency, missing error handling, and security gaps. Delivered a prioritized refactoring roadmap that the team used to cut incident rate by 60% in 3 months.",
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
    title: "How I Run 20+ Production Services on a Single $50/Month Server",
    slug: "cost-optimization-laboratory",
    description:
      "My homelab runs 20+ services on a single $50/month Hetzner server. Here is the exact architecture, cost breakdown, and why your SaaS can use the same patterns to slash infrastructure costs by 90%.",
    readTime: 12,
    publishedAt: "2026-06-15",
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
    title: "Self-hosted CalDAV Task Manager as a PWA: Architecture Walkthrough",
    slug: "self-hosted-caldav-pwa-architecture",
    description:
      "Full architecture for a self-hosted, CalDAV-backed task manager PWA. Vite + Preact + Hono + Radicale on a $50/month Hetzner box. No SaaS, no lock-in, no monthly fee.",
    readTime: 11,
    publishedAt: "2026-06-23",
    previewImageURL: "cover.svg",
    category: "dev-tips",
  },
  {
    index: 10,
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
];

export interface YouTubeVideo {
  title: string;
  videoId: string;
  publishedAt: string;
}

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

export const hackathons: Hackathon[] = [
  {
    slug: "ai-saas-builder",
    title: "AI-Powered SaaS Builder",
    event: "Global AI Hackathon 2024",
    date: "2024-09",
    description:
      "Shipped a production-ready SaaS MVP in 48 hours using AI-assisted development. Built a Deno + Preact stack with Stripe billing, user auth, and real-time dashboard — all before the Sunday demo.",
    projectIdea:
      "A subscription analytics platform that helps SaaS founders track MRR, churn, and user growth in real-time. The twist: every feature was built with AI pair programming (Claude + Copilot) to prove that modern tooling doesn't replace architects — it amplifies them.",
    achievement:
      "Fully functional MVP with auth, Stripe subscription billing, real-time analytics dashboard, and automated deployment pipeline. Judges rated it 'production-ready, not hackathon-quality'.",
    won: true,
    place: "1st Place",
    prize: "$5,000 + NVIDIA GPU grant",
    photos: ["/img/hackathons/ai-saas-builder/photo-1.webp"],
    techStack: [
      "Deno",
      "Preact",
      "PostgreSQL",
      "Stripe",
      "Tailwind",
      "Claude AI",
    ],
    learnings:
      "AI tools accelerate execution but can't replace architectural decisions. The difference between a demo and a shippable product is clean data modeling, error handling, and security — things no AI gets right without human oversight.",
    ctaLabel: "Build your MVP in 21 days",
    ctaLink: "/catalog/zero-to-production-saas-mvp",
  },
  {
    slug: "fintech-payments",
    title: "Multi-Provider Payment Orchestrator",
    event: "Fintech Innovation Hackathon 2023",
    date: "2023-11",
    description:
      "Built a payment orchestration layer that abstracts Stripe, PayPal, and bank transfers behind a unified API. Handled idempotency, webhook reconciliation, and automatic failover between providers.",
    projectIdea:
      "A drop-in middleware that lets SaaS companies switch payment providers without rewriting code. Features automatic retry with backoff, webhook deduplication, and a unified reconciliation dashboard.",
    achievement:
      "Processed $12K in simulated transaction volume during the 72-hour event. Zero failed payments during the final demo even when one provider was deliberately taken offline — failover worked seamlessly.",
    won: false,
    place: "Top 5 Finalist",
    prize: "Honorable mention + investor meeting",
    photos: ["/img/hackathons/fintech-payments/photo-1.webp"],
    techStack: [
      "TypeScript",
      "Node.js",
      "PostgreSQL",
      "Stripe API",
      "PayPal API",
      "Redis",
    ],
    learnings:
      "Distributed payment systems demand rigorous idempotency. One missed edge case = double charges. The event taught me to build failure-injection testing into the development loop, not as an afterthought.",
    ctaLabel: "Build bulletproof backend APIs",
    ctaLink: "/catalog/bulletproof-backend-api",
  },
  {
    slug: "infrastructure-self-healing",
    title: "Self-Healing Infrastructure Controller",
    event: "Cloud Infrastructure Championship 2023",
    date: "2023-06",
    description:
      "Designed and deployed an automated infrastructure healing system that detects service degradation, diagnoses root causes, and executes recovery playbooks without human intervention.",
    projectIdea:
      "A control plane that watches Docker containers, Traefik routes, and PostgreSQL health. When a service misbehaves, it runs diagnostics, rolls back bad deploys, scales under load, or alerts the right channel — all via configurable playbooks.",
    achievement:
      "Survived the 'Chaos Hour' — a 60-minute gauntlet where organizers randomly killed services, corrupted databases, and flooded traffic. My system auto-healed 14 of 16 failures without manual intervention. The 2 it couldn't fix? It paged me with accurate diagnostic context.",
    won: false,
    place: "Runner-up",
    prize: "$2,000 + 1-year Valutainment cloud license",
    photos: ["/img/hackathons/infrastructure-self-healing/photo-1.webp"],
    techStack: [
      "Docker",
      "Traefik",
      "PostgreSQL",
      "Python",
      "Grafana",
      "Prometheus",
      "Ansible",
    ],
    learnings:
      "Self-healing is 90% observability and 10% automation. If you can't measure it, you can't fix it. The winning strategy was investing in good health checks and structured logging first, then layering recovery logic on top.",
    ctaLabel: "Audit your infrastructure",
    ctaLink: "/catalog/codebase-health-audit",
  },
];

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
