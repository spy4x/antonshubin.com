import { define } from "../lib/utils.ts";
import { Layout } from "../components/Layout.tsx";
import { head } from "../lib/head.ts";
import { SEOHead } from "../components/SEOHead.tsx";
import {
  ArrowRightIcon,
  BuildingIcon,
  CardIcon,
  WalletIcon,
} from "../components/Icons.tsx";
import { NewTabHint } from "../components/NewTabHint.tsx";
import CopyButton from "../islands/CopyButton.tsx";

export default define.page(function Pay() {
  head.value = {
    ...head.value,
    title: "Payment — Anton Shubin",
    description: "Accepted payment methods: Stripe, SWIFT, BTC, ETH, Solana.",
    canonical: "https://antonshubin.com/pay",
    ogType: "website",
    noindex: true,
  };

  return (
    <Layout currentPath="/pay">
      <SEOHead />
      <div class="max-w-5xl mx-auto px-4 py-12">
        <h1 class="text-3xl sm:text-4xl font-bold text-parchment text-center mb-2">
          Choose Your Payment Method
        </h1>
        <p class="text-graphite text-center mb-10 sm:mb-12 text-base sm:text-lg">
          Pay however works best for you — crypto, bank transfer, or card.
        </p>

        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {/* --- Crypto Card --- */}
          <div class="bg-paper rounded-xl border border-rule flex flex-col">
            <div class="p-4 sm:p-6 flex flex-col items-center text-center">
              <WalletIcon class="w-9 h-9 mb-3 text-accent" />
              <h2 class="text-xl font-semibold text-parchment mb-1">Crypto</h2>
              <p class="text-graphite text-sm mb-5">
                Instant. No fees. Send from any wallet.
              </p>

              <div class="space-y-4 text-left self-stretch w-full">
                {/* EVM */}
                <div>
                  <p class="text-graphite text-sm uppercase tracking-wide mb-1">
                    ETH / Linea / Base / BNB / Polygon / OP / Arbitrum / Tron
                  </p>
                  <p
                    id="evm-addr"
                    class="text-parchment text-xs sm:text-sm break-all font-mono bg-ink rounded p-2"
                  >
                    0xDC68c304B29a85360E364Faf8b828b77a1B8439C
                  </p>
                  <CopyButton
                    {...{ "client:idle": true }}
                    elementId="evm-addr"
                    class="mt-2 inline-flex items-center gap-1"
                  />
                </div>

                {/* BTC */}
                <div>
                  <p class="text-graphite text-sm uppercase tracking-wide mb-1">
                    Bitcoin
                  </p>
                  <p
                    id="btc-addr"
                    class="text-parchment text-xs sm:text-sm break-all font-mono bg-ink rounded p-2"
                  >
                    bc1qlp05rhq99uhu6anzkzymeedgjsee605hp25knl
                  </p>
                  <CopyButton
                    {...{ "client:idle": true }}
                    elementId="btc-addr"
                    class="mt-2 inline-flex items-center gap-1"
                  />
                </div>

                {/* Solana */}
                <div>
                  <p class="text-graphite text-sm uppercase tracking-wide mb-1">
                    Solana
                  </p>
                  <p
                    id="sol-addr"
                    class="text-parchment text-xs sm:text-sm break-all font-mono bg-ink rounded p-2"
                  >
                    J5dXRN3Rip1TuadSf8zAui72HY7osVvaMJZ7xXPmkuQo
                  </p>
                  <CopyButton
                    {...{ "client:idle": true }}
                    elementId="sol-addr"
                    class="mt-2 inline-flex items-center gap-1"
                  />
                </div>
              </div>
            </div>
            <div class="mt-auto px-5 sm:px-6 pb-5 sm:pb-6">
              <p class="text-graphite text-sm">
                No minimum. Send any network. Confirm with me after sending.
              </p>
            </div>
          </div>

          {/* --- SWIFT / Bank Transfer Card --- */}
          <div class="bg-paper rounded-xl border border-rule flex flex-col">
            <div class="p-4 sm:p-6 flex flex-col items-center text-center">
              <BuildingIcon class="w-9 h-9 mb-3 text-accent" />
              <h2 class="text-xl font-semibold text-parchment mb-1">
                Bank Transfer
              </h2>
              <p class="text-graphite text-sm mb-5">
                USD via ACH or Fedwire from the US.
              </p>

              {/* Domestic US */}
              <div class="space-y-2.5 text-sm text-left self-stretch w-full">
                <p class="text-graphite text-xs font-medium uppercase tracking-wide">
                  From US (ACH / Fedwire)
                </p>
                <div>
                  <p class="text-graphite text-sm">Account holder</p>
                  <p class="text-parchment">NEATSOFT PTE. LTD.</p>
                </div>
                <div>
                  <p class="text-graphite text-sm">Account number</p>
                  <div class="flex items-center gap-2">
                    <p id="swift-acct" class="text-parchment font-mono">
                      8331896611
                    </p>
                    <CopyButton
                      {...{ "client:idle": true }}
                      elementId="swift-acct"
                      class="shrink-0"
                      title="Copy account number"
                    />
                  </div>
                </div>
                <div>
                  <p class="text-graphite text-sm">Bank</p>
                  <p class="text-parchment">Community Federal Savings Bank</p>
                </div>
                <div>
                  <p class="text-graphite text-sm">Bank address</p>
                  <div class="flex items-start gap-2">
                    <p id="swift-addr" class="text-parchment text-xs">
                      5 Penn Plaza, 14th Floor, New York, NY 10001
                    </p>
                    <CopyButton
                      {...{ "client:idle": true }}
                      elementId="swift-addr"
                      class="shrink-0 mt-0.5"
                      title="Copy bank address"
                    />
                  </div>
                </div>
                <div>
                  <p class="text-graphite text-sm">ACH routing</p>
                  <div class="flex items-center gap-2">
                    <p id="swift-ach" class="text-parchment font-mono">
                      026073150
                    </p>
                    <CopyButton
                      {...{ "client:idle": true }}
                      elementId="swift-ach"
                      class="shrink-0"
                      title="Copy ACH routing"
                    />
                  </div>
                </div>
                <div>
                  <p class="text-graphite text-sm">ABA / Fedwire</p>
                  <div class="flex items-center gap-2">
                    <p id="swift-aba" class="text-parchment font-mono">
                      026073008
                    </p>
                    <CopyButton
                      {...{ "client:idle": true }}
                      elementId="swift-aba"
                      class="shrink-0"
                      title="Copy ABA / Fedwire"
                    />
                  </div>
                </div>

                <div class="pt-3 border-t border-rule mt-4">
                  <p class="text-mist text-xs font-medium">
                    Not for collections from outside the US
                  </p>
                </div>
              </div>
            </div>
            <div class="mt-auto px-5 sm:px-6 pb-5 sm:pb-6">
              <a
                href="/contact-me"
                class="inline-flex items-center gap-1 text-accent hover:text-accent text-sm transition-colors"
              >
                From outside US? Contact me
                <ArrowRightIcon class="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* --- Stripe / Card Payment Card --- */}
          <div class="bg-paper rounded-xl border border-rule flex flex-col">
            <div class="p-4 sm:p-6 flex flex-col items-center text-center">
              <CardIcon class="w-9 h-9 mb-3 text-accent" />
              <h2 class="text-xl font-semibold text-parchment mb-1">
                Card Payment
              </h2>
              <p class="text-graphite text-sm mb-6">
                Fast checkout. Credit or debit card.
              </p>
              <a
                href="https://buy.stripe.com/4gw171g4hcwC06IdQS"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 px-6 py-3 bg-mist/15 text-parchment font-semibold rounded-lg shadow-lg shadow-blue-500/25 hover:scale-105 hover:shadow-xl transition-all duration-200"
              >
                Pay with Stripe
                <ArrowRightIcon class="w-5 h-5" />
                <NewTabHint />
              </a>
              <img
                class="w-full max-w-[200px] mx-auto mt-6 object-cover"
                src="/img/qr-stripe.svg"
                alt="QR-code to pay with Stripe"
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
});
