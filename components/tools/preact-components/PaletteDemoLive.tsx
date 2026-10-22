import { useSignal } from "@preact/signals"
import { useEffect, useMemo, useRef } from "preact/hooks"
import { copyToClipboard } from "@spy4x/platform/browser/clipboard"
import { createToastStore } from "@spy4x/preact-signals/toast"
import {
  CommandPalette,
  type CommandPaletteOption,
  matchOption,
  matchOptions,
} from "@spy4x/preact-ui/command-palette"
import { CopyButton } from "@spy4x/preact-ui/copy-button"
import { useApplePlatform } from "@spy4x/preact-ui/hotkeys"
import { Toastr } from "@spy4x/preact-ui/toastr"
import { track } from "../../../lib/analytics.ts"
import type { PaletteComponent } from "./palette-index.ts"
import {
  isForgiving,
  matchReason,
  PALETTE_ALIASES,
  PALETTE_EXAMPLES,
  PALETTE_FEATURED,
  PALETTE_LABELS,
  PREVIEW_THEME_NAME,
} from "./palette.ts"

const ITEM = "preact-components"

/** A row of the palette: a component to put on the stage, or a command to run. */
interface Row extends CommandPaletteOption {
  component?: PaletteComponent
  run?: () => void
}

/** What the stage shows: the picked component and why the search found it. */
interface Picked {
  component: PaletteComponent
  reason: string
}

