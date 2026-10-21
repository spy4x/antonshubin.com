import type { ComponentChildren } from "preact"
import CopyButton from "../../../islands/CopyButton.tsx"
import { eventAttrs } from "../../../lib/analytics.ts"
import { COPY_INSTALL_TITLE } from "../../tool-frame/ToolBand.tsx"

/**
 * A file of oko's quick start or config, with its name and a Copy button
 * (`tool-install-copy`). `id` must be unique on the page: the button copies
 * the text of the element with that id. `aside` sits beside the code, outside
 * what is copied (the field markers of "From config to card").
 */
export function CodeBlock(
  { id, file, code, aside, children }: {
    id: string
    /** The file name in the block's header. */
    file: string
    /** The text, copied as is; ignored when `children` draws it line by line. */
    code?: string
    aside?: ComponentChildren
    children?: ComponentChildren
  },
) {
  return (
    <div
      role="group"
      aria-labelledby={`${id}-file`}
      class="min-w-0 overflow-hidden rounded-xl border border-rule bg-paper"
    >
      <div class="flex items-center justify-between gap-3 border-b border-rule px-4 py-1.5">
        <span id={`${id}-file`} class="font-mono text-sm text-graphite">
          {file}
        </span>
        <CopyButton
          elementId={id}
          label="Copy"
          title={COPY_INSTALL_TITLE}
          analytics={eventAttrs("tool-install-copy", { item: "oko" })}
        />
      </div>
      <div class="flex">
        <pre
          tabIndex={0}
          class="min-w-0 flex-1 overflow-x-auto px-4 py-3 text-sm leading-6 text-parchment focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-parchment"
        ><code id={id}>{children ?? code}</code></pre>
        {aside}
      </div>
    </div>
  )
}
