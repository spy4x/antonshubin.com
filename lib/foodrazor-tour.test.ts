import { assert, assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0"
import { findWorkProject } from "./work.ts"
import { foodRazorSteps, stepsOn, youTubeId } from "./foodrazor-tour.ts"

const project = findWorkProject("foodrazor")!

Deno.test("every FoodRazor step's name is a phrase of the project description", () => {
  const description = project.description.toLowerCase()
  const missing = foodRazorSteps.map((s) => s.label)
    .filter((label) => !description.includes(label.toLowerCase()))
  assertEquals(missing, [])
})

Deno.test("every FoodRazor step file is one of the project's screenshots, used once", () => {
  const files = foodRazorSteps.flatMap((s) => Object.values(s.files))
  for (const file of files) {
    assert(project.screenshotURLs!.includes(file!), file)
  }
  assertEquals(new Set(files).size, files.length)
})

Deno.test("the phone tour has every step and the desktop tour leaves out orders", () => {
  assertEquals(stepsOn("phone").map((s) => s.id), [
    "invoices",
    "orders",
    "prices",
  ])
  assertEquals(stepsOn("desktop").map((s) => s.id), ["invoices", "prices"])
})

Deno.test("youTubeId reads the id from the project's embed URL and throws without one", () => {
  assertEquals(youTubeId(project.videoURL!), "IL3M0A7g0SE")
  assertThrows(() => youTubeId("https://youtube.com/embed/"))
})
