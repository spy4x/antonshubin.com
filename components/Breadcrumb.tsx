interface Crumb {
  name: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  if (items.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" class="mb-6 text-sm">
      <ol class="flex flex-wrap items-center gap-1 text-gray-400">
        {items.map((c, i) => (
          <li class="flex items-center gap-1" key={i}>
            {c.href && i < items.length - 1
              ? (
                <a
                  href={c.href}
                  class="hover:text-orange-400 transition-colors"
                >
                  {c.name}
                </a>
              )
              : (
                <span
                  class="text-gray-500"
                  aria-current={i === items.length - 1 ? "page" : undefined}
                >
                  {c.name}
                </span>
              )}
            {i < items.length - 1 && (
              <span aria-hidden="true" class="text-gray-600">/</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
