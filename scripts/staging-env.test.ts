import { assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0";
import { stagingEnv } from "./staging-env.ts";

const PROD = [
  "DOMAIN=example.com",
  "WWW_DOMAIN=www.example.com",
  "SCHEDULE_URL=https://meet.${DOMAIN}",
  "CONTACT_EMAIL=owner@${DOMAIN}",
  "SMTP_HOST=mail.${DOMAIN}",
  "SMTP_FROM=owner@${DOMAIN}",
  "SMTP_USERNAME=owner@${DOMAIN}",
  "",
].join("\n");

Deno.test("keeps mail and booking on the production domain", () => {
  const env = stagingEnv(PROD, "stag.example.com");
  assertEquals(env.match(/^SMTP_HOST=.*$/m)?.[0], "SMTP_HOST=mail.example.com");
  assertEquals(
    env.match(/^SMTP_FROM=.*$/m)?.[0],
    "SMTP_FROM=owner@example.com",
  );
  assertEquals(
    env.match(/^SMTP_USERNAME=.*$/m)?.[0],
    "SMTP_USERNAME=owner@example.com",
  );
  assertEquals(
    env.match(/^CONTACT_EMAIL=.*$/m)?.[0],
    "CONTACT_EMAIL=owner@example.com",
  );
  assertEquals(
    env.match(/^SCHEDULE_URL=.*$/m)?.[0],
    "SCHEDULE_URL=https://meet.example.com",
  );
});

Deno.test("serves staging on the staging host, without a www name", () => {
  const env = stagingEnv(PROD, "stag.example.com");
  assertEquals(env.match(/^DOMAIN=.*$/m)?.[0], "DOMAIN=stag.example.com");
  assertEquals(
    env.match(/^WWW_DOMAIN=.*$/m)?.[0],
    "WWW_DOMAIN=stag.example.com",
  );
});

Deno.test("refuses a production env without DOMAIN", () => {
  assertThrows(() =>
    stagingEnv("SMTP_HOST=mail.${DOMAIN}\n", "stag.example.com")
  );
});
