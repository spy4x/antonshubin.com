import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { jsonLd } from "./json-ld.ts";

const lineSeparator = String.fromCharCode(0x2028);
const paragraphSeparator = String.fromCharCode(0x2029);

Deno.test("escapes </script>, HTML comments and line/paragraph separators", () => {
  const value = {
    text:
      `</script><script>x</script><!--${lineSeparator}${paragraphSeparator}end`,
  };
  const out = jsonLd(value);
  assertEquals(out.includes("<"), false);
  assertEquals(out.includes(">"), false);
  assertEquals(out.includes(lineSeparator), false);
  assertEquals(out.includes(paragraphSeparator), false);
});

Deno.test("parses back to a deep-equal object", () => {
  const value = {
    text:
      `</script><script>x</script><!--${lineSeparator}${paragraphSeparator}end`,
    n: 1,
    list: [1, 2],
  };
  const out = jsonLd(value);
  assertEquals(JSON.parse(out), value);
});

Deno.test("escapes & and >", () => {
  const value = { text: "a & b > c" };
  const out = jsonLd(value);
  const backslash = String.fromCharCode(0x5c);
  const expected = `{"text":"a ${backslash}u0026 b ${backslash}u003e c"}`;
  assertEquals(out, expected);
  assertEquals(JSON.parse(out), value);
});

Deno.test("leaves an ordinary value unchanged in meaning", () => {
  const value = { "@type": "Person", name: "Anton Shubin" };
  assertEquals(JSON.parse(jsonLd(value)), value);
});
