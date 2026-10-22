import { page } from "fresh"
import { define } from "../../lib/utils.ts"
import { NotFound } from "../../components/NotFound.tsx"
import { findWorkProject } from "../../lib/work.ts"
import { CaseFrame } from "../../components/case-frame/CaseFrame.tsx"

// Unknown slugs show the shared not-found page (components/NotFound.tsx), but
// answer with a real 404 so search engines drop removed project pages
// instead of indexing an empty 200.
export const handler = define.handlers({
  GET(ctx) {
    return findWorkProject(ctx.params.slug) ? page() : page(null, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    })
  },
})

/**
 * Every client project without a page of its own: the shared case frame
 * (#523) with its default middle. A custom page is `routes/work/<slug>.tsx`,
 * which Fresh matches first.
 */
export default define.page(function ProjectDetail(ctx) {
  const project = findWorkProject(ctx.params.slug)
  if (!project) return <NotFound pathname={ctx.url.pathname} />
  return <CaseFrame project={project} currentPath={ctx.url.pathname} />
})
