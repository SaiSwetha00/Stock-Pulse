import type { SupabaseClient } from '@supabase/supabase-js'
import type { Role } from '@/types'
import { canViewReports } from '@/lib/permissions'
// Expiry is read through the same helpers the Inventory and dashboard
// surfaces use, so the assistant cannot disagree with the pages about what
// counts as "expiring soon".
import { storeExpiryWarningDays } from '@/lib/expiry'
import { reportingDate } from '@/lib/reportingTimezone'

export interface ToolContext {
  supabase: SupabaseClient
  storeId: string
  role: Role
}

export const OWNER_ONLY_TOOLS = new Set(['getRevenueSummary', 'getTopSellingItems', 'listStaff'])

export const TOOL_DECLARATIONS = [
  {
    name: 'searchProducts',
    description:
      'Search the store inventory by product name or category. Returns product name, category, price, stock level, and low-stock threshold.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Product name or partial name to search for' },
        category: {
          type: 'string',
          description: 'Optional category filter: produce, dairy, packaged, beverages, household',
        },
      },
    },
  },
  {
    name: 'getLowStockItems',
    description: 'List all products currently at or below their low-stock threshold.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'getExpiringItems',
    description:
      "List stock that is expiring soon or has already expired. Use `scope: 'expired'` for stock past its date and `scope: 'soon'` for stock inside the store's expiry warning window.",
    parameters: {
      type: 'object',
      properties: {
        scope: {
          type: 'string',
          enum: ['soon', 'expired'],
          description: 'Whether to list stock expiring soon or already expired',
        },
      },
    },
  },
  {
    name: 'getInventoryValue',
    description:
      'Total retail value of stock on hand (sum of unit price times quantity), with the product and unit counts it is based on.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'getCustomerCount',
    description: 'How many customers the store has, broken down by loyalty tier.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'getNeverSoldProducts',
    description:
      'Products that have never appeared on a sale. Useful for spotting dead stock.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'getSalesSummary',
    description:
      'Get sales totals and transaction count for a given period: today, week, or month.',
    parameters: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['today', 'week', 'month'],
          description: 'The period to summarize sales for',
        },
      },
      required: ['period'],
    },
  },
  {
    name: 'getRevenueSummary',
    description:
      'Owner only. Get detailed revenue breakdown including totals by category for a given period.',
    parameters: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['today', 'week', 'month'],
        },
      },
      required: ['period'],
    },
  },
  {
    name: 'getTopSellingItems',
    description: 'Owner only. Get the top-selling products by units sold over the last 30 days.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'How many items to return, default 5' },
      },
    },
  },
  {
    name: 'listStaff',
    description: 'Owner only. List staff members and their roles.',
    parameters: { type: 'object', properties: {} },
  },
]

