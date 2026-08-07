import {
  Rocket,
  Archive,
  Wallet,
  Truck,
  Users,
  UserSquare2,
  Settings,
  Sparkles,
  ShieldCheck,
  LifeBuoy,
  type LucideIcon,
} from 'lucide-react'

/**
 * Help content, as data.
 *
 * Every claim in here is checked against what the app actually does. The
 * landing page's habit of describing features that do not exist is precisely
 * what makes a product feel untrustworthy on first login, and a help centre
 * that documents an imaginary button is worse than no help centre at all — the
 * reader concludes the whole product is fiction, and they are half right.
 *
 * If a feature changes, the article changes in the same commit.
 */

export type HelpBlock =
  | { kind: 'p'; text: string }
  | { kind: 'h'; text: string }
  /** Ordered — "do this, then this". Rendered as <ol>. */
  | { kind: 'steps'; items: string[] }
  /** Unordered. Rendered as <ul>. */
  | { kind: 'list'; items: string[] }
  /** Called-out aside. Still plain text to a screen reader. */
  | { kind: 'note'; text: string }

export type HelpCategoryKey =
  | 'getting-started'
  | 'inventory'
  | 'sales'
  | 'suppliers'
  | 'customers'
  | 'staff'
  | 'settings'
  | 'ai'
  | 'roles'
  | 'troubleshooting'

export type HelpCategory = {
  key: HelpCategoryKey
  title: string
  description: string
  icon: LucideIcon
}

export type HelpArticle = {
  slug: string
  title: string
  category: HelpCategoryKey
  /** One sentence, shown on cards and in search results. */
  summary: string
  body: HelpBlock[]
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    key: 'getting-started',
    title: 'Getting started',
    description: 'Set up your store and get your first products and sales in.',
    icon: Rocket,
  },
  {
    key: 'inventory',
    title: 'Inventory & stock',
    description: 'Add products, import a price list, and set low-stock alerts.',
    icon: Archive,
  },
  {
    key: 'sales',
    title: 'Sales',
    description: 'Log sales and read the daily and weekly numbers.',
    icon: Wallet,
  },
  {
    key: 'suppliers',
    title: 'Suppliers',
    description: 'Track vendors and follow deliveries from order to dock.',
    icon: Truck,
  },
  {
    key: 'customers',
    title: 'Customers',
    description: 'Keep customer records and loyalty tiers up to date.',
    icon: Users,
  },
  {
    key: 'staff',
    title: 'Staff & scheduling',
    description: 'Invite your team and build the weekly shift rota.',
    icon: UserSquare2,
  },
  {
    key: 'settings',
    title: 'Settings',
    description: 'Store details, alert thresholds, notifications, and theme.',
    icon: Settings,
  },
  {
    key: 'ai',
    title: 'AI assistant',
    description: 'Ask questions about your own stock and sales in plain English.',
    icon: Sparkles,
  },
  {
    key: 'roles',
    title: 'Roles & permissions',
    description: 'What an owner, a manager, and a staff member can each do.',
    icon: ShieldCheck,
  },
  {
    key: 'troubleshooting',
    title: 'Troubleshooting',
    description: 'Fixes for the problems people hit most often.',
    icon: LifeBuoy,
  },
]

