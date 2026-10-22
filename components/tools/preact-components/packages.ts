// What /tools/preact-components shows of the library, quoted from the
// library itself (spy4x/preact-components 8.5.0): the guide's Orbit demo
// (`ui-guide/mini-app.tsx`, which the package does not export) and the
// README's package table. Nothing here is Anton's own data.

/** A project's state in the Orbit demo. */
export type OrbitStatus = "healthy" | "building" | "failing" | "paused"

/** One row of the Orbit demo's table. */
export interface OrbitProject {
  name: string
  status: OrbitStatus
  builds: number
}

/** The guide's five demo projects (`MINI_PROJECTS`). */
export const ORBIT_PROJECTS: readonly OrbitProject[] = [
  { name: "Atlas", status: "healthy", builds: 128 },
  { name: "Beacon", status: "building", builds: 96 },
  { name: "Comet", status: "failing", builds: 41 },
  { name: "Drift", status: "healthy", builds: 212 },
  { name: "Ember", status: "paused", builds: 17 },
]

/**
 * Each status's word, and the `StatusMark` shape that carries it: a shape
 * plus the word, so the status never rests on colour alone.
 */
export const ORBIT_STATUS: Record<
  OrbitStatus,
  { label: string; mark: "ready" | "wip" | "known-issue" | "paused" }
> = {
  healthy: { label: "Healthy", mark: "ready" },
  building: { label: "Building", mark: "wip" },
  failing: { label: "Failing", mark: "known-issue" },
  paused: { label: "Paused", mark: "paused" },
}

/** The guide's "Median build" tile, a literal in the demo too. */
export const ORBIT_MEDIAN_BUILD = "2m 41s"

/** The guide's `MINI_APP_SNIPPET`: the code of the dashboard this slice is cut from. */
export const ORBIT_SNIPPET =
  `import { Kpi, KpiGrid } from "@spy4x/preact-charts/kpi"
import { LineChart } from "@spy4x/preact-charts/line-chart"
import { createToastStore } from "@spy4x/preact-signals/toast"
import { Badge, Button, Cluster, DataTable, Field, Input, Modal, Toastr } from "@spy4x/preact-ui"
import { useMemo, useState } from "preact/hooks"

export function Dashboard({ projects }: { projects: Project[] }) {
  const toasts = useMemo(() => createToastStore(), [])
  const [sort, setSort] = useState([])
  const [open, setOpen] = useState(false)

  return (
    <>
      <Cluster>
        <Button variant="outline" onClick={() => toasts.info({ body: "Checks queued." })}>
          Run checks
        </Button>
        <Button onClick={() => setOpen(true)}>New project</Button>
      </Cluster>
      <Toastr toasts={toasts.list.value} onDismiss={toasts.remove} />

      <KpiGrid>
        <Kpi label="Projects" value={projects.length} />
        <Kpi label="Failing" value={1} tone="negative" />
      </KpiGrid>
      <LineChart ariaLabel="Builds this week" series={builds} />
      <DataTable
        caption="Projects"
        rows={projects}
        rowKey={(row) => row.id}
        sort={sort}
        onSortChange={setSort}
        columns={[
          { key: "name", header: "Project", sortable: true },
          { key: "status", header: "Status", render: (row) => <Badge text={row.status} /> },
          { key: "builds", header: "Builds", sortable: true, align: "right" },
        ]}
      />

      {open && (
        <Modal open title="New project" onClose={() => setOpen(false)}>
          <Field id="name" label="Project name" required>
            <Input />
          </Field>
        </Modal>
      )}
    </>
  )
}`

/** One published package and the README's "What it holds" line for it. */
export interface LibraryPackage {
  name: string
  holds: string
}

/** The README's package table, in its order, without the unpublished `pages/`. */
export const LIBRARY_PACKAGES: readonly LibraryPackage[] = [
  {
    name: "@spy4x/preact-ui",
    holds: "the component set: layout, buttons, tables, dialogs, forms",
  },
  {
    name: "@spy4x/preact-theme",
    holds: "design tokens, the Tailwind preset and the classes components use",
  },
  {
    name: "@spy4x/preact-icons",
    holds: "the merged icon set, one component per glyph",
  },
  {
    name: "@spy4x/preact-charts",
    holds: "server-rendered charts with tooltips",
  },
  {
    name: "@spy4x/preact-system",
    holds: "app-level pieces: auth form, calendar, shells, SEO head",
  },
  {
    name: "@spy4x/preact-crud",
    holds: "list and editor scaffold for one collection",
  },
  { name: "@spy4x/preact-map", holds: "map on Leaflet" },
  {
    name: "@spy4x/preact-signals",
    holds: "stores and state helpers; no components",
  },
  {
    name: "@spy4x/preact-cn",
    holds: "class-name join with Tailwind conflict resolution",
  },
  {
    name: "@spy4x/preact-ui-guide",
    holds: "the live component catalogue, mounted in one line",
  },
]
