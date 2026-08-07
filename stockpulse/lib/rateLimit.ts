/**
 * A small fixed-window rate limiter held in process memory.
 *
 * CAVEAT, stated plainly: on Vercel each serverless instance has its own
 * memory, so the effective allowance is (limit x warm instances) rather than a
 * hard global cap. This is deliberately not presented as airtight — it exists
 * to stop one signed-in user hammering a metered third-party API in a loop,
 * which is the realistic abuse here. A global guarantee needs shared state
 * (Vercel KV, Upstash, or a Postgres counter); see the production report.
 */

interface Window {
  count: number
  resetAt: number
}

const windows = new Map<string, Window>()

/** Stops the Map growing without bound on a long-lived warm instance. */
function sweep(now: number) {
  if (windows.size < 5_000) return
  for (const [key, w] of windows) {
    if (w.resetAt <= now) windows.delete(key)
  }
}

export interface RateLimitResult {
  ok: boolean
  /** Requests left in the current window. */
  remaining: number
  /** Seconds until the window resets — feeds the Retry-After header. */
  retryAfter: number
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const existing = windows.get(key)
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfter: 0 }
  }

  existing.count += 1
  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))

  if (existing.count > limit) {
    return { ok: false, remaining: 0, retryAfter }
  }
  return { ok: true, remaining: limit - existing.count, retryAfter }
}
