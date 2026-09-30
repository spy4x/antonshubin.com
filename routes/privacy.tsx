import type { ComponentChildren } from "preact";
import { define } from "../lib/utils.ts";
import { Layout } from "../components/Layout.tsx";
import { SEOHead } from "../components/SEOHead.tsx";
import { head } from "../lib/head.ts";
import { EMAIL_ADDRESS, emailContact } from "../lib/profiles.ts";

/**
 * What the site collects (#192). Every sentence is something the code in this
 * repository shows, except the "How long things are kept" and mail-server
 * lines, which are Anton's own rule and his setup (#301, 30 Sep 2026).
 * Change a sentence only together with the code or the rule it describes.
 */
function Section(
  { title, children }: { title: string; children: ComponentChildren },
) {
  return (
    <section class="mt-10 space-y-3">
      <h2 class="text-xl sm:text-2xl text-parchment">{title}</h2>
      {children}
    </section>
  );
}

export default define.page(function Privacy(ctx) {
  head.value = {
    ...head.value,
    title: "Privacy — Anton Shubin",
    pageName: "Privacy",
    description:
      "What antonshubin.com collects when you send the brief form, subscribe to the newsletter or just read: what is stored, where, and how to be removed.",
    canonical: "https://antonshubin.com/privacy",
    ogType: "website",
  };

  return (
    <Layout currentPath={ctx.url.pathname}>
      <SEOHead />
      <div class="max-w-2xl mx-auto text-graphite leading-relaxed">
        <h1 class="text-3xl sm:text-4xl text-parchment">Privacy</h1>
        <p class="mt-4">
          This page lists what this site collects and where it goes. It was
          checked against the site's code on 30 September 2026. How long things
          are kept is my own rule, stated below.
        </p>

        <Section title="The brief form">
          <p>
            The form asks for your name, your email address and a description of
            your tech stack, and it can carry the service you chose. Sending it
            emails those answers to me. The site writes no database record for
            them. If the mail cannot be sent, the brief is appended to a file on
            the server so it is not lost, and the site's log says that it was
            kept. If the site's mail is not set up, the whole brief is written
            to the server's log instead.
          </p>
        </Section>

        <Section title="The newsletter">
          <p>
            Entering your address sends one email to it with a confirmation
            link, and stores nothing yet. The link works for three days. Your
            address and the time you subscribed go into a list file on the
            server only when you open the link and press the button on the page
            it shows. Then the site emails you a welcome message and emails me a
            notice. The list is backed up nightly.
          </p>
          <p>
            Every newsletter carries an unsubscribe link. Opening it shows a
            confirmation page, and pressing the button on that page removes your
            address from the list. The server also records a scrambled
            fingerprint of the address (not the address itself) and the time, so
            that a confirmation link sent before you unsubscribed cannot
            subscribe you again. A fingerprint older than three days, the life
            of such a link, is cleared the next time anyone unsubscribes.
          </p>
        </Section>

        <Section title="How long things are kept">
          <p>
            Your address stays on the newsletter list until you unsubscribe. A
            brief reaches me as an email in my own mailbox. I keep it while we
            talk, and I delete it when you ask, together with any copy kept in
            the server file above.
          </p>
          <p>
            The site sends its mail through my own mail server, Stalwart, on a
            Hetzner server in Germany. No outside mail service carries it.
          </p>
        </Section>

        <Section title="Analytics and cookies">
          <p>
            The site counts page views, how fast pages load, and clicks on links
            and buttons with Umami, an analytics tool I host myself and serve
            from this site's own domain. It also counts whether a written brief
            or a booking went through, and whether a post was read to the end.
            None of these include what you typed.
          </p>
          <p>
            Umami is not loaded for known search and AI crawlers, or on the
            unsubscribe, subscription-confirmation and payment pages.
          </p>
          <p>The site's own code sets no cookies.</p>
        </Section>

        <Section title="What your browser does">
          <p>
            Project pages that show a GitHub star count ask GitHub's API from
            your browser, so GitHub sees your network address. The browser
            reuses the count for an hour and keeps it in local storage until a
            newer one overwrites it.
          </p>
          <p>
            A page with an embedded video loads it from YouTube.
          </p>
        </Section>

        <Section title="Cloudflare and the booking calendar">
          <p>
            The site is served through Cloudflare, which sees every request to
            it.
          </p>
          <p>
            The Contact page embeds the booking calendar from a separate booking
            host, which has its own handling of your data. That is out of scope
            here.
          </p>
        </Section>

        <Section title="Abuse limits">
          <p>
            To slow down bots, the brief form and the newsletter form each count
            sends per network address in the server's memory, and accept three
            an hour.
          </p>
        </Section>

        <Section title="Questions">
          <p>
            Write to{" "}
            <a
              href={emailContact.href}
              class="text-parchment underline underline-offset-4"
            >
              {EMAIL_ADDRESS}
            </a>.
          </p>
        </Section>
      </div>
    </Layout>
  );
});
