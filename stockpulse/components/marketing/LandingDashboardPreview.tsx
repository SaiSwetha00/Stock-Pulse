'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { StockProduct } from './landingTypes'
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, RefreshCw, Search } from 'lucide-react'

export default function LandingDashboardPreview() {
  const [activeTab, setActiveTab] = useState<'all' | 'warning' | 'optimal'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [simulatedScanMsg, setSimulatedScanMsg] = useState<string | null>(null)

  const initialProducts: StockProduct[] = [
    {
      id: 'SKU-8821',
      name: 'Royal Crimson Pomegranates',
      category: 'Exotic Produce',
      stock: 142,
      maxStock: 200,
      unit: 'Units',
      expiringDays: 12,
      temperature: '4.1°C',
      status: 'optimal',
      price: 6.99,
    },
    {
      id: 'SKU-4910',
      name: 'Artisanal Cold-Pressed Olive Oil',
      category: 'Pantry Elixirs',
      stock: 48,
      maxStock: 100,
      unit: 'Bottles',
      expiringDays: 140,
      temperature: '18.0°C',
      status: 'optimal',
      price: 34.5,
    },
    {
      id: 'SKU-1029',
      name: 'Organic Hass Avocados',
      category: 'Fresh Produce',
      stock: 18,
      maxStock: 150,
      unit: 'Crates',
      expiringDays: 2,
      temperature: '5.2°C',
      status: 'critical',
      price: 2.49,
    },
    {
      id: 'SKU-7723',
      name: 'Japanese Crown Melon (Grade A)',
      category: 'Luxury Produce',
      stock: 12,
      maxStock: 30,
      unit: 'Melons',
      expiringDays: 4,
      temperature: '3.8°C',
      status: 'warning',
      price: 120.0,
    },
    {
      id: 'SKU-9941',
      name: 'Miyazaki Wagyu Ribeye A5',
      category: 'Meat & Seafood',
      stock: 24,
      maxStock: 50,
      unit: 'Cuts',
      expiringDays: 7,
      temperature: '1.2°C',
      status: 'optimal',
      price: 185.0,
    },
    {
      id: 'SKU-3320',
      name: 'Raw Organic Wildflower Honey',
      category: 'Specialty Pantry',
      stock: 89,
      maxStock: 120,
      unit: 'Jars',
      expiringDays: 360,
      temperature: '20.5°C',
      status: 'optimal',
      price: 18.99,
    },
  ]

  const [products, setProducts] = useState<StockProduct[]>(initialProducts)

  const filteredProducts = products.filter((p) => {
    const matchesTab =
      activeTab === 'all' ? true : activeTab === 'warning' ? p.status === 'warning' || p.status === 'critical' : p.status === 'optimal'
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  const handleSimulateScan = () => {
    setSimulatedScanMsg('Scanning Optical Tag... Scanned SKU-1029: Organic Hass Avocados. Stock re-inventoried +5 Crates.')
    setProducts((prev) => prev.map((p) => (p.id === 'SKU-1029' ? { ...p, stock: p.stock + 5, status: 'warning' } : p)))
    setTimeout(() => setSimulatedScanMsg(null), 4000)
  }

  return (
    <section id="dashboard-preview" className="relative py-32 sp-band-gradient-a overflow-hidden border-t border-border perspective-1500">
      {/* Background Flare */}
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-[#93000a]/10 rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: -12 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16"
        >
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--sp-gold)] mb-5 px-3 py-1 rounded-full bg-[var(--sp-surface-card)] border border-border">
              <Activity className="w-3.5 h-3.5" /> AUTOMATED AI 3D SHELF TELEMETRY
            </div>
            <h2 className="font-display font-semibold text-3xl sm:text-4xl text-[#e0e2ed]">
              Automated AI 3D Telemetry & Inventory Center
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSimulateScan}
              className="px-6 py-3 rounded-xl bg-[var(--sp-surface-card)] border border-[var(--sp-gold)]/40 text-[var(--sp-gold)] hover:bg-[var(--sp-gold)] hover:text-accent-ink font-mono text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(201,162,39,0.2)]"
            >
              <RefreshCw className="w-4 h-4" /> TRIGGER AUTOMATED AI SCAN
            </button>
            <Link
              href="/dashboard"
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-[var(--sp-gold)] to-[var(--sp-gold-deep)] text-accent-ink font-mono text-xs uppercase tracking-wider font-semibold hover:shadow-[0_0_25px_rgba(201,162,39,0.5)] transition-all flex items-center gap-2 cursor-pointer"
            >
              FULL SCREEN COMMAND APP <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Scan Message Alert Notification */}
        {simulatedScanMsg && (
          <div className="mb-6 p-4 rounded-xl bg-success-bg border border-success text-success font-mono text-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <span>{simulatedScanMsg}</span>
            </div>
            <span className="text-[10px] text-success/60 uppercase">JUST NOW</span>
          </div>
        )}

        {/* Simulated Command Workspace Console Frame with 3D Depth */}
        <motion.div
          initial={{ opacity: 0, y: 50, rotateX: 12 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          whileHover={{ translateZ: 15 }}
          className="glass-panel rounded-2xl border border-[var(--sp-gold)]/30 shadow-2xl overflow-hidden bg-background/95 preserve-3d animate-3d-glow"
        >
          {/* Top Window Bar */}
          <div className="px-7 py-5 bg-[var(--sp-surface-alt)] border-b border-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#93000a]" />
                <div className="w-3 h-3 rounded-full bg-[var(--sp-gold)]" />
                <div className="w-3 h-3 rounded-full bg-success" />
              </div>
              <span className="font-mono text-xs text-[#d1c5b0] tracking-wider uppercase pl-2">
                STOCK_PULSE_HQ // LIVE_LEDGER_NODE_01
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'all' ? 'bg-[var(--sp-gold)] text-accent-ink font-bold' : 'text-[#d1c5b0] hover:text-[#e0e2ed]'
                }`}
              >
                ALL STOCK ({products.length})
              </button>
              <button
                onClick={() => setActiveTab('warning')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'warning' ? 'bg-[#93000a] text-foreground font-bold' : 'text-[#ffb4ab] hover:text-foreground'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" /> SPOILAGE ALERTS (2)
              </button>
              <button
                onClick={() => setActiveTab('optimal')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'optimal' ? 'bg-success text-foreground font-bold' : 'text-success hover:text-foreground'
                }`}
              >
                OPTIMAL
              </button>
            </div>
          </div>

          {/* Search & Stats Bar inside Console */}
          <div className="p-7 border-b border-border bg-[var(--sp-surface-elevated)] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 w-4 h-4 text-[#d1c5b0]/40" />
              <input
                type="text"
                placeholder="Search SKU, product or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-background border border-[#4e4636] text-xs text-[#e0e2ed] placeholder-[#d1c5b0]/40 outline-none focus:border-[var(--sp-gold)]"
              />
            </div>

            <div className="flex items-center gap-6 font-mono text-xs text-[#d1c5b0]">
              <div>
                <span className="text-[#d1c5b0]/60">Total Value: </span>
                <span className="text-[var(--sp-gold)] font-bold">$14,892.50</span>
              </div>
              <div>
                <span className="text-[#d1c5b0]/60">Avg Temp: </span>
                <span className="text-success font-bold">4.2°C</span>
              </div>
            </div>
          </div>

          {/* Table Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--sp-surface-alt)]/80 font-mono text-[11px] uppercase tracking-wider text-[#d1c5b0]/60 border-b border-border">
                  <th className="py-3.5 px-6">SKU Code</th>
                  <th className="py-3.5 px-6">Product Title</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Stock Level</th>
                  <th className="py-3.5 px-6">Expiry Window</th>
                  <th className="py-3.5 px-6">Probe Temp</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Unit Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-sans text-xs">
                {filteredProducts.map((p) => {
                  const stockPct = Math.round((p.stock / p.maxStock) * 100)
                  return (
                    <tr key={p.id} className="hover:bg-[var(--sp-surface-card)]/80 transition-colors cursor-pointer">
                      <td className="py-4 px-6 font-mono font-semibold text-[var(--sp-gold)]">{p.id}</td>
                      <td className="py-4 px-6 font-semibold text-[#e0e2ed]">{p.name}</td>
                      <td className="py-4 px-6 text-[#d1c5b0]/70">{p.category}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-background h-2 rounded-full overflow-hidden border border-border">
                            <div
                              className={`h-full ${
                                stockPct < 25 ? 'bg-[#93000a]' : stockPct < 50 ? 'bg-[var(--sp-gold)]' : 'bg-success'
                              }`}
                              style={{ width: `${stockPct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-[#e0e2ed]">
                            {p.stock} {p.unit}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-[11px]">
                        <span className={p.expiringDays <= 3 ? 'text-[#ffb4ab] font-bold' : 'text-[#d1c5b0]'}>
                          {p.expiringDays} Days Left
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-[11px] text-success">{p.temperature}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] uppercase font-bold ${
                            p.status === 'critical'
                              ? 'bg-[#93000a]/40 text-[#ffb4ab] border border-[#93000a]'
                              : p.status === 'warning'
                              ? 'bg-[var(--sp-gold)]/20 text-[var(--sp-gold)] border border-[var(--sp-gold)]/40'
                              : 'bg-success-bg text-success border border-success'
                          }`}
                        >
                          {p.status === 'critical' && <AlertTriangle className="w-3 h-3" />}
                          {p.status === 'optimal' && <CheckCircle2 className="w-3 h-3" />}
                          {p.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-right text-[#e0e2ed]">${p.price.toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Bar */}
          <div className="p-5 bg-[var(--sp-surface-elevated)] border-t border-border flex items-center justify-between font-mono text-[11px] text-[#d1c5b0]/60">
            <div>Click any product row to view deep telemetry inspection logs</div>
            <div className="text-[var(--sp-gold)]">Synced with Cold-Chain Probe #7</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