export const HELP_ARTICLES: HelpArticle[] = [
  // ---------------------------------------------------------------- start
  {
    slug: 'setting-up-your-store',
    title: 'Setting up your store for the first time',
    category: 'getting-started',
    summary:
      'The four things worth doing on day one, in the order that makes the rest of the app useful.',
    body: [
      {
        kind: 'p',
        text: 'When you sign up, StockPulse creates your store and makes you its owner. The app starts empty — that is expected, not a fault. Working through the four steps below in order takes about twenty minutes and makes every other screen meaningful.',
      },
      { kind: 'h', text: 'Step 1 — Add a few products' },
      {
        kind: 'p',
        text: 'Open Inventory and click Add Product. You do not need your whole range to begin with; ten or twenty of your fastest-moving lines is enough to see how the dashboard behaves. If you already have a spreadsheet, use Import CSV instead and load the lot in one go.',
      },
      { kind: 'h', text: 'Step 2 — Log a sale' },
      {
        kind: 'p',
        text: 'Go to Sales and click Log Sale. Logging a sale reduces the stock count of each product in it, which is what drives low-stock alerts, the dashboard totals, and the Analytics charts.',
      },
      { kind: 'h', text: 'Step 3 — Add your suppliers' },
      {
        kind: 'p',
        text: 'Suppliers lets you record who you buy from and track deliveries through four stages: ordered, shipped, in transit, and on the dock. Add the vendors you order from weekly first.',
      },
      { kind: 'h', text: 'Step 4 — Invite your team' },
      {
        kind: 'p',
        text: 'In Settings, use Add Staff to invite people by email. Give them the Manager role if they run shifts and order stock, or Staff if they mainly log sales. They set their own password from the invite.',
      },
      {
        kind: 'note',
        text: 'Only the owner can change store settings and invite staff. See "Who can do what" for the full breakdown.',
      },
    ],
  },

  // ------------------------------------------------------------ inventory
  {
    slug: 'adding-and-editing-products',
    title: 'Adding and editing products',
    category: 'inventory',
    summary: 'How to create a product, what each field is for, and who is allowed to change stock.',
    body: [
      {
        kind: 'p',
        text: 'Inventory is the list of everything you sell. Each product carries its own price, stock count, and reorder point.',
      },
      { kind: 'h', text: 'Creating a product' },
      {
        kind: 'steps',
        items: [
          'Open Inventory from the sidebar.',
          'Click Add Product in the top right.',
          'Fill in at least a name and a category, then save.',
        ],
      },
      { kind: 'h', text: 'What the fields mean' },
      {
        kind: 'list',
        items: [
          'Name and brand — what appears in search and on the sale screen.',
          'SKU — your own product code. Optional, but it makes CSV imports far more reliable, because StockPulse matches on it.',
          'Category — one of produce, dairy, packaged, beverages, or household. The category filter chips and the Analytics breakdown both use this.',
          'Unit price and unit — the price for one unit, and what a unit is (each, kg, litre).',
          'Stock — how many you currently hold. Logging a sale reduces this automatically.',
          'Low-stock threshold — the count at which this product starts showing as low. Defaults to 10.',
          'Expiry date — optional, used to flag perishables that are close to turning.',
        ],
      },
      { kind: 'h', text: 'Editing and deleting' },
      {
        kind: 'p',
        text: 'Hover a row and use the pencil to edit or the bin to delete. Deleting asks you to confirm first and names the product, because it cannot be undone.',
      },
      {
        kind: 'note',
        text: 'Staff can view inventory but cannot add, edit, or delete products. Owners and managers can do all three.',
      },
    ],
  },
  {
    slug: 'importing-products-from-a-spreadsheet',
    title: 'Importing products from a spreadsheet',
    category: 'inventory',
    summary: 'Load an existing price list as CSV, including which column headings are recognised.',
    body: [
      {
        kind: 'p',
        text: 'If your range already lives in Excel or Google Sheets, you do not need to retype it. Export it as CSV and use Import CSV on the Inventory page.',
      },
      { kind: 'h', text: 'The only column you must have' },
      {
        kind: 'p',
        text: 'Name. Everything else is optional and will fall back to a sensible default — stock starts at 0, the low-stock threshold at 10.',
      },
      { kind: 'h', text: 'Column headings that are recognised' },
      {
        kind: 'list',
        items: [
          'Name — also accepts "Product name" or "Product".',
          'Brand',
          'SKU',
          'Category',
          'Unit price — also accepts "Price".',
          'Unit',
          'Stock — also accepts "Quantity" or "Qty".',
          'Low stock threshold — also accepts "Min stock" or "Minimum".',
          'Expiry date — also accepts "Expiry".',
        ],
      },
      {
        kind: 'p',
        text: 'Headings are matched case-insensitively. A column StockPulse does not recognise is reported back to you rather than silently ignored, so you can see when a column has been mis-mapped.',
      },
      { kind: 'h', text: 'Before you import' },
      {
        kind: 'list',
        items: [
          'Check the file opens cleanly — a file exported from Excel often carries a hidden character at the start, which StockPulse strips for you.',
          'Make sure SKUs are unique. A SKU that appears twice in the same file is reported rather than applied twice.',
          'Category values must be one of produce, dairy, packaged, beverages, or household.',
        ],
      },
      {
        kind: 'note',
        text: 'The Export CSV button uses the same column headings as the importer, so you can export, edit in a spreadsheet, and import the file straight back.',
      },
    ],
  },

  // ---------------------------------------------------------------- sales
  {
    slug: 'logging-a-sale',
    title: 'Logging a sale',
    category: 'sales',
    summary: 'Record a transaction, and understand what it changes elsewhere in the app.',
    body: [
      {
        kind: 'p',
        text: 'Sales is where you record what left the shop. Every role can log a sale, including staff — it is the one write action staff have.',
      },
      { kind: 'h', text: 'Recording one' },
      {
        kind: 'steps',
        items: [
          'Open Sales and click Log Sale.',
          'Add each product in the basket and set the quantity.',
          "Save. The total is calculated for you from each product's unit price.",
        ],
      },
      { kind: 'h', text: 'What a logged sale changes' },
      {
        kind: 'list',
        items: [
          'Stock for each product in the sale goes down by the quantity sold.',
          'A product that drops to or below its low-stock threshold starts appearing in low-stock alerts.',
          'The dashboard totals and the Analytics charts update.',
        ],
      },
      { kind: 'h', text: 'Finding an earlier sale' },
      {
        kind: 'p',
        text: 'The Recent Transactions table is searchable and sortable, and pages in blocks so a busy day does not load thousands of rows at once. Use Export CSV to pull a period into a spreadsheet.',
      },
      {
        kind: 'note',
        text: "Logging a sale is the only thing that moves stock down automatically. If you write off damaged goods, edit the product's stock count directly in Inventory.",
      },
    ],
  },

  // ------------------------------------------------------------ suppliers
  {
    slug: 'tracking-suppliers-and-deliveries',
    title: 'Tracking suppliers and deliveries',
    category: 'suppliers',
    summary: 'Record who you buy from, and follow a delivery through its four stages.',
    body: [
      {
        kind: 'p',
        text: 'Suppliers has two halves: the vendors themselves, and the deliveries coming in from them.',
      },
      { kind: 'h', text: 'Adding a supplier' },
      {
        kind: 'p',
        text: 'Click Add Supplier and record the name, primary contact, category, and status. Status is your own judgement — mark a vendor as Issue when they are letting you down, and they sort to the top of the list so problems stay visible.',
      },
      { kind: 'h', text: 'The four delivery stages' },
      {
        kind: 'list',
        items: [
          'Ordered — the purchase order is placed.',
          'Shipped — the supplier has dispatched it.',
          'In transit — it is on its way.',
          'On the dock — it has arrived at the shop.',
        ],
      },
      {
        kind: 'p',
        text: 'Add a delivery with the + button on the Incoming Shipments panel, giving it a PO number, the supplier, an ETA, and a pallet count. Anything due today is badged Arriving Today. Once you move a delivery to On the dock it leaves the incoming list.',
      },
      { kind: 'h', text: 'The activity feed' },
      {
        kind: 'p',
        text: 'Recent Supplier Activity records what changed and when, so you can see at a glance what happened while you were off shift.',
      },
      {
        kind: 'note',
        text: 'Suppliers is available to owners and managers. Staff do not see it.',
      },
    ],
  },

  // ------------------------------------------------------------ customers
  {
    slug: 'customers-and-loyalty-tiers',
    title: 'Customers and loyalty tiers',
    category: 'customers',
    summary: 'Keep records for regulars and use the four loyalty tiers.',
    body: [
      {
        kind: 'p',
        text: 'Customers is for the regulars worth knowing by name — account customers, trade buyers, anyone on a loyalty scheme. You do not need a record for every walk-in.',
      },
      { kind: 'h', text: 'Adding a customer' },
      {
        kind: 'p',
        text: 'Click Add Customer and record their name, and optionally email, phone, and a note. Email must be unique within your store, so the same person cannot be entered twice by accident.',
      },
      { kind: 'h', text: 'The four tiers' },
      {
        kind: 'list',
        items: [
          'Bronze — the default for a new customer.',
          'Silver',
          'Gold',
          'Platinum — your best customers.',
        ],
      },
      {
        kind: 'p',
        text: 'Tiers are yours to assign. StockPulse does not promote anyone automatically, because every shop draws the line in a different place. Total spent and visit count are recorded on each customer so you have something to base the decision on.',
      },
      {
        kind: 'note',
        text: 'Customers is available to owners and managers.',
      },
    ],
  },

  // ---------------------------------------------------------------- staff
  {
    slug: 'inviting-staff-and-building-the-rota',
    title: 'Inviting staff and building the rota',
    category: 'staff',
    summary: 'Add people to your store and assign their shifts for the week.',
    body: [
      { kind: 'h', text: 'Inviting someone' },
      {
        kind: 'steps',
        items: [
          'Open Settings — only the owner can do this.',
          'In Staff Management, click Add Staff.',
          'Enter their name, email, and role, then send the invite.',
        ],
      },
      {
        kind: 'p',
        text: 'They appear in the list as Invited until they accept and set a password, at which point they show as Active.',
      },
      { kind: 'h', text: 'Assigning a shift' },
      {
        kind: 'steps',
        items: [
          'Open Staff.',
          'Click Assign Shift.',
          'Choose the person, the date, a start and end time, and a role label such as Tills or Produce.',
          'Save. The shift appears on the week grid.',
        ],
      },
      {
        kind: 'p',
        text: 'A shift left unassigned shows as UNASSIGNED with a warning icon, so gaps in cover are obvious. Use the arrows beside the date range to move between weeks, and My Schedule to filter the grid down to just your own shifts.',
      },
      {
        kind: 'note',
        text: 'Owners and managers can assign shifts. Staff see the same grid read-only, and open on their own schedule by default.',
      },
    ],
  },

  // ------------------------------------------------------------- settings
  {
    slug: 'store-settings-and-alerts',
    title: 'Store settings, alerts, and theme',
    category: 'settings',
    summary: 'Change your store details, tune when alerts fire, and switch between light and dark.',
    body: [
      {
        kind: 'p',
        text: 'Settings is owner-only, and covers the whole store rather than your personal account. For your own name, photo, and password, use Profile from the avatar menu instead.',
      },
      { kind: 'h', text: 'Store details' },
      {
        kind: 'p',
        text: 'Your store name, address, and contact phone. The store name appears throughout the app and on exported reports.',
      },
      { kind: 'h', text: 'Alert thresholds' },
      {
        kind: 'list',
        items: [
          'Global low-stock alert — the store-wide default reorder point. An individual product can override this with its own low-stock threshold.',
          'Perishables warning — how many hours before an expiry date a product starts being flagged.',
        ],
      },
      { kind: 'h', text: 'Notifications' },
      {
        kind: 'list',
        items: [
          'Critical stock alerts — when an item reaches zero.',
          'Daily digest — an end-of-day sales summary.',
          'Supplier updates — changes to delivery ETAs.',
        ],
      },
      { kind: 'h', text: 'Theme' },
      {
        kind: 'p',
        text: 'Switch the whole app between light and dark under Appearance. The choice is remembered on your device.',
      },
      {
        kind: 'note',
        text: 'Changes on this page are saved when you click Save Changes at the top — they are not saved as you type.',
      },
    ],
  },

  // ------------------------------------------------------------------- ai
  {
    slug: 'using-the-ai-assistant',
    title: 'Using the AI assistant',
    category: 'ai',
    summary: 'What the assistant can see, what it is good at, and where not to trust it.',
    body: [
      {
        kind: 'p',
        text: 'The assistant answers questions about your own store — your stock, your sales, your team — in plain English. Open it from the sparkle icon in the top bar.',
      },
      { kind: 'h', text: 'Things worth asking' },
      {
        kind: 'list',
        items: [
          '"Which products are low on stock?"',
          '"How did produce sell this week?"',
          '"What is on the schedule tomorrow?"',
        ],
      },
      { kind: 'h', text: 'What it can see' },
      {
        kind: 'p',
        text: "Only your store's data, and only the parts your role is allowed to see. If you are a staff member, the assistant will not answer questions about store-wide revenue, because you cannot see those screens either. It cannot see any other store's data under any circumstances.",
      },
      { kind: 'h', text: 'Where not to trust it' },
      {
        kind: 'p',
        text: 'It can be wrong, and it can be confidently wrong. Treat an answer as a starting point rather than a fact. Before you act on a number — reordering against it, or paying against it — check the number on the relevant screen.',
      },
      {
        kind: 'note',
        text: 'There is a limit on how many questions can be asked in a short window, to keep costs predictable. If you hit it, wait a moment and try again.',
      },
    ],
  },

  // ---------------------------------------------------------------- roles
  {
    slug: 'who-can-do-what',
    title: 'Who can do what: owner, manager, and staff',
    category: 'roles',
    summary: 'The three roles and exactly which screens and actions each one gets.',
    body: [
      {
        kind: 'p',
        text: 'StockPulse has three roles. Every store has exactly one owner — the person who signed up — and any number of managers and staff.',
      },
      { kind: 'h', text: 'Owner' },
      {
        kind: 'p',
        text: 'Everything. On top of what a manager can do, the owner alone can change store settings, invite and remove staff, and read the activity and audit log. The audit log records what managers do, which is why managers cannot read it.',
      },
      { kind: 'h', text: 'Manager' },
      {
        kind: 'list',
        items: [
          'Full use of Inventory, Sales, Suppliers, Customers, and Staff scheduling.',
          'Analytics and Reports — managers run the shop, so they see the numbers.',
          'No access to Settings, staff invitations, or the audit log.',
        ],
      },
      { kind: 'h', text: 'Staff' },
      {
        kind: 'list',
        items: [
          'Dashboard, and Inventory as read-only — they can look up a price or a stock count, but not change one.',
          'Logging sales.',
          'Their own schedule.',
          'No access to Suppliers, Customers, Analytics, Reports, Settings, or the audit log.',
        ],
      },
      { kind: 'h', text: 'One thing nobody can see: AI assistant chats' },
      {
        kind: 'p',
        text: 'Conversations with the AI assistant are private to the person who had them. Your owner cannot read your chat history, and neither can a manager — this is enforced by the database, not just hidden in the interface.',
      },
      {
        kind: 'p',
        text: 'That is deliberate. The assistant is where you ask the half-formed question you would rather not put in writing yet, and a tool that is read over your shoulder is a tool nobody uses honestly. Actions that change the store — editing stock, deleting a product, changing a role — are recorded in the audit log, which the owner does read. What you asked the assistant is not.',
      },
      {
        kind: 'note',
        text: 'These rules are enforced by the database, not just hidden in the menu. A link typed directly into the address bar will still be refused.',
      },
    ],
  },

  // ------------------------------------------------------- troubleshooting
  {
    slug: 'i-cannot-see-a-page-or-button',
    title: 'I cannot see a page or a button that someone else has',
    category: 'troubleshooting',
    summary: 'Almost always your role. How to tell, and what to do about it.',
    body: [
      {
        kind: 'p',
        text: 'If a colleague can see Suppliers or Settings and you cannot, the usual cause is that your account has a different role. The sidebar only shows what your role is allowed to open.',
      },
      { kind: 'h', text: 'Check your role' },
      {
        kind: 'p',
        text: 'Open Profile from your avatar in the top right. Your role is shown under your name.',
      },
      { kind: 'h', text: 'What to do' },
      {
        kind: 'list',
        items: [
          'If you need broader access, ask your store owner — only they can change a role.',
          'If you were recently given a new role, sign out and back in. Your role is read when you sign in.',
        ],
      },
      {
        kind: 'p',
        text: 'Typing the address directly will not get you in. The database enforces the same rules independently of the menu, so the page will send you back to the dashboard.',
      },
    ],
  },
  {
    slug: 'password-and-sign-in-problems',
    title: 'Password and sign-in problems',
    category: 'troubleshooting',
    summary: 'Resetting a forgotten password, and what to do when an invite never arrives.',
    body: [
      { kind: 'h', text: 'You have forgotten your password' },
      {
        kind: 'steps',
        items: [
          'On the sign-in screen, click "Forgot password?".',
          'Enter the email address you use for StockPulse.',
          'Open the email and follow the link to set a new password.',
        ],
      },
      {
        kind: 'p',
        text: 'The link is single-use and expires, so request a fresh one rather than reusing an old email.',
      },
      { kind: 'h', text: 'You want to change a password you still know' },
      {
        kind: 'p',
        text: 'Open Profile from the avatar menu and use Update under Account Security.',
      },
      { kind: 'h', text: 'An invited colleague never got their email' },
      {
        kind: 'list',
        items: [
          'Check their spam folder first — this is the answer most of the time.',
          'Check the address in Settings under Staff Management for a typo.',
          'If they are still listed as Invited, the owner can send the invite again.',
        ],
      },
      {
        kind: 'note',
        text: 'Support can never tell you your password, and will never ask for it.',
      },
    ],
  },
]

