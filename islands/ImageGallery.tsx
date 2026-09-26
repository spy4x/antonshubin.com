import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { webpForPng } from "../lib/image-path.ts";
import { buttonClass } from "../components/Button.tsx";

interface GalleryImageData {
  src: string;
  /** The caption: shown under the slide and used as the `alt` text. */
  alt: string;
  width?: number;
  height?: number;
}

interface ImageGalleryProps {
  images: GalleryImageData[];
  /**
   * The gallery is the page's hero: the first image loads eagerly with
   * `fetchpriority="high"`, since it is the largest thing in the first
   * screen. Every other image stays lazy.
   */
  hero?: boolean;
}

/**
 * Renders an image with a WebP `<source>` fallback when the src ends in `.png`.
 * Used in both the strip and the lightbox. Emits `width`/`height` only when
 * the caller supplied them; the strip's slides also reserve their box with an
 * aspect ratio, so nothing jumps while an image loads.
 */
function GalleryImage(
  { src, alt, width, height, class: className, priority }:
    & GalleryImageData
    & { class: string; priority?: boolean },
) {
  const webpSrc = webpForPng(src);
  return (
    <picture>
      {webpSrc && <source srcset={webpSrc} type="image/webp" />}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        class={className}
        loading={priority ? "eager" : "lazy"}
        fetchpriority={priority ? "high" : undefined}
        decoding={priority ? undefined : "async"}
      />
    </picture>
  );
}

const ARROW_LEFT = "M15 19l-7-7 7-7";
const ARROW_RIGHT = "M9 5l7 7-7 7";

