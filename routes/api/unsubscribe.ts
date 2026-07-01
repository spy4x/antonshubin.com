import { define } from "../../lib/utils.ts";
import type { Subscriber } from "./subscribe.ts";

// Same data file as subscribe
const DATA_FILE = "data/subscribers.json";

function loadSubscribers(): Subscriber[] {
  try {
    const raw = Deno.readTextFileSync(DATA_FILE);
    return JSON.parse(raw) as Subscriber[];
  } catch {
    return [];
  }
}

function saveSubscribers(list: Subscriber[]): void {
  try {
    Deno.writeTextFileSync(DATA_FILE, JSON.stringify(list, null, 2));
  } catch (err) {
    console.error("[UNSUBSCRIBE] failed to save:", err);
  }
}

export const handler = define.handlers({
  GET(ctx) {
    const email = ctx.url.searchParams.get("email");
    if (!email) {
      return new Response(
        `<html><body style="background:#0f172a;color:#e2e8f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
          <div style="text-align:center"><h1>Missing email</h1><p>Provide ?email=your@email.com to unsubscribe.</p></div>
        </body></html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" } },
      );
    }

    const normalized = email.trim().toLowerCase();
    const subs = loadSubscribers();
    const before = subs.length;
    const remaining = subs.filter((s) => s.email !== normalized);

    if (remaining.length < before) {
      saveSubscribers(remaining);
    }

    return new Response(
      `<html><body style="background:#0f172a;color:#e2e8f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
        <div style="text-align:center">
          <h1 style="color:#22c55e">Unsubscribed</h1>
          <p>${normalized} has been removed from the list.</p>
          <a href="/" style="color:#f97316">← Back to home</a>
        </div>
      </body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  },

  async POST(ctx) {
    let body: { email?: string };
    try {
      body = await ctx.req.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
    if (!body.email) {
      return Response.json({ error: "Email required" }, { status: 400 });
    }
    const normalized = body.email.trim().toLowerCase();
    const subs = loadSubscribers();
    const remaining = subs.filter((s) => s.email !== normalized);
    saveSubscribers(remaining);
    return Response.json({
      ok: true,
      wasSubscribed: remaining.length < subs.length,
    });
  },
});
