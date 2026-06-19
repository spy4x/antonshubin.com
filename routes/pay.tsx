import { define } from "../lib/utils.ts";
import { Layout } from "../components/Layout.tsx";
import CopyButton from "../islands/CopyButton.tsx";

export default define.page(function Pay() {
  return (
    <Layout currentPath="/pay">
      <div class="max-w-5xl mx-auto px-4 py-12">
        <h1 class="text-3xl sm:text-4xl font-bold text-white text-center mb-2">
          Choose Your Payment Method
        </h1>
        <p class="text-gray-400 text-center mb-10 sm:mb-12 text-base sm:text-lg">
          Pay however works best for you — crypto, bank transfer, or card.
        </p>

        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {/* --- Crypto Card --- */}
          <div class="bg-gray-800 rounded-xl border border-gray-700 flex flex-col">
            <div class="p-5 sm:p-6 flex flex-col items-center text-center">
              <div class="text-3xl mb-3">🪙</div>
              <h2 class="text-xl font-semibold text-white mb-1">Crypto</h2>
              <p class="text-gray-400 text-sm mb-5">
                Instant. No fees. Send from any wallet.
              </p>

              <div class="space-y-4 text-left self-stretch w-full">
                {/* EVM */}
                <div>
                  <p class="text-gray-400 text-sm uppercase tracking-wide mb-1">
                    ETH / Linea / Base / BNB / Polygon / OP / Arbitrum / Tron
                  </p>
                  <p
                    id="evm-addr"
                    class="text-white text-xs sm:text-sm break-all font-mono bg-gray-900 rounded p-2"
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
                  <p class="text-gray-400 text-sm uppercase tracking-wide mb-1">
                    Bitcoin
                  </p>
                  <p
                    id="btc-addr"
                    class="text-white text-xs sm:text-sm break-all font-mono bg-gray-900 rounded p-2"
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
                  <p class="text-gray-400 text-sm uppercase tracking-wide mb-1">
                    Solana
                  </p>
                  <p
                    id="sol-addr"
                    class="text-white text-xs sm:text-sm break-all font-mono bg-gray-900 rounded p-2"
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
              <p class="text-gray-400 text-sm">
                No minimum. Send any network. Confirm with me after sending.
              </p>
            </div>
          </div>

          {/* --- SWIFT / Bank Transfer Card --- */}
          <div class="bg-gray-800 rounded-xl border border-gray-700 flex flex-col">
            <div class="p-5 sm:p-6 flex flex-col items-center text-center">
              <div class="text-3xl mb-3">🏦</div>
              <h2 class="text-xl font-semibold text-white mb-1">
                Bank Transfer
              </h2>
              <p class="text-gray-400 text-sm mb-5">
                USD via ACH or Fedwire from the US.
              </p>

              {/* Domestic US */}
              <div class="space-y-2.5 text-sm text-left self-stretch w-full">
                <p class="text-gray-400 text-xs font-medium uppercase tracking-wide">
                  From US (ACH / Fedwire)
                </p>
                <div>
                  <p class="text-gray-400 text-sm">Account holder</p>
                  <p class="text-white">NEATSOFT PTE. LTD.</p>
                </div>
                <div>
                  <p class="text-gray-400 text-sm">Account number</p>
                  <div class="flex items-center gap-2">
                    <p id="swift-acct" class="text-white font-mono">
                      8331896611
                    </p>
                    <CopyButton
                      {...{ "client:idle": true }}
                      elementId="swift-acct"
                      label="📋"
                      class="shrink-0"
                      title="Copy account number"
                    />
                  </div>
                </div>
                <div>
                  <p class="text-gray-400 text-sm">Bank</p>
                  <p class="text-white">Community Federal Savings Bank</p>
                </div>
                <div>
                  <p class="text-gray-400 text-sm">Bank address</p>
                  <div class="flex items-start gap-2">
                    <p id="swift-addr" class="text-white text-xs">
                      5 Penn Plaza, 14th Floor, New York, NY 10001
                    </p>
                    <CopyButton
                      {...{ "client:idle": true }}
                      elementId="swift-addr"
                      label="📋"
                      class="shrink-0 mt-0.5"
                      title="Copy bank address"
                    />
                  </div>
                </div>
                <div>
                  <p class="text-gray-400 text-sm">ACH routing</p>
                  <div class="flex items-center gap-2">
                    <p id="swift-ach" class="text-white font-mono">026073150</p>
                    <CopyButton
                      {...{ "client:idle": true }}
                      elementId="swift-ach"
                      label="📋"
                      class="shrink-0"
                      title="Copy ACH routing"
                    />
                  </div>
                </div>
                <div>
                  <p class="text-gray-400 text-sm">ABA / Fedwire</p>
                  <div class="flex items-center gap-2">
                    <p id="swift-aba" class="text-white font-mono">026073008</p>
                    <CopyButton
                      {...{ "client:idle": true }}
                      elementId="swift-aba"
                      label="📋"
                      class="shrink-0"
                      title="Copy ABA / Fedwire"
                    />
                  </div>
                </div>

                <div class="pt-3 border-t border-gray-700 mt-4">
                  <p class="text-amber-400 text-xs font-medium">
                    ✗ Do not use for collections from outside US
                  </p>
                </div>
              </div>
            </div>
            <div class="mt-auto px-5 sm:px-6 pb-5 sm:pb-6">
              <a
                href="/contact-me"
                class="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 text-sm transition-colors"
              >
                From outside US? Contact me →
              </a>
            </div>
          </div>

          {/* --- Stripe / Card Payment Card --- */}
          <div class="bg-gray-800 rounded-xl border border-gray-700 flex flex-col">
            <div class="p-5 sm:p-6 flex flex-col items-center text-center">
              <div class="text-3xl mb-3">💳</div>
              <h2 class="text-xl font-semibold text-white mb-1">
                Card Payment
              </h2>
              <p class="text-gray-400 text-sm mb-6">
                Fast checkout. Credit or debit card.
              </p>
              <a
                href="https://buy.stripe.com/4gw171g4hcwC06IdQS"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/25 hover:scale-105 hover:shadow-xl transition-all duration-200"
              >
                Pay with Stripe →
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
