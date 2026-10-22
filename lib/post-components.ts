/**
 * Interactive components in blog posts (#537). A post embeds one as a
 * self-closing JSX tag on its own line, with props as JSON literals in braces
 * or as quoted strings:
 *
 *     <RunsCalculator saving={15} label="My run" />
 *
 * `lib/markdown.ts` finds the tag, reads it with `readComponentTag()` and
 * renders it between the post's HTML chunks; `toDevToMarkdown()` there swaps
 * it for the entry's Markdown fallback. An unknown tag or props that fail
 * the entry's schema throw, naming the post, the tag and the reason, so a
 * typo fails the build instead of reaching a reader.
 */
import type { ComponentType } from "preact"
import { type Type, type } from "arktype"
import CachedShareSlider from "../islands/CachedShareSlider.tsx"
import FrameworkChecklist from "../islands/FrameworkChecklist.tsx"
import RunsCalculator from "../islands/RunsCalculator.tsx"
import { TaskCostChart } from "../components/TaskCostChart.tsx"
import { cachedShareMarkdown, runsMarkdown } from "./post-math.ts"
import { checklistMarkdown } from "./framework-checklist.ts"
import { taskCostMarkdown } from "./task-cost.ts"

/** What the post page passes to every component besides its own props. */
export interface PostComponentContext {
  /** The post's slug: the `item` of the component's `post-try` event. */
  post: string
}

/** One registered component. */
export interface PostComponent<P extends object> {
  /**
   * The props a post may pass. Declare `"+": "reject"` so a mistyped prop
   * name fails instead of being ignored.
   */
  props: Type<P>
  /** The island (or server component) that renders it. */
  component: ComponentType<P & PostComponentContext>
  /** The id of the box it renders in, so a link can point at it. */
  anchor: string | ((props: P) => string)
  /** Markdown that stands in for it on Dev.to, from the same props. */
  toMarkdown(props: P, postUrl: string): string
}

/** A registry entry with its props type erased, so entries share one map. */
export type AnyPostComponent = PostComponent<Record<string, unknown>>

/** Registers an entry with its own props type checked against its parts. */
export function postComponent<P extends object>(
  entry: PostComponent<P>,
): AnyPostComponent {
  return entry as unknown as AnyPostComponent
}

/** Tag name → entry. A tag a post uses must be listed here. */
export type PostComponentRegistry = Readonly<Record<string, AnyPostComponent>>

const noProps = type({ "+": "reject" })

const sliderMark = type({
  "+": "reject",
  value: "number",
  label: "string > 0",
})

/** Every component a post can embed. */
export const POST_COMPONENTS: PostComponentRegistry = {
  CachedShareSlider: postComponent({
    props: noProps,
    component: CachedShareSlider,
    anchor: "per-call-price",
    toMarkdown: () => cachedShareMarkdown(),
  }),
  FrameworkChecklist: postComponent({
    props: noProps,
    component: FrameworkChecklist,
    anchor: "decision-framework",
    toMarkdown: () => checklistMarkdown(),
  }),
  RunsCalculator: postComponent({
    props: type({
      "+": "reject",
      noise: "1 <= number.integer <= 30",
      saving: "1 <= number.integer <= 50",
      experimentTasks: "number.integer >= 1",
      "marks?": sliderMark.array().atMostLength(2),
    }),
    component: RunsCalculator,
    anchor: "how-many-tasks",
    toMarkdown: () => runsMarkdown(),
  }),
  TaskCostChart: postComponent({
    props: type({ "+": "reject", round: "'pull' | 'push'" }),
    component: TaskCostChart,
    anchor: (p) => `cost-${p.round}`,
    toMarkdown: (p) => taskCostMarkdown(p.round),
  }),
}

/** One tag in a post, read and checked. */
export interface PostComponentUse {
  tag: string
  /** The props after the schema accepted them. */
  props: Record<string, unknown>
  anchor: string
  entry: AnyPostComponent
}

/** A tag as written: its name and its props, before any schema. */
export interface ParsedTag {
  tag: string
  props: Record<string, unknown>
}

/** A line that opens a component tag: `<` and a capital letter. */
export const TAG_START = /^ {0,3}<[A-Z]/

