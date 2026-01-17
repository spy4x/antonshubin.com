import { define } from "../utils.ts";

export default define.page(function Share() {
  return (
    <div class="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <div class="max-w-xl mx-auto text-center">
        <h1 class="text-4xl tracking-wide text-white font-medium mb-4">
          anton<span class="text-orange-500">shubin</span>.com
        </h1>
        <img
          class="w-full max-w-md mx-auto object-cover"
          src="/img/qr-share.webp"
          alt="QR-code to share the website"
        />
        <a href="/" class="text-orange-500 hover:underline inline-block mt-8">
          Back to home
        </a>
      </div>
    </div>
  );
});
