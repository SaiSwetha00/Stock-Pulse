import React, { useState } from 'react';
import { PageView, StockProduct } from '../types';
import { StockPulseLogo } from './StockPulseLogo';
import {
  Activity,
  Layers,
  BarChart3,
  Search,
  Bell,
  Plus,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Thermometer,
  ShieldCheck,
  TrendingUp,
  Boxes,
  RefreshCw,
  LogOut,
  Sparkles,
  PackageCheck,
  Building,
} from 'lucide-react';

interface FullDashboardViewProps {
  onNavigate: (page: PageView) => void;
}

export const FullDashboardView: React.FC<FullDashboardViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'analytics' | 'coldchain'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [products, setProducts] = useState<StockProduct[]>([
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
      price: 34.50,
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
      price: 120.00,
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
      price: 185.00,
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
  ]);

  // Form State for Adding Product
  const [newProductName, setNewProductName] = useState('');
  const [newCategory, setNewCategory] = useState('Fresh Produce');
  const [newStock, setNewStock] = useState(50);
  const [newPrice, setNewPrice] = useState(9.99);

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName) return;
    const newSku: StockProduct = {
      id: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newProductName,
      category: newCategory,
      stock: Number(newStock),
      maxStock: Number(newStock) * 2,
      unit: 'Units',
      expiringDays: 14,
      temperature: '4.0°C',
      status: 'optimal',
      price: Number(newPrice),
    };
    setProducts([newSku, ...products]);
    setNewProductName('');
    setShowAddModal(false);
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#10131b] text-[#e0e2ed] flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-72 bg-[#0b0e15] border-r border-[#edc155]/20 p-6 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Header */}
          <div className="mb-10 pb-6 border-b border-white/5 cursor-pointer" onClick={() => onNavigate('landing')}>
            <StockPulseLogo size="md" />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2 font-mono text-xs uppercase tracking-wider">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full p-3.5 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#edc155]/20 text-[#edc155] border-l-2 border-[#edc155]'
                  : 'text-[#d1c5b0]/70 hover:text-[#e0e2ed] hover:bg-white/5'
              }`}
            >
              <Activity className="w-4 h-4" /> Overview Dashboard
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`w-full p-3.5 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'ledger'
                  ? 'bg-[#edc155]/20 text-[#edc155] border-l-2 border-[#edc155]'
                  : 'text-[#d1c5b0]/70 hover:text-[#e0e2ed] hover:bg-white/5'
              }`}
            >
              <Layers className="w-4 h-4" /> Stock Ledger
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full p-3.5 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-[#edc155]/20 text-[#edc155] border-l-2 border-[#edc155]'
                  : 'text-[#d1c5b0]/70 hover:text-[#e0e2ed] hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Spoilage Analytics
            </button>

            <button
              onClick={() => setActiveTab('coldchain')}
              className={`w-full p-3.5 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'coldchain'
                  ? 'bg-[#edc155]/20 text-[#edc155] border-l-2 border-[#edc155]'
                  : 'text-[#d1c5b0]/70 hover:text-[#e0e2ed] hover:bg-white/5'
              }`}
            >
              <Thermometer className="w-4 h-4 text-emerald-400" /> Cold-Chain Probes
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-6 border-t border-white/5 space-y-4 font-mono text-xs">
          <div className="p-3 rounded-xl bg-[#1d2027] border border-emerald-500/30 text-emerald-400 text-[11px] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Store #104 Active</span>
          </div>

          <button
            onClick={() => onNavigate('landing')}
            className="w-full py-3 rounded-xl border border-[#4e4636] text-[#d1c5b0] hover:text-[#edc155] hover:border-[#edc155] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Exit to Landing Page
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Header Bar */}
        <header className="px-8 py-5 bg-[#181b23] border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-3 w-4 h-4 text-[#d1c5b0]/40" />
            <input
              type="text"
              placeholder="Search ledger by SKU or item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#10131b] border border-[#4e4636] text-xs text-[#e0e2ed] placeholder-[#d1c5b0]/40 outline-none focus:border-[#edc155]"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#edc155] to-[#c9a037] text-[#10131b] font-mono text-xs uppercase tracking-wider font-bold flex items-center gap-2 hover:shadow-[0_0_20px_rgba(237,193,85,0.4)] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Product
            </button>

            <button className="p-2.5 rounded-xl bg-[#10131b] border border-[#4e4636] text-[#e0e2ed] hover:text-[#edc155] relative cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#93000a]" />
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-white/10 font-mono text-xs">
              <div className="w-8 h-8 rounded-full bg-[#edc155] text-[#10131b] font-bold flex items-center justify-center">
                SP
              </div>
              <div>
                <div className="text-[#e0e2ed] font-semibold">Store Operator</div>
                <div className="text-[10px] text-[#d1c5b0]/60">Admin HQ</div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Tab Body */}
        <div className="p-8 space-y-8 flex-1">
          {/* Top Metric Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card p-6 rounded-2xl border border-[#edc155]/20">
              <div className="font-mono text-xs text-[#edc155] uppercase tracking-wider mb-2 flex items-center gap-2">
                <Boxes className="w-4 h-4" /> Total Active SKUs
              </div>
              <div className="font-display font-bold text-4xl text-[#e0e2ed] mb-1">
                {products.length} Items
              </div>
              <div className="font-mono text-[11px] text-[#d1c5b0]/60">Across 6 Department Shelves</div>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-white/10">
              <div className="font-mono text-xs text-[#ffb4ab] uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Spoilage Risk Items
              </div>
              <div className="font-display font-bold text-4xl text-[#ffb4ab] mb-1">2 SKUs</div>
              <div className="font-mono text-[11px] text-[#ffb4ab]">Hass Avocados (2 Days Left)</div>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-white/10">
              <div className="font-mono text-xs text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Thermometer className="w-4 h-4" /> Cold-Chain Status
              </div>
              <div className="font-display font-bold text-4xl text-[#e0e2ed] mb-1">3.8°C</div>
              <div className="font-mono text-[11px] text-emerald-400">All 8 Probes Nominal</div>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-white/10">
              <div className="font-mono text-xs text-[#A882C1] uppercase tracking-wider mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Ledger Valuation
              </div>
              <div className="font-display font-bold text-4xl text-[#e0e2ed] mb-1">$24,890</div>
              <div className="font-mono text-[11px] text-[#d1c5b0]/60">Audited 4 mins ago</div>
            </div>
          </div>

          {/* Main Ledger Table */}
          <div className="glass-panel rounded-2xl border border-[#edc155]/30 overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-[#181b23] border-b border-white/10 flex items-center justify-between">
              <h3 className="font-display font-bold text-xl text-[#e0e2ed]">
                Active Inventory Telemetry Ledger
              </h3>
              <div className="font-mono text-xs text-[#edc155] flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Dynamic AI Telemetry Active
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#181b23]/60 font-mono text-[11px] uppercase tracking-wider text-[#d1c5b0]/60 border-b border-white/5">
                    <th className="py-3.5 px-6">SKU</th>
                    <th className="py-3.5 px-6">Product Title</th>
                    <th className="py-3.5 px-6">Category</th>
                    <th className="py-3.5 px-6">Current Stock</th>
                    <th className="py-3.5 px-6">Expiry Window</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans text-xs">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-[#1d2027]/80 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-[#edc155]">{p.id}</td>
                      <td className="py-4 px-6 font-semibold text-[#e0e2ed]">{p.name}</td>
                      <td className="py-4 px-6 text-[#d1c5b0]/70">{p.category}</td>
                      <td className="py-4 px-6 font-mono text-[#e0e2ed]">
                        {p.stock} {p.unit}
                      </td>
                      <td className="py-4 px-6 font-mono text-[#d1c5b0]">{p.expiringDays} Days</td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] uppercase font-bold ${
                            p.status === 'critical'
                              ? 'bg-[#93000a]/40 text-[#ffb4ab] border border-[#93000a]'
                              : p.status === 'warning'
                              ? 'bg-[#edc155]/20 text-[#edc155] border border-[#edc155]/40'
                              : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-right text-[#e0e2ed]">
                        ${p.price.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md p-8 rounded-2xl glass-panel border border-[#edc155]/40 bg-[#10131b]">
            <h3 className="font-display font-bold text-2xl text-[#edc155] mb-6">
              Add New Stock Item
            </h3>
            <form onSubmit={handleAddProduct} className="space-y-4 font-sans text-xs">
              <div>
                <label className="block font-mono text-[11px] text-[#d1c5b0] uppercase mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="e.g. Organic Wild Blackberries"
                  className="w-full p-3 rounded-xl bg-[#1d2027] border border-[#4e4636] text-[#e0e2ed] outline-none focus:border-[#edc155]"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] text-[#d1c5b0] uppercase mb-1">
                  Department Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#1d2027] border border-[#4e4636] text-[#e0e2ed] outline-none focus:border-[#edc155]"
                >
                  <option value="Fresh Produce">Fresh Produce</option>
                  <option value="Exotic Produce">Exotic Produce</option>
                  <option value="Meat & Seafood">Meat & Seafood</option>
                  <option value="Dairy & Artisan">Dairy & Artisan</option>
                  <option value="Specialty Pantry">Specialty Pantry</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[11px] text-[#d1c5b0] uppercase mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(Number(e.target.value))}
                    className="w-full p-3 rounded-xl bg-[#1d2027] border border-[#4e4636] text-[#e0e2ed] outline-none focus:border-[#edc155]"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-[#d1c5b0] uppercase mb-1">
                    Unit Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full p-3 rounded-xl bg-[#1d2027] border border-[#4e4636] text-[#e0e2ed] outline-none focus:border-[#edc155]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#4e4636] text-[#d1c5b0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#edc155] text-[#10131b] font-bold font-mono uppercase"
                >
                  Save to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