const NAME = /[A-Za-z_][A-Za-z0-9_]*/y
const SPACE = /\s*/y

/**
 * Reads one self-closing tag, `<Name prop={json} other="text" />`, from a
 * single line. Throws with the reason when the line is anything else: a tag
 * that does not close itself, an unquoted value, invalid JSON, a repeated
 * prop or text after the tag.
 */
export function parseComponentTag(line: string): ParsedTag {
  const open = /^ {0,3}<([A-Z][A-Za-z0-9]*)/.exec(line)
  if (!open) throw new Error("a component tag starts with `<` and a capital")
  const tag = open[1]
  const props: Record<string, unknown> = {}
  let i = open[0].length
  for (;;) {
    SPACE.lastIndex = i
    const spaced = SPACE.exec(line)![0].length > 0
    i = SPACE.lastIndex
    if (line.startsWith("/>", i)) {
      if (line.slice(i + 2).trim() !== "") {
        throw new Error("the tag must be alone on its line")
      }
      return { tag, props }
    }
    if (i >= line.length || line[i] === ">") {
      throw new Error("the tag must close itself with `/>` on the same line")
    }
    NAME.lastIndex = i
    const name = spaced ? NAME.exec(line)?.[0] : undefined
    if (!name) throw new Error(`unexpected "${line.slice(i, i + 12)}"`)
    i += name.length
    if (line[i] !== "=") {
      throw new Error(`prop "${name}" needs a value: {json} or "text"`)
    }
    i++
    let value: unknown
    if (line[i] === '"') {
      const end = line.indexOf('"', i + 1)
      if (end < 0) throw new Error(`prop "${name}": unclosed string`)
      value = line.slice(i + 1, end)
      i = end + 1
    } else if (line[i] === "{") {
      const end = closingBrace(line, i)
      if (end < 0) throw new Error(`prop "${name}": unclosed {`)
      try {
        value = JSON.parse(line.slice(i + 1, end))
      } catch {
        throw new Error(
          `prop "${name}": ${line.slice(i, end + 1)} is not a JSON literal`,
        )
      }
      i = end + 1
    } else {
      throw new Error(`prop "${name}" needs a value: {json} or "text"`)
    }
    if (Object.hasOwn(props, name)) {
      throw new Error(`prop "${name}" is given twice`)
    }
    props[name] = value
  }
}

/** The index of the `}` that closes the `{` at `start`, or -1. */
function closingBrace(text: string, start: number): number {
  let depth = 0
  let inString = false
  for (let j = start; j < text.length; j++) {
    const c = text[j]
    if (inString) {
      if (c === "\\") j++
      else if (c === '"') inString = false
    } else if (c === '"') inString = true
    else if (c === "{") depth++
    else if (c === "}" && --depth === 0) return j
  }
  return -1
}

/**
 * Reads a tag line and checks it against `registry`: the tag must be listed
 * and its props must pass the entry's schema. Throws an error that names the
 * post, the tag and the reason.
 */
export function readComponentTag(
  line: string,
  slug: string,
  registry: PostComponentRegistry = POST_COMPONENTS,
): PostComponentUse {
  const where = `content/blog/${slug}.md`
  const name = /<([A-Za-z0-9]*)/.exec(line)?.[1] ?? line.trim()
  let parsed: ParsedTag
  try {
    parsed = parseComponentTag(line)
  } catch (err) {
    throw new Error(`${where}: <${name}>: ${(err as Error).message}`)
  }
  const entry = Object.hasOwn(registry, parsed.tag)
    ? registry[parsed.tag]
    : undefined
  if (!entry) {
    const known = Object.keys(registry).join(", ") || "none"
    throw new Error(
      `${where}: <${parsed.tag}>: unknown component (registered: ${known})`,
    )
  }
  const props = entry.props(parsed.props)
  if (props instanceof type.errors) {
    throw new Error(`${where}: <${parsed.tag}>: ${props.summary}`)
  }
  const anchor = typeof entry.anchor === "function"
    ? entry.anchor(props)
    : entry.anchor
  return { tag: parsed.tag, props, anchor, entry }
}
