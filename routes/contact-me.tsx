import { define } from "../lib/utils.ts";
import { Layout } from "../components/Layout.tsx";
import { getBreadcrumb, head } from "../lib/head.ts";
import { SEOHead } from "../components/SEOHead.tsx";
import { Breadcrumb } from "../components/Breadcrumb.tsx";
import { ArrowRightIcon } from "../components/Icons.tsx";
import { NewTabHint } from "../components/NewTabHint.tsx";
import { SCHEDULE_URL } from "../lib/config.ts";
import {
  CalendarIcon,
  GithubIcon,
  LinkedInIcon,
  MailIcon,
  TelegramIcon,
  YouTubeIcon,
} from "../components/Icons.tsx";
import MeetEmbed, { embedUrl } from "../islands/MeetEmbed.tsx";
import { buttonClass } from "../components/Button.tsx";

/**
 * The ways to reach me. Everything else is an icon below. The "Book a call"
 * card is omitted when `SCHEDULE_URL` is unset, since it links to `#book`,
 * a section that itself only renders when the scheduler is configured.
 */
const contacts = [
  ...(SCHEDULE_URL
    ? [{
      icon: <CalendarIcon class="w-6 h-6" />,
      title: "Book a call",
      desc: "A free 30-minute intro call. Pick a time that works for you.",
      href: "#book",
      color: "bg-sage/15 text-sage border-sage/30 hover:border-sage",
      btnClass: buttonClass("primary", "px-4 py-2 text-sm"),
      isPrimaryBook: true,
      // The glyph is rendered separately, wrapped in an `aria-hidden` span, so
      // a screen reader doesn't read "downwards arrow" after the label.
      btnText: "Book now",
      downArrow: true,
      // The down arrow in the text already points at the #book section below,
      // so the trailing ArrowRightIcon every other card gets would be a second,
      // conflicting arrow here.
      hideArrow: true,
    }]
    : []),
  {
    icon: <MailIcon class="w-6 h-6" />,
    title: "Email",
    desc: "Prefer writing? Email me anytime.",
    href: "mailto:anton@antonshubin.com",
    color:
      "bg-rule-strong/20 text-graphite border-rule-strong/30 hover:border-rule-strong",
    btnClass: buttonClass("secondary", "px-4 py-2 text-sm inline-block"),
    isPrimaryBook: false,
    btnText: "Send email",
    hideArrow: false,
    downArrow: false,
  },
  {
    icon: <TelegramIcon class="w-6 h-6" />,
    title: "Telegram",
    desc: "Quick messages. Best for async chat and file sharing.",
    href: "https://t.me/spy4x",
    color: "bg-mist/20 text-mist border-mist/30 hover:border-mist",
    btnClass: buttonClass("secondary", "px-4 py-2 text-sm inline-block"),
    isPrimaryBook: false,
    btnText: "Message me",
    hideArrow: false,
    downArrow: false,
  },
];

/**
 * The intro sentence names how many cards are on the page, so it has to
 * follow `contacts.length` instead of hardcoding "Three" — the only two
 * possible counts once the "Book a call" card is optional (#152).
 */
const CONTACT_COUNT_WORD: Record<number, string> = { 2: "Two", 3: "Three" };

const profiles = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/anton-shubin",
    icon: <LinkedInIcon class="w-6 h-6" />,
  },
  {
    name: "GitHub",
    href: "https://github.com/spy4x",
    icon: <GithubIcon class="w-6 h-6" />,
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@anton-shubin",
    icon: <YouTubeIcon class="w-6 h-6" />,
  },
];

export default define.page(function ContactMe() {
  head.value = {
    ...head.value,
    title: "Contact Anton Shubin",
    description: SCHEDULE_URL
      ? "Book a free 30-minute intro call, email me, or message me on Telegram."
      : "Email me or message me on Telegram.",
    canonical: "https://antonshubin.com/contact-me",
    ogType: "website",
  };
  return (
    <Layout currentPath="/contact-me">
      <SEOHead />
      <Breadcrumb
        items={getBreadcrumb(head.value.canonical, head.value.title)}
      />
      <div class="max-w-4xl mx-auto px-2 sm:px-4 py-8 sm:py-12">
        <h1 class="text-3xl sm:text-4xl font-bold text-parchment text-center mb-2">
          Get in touch
        </h1>
        <p class="text-graphite text-center mb-10 sm:mb-12 text-base sm:text-lg">
          {CONTACT_COUNT_WORD[contacts.length]}{" "}
          ways to reach me. Pick the one that suits you.
        </p>

        {
          /* Two full literal class strings, chosen by count — Tailwind only
            picks up a class name that appears complete in the source, so
            this can't be built by interpolating the column count in. */
        }
        <div
          class={contacts.length === 3
            ? "grid gap-5 sm:grid-cols-3"
            : "grid gap-5 sm:grid-cols-2"}
        >
          {contacts.map((c) => (
            <a
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel={c.href.startsWith("http")
                ? "noopener noreferrer"
                : undefined}
              data-contact-option
              class={`block p-4 sm:p-6 rounded-xl border transition-all ${c.color} group`}
            >
              <div class="flex items-center gap-3 mb-3">
                <div class="p-2 rounded-lg bg-paper/50">{c.icon}</div>
                <h2 class="text-lg font-semibold text-parchment">{c.title}</h2>
              </div>
              <p class="text-graphite text-sm mb-4">{c.desc}</p>
              <span
                class={c.btnClass + " inline-flex items-center gap-1"}
                {...(c.isPrimaryBook ? { "data-primary-book": true } : {})}
              >
                {c.btnText}
                {c.downArrow && <span aria-hidden="true">↓</span>}
                {!c.hideArrow && <ArrowRightIcon class="w-4 h-4" />}
              </span>
              {c.href.startsWith("http") && <NewTabHint />}
            </a>
          ))}
        </div>

        <ul class="mt-10 flex justify-center gap-4">
          {profiles.map((p) => (
            <li key={p.name}>
              <a
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${p.name} (opens in a new tab)`}
                title={p.name}
                class="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-paper border border-rule text-graphite hover:text-parchment hover:border-accent transition-colors"
              >
                {p.icon}
              </a>
            </li>
          ))}
        </ul>

        <p class="mt-8 text-center text-graphite text-sm">
          Invoices are issued by NeatSoft PTE LTD, Singapore (UEN 202300222R),
          where I'm co-founder and CEO.
        </p>

        {SCHEDULE_URL && (
          <section id="book" class="mt-12 scroll-mt-4">
            <h2 class="text-2xl font-bold text-parchment text-center mb-2">
              Book a free 30-min intro call
            </h2>
            <p class="text-graphite text-center mb-6 text-sm">
              Roles, press, or a quick question — email or Telegram above.
            </p>
            <div class="flex justify-center">
              <MeetEmbed url={embedUrl(SCHEDULE_URL)} />
            </div>
            <p class="text-xs text-graphite mt-3 text-center">
              Or{" "}
              <a
                href={SCHEDULE_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-umami-event="meet-embed-fallback-click"
                class="underline hover:text-accent"
              >
                open standalone
                <NewTabHint />
              </a>.
            </p>
          </section>
        )}

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
