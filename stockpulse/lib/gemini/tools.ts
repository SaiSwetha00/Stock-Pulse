import type { SupabaseClient } from '@supabase/supabase-js'
import type { Role } from '@/types'
import { canViewReports } from '@/lib/permissions'

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
