import { NextRequest } from 'next/server'
import { GoogleGenAI, type Content } from '@google/genai'
import { createClient } from '@/lib/supabase/server'
import { TOOL_DECLARATIONS, executeTool } from '@/lib/gemini/tools'
import { rateLimit } from '@/lib/rateLimit'
import { canViewReports } from '@/lib/permissions'
import type { Role } from '@/types'

export const dynamic = 'force-dynamic'

interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

function systemInstruction(role: Role, storeName: string) {
  const base = `You are the Store Assistant for "${storeName}", a neighborhood grocery store using StockPulse. Be concise and friendly. Use tools to look up real data before answering questions about inventory, sales, or stock. Never make up numbers.`
  if (canViewReports(role)) {
    return `${base} This user is the store Owner, so they can ask about revenue, reports, top-selling items, and staff in addition to stock and sales.`
  }
  return `${base} This user is Staff, with access limited to stock levels and sales/order questions only. If asked about revenue, reports, or staff management, politely explain that's owner-only information.`
}

/** Caps chosen to be generous for a person typing and hostile to a loop. */
const RATE_LIMIT = 20
const RATE_WINDOW_MS = 60_000
const MAX_MESSAGES = 40
const MAX_CHARS = 8_000

/** Narrows an untrusted body. Anything failing this is a 400, not a 500. */
function parseMessages(body: unknown): ChatMessage[] | null {
  if (typeof body !== 'object' || body === null) return null
  const { messages } = body as { messages?: unknown }
  if (!Array.isArray(messages) || messages.length === 0) return null
  if (messages.length > MAX_MESSAGES) return null

  const out: ChatMessage[] = []
  let total = 0
  for (const m of messages) {
    if (typeof m !== 'object' || m === null) return null
    const { role, text } = m as { role?: unknown; text?: unknown }
    if (role !== 'user' && role !== 'model') return null
    if (typeof text !== 'string') return null
    total += text.length
    if (total > MAX_CHARS) return null
    out.push({ role, text })
  }
  return out
}

export async function POST(req: NextRequest) {
  // Parsed inside a try: a malformed payload previously threw here and
  // surfaced as an unhandled 500.
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return new Response('Malformed request body.', { status: 400 })
  }

  const messages = parseMessages(raw)
  if (!messages) {
    return new Response('Invalid or oversized message payload.', { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Keyed by user, and only after authentication, so an unauthenticated
  // flood cannot consume someone else's allowance.
  const limit = rateLimit(`ai:${user.id}`, RATE_LIMIT, RATE_WINDOW_MS)
  if (!limit.ok) {
    return new Response('Too many requests. Please wait a moment and try again.', {
      status: 429,
      headers: {
        'Retry-After': String(limit.retryAfter),
        'RateLimit-Limit': String(RATE_LIMIT),
        'RateLimit-Remaining': '0',
      },
    })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, store_id')
    .eq('id', user.id)
    .single()
  if (!profile) return new Response('Unauthorized', { status: 401 })

  const { data: store } = await supabase
    .from('stores')
    .select('name')
    .eq('id', profile.store_id)
    .single()

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return new Response('AI Assistant is not configured yet. Add GEMINI_API_KEY to enable it.', {
      status: 200,
    })
  }

  const ai = new GoogleGenAI({ apiKey })
  const tools = [{ functionDeclarations: TOOL_DECLARATIONS as never }]
  const config = {
    systemInstruction: systemInstruction(profile.role as Role, store?.name ?? 'the store'),
    tools,
  }

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }))
  const lastMessage = messages[messages.length - 1]?.text ?? ''

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        const contents: Content[] = [...history, { role: 'user', parts: [{ text: lastMessage }] }]

        /**
         * Runs one model turn, forwarding text to the client as it arrives.
         *
         * This previously awaited the whole response and then re-emitted it
         * word-by-word on a 15ms timer, which delayed the first token by the
         * full generation time and then added seconds of artificial drip on
         * top. Gemini streams natively; this just passes it through.
         */
        async function runTurn() {
          const iterator = await ai.models.generateContentStream({
            model: 'gemini-flash-latest',
            contents,
            config,
          })

          const turnCalls: NonNullable<
            Awaited<ReturnType<typeof ai.models.generateContent>>['functionCalls']
          > = []
          const turnParts: NonNullable<Content['parts']> = []
          let turnText = ''

          for await (const chunk of iterator) {
            if (chunk.functionCalls?.length) turnCalls.push(...chunk.functionCalls)

            const piece = chunk.text
            if (piece) {
              turnText += piece
              controller.enqueue(encoder.encode(piece))
            }

            const parts = chunk.candidates?.[0]?.content?.parts
            if (parts) turnParts.push(...parts)
          }

          return { calls: turnCalls, parts: turnParts, text: turnText }
        }

        let response = await runTurn()
        let calls = response.calls
        let guard = 0
        let streamedAnything = response.text.length > 0

        // Gemini can emit SEVERAL function calls in a single turn (parallel calling).
        // Every functionCall must receive a matching functionResponse — if any is left
        // unanswered, the model fills the gap by inventing data.
        while (calls.length > 0 && guard < 4) {
          guard++

          const responseParts = await Promise.all(
            calls.map(async (call) => {
              const toolResult = await executeTool(
                call.name ?? '',
                (call.args ?? {}) as Record<string, unknown>,
                {
                  supabase,
                  storeId: profile.store_id,
                  role: profile.role as Role,
                }
              )
              return {
                functionResponse: {
                  name: call.name ?? '',
                  response: toolResult as object,
                },
              }
            })
          )

          contents.push({ role: 'model', parts: response.parts })
          contents.push({ role: 'user', parts: responseParts as never })

          response = await runTurn()
          calls = response.calls
          if (response.text.length > 0) streamedAnything = true
        }

        // The loop can exit with calls still outstanding once the guard trips.
        // Saying so beats returning an empty bubble the user can't interpret.
        if (calls.length > 0) {
          controller.enqueue(
            encoder.encode(
              "\n\nI wasn't able to finish looking that up — the request needed too many lookups. Try asking for one thing at a time.",
            ),
          )
        } else if (!streamedAnything) {
          controller.enqueue(
            encoder.encode("Sorry, I couldn't come up with an answer for that. Try rephrasing?"),
          )
        }
      } catch (err) {
        controller.enqueue(
          new TextEncoder().encode(
            `Sorry, I ran into an error: ${err instanceof Error ? err.message : 'unknown error'}`
          )
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
