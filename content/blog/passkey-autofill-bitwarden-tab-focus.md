---
title: "My app's tab kept jumping to the front: passkey autofill and Bitwarden"
seoTitle: "Passkey autofill made Bitwarden steal tab focus"
description: "Passkey autofill that renews on a timer can make Bitwarden steal focus and switch to your tab. Why, and the fix: renew only while the page has focus."
tldr:
  - "A sign-in page with passkey autofill restarted its waiting request every 4.5 minutes. With Bitwarden installed, every restart pulled the tab, and its window, to the front."
  - "Bitwarden's code (version 2026.10.0) switches to the tab and focuses its window when any passkey request it handles ends, a cancel included."
  - "The fix: start and renew passkey autofill only while document.hasFocus() is true. A renewal that falls due in the background waits for the focus event."
  - "My first guess, the \"new version\" banner, was wrong. The timer was the clue."
intro: "A friend told me my app's tab kept jumping to the front by itself, and a few days later it did it to me in the middle of a YouTube video. This post is the hunt, from the wrong first guess to the timer in my own sign-in page, and the two lines in Bitwarden's code it kept triggering. It is for anyone who ships passkey sign-in, or who ever wondered whether a web page can switch your tab."
coverImage: "/img/blog/passkey-autofill-bitwarden-tab-focus/cover.png"
coverAlt: "The Scooby-Doo unmasking meme: Fred holds a captured ghost captioned \"The ghost that keeps switching my tab\", then pulls off the sheet to reveal a scowling man captioned \"My own passkey renewal timer\"."
publishedAt: "2026-11-01"
readTime: 6
topic: "scars"
relatedTool: "seed"
catalogSlug: "codebase-health-audit"
---

![The sign-in page of the Seed demo at app.seedsaas.com: a Welcome back card with an email or username field and a password field, under a note that the demo resets every night](/img/blog/passkey-autofill-bitwarden-tab-focus/sign-in.webp "The innocent-looking page that kept grabbing the browser")

If your web app's tab keeps switching to the front by itself, look at your
passkey autofill. Bitwarden's extension switches to the tab and focuses its
window whenever a passkey request it handles ends, a cancel included, so a
conditional request that restarts on a timer steals focus on every restart. The
fix: start and renew passkey autofill only while `document.hasFocus()` is true.
Together, a timer and Bitwarden made the sign-in page of [Seed](/tools/seed), my
SaaS starter, jump to the front every four and a half minutes, no matter what
the person was doing in other tabs.

This is a post in my **Scars** series: things I got wrong, and what I changed
after. It's for anyone who ships passkey sign-in, and for anyone who wondered
whether a web page can steal your focus.

## What happened?

A friend sent me a message: the Seed demo had been open in a background tab, and
it switched to itself, showing the "New version available" banner. "Forced focus
is too much," he wrote. I agreed it would be too much, but I wasn't sure a page
could even do that.

The next day I was browsing Google Maps in Brave, and the Seed tab jumped to the
front. Twice in ten minutes. Then I put on a YouTube video, and it kept
happening, about every five minutes. Now I believed him.

## Can a web page switch your tab by itself?

Not on its own. Modern browsers don't let an ordinary tab bring itself to the
front with `window.focus()`. A service worker can focus a tab, but only while it
handles a click on one of its notifications.

I asked my coding agent to check what Seed actually ships: the live JavaScript
bundle, the service worker and the web app manifest. None of them called
`focus()` on a window, opened one, or focused a tab outside a notification
click. So the agent's first answer was "not our code". That was true of focus
calls, and it was not the whole answer.

## Was it the "New version available" banner?

Since my friend saw the "New version available" banner, the banner was the first
suspect. It lives in a screen-reader live region, so new text in it is
announced. Maybe the browser or the desktop raised the tab on that announcement?

I ran the test: a blank tab, the same live region, the same text after 15
seconds, while I sat on another tab. Nothing moved. And when it happened to me
again there was no new version at all. Wrong guess.

> Every five minutes, with no new version, is not an event. It's a timer.

## What runs every 4.5 minutes?

So I asked the agent to search the app and its shared libraries for timers. It
found one:

```ts
/** How long an autofill passkey request waits before it starts again with a fresh challenge. */
const PASSKEY_AUTOFILL_RENEW_MS = 4.5 * 60_000
```

Seed's sign-in page offers your passkeys right in the login field's autofill. To
do that, it keeps a request waiting in the background:
`navigator.credentials.get()` with `mediation: "conditional"`. The request
carries a challenge from the server, and the challenge expires after five
minutes. So every four and a half minutes the page cancelled the waiting request
and started a new one with a fresh challenge.

And my friend's tab? Its address was `/sign-in`.

## Who actually switched the tab?

Before fixing anything, I told the agent to prove it. It ran a clean Brave
profile with a probe page that cancels and restarts a conditional passkey
request every 8 seconds, while another tab is active. The probe tab stayed in
the background. So neither Brave nor the request itself does it.

The difference was my real profile, and in it, the Bitwarden extension. With its
passkey setting on, which is the default, Bitwarden handles passkeys on web
pages in place of the browser. Here are the two calls its background script
(version 2026.10.0) makes, with its helpers inlined. They run in a `finally`
after every passkey request it handles:

```js
chrome.tabs.update(tabId, { active: true, highlighted: true })
chrome.windows.update(windowId, { focused: true })
```

"Every request" includes one the page cancels. So every 4.5 minutes Seed
cancelled its waiting request, Bitwarden finished handling it, switched to the
tab and focused the window. If Brave sits behind another app, the whole window
can come up.

Bitwarden didn't run in the test profile: it only steps in with a signed-in
vault, and I wasn't going to sign a test script into mine. So this step is read
from Bitwarden's code, not reproduced. The code reads plainly, and it matches
the timing.

## How do you stop passkey autofill stealing focus?

Start and renew the conditional passkey request only while `document.hasFocus()`
is true, and catch up on the `focus` event. That was my mistake: Seed restarted
a request in a tab nobody was looking at. Seed can't change Bitwarden, but it
can stop poking it while you're away. The sign-in page now starts and renews the
autofill request only while the page has focus. A renewal that falls due in the
background waits, and runs the moment you come back, before you can pick a
passkey with an expired challenge:

```ts
const waitForAutofill = () => {
  renewal.current()
  if (!document.hasFocus()) {
    const resume = () => waitForAutofill()
    globalThis.addEventListener("focus", resume, { once: true })
    renewal.current = () => globalThis.removeEventListener("focus", resume)
    return
  }
  waiting.current?.abort()
  // ...start a new request, and renew it again in 4.5 minutes
}
```

Three tests drive the real sign-in view with a fake passkey browser and a fake
clock. They check that the request renews on time with focus, stays untouched in
the background, and starts in a tab opened in the background only once it gets
focus. The fix is in
[Seed's pull request #610](https://github.com/spy4x/seed/pull/610).

## What to take from it

1. **A timer in a background tab is not invisible.** Anything you start, cancel
   or restart there can reach extensions you never heard of. If it doesn't need
   to run while the person is away, don't run it.
2. **Renew passkey autofill only while the page has focus.** If you use
   conditional mediation with a short-lived challenge, check
   `document.hasFocus()` before you cancel and restart, and catch up on the
   `focus` event.
3. **"Every five minutes" is the best clue you can get.** My first guess chased
   an event that happened to be on screen. The period pointed straight at the
   cause.

If you use Bitwarden and a site of yours renews passkey autofill on a timer,
sign in to your vault, open the site in a background tab and wait one renewal
period. If the tab jumps to the front, add the focus check.
