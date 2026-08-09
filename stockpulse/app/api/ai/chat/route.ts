import { NextRequest } from 'next/server'
import { GoogleGenAI, type Content } from '@google/genai'
import { createClient } from '@/lib/supabase/server'
import { TOOL_DECLARATIONS, executeTool } from '@/lib/gemini/tools'
import { rateLimit } from '@/lib/rateLimit'
import { canViewReports } from '@/lib/permissions'
import { persistTurn } from '@/lib/ai/persistTurn'
import type { Role } from '@/types'

export const dynamic = 'force-dynamic'

interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

function systemInstruction(role: Role, storeName: string) {
  // The currency clause is not decoration. Every tool in lib/gemini/tools.ts
  // returns bare numbers — `total_revenue: "4715.35"` — with no unit attached,
  // so the model picks a symbol from context, and a model trained mostly on
  // American text picks "$". The rest of the app renders the same figure as
  // ₹4,715.35, so the assistant was the one surface that would disagree with
  // every screen around it. Naming the currency here is what makes the tool
  // output unambiguous; pre-formatting it in the tools instead would hand the
  // model strings it then has to do arithmetic on.
  const base = `You are the Store Assistant for "${storeName}", a neighborhood grocery store using StockPulse. Be concise and friendly. Use tools to look up real data before answering questions about inventory, sales, or stock. Never make up numbers. All monetary amounts returned by tools are in Indian rupees: always write them with the ₹ symbol and Indian digit grouping (₹1,00,000.00, not $100,000.00). Never use a dollar sign.`
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

/**
 * The conversation to record this turn against.
 *
 * Optional on purpose: the endpoint answers with or without one. A caller that
 * omits it — an older client, or a future surface with nothing to persist —
 * gets exactly the behaviour it had before threads existed, rather than a 400
 * for a field it does not know about.
 */
function parseThreadId(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null
  const { threadId } = body as { threadId?: unknown }
  return typeof threadId === 'string' && threadId.length > 0 ? threadId : null
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
  const threadId = parseThreadId(raw)

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

      // Everything the user actually sees, captured as it goes out, so what
      // gets stored is what was on screen — including the two apology strings
      // below. A history that silently drops the failed turns would show a
      // question with no answer under it and no explanation why.
      let emitted = ''
      function send(text: string) {
        emitted += text
        controller.enqueue(encoder.encode(text))
      }

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
              send(piece)
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
          send(
            "\n\nI wasn't able to finish looking that up — the request needed too many lookups. Try asking for one thing at a time.",
          )
        } else if (!streamedAnything) {
          send("Sorry, I couldn't come up with an answer for that. Try rephrasing?")
        }
      } catch (err) {
        send(`Sorry, I ran into an error: ${err instanceof Error ? err.message : 'unknown error'}`)
      } finally {
        // Close first, then write. The user has the complete answer on screen
        // the moment the model stops talking; making them wait on two database
        // round trips before the stream ends would add latency to every single
        // turn in exchange for nothing they can perceive.
        controller.close()

        if (threadId && lastMessage.trim()) {
          await persistTurn({
            supabase,
            threadId,
            userId: user.id,
            userText: lastMessage,
            modelText: emitted,
          })
          // A persistence failure is not reported to the user: the answer is
          // already delivered and the stream is closed, so there is nowhere
          // left to say it. The visible symptom is a turn missing from
          // history after a refresh, which is the honest consequence.
        }
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
