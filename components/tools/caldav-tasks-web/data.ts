// The words and the task file of /tools/caldav-tasks-web (#465). Every line
// comes from spy4x/caldav-tasks-web at v1.10.0: the task file is the made-up
// "Buy seeds" fixture of `libs/tasks/fixtures/tasksorg.ts` (its `task()` inside
// `vtodo()`), and the field rows and the tested table are
// `docs/compatibility.md`'s, word for word.

/** The Tasks.org fields "Same file, two apps" offers: the ones the file holds. */
export type FieldId = "title" | "priority" | "parent" | "order" | "reminder";

/** One field: its chip, the lines it owns in the file and its compatibility.md row. */
export interface TaskField {
  id: FieldId;
  /** The chip's label. */
  label: string;
  /** The first words of the file lines that belong to the field. */
  lines: string[];
  /** compatibility.md's "In the file" cell; `code` spans are in backticks. */
  inFile: string;
  /** compatibility.md's "Covered by the fixtures and tests" cell. */
  covered: string;
}

/** The fixture's "Buy seeds" task, line by line, exactly as Tasks.org writes it. */
export const TASK_FILE: readonly string[] = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "PRODID:+//IDN tasks.org//android-150904//EN",
  "BEGIN:VTODO",
  "DTSTAMP:20261001T080000Z",
  "CREATED:20260930T080000Z",
  "UID:100200301",
  "SUMMARY:Buy seeds",
  "PRIORITY:1",
  "RELATED-TO:100200300",
  "X-APPLE-SORT-ORDER:792512300",
  "BEGIN:VALARM",
  "TRIGGER;RELATED=END:PT0S",
  "ACTION:DISPLAY",
  "DESCRIPTION:Default Tasks.org description",
  "END:VALARM",
  "END:VTODO",
  "END:VCALENDAR",
];

export const TASK_FIELDS: readonly TaskField[] = [
  {
    id: "title",
    label: "Title, notes",
    lines: ["SUMMARY:"],
    inFile: "`SUMMARY`, `DESCRIPTION`",
    covered: "Yes (the repeating task has notes)",
  },
  {
    id: "priority",
    label: "Priority",
    lines: ["PRIORITY:"],
    inFile: "`PRIORITY` 1, 5, 9, 0",
    covered:
      "The fixtures hold 1 and 5. The editor test saves 0, 1, 5 and 9, and the quick-add test maps its words to 1, 5 and 9.",
  },
  {
    id: "parent",
    label: "Subtask of",
    lines: ["RELATED-TO:"],
    inFile: "`RELATED-TO` (Tasks.org writes no `RELTYPE`)",
    covered: "Yes, including a missing parent and a cycle",
  },
  {
    id: "order",
    label: "Manual order",
    lines: ["X-APPLE-SORT-ORDER:"],
    inFile: "`X-APPLE-SORT-ORDER`",
    covered:
      "Yes. The expected order in the fixtures was worked out by hand from Tasks.org's rule, not read off a Tasks.org screen.",
  },
  {
    id: "reminder",
    label: "Reminder",
    lines: [
      "BEGIN:VALARM",
      "TRIGGER;",
      "ACTION:",
      "DESCRIPTION:Default",
      "END:VALARM",
    ],
    inFile: "`VALARM`",
    covered:
      'Yes, the default "when due" alarm; kept untouched by an edit (`e2e/tasks.e2e.ts`)',
  },
];

/** The field a line of {@link TASK_FILE} belongs to, or undefined for a line no chip lights. */
export function fieldOf(line: string): FieldId | undefined {
  return TASK_FIELDS.find((f) =>
    f.lines.some((start) => line.startsWith(start))
  )
    ?.id;
}

/** One row of "What was tested". */
export interface TestedRow {
  name: string;
  version?: string;
  status: "Tested" | "In daily use, not in CI" | "Untested";
  evidence?: string;
}

/** compatibility.md's "CalDAV servers" table; Nextcloud and Baikal share a row. */
export const SERVERS: readonly TestedRow[] = [
  {
    name: "Radicale",
    version: "3.5.4",
    status: "Tested",
    evidence:
      "The browser test suite runs against this version, locally and in CI.",
  },
  {
    name: "Stalwart",
    version: "0.16",
    status: "In daily use, not in CI",
    evidence:
      "The author's own install runs against it. No automated test talks to a Stalwart server.",
  },
  { name: "Nextcloud, Baikal", status: "Untested" },
  { name: "Others", status: "Untested" },
];

/** compatibility.md's "Browsers" table. */
export const BROWSERS: readonly TestedRow[] = [
  {
    name: "Chromium",
    status: "Tested",
    evidence:
      "The browser tests run in Chromium only, one spec in a 375 by 812 window.",
  },
  { name: "Firefox, Safari, others", status: "Untested" },
];