function Arrow({ d, class: className }: { d: string; class: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      class={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d={d}
      />
    </svg>
  );
}

/** Round icon button in the site's secondary style. */
const ROUND = buttonClass("secondary", "justify-center w-11 h-11 bg-ink");

/**
 * A project's screenshots as a horizontal strip: each slide is sized by the
 * column's width so the next one peeks in, snaps to the centre, and carries
 * its caption. A "3 / 12" counter sits under the strip, with Previous and
 * Next buttons from 1024px. A click opens the lightbox, which has its own
 * Previous/Next bar under the image, arrow keys and swipe.
 */
export default function ImageGallery({ images, hero }: ImageGalleryProps) {
  const activeIndex = useSignal<number | null>(null);
  const current = useSignal(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  // The slide button that opened the lightbox, so closing it can put
  // keyboard focus back where it started instead of dropping it to <body>.
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const swipeStart = useRef<number | null>(null);

  const first = images[0];
  const portrait = !!(first?.width && first?.height &&
    first.height > first.width);
  const slideWidth = portrait
    ? "w-[55%] sm:w-[35%] lg:w-[28%]"
    : "w-[85%] lg:w-[60%]";

  const openLightbox = (index: number, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    activeIndex.value = index;
    dialogRef.current?.showModal();
  };

  const closeLightbox = () => {
    dialogRef.current?.close();
    activeIndex.value = null;
    triggerRef.current?.focus();
  };

  const goNext = () => {
    if (activeIndex.value !== null) {
      activeIndex.value = (activeIndex.value + 1) % images.length;
    }
  };

  const goPrev = () => {
    if (activeIndex.value !== null) {
      activeIndex.value = (activeIndex.value - 1 + images.length) %
        images.length;
    }
  };

  /** The slide whose centre is nearest the strip's centre; the ends win at the scroll limits. */
  const updateCurrent = () => {
    const strip = stripRef.current;
    if (!strip) return;
    const max = strip.scrollWidth - strip.clientWidth;
    if (strip.scrollLeft <= 1) {
      current.value = 0;
      return;
    }
    if (strip.scrollLeft >= max - 1) {
      current.value = images.length - 1;
      return;
    }
    const centre = strip.scrollLeft + strip.clientWidth / 2;
    let best = 0;
    let bestDistance = Infinity;
    Array.from(strip.children).forEach((child, i) => {
      const el = child as HTMLElement;
      const distance = Math.abs(el.offsetLeft + el.offsetWidth / 2 - centre);
      if (distance < bestDistance) {
        best = i;
        bestDistance = distance;
      }
    });
    current.value = best;
  };

  /** Scrolls the strip so slide `index` sits in the centre. */
  const scrollToSlide = (index: number) => {
    const strip = stripRef.current;
    const slide = strip?.children[index] as HTMLElement | undefined;
    if (!strip || !slide) return;
    const reduce = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")
      .matches;
    strip.scrollTo({
      left: slide.offsetLeft - (strip.clientWidth - slide.offsetWidth) / 2,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeIndex.value === null) return;

      switch (e.key) {
        case "ArrowRight":
          goNext();
          break;
        case "ArrowLeft":
          goPrev();
          break;
        case "Escape":
          closeLightbox();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const many = images.length > 1;

  return (
    <>
      <div
        ref={stripRef}
        onScroll={updateCurrent}
        data-gallery-strip
        class="relative flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:thin] [scrollbar-color:var(--color-rule-strong)_transparent]"
      >
        {images.map((image, index) => (
          <figure
            key={index}
            class={`shrink-0 snap-center ${many ? slideWidth : "w-full"}`}
          >
            <button
              type="button"
              onClick={(e) =>
                openLightbox(index, e.currentTarget as HTMLButtonElement)}
              class="block w-full cursor-zoom-in rounded-lg overflow-hidden bg-paper border border-rule hover:border-rule-strong transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              style={{
                aspectRatio: image.width && image.height
                  ? `${image.width} / ${image.height}`
                  : "16 / 10",
              }}
            >
              <GalleryImage
                {...image}
                priority={hero && index === 0}
                class="w-full h-full object-contain"
              />
            </button>
            <figcaption class="mt-2 text-sm text-graphite">
              {image.alt}
            </figcaption>
          </figure>
        ))}
      </div>

      {many && (
        <div class="mt-2 flex items-center justify-between gap-4">
          <button
            type="button"
            aria-label="Previous screenshot"
            onClick={() => scrollToSlide(Math.max(0, current.value - 1))}
            disabled={current.value === 0}
            class={`${ROUND} max-lg:hidden disabled:opacity-40`}
          >
            <Arrow d={ARROW_LEFT} class="w-5 h-5" />
          </button>
          <p
            data-gallery-counter
            class="text-sm text-graphite tabular-nums mx-auto"
          >
            {current.value + 1} / {images.length}
          </p>
          <button
            type="button"
            aria-label="Next screenshot"
            onClick={() =>
              scrollToSlide(Math.min(images.length - 1, current.value + 1))}
            disabled={current.value === images.length - 1}
            class={`${ROUND} max-lg:hidden disabled:opacity-40`}
          >
            <Arrow d={ARROW_RIGHT} class="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Lightbox Dialog */}
      <dialog
        ref={dialogRef}
        aria-label={activeIndex.value !== null
          ? images[activeIndex.value].alt
          : undefined}
        class="fixed inset-0 w-full h-full max-w-none max-h-none m-0 p-0 bg-ink/95 backdrop:bg-ink/80"
        onClick={(e) => {
          if (e.target === dialogRef.current) closeLightbox();
        }}
      >
        {activeIndex.value !== null && (
          <div class="w-full h-full flex flex-col">
            <div class="flex justify-end p-3">
              <button
                type="button"
                onClick={closeLightbox}
                class={ROUND}
                aria-label="Close"
              >
                <svg
                  aria-hidden="true"
                  focusable="false"
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Image; a horizontal swipe moves to the previous or next one. */}
            <div
              class="flex-1 min-h-0 flex items-center justify-center px-3 touch-pan-y"
              onPointerDown={(e) => {
                swipeStart.current = e.clientX;
              }}
              onPointerUp={(e) => {
                if (swipeStart.current === null) return;
                const dx = e.clientX - swipeStart.current;
                swipeStart.current = null;
                if (dx > 50) goPrev();
                else if (dx < -50) goNext();
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) closeLightbox();
              }}
            >
              <GalleryImage
                {...images[activeIndex.value]}
                class="max-w-full max-h-full object-contain select-none"
              />
            </div>

            {/* Previous, counter with caption, and Next: below the image, never over it. */}
            <div class="flex items-center justify-between gap-4 p-3">
              {many
                ? (
                  <button
                    type="button"
                    onClick={goPrev}
                    class={ROUND}
                    aria-label="Previous image"
                  >
                    <Arrow d={ARROW_LEFT} class="w-6 h-6" />
                  </button>
                )
                : <span />}
              <p class="text-sm text-parchment text-center tabular-nums">
                {activeIndex.value + 1} / {images.length}
                {/* A "Screenshot 3 of 12" caption would only repeat the counter. */}
                {!/^Screenshot \d+ of \d+$/.test(
                  images[activeIndex.value].alt,
                ) && (
                  <span class="text-graphite">
                    · {images[activeIndex.value].alt}
                  </span>
                )}
              </p>
              {many
                ? (
                  <button
                    type="button"
                    onClick={goNext}
                    class={ROUND}
                    aria-label="Next image"
                  >
                    <Arrow d={ARROW_RIGHT} class="w-6 h-6" />
                  </button>
                )
                : <span />}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
