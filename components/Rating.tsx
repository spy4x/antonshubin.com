import { StarIcon } from "./Icons.tsx";

/**
 * A review's Upwork star rating: filled stars plus the number, e.g. "5.0".
 * The stars are decorative; a screen reader hears "Rated 5.0 out of 5".
 */
export function Rating(
  { value, class: className = "" }: { value: number; class?: string },
) {
  const label = value.toFixed(1);
  return (
    <span
      data-rating={label}
      class={`inline-flex items-center gap-1 ${className}`}
    >
      {Array.from(
        { length: 5 },
        (_, i) => (
          <StarIcon
            key={i}
            class="text-accent w-4 h-4"
            filled={i < Math.round(value)}
          />
        ),
      )}
      <span class="ml-1 text-parchment font-semibold text-sm">
        <span aria-hidden="true">{label}</span>
      </span>
    </span>
  );
}
