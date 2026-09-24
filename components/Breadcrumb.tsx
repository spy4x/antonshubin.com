interface Crumb {
  name: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  if (items.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" class="mb-6 text-sm">
      <ol class="flex flex-wrap items-center gap-1 text-graphite">
        {items.map((c, i) => (
          <li class="flex items-center gap-1" key={i}>
            {c.href && i < items.length - 1
              ? (
                <a
                  href={c.href}
                  class="hover:text-accent transition-colors"
                >
                  {c.name}
                </a>
              )
              : (
                <span
                  class="text-graphite"
                  aria-current={i === items.length - 1 ? "page" : undefined}
                >
                  {c.name}
                </span>
              )}
            {i < items.length - 1 && (
              <span aria-hidden="true" class="text-graphite">/</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
