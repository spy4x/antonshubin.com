import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";

/**
 * The post body's two interactive parts, wired to markup `lib/markdown.ts`
 * renders on the server (#274):
 *
 * - Each post image is already a `<button data-lightbox>` in the HTML, so a
 *   keyboard reaches it without JS; this opens it in a full-screen
 *   `<dialog>` (UX 8). The close button clears the notch and home bar
 *   (`env(safe-area-inset-*)`, the site sets `viewport-fit=cover`), and a
 *   tap anywhere but the image closes it.
 * - Each code block's Copy button (`[data-copy-code]`) is `hidden` in the
 *   HTML, since it does nothing without JS; this shows it and copies the
 *   block's text. `islands/CopyButton.tsx` can't be used here: an island
 *   can't hydrate inside the post's `dangerouslySetInnerHTML` markup.
 */
export default function BlogImageEnhancer() {
  const activeImage = useSignal<{ src: string; alt: string } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  // The button that opened the lightbox, so closing it returns keyboard
  // focus there instead of dropping it to <body>.
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const blogContent = document.querySelector(".blog-content");
    if (!blogContent) return;

    blogContent.querySelectorAll<HTMLButtonElement>("[data-lightbox]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const img = button.querySelector("img");
          if (!img) return;
          triggerRef.current = button;
          activeImage.value = { src: img.src, alt: img.alt || "Blog image" };
          dialogRef.current?.showModal();
        });
      });

    blogContent.querySelectorAll<HTMLButtonElement>("[data-copy-code]")
      .forEach((button) => {
        button.hidden = false;
        button.addEventListener("click", async () => {
          const code = button.closest(".code-block")?.querySelector("pre");
          const text = code?.textContent ?? "";
          try {
            await navigator.clipboard.writeText(text.replace(/\n$/, ""));
            button.textContent = "Copied!";
          } catch {
            button.textContent = "Copy failed";
          }
          setTimeout(() => {
            button.textContent = "Copy";
          }, 3000);
        });
      });
  }, []);

  const closeLightbox = () => {
    dialogRef.current?.close();
    activeImage.value = null;
    triggerRef.current?.focus();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeImage.value === null) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-label={activeImage.value?.alt}
      class="lightbox fixed inset-0 w-full h-full max-w-none max-h-none m-0 p-0 bg-ink"
      onClick={(e) => {
        // Anything but the image itself (or the close button, which closes
        // on its own) closes the lightbox: the backdrop, the frame around
        // the image and the caption alike.
        if ((e.target as HTMLElement).tagName !== "IMG") closeLightbox();
      }}
    >
      {activeImage.value && (
        <figure class="lightbox-frame">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            class="lightbox-close z-10 p-2 text-parchment bg-desk border border-rule-strong rounded-full hover:bg-lamp transition-colors"
            aria-label="Close"
          >
            <svg
              aria-hidden="true"
              focusable="false"
              class="w-8 h-8"
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
          <img
            src={activeImage.value.src}
            alt={activeImage.value.alt}
            class="lightbox-image object-contain"
          />
          <figcaption class="mt-3 text-center text-sm text-graphite">
            {activeImage.value.alt}
          </figcaption>
        </figure>
      )}
    </dialog>
  );
}
