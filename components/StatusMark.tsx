export type Status =
  | "ready"
  | "beta"
  | "wip"
  | "paused"
  | "archived"
  | "outcome"
  | "issue"
  | "live"
  | "offline";

interface StatusConfig {
  label: string;
  colorClass: string;
}

const CONFIG: Record<Status, StatusConfig> = {
  ready: { label: "Ready", colorClass: "text-sage" },
  beta: { label: "Beta", colorClass: "text-mist" },
  wip: { label: "WIP", colorClass: "text-graphite" },
  paused: { label: "Paused", colorClass: "text-graphite" },
  archived: { label: "Archived", colorClass: "text-graphite" },
  outcome: { label: "Outcome", colorClass: "text-parchment" },
  issue: { label: "Known issue", colorClass: "text-brick" },
  live: { label: "Live", colorClass: "text-sage" },
  offline: { label: "Offline", colorClass: "text-graphite" },
};

/** 16x16 shape for a status, one per `Status` — never colour alone. */
function Shape(
  { status, class: className }: { status: Status; class?: string },
) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 16 16",
    class: className,
  };
  switch (status) {
    case "ready":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="8" cy="8" r="6" fill="currentColor" />
        </svg>
      );
    case "beta":
      return (
        <svg {...common} aria-hidden="true">
          <circle
            cx="8"
            cy="8"
            r="6"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <path d="M8 2a6 6 0 0 1 0 12z" fill="currentColor" />
        </svg>
      );
    case "wip":
      return (
        <svg {...common} aria-hidden="true">
          <circle
            cx="8"
            cy="8"
            r="6"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-dasharray="2.5 2.5"
          />
        </svg>
      );
    case "paused":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="4" y="2" width="2.5" height="12" fill="currentColor" />
          <rect x="9.5" y="2" width="2.5" height="12" fill="currentColor" />
        </svg>
      );
    case "archived":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="2.5" y="2.5" width="11" height="11" fill="currentColor" />
        </svg>
      );
    case "outcome":
      return (
        <svg {...common} aria-hidden="true">
          <rect
            x="3.5"
            y="3.5"
            width="9"
            height="9"
            fill="currentColor"
            transform="rotate(45 8 8)"
          />
        </svg>
      );
    case "live":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="8" cy="8" r="3" fill="currentColor" />
          <circle
            cx="8"
            cy="8"
            r="6.25"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          />
        </svg>
      );
    case "offline":
      return (
        <svg {...common} aria-hidden="true">
          <circle
            cx="8"
            cy="8"
            r="6"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <path
            d="M3.5 12.5 12.5 3.5"
            stroke="currentColor"
            stroke-width="1.5"
          />
        </svg>
      );
    case "issue":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M8 2 14.5 13.5H1.5Z" fill="currentColor" />
        </svg>
      );
  }
}

/**
 * Status is always a shape plus a word, never colour alone (#184). `label`
 * overrides the default word for `outcome` ("Acquired 2023") and `issue`
 * (the concrete problem); every other status uses its fixed word so it reads
 * the same everywhere on the site.
 */
export default function StatusMark(
  { status, label, class: className }: {
    status: Status;
    label?: string;
    class?: string;
  },
) {
  const { label: defaultLabel, colorClass } = CONFIG[status];
  return (
    <span
      class={`inline-flex items-center gap-1.5 text-sm ${colorClass} ${
        className ?? ""
      }`}
    >
      <Shape status={status} class={colorClass} />
      <span>{label ?? defaultLabel}</span>
    </span>
  );
}
