/**
 * Seeds the throwaway Radicale of `record.sh` with the demo calendar: two
 * calendars, one meeting and six made-up tasks dated around today (UTC), so the clip's
 * question "What's on my list for today?" has three tasks due today, one
 * overdue from yesterday, one for tomorrow and one already done.
 *
 *   deno run --allow-net=127.0.0.1 scripts/clips/caldav-mcp/seed.ts http://127.0.0.1:25232/demo
 *
 * Idempotent: an existing calendar answers 405 or 409 and is kept, and every task is
 * a PUT to a fixed name, so a second run overwrites the same items.
 */

interface DemoTask {
  calendar: "personal" | "work";
  uid: string;
  summary: string;
  /** Days from today, then the UTC time of day. */
  due: [days: number, time: string];
  priority?: number;
  completed?: boolean;
}

const TASKS: DemoTask[] = [
  {
    calendar: "work",
    uid: "agenda-jane",
    summary: "Send the agenda to Jane",
    due: [0, "10:00"],
    priority: 1,
  },
  {
    calendar: "work",
    uid: "review-pr",
    summary: "Review the checkout PR",
    due: [0, "14:00"],
  },
  {
    calendar: "personal",
    uid: "renew-domain",
    summary: "Renew the example.com domain",
    due: [0, "17:00"],
  },
  {
    calendar: "personal",
    uid: "reply-alex",
    summary: "Reply to Alex about the invoice",
    due: [-1, "16:00"],
  },
  {
    calendar: "work",
    uid: "demo-slides",
    summary: "Prepare the demo slides",
    due: [1, "11:00"],
  },
  {
    calendar: "personal",
    uid: "train-tickets",
    summary: "Book the train tickets",
    due: [0, "09:00"],
    completed: true,
  },
];

/** One meeting today, so "today" holds an event as well as tasks. */
const EVENTS = [
  {
    calendar: "work",
    uid: "call-jane",
    summary: "Call with Jane Doe",
    start: [0, "11:00"],
    end: [0, "11:30"],
  },
] as const;

const CALENDARS = [
  { id: "personal", name: "Personal" },
  { id: "work", name: "Work" },
];

const base = Deno.args[0]?.replace(/\/$/, "");
if (!base) {
  throw new Error(
    "usage: seed.ts <collection URL, e.g. http://127.0.0.1:25232/demo>",
  );
}
const auth = `Basic ${btoa("demo:demo")}`;

/** iCalendar UTC date-time, e.g. 20261019T100000Z. */
function icalDate(days: number, time: string): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  const [h, m] = time.split(":");
  d.setUTCHours(Number(h), Number(m), 0, 0);
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

async function request(
  method: string,
  url: string,
  body: string,
  type: string,
): Promise<number> {
  const res = await fetch(url, {
    method,
    body,
    headers: { authorization: auth, "content-type": type },
  });
  await res.body?.cancel();
  return res.status;
}

for (const cal of CALENDARS) {
  const status = await request(
    "MKCALENDAR",
    `${base}/${cal.id}/`,
    `<?xml version="1.0"?><C:mkcalendar xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">` +
      `<D:set><D:prop><D:displayname>${cal.name}</D:displayname><C:supported-calendar-component-set>` +
      `<C:comp name="VEVENT"/><C:comp name="VTODO"/></C:supported-calendar-component-set>` +
      `</D:prop></D:set></C:mkcalendar>`,
    "application/xml",
  );
  if (![201, 405, 409].includes(status)) {
    throw new Error(`MKCALENDAR ${cal.id}: ${status}`);
  }
}

const stamp = icalDate(0, "00:00");
for (const t of TASKS) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//antonshubin.com//caldav-mcp demo//EN",
    "BEGIN:VTODO",
    `UID:${t.uid}@demo.example.com`,
    `DTSTAMP:${stamp}`,
    `SUMMARY:${t.summary}`,
    `DUE:${icalDate(...t.due)}`,
    ...(t.priority ? [`PRIORITY:${t.priority}`] : []),
    ...(t.completed
      ? [
        "STATUS:COMPLETED",
        `COMPLETED:${icalDate(0, "08:30")}`,
        "PERCENT-COMPLETE:100",
      ]
      : ["STATUS:NEEDS-ACTION"]),
    "END:VTODO",
    "END:VCALENDAR",
  ];
  const status = await request(
    "PUT",
    `${base}/${t.calendar}/${t.uid}.ics`,
    lines.join("\r\n") + "\r\n",
    "text/calendar; charset=utf-8",
  );
  if (status !== 201 && status !== 204) {
    throw new Error(`PUT ${t.uid}: ${status}`);
  }
}
for (const e of EVENTS) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//antonshubin.com//caldav-mcp demo//EN",
    "BEGIN:VEVENT",
    `UID:${e.uid}@demo.example.com`,
    `DTSTAMP:${stamp}`,
    `SUMMARY:${e.summary}`,
    `DTSTART:${icalDate(...e.start)}`,
    `DTEND:${icalDate(...e.end)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const status = await request(
    "PUT",
    `${base}/${e.calendar}/${e.uid}.ics`,
    lines.join("\r\n") + "\r\n",
    "text/calendar; charset=utf-8",
  );
  if (status !== 201 && status !== 204) {
    throw new Error(`PUT ${e.uid}: ${status}`);
  }
}
console.log(
  `seeded ${EVENTS.length} event and ${TASKS.length} tasks in ${CALENDARS.length} calendars at ${base}`,
);
