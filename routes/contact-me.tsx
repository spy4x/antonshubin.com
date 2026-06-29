import { define } from "../lib/utils.ts";
import { Layout } from "../components/Layout.tsx";
import { getBreadcrumb, head } from "../lib/head.ts";
import { SEOHead } from "../components/SEOHead.tsx";
import { Breadcrumb } from "../components/Breadcrumb.tsx";
import { SCHEDULE_URL } from "../lib/config.ts";
import {
  CalendarIcon,
  GithubIcon,
  LinkedInIcon,
  TelegramIcon,
  YouTubeIcon,
} from "../components/Icons.tsx";

const contacts = [
  {
    icon: <CalendarIcon class="w-6 h-6" />,
    title: "Schedule a Call",
    desc: "Book a 30-min strategy session. Pick a time that works for you.",
    href: SCHEDULE_URL,
    color:
      "bg-green-600/20 text-green-400 border-green-600/30 hover:border-green-500",
    btnClass:
      "bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block",
    btnText: "Book now",
  },
  {
    icon: <YouTubeIcon class="w-6 h-6" />,
    title: "YouTube",
    desc: "Architecture deep-dives and dev tips from a Fractional CTO.",
    href: "https://www.youtube.com/@anton-shubin",
    color: "bg-red-600/20 text-red-400 border-red-600/30 hover:border-red-500",
    btnClass:
      "bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block",
    btnText: "Watch videos",
  },
  {
    icon: <GithubIcon class="w-6 h-6" />,
    title: "GitHub",
    desc: "Open-source projects and code contributions.",
    href: "https://github.com/spy4x",
    color: "bg-gray-600/20 text-gray-300 border-gray-600/30 hover:border-white",
    btnClass:
      "bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block",
    btnText: "View profile",
  },
  {
    icon: (
      <svg
        class="w-6 h-6"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    title: "Email",
    desc: "Prefer written communication? Email me anytime.",
    href: "mailto:anton@antonshubin.com",
    color:
      "bg-gray-600/20 text-gray-300 border-gray-600/30 hover:border-gray-400",
    btnClass:
      "bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block",
    btnText: "Send email",
  },
  {
    icon: (
      <svg
        class="w-6 h-6"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
        />
      </svg>
    ),
    title: "NeatSoft",
    desc: "My Singapore-based software agency. Same quality, company backing.",
    href: "https://neatsoft.dev",
    color:
      "bg-indigo-600/20 text-indigo-400 border-indigo-600/30 hover:border-indigo-500",
    btnClass:
      "bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block",
    btnText: "Visit website",
  },
  {
    icon: <TelegramIcon class="w-6 h-6" />,
    title: "Telegram",
    desc: "Quick messages. Best for async chat and file sharing.",
    href: "https://t.me/spy4x",
    color: "bg-sky-600/20 text-sky-400 border-sky-600/30 hover:border-sky-500",
    btnClass:
      "bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block",
    btnText: "Message me",
  },
  {
    icon: <LinkedInIcon class="w-6 h-6" />,
    title: "LinkedIn",
    desc: "Connect professionally. Follow my work and updates.",
    href: "https://www.linkedin.com/in/anton-shubin",
    color:
      "bg-blue-700/20 text-blue-400 border-blue-700/30 hover:border-blue-500",
    btnClass:
      "bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block",
    btnText: "Connect",
  },
];

export default define.page(function ContactMe() {
  head.value = {
    ...head.value,
    title: "Contact Anton Shubin",
    description:
      "Fractional CTO consultation, questions, and project inquiries.",
    canonical: "https://antonshubin.com/contact-me/",
    ogType: "website",
  };
  return (
    <Layout currentPath="/contact-me">
      <SEOHead />
      <Breadcrumb
        items={getBreadcrumb(head.value.canonical, head.value.title)}
      />
      <div class="max-w-4xl mx-auto px-2 sm:px-4 py-8 sm:py-12">
        <h1 class="text-3xl sm:text-4xl font-bold text-white text-center mb-2">
          Get in Touch
        </h1>
        <p class="text-gray-400 text-center mb-10 sm:mb-12 text-base sm:text-lg">
          Pick the channel that works best for you.
        </p>

        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((c) => (
            <a
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel={c.href.startsWith("http")
                ? "noopener noreferrer"
                : undefined}
              class={`block p-4 sm:p-6 rounded-xl border transition-all ${c.color} group`}
            >
              <div class="flex items-center gap-3 mb-3">
                <div class="p-2 rounded-lg bg-gray-800/50">{c.icon}</div>
                <h3 class="text-lg font-semibold text-white">{c.title}</h3>
              </div>
              <p class="text-gray-400 text-sm mb-4">{c.desc}</p>
              <span class={c.btnClass}>
                {c.btnText} →
              </span>
            </a>
          ))}
        </div>

        {/* QR code */}
        <div class="mt-16 text-center">
          <img
            class="w-full max-w-xs mx-auto object-cover"
            src="/img/qr-share.webp"
            alt="QR code — antonshubin.com"
          />
        </div>
      </div>
    </Layout>
  );
});
