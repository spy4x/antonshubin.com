import {
  briefPath,
  type CatalogItem,
  catalogPromises,
  formatPrice,
  priceRows,
} from "../lib/catalog.ts";
import { promise } from "../lib/promises.ts";
import { SCHEDULE_URL } from "../lib/config.ts";
import { BookCallLink } from "./BookCallLink.tsx";
import { buttonClass } from "./Button.tsx";
import { Fact, FactCard } from "./FactCard.tsx";
import { eventAttrs } from "../lib/analytics.ts";
import { BOOK_LABEL, BRIEF_LABEL } from "../lib/nav.ts";

/**
 * The service page's price card (#271), built on the shared `FactCard` shell:
 * the price from `lib/catalog.ts` in Parchment (one row, or "Hourly" and
 * "Retainer" for two prices) with its note, the time, the stack, the titles of
 * the promises that apply (`catalogPromises()`), then Book and the written
 * brief with the service chosen. Sticky in the right column from 1024px and
 * first at 390px, like the project page's card.
 */
export function ServicePriceCard({ item }: { item: CatalogItem }) {
  const promiseIds = catalogPromises(item.slug);
  return (
    <div data-service-card={item.slug}>
      <FactCard label="Price and booking">
        <dl class="space-y-2 text-sm">
          {priceRows(item).map((row) => (
            <Fact term={row.label} key={row.label}>
              <span class="price block text-2xl font-semibold text-parchment">
                {formatPrice(row.price)}
              </span>
              {row.note && (
                <span class="block mt-1 text-graphite">{row.note}</span>
              )}
            </Fact>
          ))}
          <Fact term="Time">{item.delivery}</Fact>
          <Fact term="Stack">
            <span class="text-graphite">{item.tech.join(" · ")}</span>
          </Fact>
          {promiseIds.length > 0 && (
            <Fact term="Promises">
              <ul class="space-y-1" data-service-promises>
                {promiseIds.map((id) => <li key={id}>{promise(id).title}</li>)}
              </ul>
            </Fact>
          )}
        </dl>
        <div class="mt-5 space-y-3">
          <BookCallLink
            url={SCHEDULE_URL}
            target="_blank"
            event={eventAttrs("book", { place: "card", item: item.slug })}
            class="w-full justify-center px-5 py-3"
          >
            {BOOK_LABEL}
          </BookCallLink>
          <a
            href={briefPath(item.slug)}
            {...eventAttrs("brief", { place: "card", item: item.slug })}
            class={buttonClass("secondary", "w-full justify-center px-5 py-3")}
          >
            {BRIEF_LABEL}
          </a>
        </div>
      </FactCard>
    </div>
  );
}