function startOfPeriod(period: 'today' | 'week' | 'month'): Date {
  const now = new Date()
  if (period === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }
  if (period === 'week') {
    const d = new Date(now)
    d.setDate(d.getDate() - 7)
    return d
  }
  const d = new Date(now)
  d.setMonth(d.getMonth() - 1)
  return d
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown> {
  if (OWNER_ONLY_TOOLS.has(name) && !canViewReports(ctx.role)) {
    return { error: 'This information is only available to owners and managers.' }
  }

  const { supabase, storeId } = ctx

  switch (name) {
    case 'searchProducts': {
      let q = supabase
        .from('products')
        .select('name, category, unit_price, stock, low_stock_threshold, unit')
        .eq('store_id', storeId)
        .limit(15)
      if (args.query) q = q.ilike('name', `%${args.query}%`)
      if (args.category) q = q.eq('category', args.category as string)
      const { data, error } = await q
      if (error) return { error: error.message }
      return { products: data }
    }

    case 'getLowStockItems': {
      const { data, error } = await supabase
        .from('products')
        .select('name, category, stock, low_stock_threshold, unit')
        .eq('store_id', storeId)
        .order('stock', { ascending: true })
        .limit(30)
      if (error) return { error: error.message }
      const lowStock = (data ?? []).filter((p) => p.stock <= p.low_stock_threshold)
      return { low_stock_items: lowStock, count: lowStock.length }
    }

    /**
     * Expiry reads LOTS, never `products.expiry_date` — that column is legacy
     * and unread by the rest of the app, so answering from it would tell the
     * shopkeeper something the Inventory page contradicts. Zero-quantity lots
     * are excluded because stock that is gone cannot expire.
     */
    case 'getExpiringItems': {
      const scope = (args.scope as 'soon' | 'expired') ?? 'soon'
      const { data: store } = await supabase
        .from('stores')
        .select('expiry_warning_days')
        .eq('id', storeId)
        .single()
      const days = storeExpiryWarningDays(store ?? {})
      const today = reportingDate()
      // Same YYYY-MM-DD string arithmetic lib/expiry.ts uses. Deliberately
      // not `new Date(today)` + setDate: that parses as UTC midnight and
      // renders as the previous day anywhere ahead of UTC, which is exactly
      // the bug lib/expiry.ts documents.
      const cutoffDate = new Date(`${today}T00:00:00`)
      cutoffDate.setDate(cutoffDate.getDate() + days)
      const cutoff = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}-${String(cutoffDate.getDate()).padStart(2, '0')}`

      let q = supabase
        .from('product_batches')
        .select('quantity, expiry_date, products!inner(name, unit)')
        .eq('store_id', storeId)
        .gt('quantity', 0)
        .not('expiry_date', 'is', null)
        .order('expiry_date', { ascending: true })
        .limit(30)
      q = scope === 'expired' ? q.lt('expiry_date', today) : q.gte('expiry_date', today).lte('expiry_date', cutoff)

      const { data, error } = await q
      if (error) return { error: error.message }
      const rows = (data ?? []).map((r) => {
        const product = r.products as unknown as { name: string; unit: string | null }
        return { name: product?.name, unit: product?.unit, quantity: r.quantity, expiry_date: r.expiry_date }
      })
      return { scope, warning_days: days, today, items: rows, count: rows.length }
    }

    /**
     * Retail value, not cost — the schema has no cost price, so this is what
     * the stock would ring up for. Said plainly in the return so the model
     * cannot present it as margin or profit.
     */
    case 'getInventoryValue': {
      const { data, error } = await supabase
        .from('products')
        .select('unit_price, stock')
        .eq('store_id', storeId)
      if (error) return { error: error.message }
      const rows = data ?? []
      const total = rows.reduce((sum, p) => sum + Number(p.unit_price ?? 0) * Number(p.stock ?? 0), 0)
      return {
        basis: 'retail selling price; the schema stores no cost price, so this is not margin',
        total_retail_value: Math.round(total * 100) / 100,
        product_count: rows.length,
        units_on_hand: rows.reduce((sum, p) => sum + Number(p.stock ?? 0), 0),
      }
    }

    case 'getCustomerCount': {
      const { data, error } = await supabase
        .from('customers')
        .select('loyalty_tier')
        .eq('store_id', storeId)
      if (error) return { error: error.message }
      const rows = data ?? []
      const by_tier: Record<string, number> = {}
      for (const c of rows) by_tier[c.loyalty_tier] = (by_tier[c.loyalty_tier] ?? 0) + 1
      return { total: rows.length, by_tier }
    }

    /**
     * Two queries rather than a NOT IN subselect, because PostgREST cannot
     * express one and the sold set is small enough to difference in memory.
     * Capped, and the cap is REPORTED — a truncated list presented as complete
     * is the kind of answer that gets a shopkeeper to write off live stock.
     */
    case 'getNeverSoldProducts': {
      const { data: sold, error: soldError } = await supabase
        .from('sale_items')
        .select('product_id, sales!inner(store_id)')
        .eq('sales.store_id', storeId)
      if (soldError) return { error: soldError.message }
      const soldIds = new Set((sold ?? []).map((r) => r.product_id))

      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, category, stock, unit, unit_price')
        .eq('store_id', storeId)
      if (error) return { error: error.message }

      const never = (products ?? []).filter((p) => !soldIds.has(p.id))
      const shown = never.slice(0, 25)
      return {
        // The product id is dropped: it is a uuid the model has no use for
        // and would otherwise be free to echo back into a reply.
        never_sold: shown.map((p) => ({
          name: p.name,
          category: p.category,
          stock: p.stock,
          unit: p.unit,
          unit_price: p.unit_price,
        })),
        count: never.length,
        truncated: never.length > shown.length,
      }
    }

    case 'getSalesSummary': {
      const period = (args.period as 'today' | 'week' | 'month') ?? 'today'
      const since = startOfPeriod(period)
      const { data, error } = await supabase
        .from('sales')
        .select('total, created_at')
        .eq('store_id', storeId)
        .gte('created_at', since.toISOString())
      if (error) return { error: error.message }
      const total = (data ?? []).reduce((sum, s) => sum + Number(s.total), 0)
      return { period, transaction_count: data?.length ?? 0, total_revenue: total.toFixed(2) }
    }

    case 'getRevenueSummary': {
      const period = (args.period as 'today' | 'week' | 'month') ?? 'today'
      const since = startOfPeriod(period)
      const { data, error } = await supabase
        .from('sales')
        .select('total, created_at, sale_items(product_name, line_total, quantity)')
        .eq('store_id', storeId)
        .gte('created_at', since.toISOString())
      if (error) return { error: error.message }
      const total = (data ?? []).reduce((sum, s) => sum + Number(s.total), 0)
      return {
        period,
        transaction_count: data?.length ?? 0,
        total_revenue: total.toFixed(2),
        average_order_value: data?.length ? (total / data.length).toFixed(2) : '0.00',
      }
    }

    case 'getTopSellingItems': {
      const limit = (args.limit as number) ?? 5
      const since = startOfPeriod('month')
      const { data, error } = await supabase
        .from('sale_items')
        .select('product_name, quantity, sales!inner(store_id, created_at)')
        .eq('sales.store_id', storeId)
        .gte('sales.created_at', since.toISOString())
      if (error) return { error: error.message }
      const totals = new Map<string, number>()
      for (const row of data ?? []) {
        totals.set(row.product_name, (totals.get(row.product_name) ?? 0) + row.quantity)
      }
      const sorted = [...totals.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([product_name, units_sold]) => ({ product_name, units_sold }))
      return { top_selling_items: sorted }
    }

    case 'listStaff': {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, role, job_title, email')
        .eq('store_id', storeId)
      if (error) return { error: error.message }
      return { staff: data }
    }

    default:
      return { error: `Unknown tool: ${name}` }
  }
}
