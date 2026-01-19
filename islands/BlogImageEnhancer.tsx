import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";

export default function BlogImageEnhancer() {
  const activeImage = useSignal<{ src: string; alt: string } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    // Find all images in blog-content and make them clickable
    const blogContent = document.querySelector(".blog-content");
    if (!blogContent) return;

    const images = blogContent.querySelectorAll("img");
    images.forEach((img) => {
      img.style.cursor = "zoom-in";
      img.addEventListener("click", () => {
        activeImage.value = {
          src: img.src,
          alt: img.alt || "Blog image",
        };
        dialogRef.current?.showModal();
      });
    });
  }, []);

  const closeLightbox = () => {
    dialogRef.current?.close();
    activeImage.value = null;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeImage.value === null) return;
      if (e.key === "Escape") {
        closeLightbox();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <dialog
      ref={dialogRef}
      class="fixed inset-0 w-full h-full max-w-none max-h-none m-0 p-0 bg-black/95 backdrop:bg-black/80"
      onClick={(e) => {
        if (e.target === dialogRef.current) closeLightbox();
      }}
    >
      {activeImage.value && (
        <div class="relative w-full h-full flex items-center justify-center">
          {/* Close button */}
          <button
            type="button"
            onClick={closeLightbox}
            class="absolute top-4 right-4 z-10 p-2 text-white/70 hover:text-white bg-black/50 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg
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

          {/* Image */}
          <img
            src={activeImage.value.src}
            alt={activeImage.value.alt}
            class="max-w-[90vw] max-h-[90vh] object-contain"
          />
        </div>
      )}
    </dialog>
  );
}
