import { define } from "../../lib/utils.ts"
import { NotFound } from "../../components/NotFound.tsx"
import { CaseFrame } from "../../components/case-frame/CaseFrame.tsx"
import {
  CaseGallery,
  WhatIBuilt,
} from "../../components/case-frame/CaseParts.tsx"
import { SameFounder } from "../../components/case-frame/SameFounder.tsx"
import { ProjectReviews } from "../../components/ProjectReviews.tsx"
import { findWorkProject } from "../../lib/work.ts"
import { projectTestimonials } from "../../lib/testimonials.ts"

/**
 * `/work/connectful` (#523): a highlight with no interaction. Both of the
 * founder's reviews come first, in full (the second says Anton told her when
 * something should be done differently), then the link to Corecircle, her
 * next product, then the other screenshots and "What I built".
 */
export default define.page(function ConnectfulPage(ctx) {
  const project = findWorkProject("connectful")
  if (!project) return <NotFound pathname={ctx.url.pathname} />
  return (
    <CaseFrame project={project} currentPath={ctx.url.pathname} ownReviews>
      <ProjectReviews
        project={project}
        reviews={projectTestimonials("connectful")}
      />
      <SameFounder project={project} />
      <CaseGallery project={project} />
      <WhatIBuilt project={project} />
    </CaseFrame>
  )
})