/**
 * Flattened lowercase text per article, built once at module load rather than
 * per keystroke. Search runs on every character typed; re-flattening a dozen
 * articles each time is wasted work on the main thread at exactly the moment
 * the UI has to stay responsive.
 */
const SEARCH_INDEX = new Map<string, string>(
  HELP_ARTICLES.map((article) => {
    const parts: string[] = [article.title, article.summary]
    for (const block of article.body) {
      if (block.kind === 'p' || block.kind === 'h' || block.kind === 'note') parts.push(block.text)
      else parts.push(...block.items)
    }
    const category = HELP_CATEGORIES.find((c) => c.key === article.category)
    if (category) parts.push(category.title)
    return [article.slug, parts.join(' ').toLowerCase()]
  }),
)

/** Case-insensitive match across title, summary, category name, and full body. */
export function articleMatches(article: HelpArticle, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return SEARCH_INDEX.get(article.slug)?.includes(q) ?? false
}

export function getArticle(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug)
}

export function articlesInCategory(key: HelpCategoryKey): HelpArticle[] {
  return HELP_ARTICLES.filter((a) => a.category === key)
}

export function categoryFor(key: HelpCategoryKey): HelpCategory | undefined {
  return HELP_CATEGORIES.find((c) => c.key === key)
}