/** `@spy4x/preact-ui` → `preact-ui`. */
function packageName(from: string): string {
  return from.replace(/^@spy4x\//, "")
}

/** The row's short package word: `ui`, `system`, `charts`. */
function hint(component: PaletteComponent): string {
  return packageName(component.from).replace(/^preact-/, "")
}

let rowsLoading: Promise<Row[]> | undefined

/**
 * The component rows, from a chunk of their own that loads the first time
 * the search is near (a pointer over it, focus in it), so the page's island
 * stays small. "Start here" repeats the featured ones for the empty query.
 */
function loadRows(): Promise<Row[]> {
  return rowsLoading ??= import("./palette-index.ts").then((
    { PALETTE_COMPONENTS },
  ) => [
    ...PALETTE_FEATURED.map((name) => {
      const component = PALETTE_COMPONENTS.find((c) => c.name === name)!
      return {
        id: `start:${name}`,
        group: "Start here",
        label: name,
        detail: component.line,
        hint: hint(component),
        component,
      }
    }),
    ...PALETTE_COMPONENTS.map((component) => ({
      id: `component:${component.name}`,
      group: "Components",
      label: component.name,
      detail: component.line,
      hint: hint(component),
      aliases: PALETTE_ALIASES[component.name],
      component,
    })),
  ]).catch((error) => {
    // A failed load is retried on the next search instead of failing forever.
    rowsLoading = undefined
    throw error
  })
}

function importLine({ name, from }: PaletteComponent): string {
  return `import { ${name} } from "${from}"`
}

/** The preview's radio for `theme`, if the page has it. */
function themeRadio(theme: "dark" | "light"): HTMLInputElement | null {
  return document.querySelector<HTMLInputElement>(
    `input[name="${PREVIEW_THEME_NAME}"][value="${theme}"]`,
  )
}

/** Props of {@link PaletteDemoLive}. */
export interface PaletteDemoProps {
  /** How many components the search holds, for its placeholder. */
  count: number
  /** The live guide's home. */
  guideHref: string
  /** The pinned install command, from lib/tools.ts. */
  install: string
}

/**
 * The live demo on /tools/preact-components (#522): the library's
 * `CommandPalette` over the library's own components, with forgiving search.
 * A picked component lands on the stage beside the search with why it
 * matched; the "Try" commands repaint the preview frame around it, show the
 * library's `Toastr` with Undo, copy the install command and open the guide.
 *
 * The server renders it with the trigger and the example chips disabled
 * (`islands/PaletteDemo.tsx` shows that markup until this module loads, after
 * the page's own load); on the client it enables them as it mounts. The root's
 * `data-apple` tells the keys line beside it which modifier to show.
 */
export function PaletteDemoLive(
  { count, guideHref, install }: PaletteDemoProps,
) {
  const mounted = useSignal(false)
  const theme = useSignal<"dark" | "light">("dark")
  const wide = useSignal(false)
  const picked = useSignal<Picked | null>(null)
  const chipQuery = useSignal<string | undefined>(undefined)
  const announcement = useSignal("")
  const root = useRef<HTMLDivElement>(null)
  const importCode = useRef<HTMLElement>(null)
  // The query the palette last filtered by: what the reader had typed at the pick.
  const lastQuery = useRef("")
  const openedOnce = useRef(false)
  const toasts = useMemo(() => createToastStore(), [])
  const apple = useApplePlatform()

  useEffect(() => {
    mounted.value = true
    if (themeRadio("light")?.checked) theme.value = "light"
    const onChange = (event: Event) => {
      const input = event.target as HTMLInputElement
      if (input.name === PREVIEW_THEME_NAME) {
        theme.value = input.value === "light" ? "light" : "dark"
      }
    }
    document.addEventListener("change", onChange)
    const query = matchMedia("(min-width: 1024px)")
    const onWidth = () => wide.value = query.matches
    onWidth()
    query.addEventListener("change", onWidth)
    return () => {
      document.removeEventListener("change", onChange)
      query.removeEventListener("change", onWidth)
    }
  }, [])

  // An example chip set the query the palette opens with; open it now that it has rendered.
  useEffect(() => {
    if (chipQuery.value === undefined) return
    root.current?.querySelector<HTMLButtonElement>("[aria-haspopup=dialog]")
      ?.click()
    chipQuery.value = undefined
  }, [chipQuery.value])

  const copyPort = (what: "install" | "import") => async (text: string) => {
    const copied = await copyToClipboard(text)
    if (copied) {
      track("tool-install-copy", { item: ITEM, part: what })
      toasts.success({
        title: "",
        body: what === "install"
          ? "Copied the install command."
          : "Copied the import line.",
      })
    } else {
      toasts.error({
        title: "",
        body: "Couldn't copy. Select the line and copy it yourself.",
      })
      const line = importCode.current
      if (what === "import" && line) {
        line.focus()
        getSelection()?.selectAllChildren(line)
      }
    }
    return copied
  }

  const setTheme = (next: "dark" | "light") => {
    const radio = themeRadio(next)
    if (!radio) return
    // Checked without a click, so the radio's own analytics attribute stays the chips' count.
    radio.checked = true
    radio.dispatchEvent(new Event("change", { bubbles: true }))
    track("tool-try", { item: ITEM, part: `command:theme-${next}` })
  }

  const other = theme.value === "dark" ? "light" : "dark"
  const commands: Row[] = [
    {
      id: "command:theme",
      group: "Try",
      label: `Switch the preview to ${other === "light" ? "Light" : "Dark"}`,
      detail: "Repaints this frame with the library's other palette",
      hint: "theme",
      aliases: ["theme", other, "тема"],
      run: () => setTheme(other),
    },
    {
      id: "command:toast",
      group: "Try",
      label: "Show a toast",
      detail: "The library's Toastr, with an Undo button",
      hint: "Toastr",
      aliases: ["toastr", "notification"],
      run: () => {
        track("tool-try", { item: ITEM, part: "command:toast" })
        toasts.success({
          title: "",
          body: "This is Toastr. It closes by itself.",
          action: {
            label: "Undo",
            onAction: () => {
              track("tool-try", { item: ITEM, part: "command:undo" })
              toasts.success({
                title: "",
                body: "Undone. Nothing changed: it's a demo.",
              })
            },
          },
        })
      },
    },
    {
      id: "command:copy",
      group: "Try",
      label: "Copy the install command",
      detail: install,
      hint: "copy",
      aliases: ["install", "copy"],
      run: () => void copyPort("install")(install),
    },
    {
      id: "command:guide",
      group: "Try",
      label: "Open the live UI guide",
      detail: "Every component, running, with its code",
      hint: "link",
      aliases: ["guide", "docs"],
      run: () => {
        track("outbound", { to: "live", item: ITEM, place: "body" })
        location.assign(guideHref)
      },
    },
  ]

  const pick = (row: Row) => {
    if (row.run) return row.run()
    const component = row.component!
    const query = lastQuery.current
    const kind = matchOption(query, {
      label: component.name,
      aliases: PALETTE_ALIASES[component.name],
    })
    track("tool-try", {
      item: ITEM,
      part: isForgiving(kind) ? "pick:forgiving" : "pick:name",
    })
    const reason = matchReason(query, component.name)
    picked.value = { component, reason }
    announcement.value = [
      `${component.name}, from ${packageName(component.from)}.`,
      reason,
    ].filter(Boolean).join(" ")
  }

  const shown = picked.value
  return (
    <div
      ref={root}
      data-palette-demo
      data-apple={apple ? "true" : "false"}
      onFocusIn={(event) => {
        // The palette's field takes focus each time it opens, by click, hotkey or chip.
        if (
          openedOnce.current ||
          !(event.target as HTMLElement).closest("dialog")
        ) return
        openedOnce.current = true
        track("tool-try", { item: ITEM, part: "palette:open" })
      }}
      class="grid gap-6 lg:grid-cols-12"
    >
      <div class="min-w-0 space-y-4 lg:col-span-5">
        {/* Disabled until the island runs: no press before hydration does nothing. */}
        <fieldset
          disabled={!mounted.value}
          onPointerEnter={() => void loadRows().catch(() => {})}
          onFocusIn={() => void loadRows().catch(() => {})}
          class="mx-0 min-w-0 space-y-4 border-0 p-0 disabled:opacity-70"
        >
          {/* palette:start */}
          <CommandPalette<Row>
            trigger="field"
            hotkeys={["mod+k", "/"]}
            search={async (query) => {
              lastQuery.current = query
              const rows = await loadRows()
              return query.trim() === ""
                ? [...commands, ...rows.filter((r) => r.group === "Start here")]
                // Components first, so a tie goes to the component, not a command.
                : matchOptions(
                  [
                    ...rows.filter((r) => r.group === "Components"),
                    ...commands,
                  ],
                  query,
                )
            }}
            debounce={0}
            defaultQuery={chipQuery.value ?? ""}
            onSelect={pick}
            labels={{
              ...PALETTE_LABELS,
              placeholder: PALETTE_LABELS.placeholder(count),
            }}
            class="h-12! text-base!"
          />
          {/* palette:end */}
          <div>
            <p id="palette-examples" class="text-sm text-muted">Try:</p>
            <ul
              aria-labelledby="palette-examples"
              class="mt-2 flex flex-wrap gap-2"
            >
              {PALETTE_EXAMPLES.map((example) => (
                <li key={example.query}>
                  <button
                    type="button"
                    data-palette-example={example.part}
                    onClick={() => {
                      track("tool-try", {
                        item: ITEM,
                        part: `example:${example.part}`,
                      })
                      chipQuery.value = example.query
                    }}
                    class="inline-flex min-h-11 items-center gap-2 rounded-lg border border-subtle bg-surface px-3 text-sm text-foreground hover:border-control focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-focus"
                  >
                    <span class="sr-only">Search for</span>
                    <span class="font-mono">{example.query}</span>
                    <span class="text-muted">{example.caption}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </fieldset>
      </div>
      <div
        data-palette-stage={shown ? "filled" : "empty"}
        class="min-w-0 rounded-lg border border-subtle bg-surface p-4 sm:p-6 lg:col-span-7"
      >
        {shown
          ? (
            <div key={shown.component.name} class="palette-stage-in">
              <p class="text-sm text-muted">
                {packageName(shown.component.from)} · component
              </p>
              <h3 class="mt-1 text-xl text-foreground">
                {shown.component.name}
              </h3>
              <p class="mt-2">{shown.component.line}</p>
              <div class="mt-4 flex items-center gap-2 rounded-lg border border-subtle bg-canvas py-1 pl-3 pr-1">
                <code
                  ref={importCode}
                  tabIndex={-1}
                  data-palette-import
                  class="min-w-0 flex-1 font-mono text-sm [overflow-wrap:anywhere] focus-visible:outline-hidden"
                >
                  {importLine(shown.component)}
                </code>
                <CopyButton
                  textToCopy={importLine(shown.component)}
                  copy={copyPort("import")}
                  title="Copy"
                  copyLabel="Copy the import line"
                />
              </div>
              {shown.reason && (
                <p data-palette-reason class="mt-3 text-sm">{shown.reason}</p>
              )}
              <p class="mt-3">
                <a
                  href={`${guideHref}${shown.component.guide ?? ""}`}
                  data-umami-event="outbound"
                  data-umami-event-to="live"
                  data-umami-event-item={ITEM}
                  data-umami-event-place="body"
                  class="text-sm text-foreground underline underline-offset-4"
                >
                  {shown.component.guide
                    ? "See it in the live UI guide"
                    : "Open the live UI guide"}
                </a>
              </p>
            </div>
          )
          : <p class="text-muted">Pick a result and it lands here.</p>}
      </div>
      <p role="status" class="sr-only">{announcement.value}</p>
      <Toastr
        toasts={toasts.list.value}
        onDismiss={toasts.remove}
        corner={wide.value ? "bottom-right" : "top-right"}
      />
    </div>
  )
}
