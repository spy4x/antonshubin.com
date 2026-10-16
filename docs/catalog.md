# Catalog and prices

`lib/catalog.ts` is the only place a catalog title or price is written. The home
page, `/catalog`, `/catalog/[slug]`, the sitemap, both llms files, the guide
page and the `Offer` JSON-LD read from it. `lib/catalog.test.ts` pins the four
prices and the six redirects; `test/structure.test.ts` fails when a dollar
amount that is not in the catalog shows up on a page listed in its `PRICE_PAGES`
or in an llms file — add a page to that list when it starts showing a price.
Every client project page is on that list: its fact card and closing band link
"Similar work today" to the item named by the project's `catalogSlug`
(`lib/data.ts`, checked through `catalogItem()` by `lib/data.test.ts`). Retired
slugs live in `catalogRedirects` there and answer 301 — never link to one. The
same price list is used on Upwork, so a price change is followed by a manual
edit there; neatsoft.dev shows no prices (neatsoft.dev#5).

The label the site leads with is `ROLE` in `lib/head.ts` ("Senior Full-Stack
Engineer & Tech Lead"). "Fractional CTO" appears only as the Ongoing catalog
item. The five promises on `/how-i-work` are the only promises on the site; the
free written audit carries no deadline.
