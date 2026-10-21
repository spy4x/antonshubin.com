import { cn } from "@spy4x/preact-cn"
import { type Project, projectScreenshots } from "../lib/data.ts"

/**
 * The picture in a highlight card's 16:10 frame (UX 1, UX 10 on #270): the
 * card image, a phone screenshot centred on the Lamp panel, or the logo when
 * a project has no card image. Shared by `/work`'s highlight cards and the
 * home page's client work cards (#529). Only `/work`'s first card loads
 * eagerly, and none asks for high priority: the home page's one
 * high-priority image is its portrait.
 */
export function CardPicture(
  { project, eager }: { project: Project; eager: boolean },
) {
  const image = project.cardImage
  const alt = projectScreenshots(project)[0]?.alt ?? ""
  return (
    <div class="aspect-[16/10] bg-lamp flex items-center justify-center overflow-hidden">
      {image
        ? (
          <img
            src={image.src}
            alt={alt}
            width={image.width}
            height={image.height}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            class={image.width > image.height
              ? "w-full h-full object-cover object-top"
              : "h-full w-auto"}
          />
        )
        : project.logoImageURL && (
          <img
            src={project.logoImageURL}
            alt=""
            aria-hidden="true"
            width={96}
            height={96}
            loading={eager ? "eager" : "lazy"}
            class={cn(
              "w-24 h-24 object-contain",
              project.logoPlate && "bg-parchment rounded-lg p-2",
            )}
          />
        )}
    </div>
  )
}
