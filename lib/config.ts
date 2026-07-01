export const DOMAIN = Deno.env.get("DOMAIN") || "https://antonshubin.com";
export const SCHEDULE_URL = Deno.env.get("SCHEDULE_URL") || "";
export const UPWORK_URL = Deno.env.get("UPWORK_URL") ||
  "https://www.upwork.com/freelancers/ashubin";
export const PLAUSIBLE_URL = Deno.env.get("PLAUSIBLE_URL") || "";
export const UMAMI_URL = Deno.env.get("UMAMI_URL") || "";
export const UMAMI_ID = Deno.env.get("UMAMI_ID") || "";

export const CONTACT_EMAIL = Deno.env.get("CONTACT_EMAIL") || "";
export const SAME_AS_URLS = [
  "https://www.upwork.com/freelancers/ashubin",
  "https://github.com/spy4x",
] as const;
