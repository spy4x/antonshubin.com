import { define } from "../../lib/utils.ts"
import { NotFound } from "../../components/NotFound.tsx"
import { CaseFrame } from "../../components/case-frame/CaseFrame.tsx"
import {
  CaseGallery,
  WhatIBuilt,
} from "../../components/case-frame/CaseParts.tsx"
import { DareChatMap } from "../../components/DareChatMap.tsx"
import { findWorkProject } from "../../lib/work.ts"

/**
 * `/work/truth-or-dare` (#523): the case frame with "One backend for every
 * app", a map of DareChat's parts where a picked flow lights the boxes it
 * uses, then the other screenshots and "What I built".
 */
export default define.page(function TruthOrDarePage(ctx) {
  const project = findWorkProject("truth-or-dare")
  if (!project) return <NotFound pathname={ctx.url.pathname} />
  return (
    <CaseFrame project={project} currentPath={ctx.url.pathname}>
      <DareChatMap item="truth-or-dare" />
      <CaseGallery project={project} />
      <WhatIBuilt project={project} />
    </CaseFrame>
  )
})
