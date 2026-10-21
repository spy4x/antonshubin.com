// The /tools/dotfiles page's own wording (#460), quoted from spy4x/dotfiles:
// README.md ("The AI-agent setup", "The workstation") and
// ai-harnesses/README.md ("Layout"). Change a line here only together with
// the line it quotes there.

const BLOB = "https://github.com/spy4x/dotfiles/blob/main"
const TREE = "https://github.com/spy4x/dotfiles/tree/main"

/** One harness `deno task ai` renders for, and where it reads its config. */
export interface Harness {
  name: string
  home: string
}

export const HARNESSES: Harness[] = [
  { name: "Claude Code", home: "~/.claude" },
  { name: "OpenCode", home: "~/.config/opencode" },
  { name: "DSH", home: "$DSH_HOME" },
]

/**
 * One row of ai-harnesses/README.md's layout table: a source path and what
 * it becomes in each harness, in {@link HARNESSES} order.
 */
export interface HarnessRow {
  source: string
  targets: [string, string, string]
}

export const HARNESS_MAP: HarnessRow[] = [
  {
    source: "AGENTS.md",
    targets: ["CLAUDE.md", "AGENTS.md", "AGENTS.md"],
  },
  {
    source: "skills/<name>/ (SKILL.md + files)",
    targets: [
      "skills/<name>/",
      "skills/<name>/ and/or commands/<name>.md",
      "skills/<name>/",
    ],
  },
  {
    source: "agents/<name>.md",
    targets: [
      "agents/<name>.md",
      "agents/<name>.md",
      ".agent-presets/<name>/{preset,agent.cordis}.yml",
    ],
  },
  {
    source: "settings/<harness>/**",
    targets: [
      "settings.json merged",
      "opencode.json, tui.json merged",
      "settings.yaml merged, profiles/web/* copied",
    ],
  },
  {
    source: "mcp.jsonc",
    targets: [
      "mcpServers in ~/.claude.json, merged",
      "mcp in opencode.json, merged",
      "not rendered",
    ],
  },
]

/** The sentence under the table, from ai-harnesses/README.md, after its leading `--check`. */
export const CHECK_LINE =
  "answers one question: is what the harnesses read on this machine the same as what is committed here?"

/** One card of "The AI-agent setup": a README bullet and the files it names. */
export interface SetupCard {
  title: string
  text: string
  links: { label: string; href: string }[]
}

export const SETUP_CARDS: SetupCard[] = [
  {
    title: "One rules file, every harness",
    text:
      "ai-harnesses/AGENTS.md holds the global rules: autonomy, Git flow, secrets, cleanup, subagent orchestration. It becomes Claude Code's CLAUDE.md and OpenCode's and DSH's AGENTS.md, byte for byte.",
    links: [{
      label: "ai-harnesses/AGENTS.md",
      href: `${BLOB}/ai-harnesses/AGENTS.md`,
    }],
  },
  {
    title: "Agents and skills, written once",
    text:
      "The agents and skills in one harness-neutral format. Validated frontmatter picks a model tier and effort per agent; each adapter renders its harness's format, covered by golden tests.",
    links: [
      { label: "ai-harnesses/agents/", href: `${TREE}/ai-harnesses/agents` },
      { label: "ai-harnesses/skills/", href: `${TREE}/ai-harnesses/skills` },
    ],
  },
  {
    title: "A reviewer gate",
    text:
      "A separate, read-only reviewer runs the checks itself, breaks the code to prove each test goes red, and counts every claim in the PR body. Its verdict is what authorises a merge.",
    links: [{
      label: "agents/reviewer.md",
      href: `${BLOB}/ai-harnesses/agents/reviewer.md`,
    }],
  },
  {
    title: "Nothing left running",
    text:
      "tools/sweep-orphans.sh lists the processes and stale systemd-run scopes an agent session left behind, and the anonymous Docker volumes and networks no container uses, and stops exactly those on request. The rules cap the processes and memory of anything that spawns processes, and give every wait a deadline.",
    links: [{
      label: "tools/sweep-orphans.sh",
      href: `${BLOB}/tools/sweep-orphans.sh`,
    }],
  },
  {
    title: "Costs you can see",
    text:
      "tools/session-cost.ts reports each session's and subagent's cost, peak context and compactions from Claude Code's transcripts.",
    links: [{
      label: "tools/session-cost.ts",
      href: `${BLOB}/tools/session-cost.ts`,
    }],
  },
  {
    title: "Secrets stay local",
    text:
      "Committed env files are age-encrypted one value per line, and tools/env-key-copy.ts gives a worktree its key without the key ever being printed.",
    links: [{
      label: "tools/env-key-copy.ts",
      href: `${BLOB}/tools/env-key-copy.ts`,
    }],
  },
]

/** "The workstation": each README bullet's label and its first sentence. */
export const WORKSTATION: [string, string][] = [
  [
    "Apps.",
    "install-apps.ts installs everything in apps.jsonc with dnf, apt or zypper, and falls back to Flatpak.",
  ],
  [
    "Claude Desktop.",
    "tools/claude-desktop-update.sh installs or updates the app from Anthropic's Debian package, which Fedora has no updater for.",
  ],
  [
    "Secrets backup.",
    "tools/secrets-backup.sh backs up the age keys and plaintext env files that Syncthing keeps on this machine, with restic, every night.",
  ],
  [
    "Shell.",
    "install-shell.ts sets up Zsh, Oh My Zsh, Powerlevel10k and the aliases in aliases.sh.",
  ],
  [
    "Config in home.",
    "tmux, Neovim, Zsh and the prompt are symlinked from this repository.",
  ],
  [
    "Limits for many agents.",
    "system/ raises inotify instances and zram swap, cleans /tmp sooner, and caps the tasks each app can start.",
  ],
  [
    "VPN only while it works.",
    "tools/vpn-guard/ connects a full-tunnel VPN at boot and every 30 minutes, and drops it when the internet does not work through it.",
  ],
  [
    "Synced, not cloned.",
    "The repository lives in a Syncthing folder, and agent worktrees are ignored so they never replicate.",
  ],
]

/** The README's warning next to the quick start, shortened: the words around `deno task install-all`. */
export const INSTALL_WARNING = [
  "Only",
  "installs my setup: it adds my apps and replaces your shell configuration.",
] as const
