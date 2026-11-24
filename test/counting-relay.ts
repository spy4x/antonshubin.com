// A fake mail relay for the rendered-site tests that check which mails the
// site tries to send.

/**
 * A stand-in for the mail relay that only counts connections. The site opens
 * one connection per mail it tries to send; this closes each at once, so the
 * send fails and is logged, which the visitor's answer never shows.
 */
export function countingRelay(): {
  port: number
  connections: () => number
  close: () => Promise<void>
} {
  const listener = Deno.listen({ hostname: "127.0.0.1", port: 0 })
  let connections = 0
  const accepting = (async () => {
    for await (const conn of listener) {
      connections++
      conn.close()
    }
  })().catch(() => {})
  return {
    port: listener.addr.port,
    connections: () => connections,
    close: async () => {
      listener.close()
      await accepting
    },
  }
}
