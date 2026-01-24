import { define } from "../utils.ts";
import { Layout } from "../components/Layout.tsx";
import {
  GitHubIcon,
  LinkedInIcon,
  TelegramIcon,
  YouTubeIcon,
  EmailIcon,
} from "../components/Icons.tsx";

export default define.page(function Share(ctx) {
  return (
    <Layout currentPath={ctx.url.pathname}>
      <div class="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <div class="max-w-xl mx-auto text-center">
          <h1 class="text-4xl tracking-wide text-white font-medium mb-4">
            anton<span class="text-orange-500">shubin</span>.com
          </h1>
          <img
            class="w-full max-w-md mx-auto object-cover mb-4"
            src="/img/qr-share.webp"
            alt="QR-code to share the website"
          />
          <div class="flex justify-center">
            <div class="p-4 bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-[330px] backdrop-blur-sm">
              <div class="grid grid-cols-1 gap-1">
                <a href="https://www.youtube.com/@anton-shubin" target="_blank" class="flex items-center gap-3 text-gray-300 hover:text-white transition-all duration-300 p-2 rounded-lg hover:bg-slate-700 cursor-pointer group" title="YouTube — anton-shubin">
                  <YouTubeIcon class="w-6 h-6 flex-shrink-0 group-hover:text-orange-400" />
                  <span class="text-lg transition-colors group-hover:text-orange-400">anton-shubin</span>
                </a>
                <a href="https://www.linkedin.com/in/anton-shubin" target="_blank" class="flex items-center gap-3 text-gray-300 hover:text-white transition-all duration-300 p-2 rounded-lg hover:bg-slate-700 cursor-pointer group" title="LinkedIn — anton-shubin">
                  <LinkedInIcon class="w-6 h-6 flex-shrink-0 group-hover:text-orange-400" />
                  <span class="text-lg transition-colors group-hover:text-orange-400">anton-shubin</span>
                </a>
                <a href="https://github.com/spy4x" target="_blank" class="flex items-center gap-3 text-gray-300 hover:text-white transition-all duration-300 p-2 rounded-lg hover:bg-slate-700 cursor-pointer group" title="GitHub — spy4x">
                  <GitHubIcon class="w-6 h-6 flex-shrink-0 group-hover:text-orange-400" />
                  <span class="text-lg transition-colors group-hover:text-orange-400">spy4x</span>
                </a>
                <a href="https://t.me/spy4x" target="_blank" class="flex items-center gap-3 text-gray-300 hover:text-white transition-all duration-300 p-2 rounded-lg hover:bg-slate-700 cursor-pointer group" title="Telegram — @spy4x">
                  <TelegramIcon class="w-6 h-6 flex-shrink-0 group-hover:text-orange-400" />
                  <span class="text-lg transition-colors group-hover:text-orange-400">spy4x</span>
                </a>
                <a href="https://www.upwork.com/freelancers/ashubin" target="_blank" class="flex items-center gap-3 text-gray-300 hover:text-white transition-all duration-300 p-2 rounded-lg hover:bg-slate-700 cursor-pointer group" title="Upwork — ashubin">
                  <span class="inline-block w-6 h-6 flex-shrink-0 text-gray-300 group-hover:text-orange-400">Up</span>
                  <span class="text-lg transition-colors group-hover:text-orange-400">ashubin</span>
                </a>
                <a href="mailto:anton@antonshubin.com" class="flex items-center gap-3 text-gray-300 hover:text-white transition-all duration-300 p-2 rounded-lg hover:bg-slate-700 cursor-pointer group" title="Email — anton@antonshubin.com">
                  <EmailIcon class="w-6 h-6 flex-shrink-0 group-hover:text-orange-400" />
                  <span class="text-lg transition-colors group-hover:text-orange-400">anton@antonshubin.com</span>
                </a>
              </div>
          </div>
        </div>
      </div>
      </div>
    </Layout>
  );
});
