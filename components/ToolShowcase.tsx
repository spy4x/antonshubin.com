import { FeatureCard } from "@spy4x/preact-ui/feature-card";
import type { Tool, ToolFeature, ToolScreenshot } from "../lib/tools.ts";

/**
 * "What you get" of a tool page whose entry has `features` (#448): today
 * Seed's, drawn as the middle of its page by `routes/tools/[slug].tsx`
 * inside the shared tool frame (#454) until Seed's own page replaces it.
 */

/** One screenshot as a lazy `<img>`. */
function Shot(
  { shot, sizes, class: className = "block" }: {
    shot: ToolScreenshot;
    sizes: string;
    class?: string;
  },
) {
  return (
    <img
      src={shot.src}
      srcset={shot.srcset}
      sizes={shot.srcset ? sizes : undefined}
      alt={shot.alt}
      width={shot.width}
      height={shot.height}
      loading="lazy"
      decoding="async"
      class={`${className} w-full h-auto`}
    />
  );
}

/** The `lg` column span of each feature card size in the six-column grid. */
const SPAN: Record<NonNullable<ToolFeature["size"]> | "third", string> = {
  third: "lg:col-span-2",
  half: "lg:col-span-3",
  wide: "lg:col-span-4",
};

/** The `sizes` of a card's shot at each card size. */
const SIZES: Record<keyof typeof SPAN, string> = {
  third: "(min-width: 1024px) 20.5rem, (min-width: 640px) 50vw, 100vw",
  half: "(min-width: 1024px) 31.5rem, (min-width: 640px) 50vw, 100vw",
  wide: "(min-width: 1024px) 42rem, (min-width: 640px) 50vw, 100vw",
};

/** A feature's picture: its `phoneShot` under 640px when it has one. */
function FeatureMedia({ feature }: { feature: ToolFeature }) {
  const { shot, phoneShot } = feature;
  if (!shot) return null;
  const sizes = SIZES[feature.size ?? "third"];
  if (!phoneShot) return <Shot shot={shot} sizes={sizes} />;
  // Two images, one shown per width: each keeps its own alt text, and the
  // hidden one is never fetched because a lazy image loads only when shown.
  return (
    <>
      <Shot shot={phoneShot} sizes="100vw" class="block sm:hidden" />
      <Shot shot={shot} sizes={sizes} class="hidden sm:block" />
    </>
  );
}

/**
 * "What you get": one library `FeatureCard` per feature in a six-column
 * grid from 1024px (a third, a half or two thirds each), two columns from
 * 640px. Cards in a row stretch to one height and each shot sits at its
 * card's bottom, so a row has no holes.
 */
export function ShowcaseFeatures({ tool }: { tool: Tool }) {
  if (!tool.features?.length) return null;
  return (
    <section aria-labelledby="features">
      <h2 id="features" class="text-2xl sm:text-3xl text-parchment">
        What you get
      </h2>
      <div data-lightbox class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
        {tool.features.map((f, i) => (
          <FeatureCard
            key={f.title}
            id={`feature-${i + 1}`}
            title={f.title}
            class={SPAN[f.size ?? "third"]}
            media={f.shot && <FeatureMedia feature={f} />}
          >
            {f.text}
          </FeatureCard>
        ))}
      </div>
    </section>
  );
}
