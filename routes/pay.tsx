import { define } from "../utils.ts";

export default define.page(function Pay() {
  return (
    <div class="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <div class="max-w-xl mx-auto text-center space-y-8">
        {/* Stripe Payment */}
        <a
          href="https://buy.stripe.com/4gw171g4hcwC06IdQS"
          target="_blank"
          rel="noopener noreferrer"
          class="block"
        >
          <span class="text-4xl tracking-wide text-white font-medium">
            Pay with <span class="text-blue-500 underline">Stripe</span>
          </span>
          <p class="text-slate-300 text-sm mt-2">
            click this link or scan the QR-code
          </p>
          <img
            class="w-full max-w-xs mx-auto mt-4 object-cover"
            src="/img/qr-stripe.svg"
            alt="QR-code to pay with Stripe"
          />
        </a>

        <p class="text-slate-300 text-xl">OR</p>

        {/* SWIFT Transfer */}
        <div class="flex flex-col gap-3 mx-auto mt-4 max-w-xs text-left">
          <p class="text-4xl tracking-wide text-white font-medium text-center">
            Transfer USD through <span class="text-orange-500">SWIFT:</span>
          </p>

          <div>
            <p class="text-slate-400">Account holder full name</p>
            <p class="text-white">NEATSOFT PTE. LTD.</p>
          </div>

          <div>
            <p class="text-slate-400">Account number/IBAN</p>
            <p class="text-white">GB21TCCL04140420871198</p>
          </div>

          <div>
            <p class="text-slate-400">Bank name</p>
            <p class="text-white">The Currency Cloud Limited</p>
          </div>

          <div>
            <p class="text-slate-400">Bank SWIFT/BIC</p>
            <p class="text-white">TCCLGB3L</p>
          </div>

          <div>
            <p class="text-slate-400">Bank address</p>
            <p class="text-white">
              12 Steward Street, The Steward Building, London, E1 6FQ, GB
            </p>
          </div>

          <div>
            <p class="text-slate-400">Bank country</p>
            <p class="text-white">GB</p>
          </div>
        </div>

        {/* Back link */}
        <a href="/" class="text-orange-500 hover:underline inline-block mt-8">
          Back to home
        </a>
      </div>
    </div>
  );
});
