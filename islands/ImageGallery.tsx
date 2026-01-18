import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";

interface ImageGalleryProps {
  images: { src: string; alt: string }[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const activeIndex = useSignal<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openLightbox = (index: number) => {
    activeIndex.value = index;
    dialogRef.current?.showModal();
  };

  const closeLightbox = () => {
    dialogRef.current?.close();
    activeIndex.value = null;
  };

  const goNext = () => {
    if (activeIndex.value !== null) {
      activeIndex.value = (activeIndex.value + 1) % images.length;
    }
  };

  const goPrev = () => {
    if (activeIndex.value !== null) {
      activeIndex.value = (activeIndex.value - 1 + images.length) % images.length;
    }
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

  return (
    <>
      {/* Masonry Grid using CSS columns */}
      <div class="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        {images.map((image, index) => (
          <button
            key={index}
            type="button"
            onClick={() => openLightbox(index)}
            class="w-full break-inside-avoid cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-lg overflow-hidden"
          >
            <img
              src={image.src}
              alt={image.alt}
              class="w-full rounded-lg border border-gray-700 hover:border-orange-500 transition-colors"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* Lightbox Dialog */}
      <dialog
        ref={dialogRef}
        class="fixed inset-0 w-full h-full max-w-none max-h-none m-0 p-0 bg-black/95 backdrop:bg-black/80"
        onClick={(e) => {
          if (e.target === dialogRef.current) closeLightbox();
        }}
      >
        {activeIndex.value !== null && (
          <div class="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              type="button"
              onClick={closeLightbox}
              class="absolute top-4 right-4 z-10 p-2 text-white/70 hover:text-white bg-black/50 rounded-full transition-colors"
              aria-label="Close"
            >
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Previous button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={goPrev}
                class="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 text-white/70 hover:text-white bg-black/50 rounded-full transition-colors"
                aria-label="Previous image"
              >
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Image */}
            <img
              src={images[activeIndex.value].src}
              alt={images[activeIndex.value].alt}
              class="max-w-[90vw] max-h-[90vh] object-contain"
            />

            {/* Next button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={goNext}
                class="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 text-white/70 hover:text-white bg-black/50 rounded-full transition-colors"
                aria-label="Next image"
              >
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Image counter */}
            <div class="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm bg-black/50 px-3 py-1 rounded-full">
              {activeIndex.value + 1} / {images.length}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
