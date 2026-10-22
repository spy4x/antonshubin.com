/**
 * "From a paper invoice to a price alert" on `/work/foodrazor` (#523): the
 * description's three verbs as steps, each with the real screenshot that
 * shows it on a phone and, where one exists, on a desktop. The tab names are
 * the description's own words (`lib/foodrazor-tour.test.ts`); the files are
 * the project's numbered screenshots, matched by the screen title each one
 * shows (Invoices, Orders, Product Price History Report, Recent price
 * increase). No desktop screenshot shows orders, so that step is on the
 * phone only.
 */

/** The video's poster: YouTube's own thumbnail, saved once as WebP so the page asks YouTube for nothing until play. */
export const FOODRAZOR_POSTER = "/img/projects/foodrazor/video-poster.webp"

/** Which device's screenshots the tour shows. */
export type FoodRazorDevice = "phone" | "desktop"

/** One step of the tour. */
export interface FoodRazorStep {
  id: string
  /** The tab's name, a phrase of the description. */
  label: string
  /** The screenshot file under `static/img/projects/foodrazor/`, by device. */
  files: Partial<Record<FoodRazorDevice, string>>
}

export const foodRazorSteps: FoodRazorStep[] = [
  {
    id: "invoices",
    label: "Digitize paper invoices",
    files: { phone: "9.webp", desktop: "3.webp" },
  },
  {
    id: "orders",
    label: "Automating orders to suppliers",
    files: { phone: "10.webp" },
  },
  {
    id: "prices",
    label: "Tracking price fluctuations",
    files: { phone: "11.webp", desktop: "1.webp" },
  },
]

/** The devices in the switch, the first shown when the page opens. */
export const foodRazorDevices: { id: FoodRazorDevice; label: string }[] = [
  { id: "phone", label: "Phone" },
  { id: "desktop", label: "Desktop" },
]

/** The steps that have a screenshot on `device`, in order. */
export function stepsOn(device: FoodRazorDevice): FoodRazorStep[] {
  return foodRazorSteps.filter((s) => s.files[device] !== undefined)
}

/** The YouTube id at the end of an embed URL such as `https://youtube.com/embed/<id>`. */
export function youTubeId(embedUrl: string): string {
  const id = new URL(embedUrl).pathname.split("/").pop() ?? ""
  if (id === "") throw new Error(`no YouTube id in ${embedUrl}`)
  return id
}
