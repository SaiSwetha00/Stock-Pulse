import {
  Archive,
  Bot,
  CalendarClock,
  ChartColumn,
  CloudOff,
  Heart,
  ReceiptText,
  ScanBarcode,
  Truck,
  UserSquare2,
  type LucideIcon,
} from 'lucide-react'

/**
 * Shared, canonical copy for the three landing-page design samples.
 *
 * All three concepts read from this one module, so a comparison between them
 * is a comparison of DESIGN, not of three differently-worded pitches. Every
 * claim here is one the product actually makes good on: it was written from
 * the live app and the production QA cycle, not from the current landing page,
 * whose FAQ still says there is no offline mode. There is.
 *
 * Deliberately absent: customer logos, testimonials, user counts and star
 * ratings. None would be real, and a page trying to read as "a real product,
 * not a template" loses that the moment it shows invented social proof.
 */

export const LINKS = {
  demo: '/login?demo=1',
  signup: '/signup',
  signin: '/login',
  privacy: '/privacy',
  terms: '/terms',
  help: '/help',
} as const

/** In-page anchors. Every nav in every concept points at these ids. */
export const NAV = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
] as const

export const HERO = {
  headline: ['Run the store,', 'not the spreadsheet.'] as const,
  // Every concept already names the audience in an eyebrow above the headline,
  // so the sub-headline goes straight to what the product does.
  sub: 'Inventory, sales, suppliers, staff and customers in one place — and the till keeps working when the internet doesn’t.',
  reassurance: 'Free while in beta · No card required',
}

export interface Module {
  key: string
  title: string
  summary: string
  detail: string
  icon: LucideIcon
}

/** The ten capabilities, in the order a shopkeeper meets them. */
export const MODULES: Module[] = [
  {
    key: 'inventory',
    title: 'Inventory',
    summary: 'Every product, every delivery.',
    detail:
      'Stock is held per delivery lot, each with its own expiry date. Import a catalogue from a spreadsheet and export it back.',
    icon: Archive,
  },
  {
    key: 'sales',
    title: 'Sales & POS',
    summary: 'Ring it up, stock follows.',
    detail:
      'Log a sale with line items and payment method. Stock is deducted from the earliest-expiring lot first.',
    icon: ReceiptText,
  },
  {
    key: 'alerts',
    title: 'Stock & expiry alerts',
    summary: 'Know before the shelf does.',
    detail:
      'Per-product low-stock thresholds, and an expiry warning window each store sets for itself.',
    icon: CalendarClock,
  },
  {
    key: 'suppliers',
    title: 'Suppliers & purchase orders',
    summary: 'Know what is arriving, and when.',
    detail:
      'A supplier directory, and purchase orders tracked from ordered to shipped to in transit to at dock.',
    icon: Truck,
  },
  {
    key: 'staff',
    title: 'Staff & shifts',
    summary: 'Roles, rotas and a record.',
    detail:
      'Owner, manager and staff roles, a shift schedule, and an audit log of who changed what.',
    icon: UserSquare2,
  },
  {
    key: 'customers',
    title: 'Customers & loyalty',
    summary: 'Regulars, recognised.',
    detail: 'Four loyalty tiers, with spend and visit counts that update as customers shop.',
    icon: Heart,
  },
  {
    key: 'analytics',
    title: 'Analytics & reports',
    summary: 'The week, in numbers.',
    detail: 'Daily takings, revenue trends and period-over-period reports, exportable to CSV.',
    icon: ChartColumn,
  },
  {
    key: 'offline',
    title: 'Offline sales',
    summary: 'The till doesn’t wait for Wi-Fi.',
    detail:
      'Sales made without a connection are saved on the device and sync on reconnect — once, never twice.',
    icon: CloudOff,
  },
  {
    key: 'scanning',
    title: 'Barcode scanning',
    summary: 'Point the camera, find the product.',
    detail:
      'Scan with the device camera to look up a product at the shelf or add it to a sale at the till.',
    icon: ScanBarcode,
  },
  {
    key: 'assistant',
    title: 'AI assistant',
    summary: 'Ask the store a question.',
    detail:
      'Ask what needs reordering or how the week went. It answers from live store data, limited to what your role can see.',
    icon: Bot,
  },
]

export const moduleByKey = (key: string): Module => {
  const m = MODULES.find((x) => x.key === key)
  if (!m) throw new Error(`Unknown module: ${key}`)
  return m
}

export const STEPS = [
  {
    n: '01',
    title: 'Bring your stock in',
    body: 'Add products by hand or import a spreadsheet — prices, thresholds, and expiry dates per delivery.',
  },
  {
    n: '02',
    title: 'Sell as you normally would',
    body: 'Log sales at the counter, online or off. Stock adjusts from the right lot as you go.',
  },
  {
    n: '03',
    title: 'Act on what surfaces',
    body: 'Low stock, items about to expire and deliveries due show up on the dashboard each morning.',
  },
] as const

/**
 * The ONE pricing statement. Each concept renders exactly one Pricing section
 * from this, with id="pricing" — the current page's duplicate pricing callout
 * is the thing this exists to prevent.
 */
export const PRICING = {
  plan: 'Beta',
  price: '₹0',
  period: 'while in beta',
  blurb: 'Every feature, for every store. No tiers, no trial clock, no card to enter.',
  includes: [
    'Unlimited products and delivery lots',
    'Sales, including offline sales that sync',
    'Low-stock and expiry alerts',
    'Suppliers and purchase orders',
    'Staff roles, shifts and audit log',
    'Customers, loyalty and reports',
    'Barcode scanning and AI assistant',
    'CSV import and export',
  ],
  cta: 'Get started free',
}

/**
 * Accurate as of the production QA cycle. The offline answer in particular
 * replaces the live page's "there is no offline mode", which is out of date.
 */
export const FAQ = [
  {
    q: 'What hardware do we need?',
    a: 'None beyond what you have. StockPulse runs in the browser on a computer, tablet or phone, and barcode scanning uses the device camera.',
  },
  {
    q: 'What happens if the internet drops?',
    a: 'Sales keep working. They are saved on the device and sync automatically when the connection returns — each sale lands exactly once. If stock ran short in the meantime, the sale still stands and the shortfall is flagged for you to check.',
  },
  {
    q: 'Does it connect to our till or accounting software?',
    a: 'Not yet — there are no POS or accounting integrations today. Sales are recorded in StockPulse itself, and any list can be exported to CSV for your accountant.',
  },
  {
    q: 'Can staff see everything?',
    a: 'No. Owners, managers and staff each see what their role allows, and that is enforced by the database, not only hidden in the interface.',
  },
  {
    q: 'What does it cost?',
    a: 'Nothing while StockPulse is in beta. There is no card to enter and no tier to upgrade to.',
  },
] as const

/** Factual trust points — mechanisms, not claims about other customers. */
export const TRUST = [
  { title: 'Separate by store', body: 'Every record is scoped to its store and enforced by row-level security in the database.' },
  { title: 'Role-based access', body: 'Owner, manager and staff permissions, checked on the server for every change.' },
  { title: 'A full audit trail', body: 'Changes are logged with who made them and the before-and-after values.' },
  { title: 'Sync that can’t double-count', body: 'Each offline sale carries its own ID, so a retry can never record it twice.' },
] as const
