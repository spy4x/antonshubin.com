export interface Project {
  title: string;
  slug?: string;
  externalURL?: string;
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
}

export const projects = {
  my: [
    {
      title: "Toread.today",
      slug: "toread-today",
      externalURL: "https://toread.today",
      description:
        "A cloud tool to organise things to read/watch later. Priorities, tags, statuses and other fancy stuff. Web, Desktop & Mobile app, Google Chrome extension.",
      logoImageURL: "/img/projects/toread-today/logo.svg",
      logoImageStyle: "padding: 3rem 0;",
      logoText: "Toread.Today",
      logoTextStyle: "color: white; font-size: 2rem;",
      tags: [
        "Angular",
        "Node.js",
        "Express.js",
        "GCP",
        "Firebase",
        "Firestore",
      ],
      screenshotURLs: ["1.webp", "2.webp", "3.webp"],
    },
    {
      title: "The Seed [private beta]",
      description:
        "A one-person SaaS application codebase template. Ship your project idea in days instead of months. It is addictive.",
      logoImageURL: "/img/projects/seed/logo.webp",
    },
    {
      title: "YouTube Tech Channel",
      externalURL: "https://www.youtube.com/@anton-shubin",
      description: "Short tech videos about software development and SaaS.",
      logoImageURL: "/img/projects/youtube-channel/logo.svg",
    },
  ] as Project[],
  freelance: [
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
      madeForName: "Nastassia Ponomarenko",
      madeForURL: "https://www.linkedin.com/in/nastassia-ponomarenko/",
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
      madeForName: "Peter Visser",
      madeForURL: "https://www.linkedin.com/in/peter-visser-04331820a/",
    },
    {
      title: "Microwork",
      slug: "microwork",
      externalURL: "https://microwork.io",
      description:
        "Human text classification service freelance platform. Earn money by classifying things.",
      role: "Full-stack",
      tags: ["Angular", "Node.js", "Express.js", "Firebase", "Firestore"],
      logoText:
        "\uFF4D\uFF49\uFF43\uFF52\uFF4F\uFF57\uFF4F\uFF52\uFF4B.\uFF49\uFF4F",
      logoTextStyle: "color: white; font-weight: bold; font-size: 1.3rem;",
      screenshotURLs: ["1.webp", "2.webp", "3.webp", "4.webp", "5.webp"],
      madeForName: "Andy Gough",
      madeForURL: "https://www.linkedin.com/in/andy-gough-bb262b55/",
    },
    {
      title: "Code review",
      slug: "code-review",
      externalURL: "https://spy4x.github.io/pb-code-review",
      description:
        "Code review report for a Node.js REST API codebase. Callback hell, code inconsistency and fun.",
      role: "Audit",
      tags: ["Node.js", "Express.js"],
      logoImageURL: "/img/projects/code-review/logo.svg",
      screenshotURLs: ["1.webp", "2.webp", "3.webp"],
    },
    {
      title: "Sajari",
      slug: "sajari",
      role: "Frontend",
      externalURL: "https://sajari.com",
      description:
        "Dashboard single-page application for search and recommendations engine as a service.",
      tags: ["Angular"],
      logoImageURL: "/img/projects/sajari/logo.svg",
      logoImageStyle: "padding: 3rem;",
      screenshotURLs: ["1.webp", "2.webp", "3.webp"],
      madeForName: "Hamish Ogilvy",
      madeForURL: "https://www.linkedin.com/in/hamishogilvy/",
    },
    {
      title: "CallTrack",
      slug: "calltrack",
      externalURL: "https://ctrk.net",
      description:
        "Analyze calls data from your call center and manage phone numbers based on various rules.",
      role: "Frontend",
      tags: ["Angular"],
      logoText:
        "\uD835\uDE8C\uD835\uDE9D\uD835\uDE9B\uD835\uDE94.\uD835\uDE97\uD835\uDE8E\uD835\uDE9D",
      logoTextStyle: "color: white; font-size: 2.5rem;",
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
    publishedAt: "2022.04.27",
    previewImageURL: "preview.webp",
  },
  {
    index: 1,
    title: "My journey from an office job to freelance to my startups",
    slug: "from-office-job-to-freelance-to-my-startups",
    description: "While traveling and enjoying life",
    readTime: 15,
    publishedAt: "2022.06.07",
    previewImageURL: "preview2.webp",
  },
  {
    index: 2,
    title:
      "How to Keep Sane When Developing a SaaS Startup Solo? Part 1: Mindset and Mental Health",
    slug: "how-to-keep-sane-while-developing-saas-alone-part-1-mental-health",
    description: "Take care of yourself first and work hard then",
    readTime: 7,
    publishedAt: "2022.12.15",
    previewImageURL: "preview.webp",
  },
  {
    index: 3,
    title:
      "Dev tricks, Part 1: The Importance of Code Formatting with Prettier",
    slug: "the-importance-of-code-formatting-with-prettier",
    description:
      "Are you tired of staring at messy, unformatted code that looks like it was written by a herd of chaotic monkeys? Fear not, because Prettier is here to save the day!",
    readTime: 7,
    publishedAt: "2022.12.21",
    previewImageURL: "preview.webp",
    youtubeVideoId: "uaqFYlfOZeE",
  },
  {
    index: 5,
    title: "Setting Up Your Own CI/CD Server with Drone CI",
    slug: "setting-up-your-own-ci-cd-server-with-drone-ci",
    description:
      "Streamline your software development process with Drone CI. Learn how to set up your own CI/CD server using Drone CI.",
    readTime: 5,
    publishedAt: "2023.02.12",
    previewImageURL: "preview.webp",
  },
  {
    index: 6,
    title:
      "How ChatGPT Can Help You Design System Architecture for Your Applications",
    slug: "how-chatgpt-can-help-you-design-system-architecture",
    description:
      "Designing system architecture can be challenging for new developers. ChatGPT can simplify the process.",
    readTime: 5,
    publishedAt: "2023.04.18",
    previewImageURL: "preview.webp",
    youtubeVideoId: "Ri3TLTKvSYQ",
  },
];

export function prettyDate(dateString: string): string {
  const date = new Date(dateString.replace(/\./g, "-"));
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
