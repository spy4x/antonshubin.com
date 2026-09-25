import CopyButton from "../islands/CopyButton.tsx";
import type { Tool } from "../lib/tools.ts";

/**
 * A tool's one install command, pinned to a version, with the registry named
 * (#189). While `registry.published` is false the command is shown marked
 * "Not yet available" and gets no copy button, so nobody copies a command
 * that cannot work yet. `id` must be unique on the page: the copy button
 * reads the command's text through it.
 */
export function InstallLine({ tool, id }: { tool: Tool; id: string }) {
  const { registry } = tool;
  return (
    <div data-install={registry.published ? "available" : "not-yet"}>
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <code
          id={id}
          class={`text-sm break-words ${
            registry.published ? "text-parchment" : "text-graphite"
          }`}
        >
          {registry.install}
        </code>
        {registry.published && (
          <CopyButton
            elementId={id}
            label="Copy"
            title={`Copy the install command for ${tool.name}`}
          />
        )}
      </div>
      <p class="mt-1 text-sm text-graphite">
        {registry.published
          ? `From ${registry.name}, pinned to ${registry.version}.`
          : `Not yet available: ${registry.version} is being published to ${registry.name} now.`}
      </p>
    </div>
  );
}
