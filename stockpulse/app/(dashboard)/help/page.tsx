/*
GateGuard facts:
- Importer/caller: Next.js App Router file-based route "/help"; linked from components/layout/Sidebar.tsx nav item.
  Imports components/help/HelpCenterClient.tsx.
- Affected API: new default-exported page component. No existing API changed.
- Data: none. Help content is static; no database reads or writes.
- User instruction (verbatim): "2. Help Center - Searchable help articles - Browse topics grid (Getting Started,
  Inventory & Stock, Managing Staff, Payments & Sales, Hardware & POS, Security & Monitoring) - FAQ accordion section -
  Live Chat / Email Support contact card ... DESIGN REQUIREMENT: Match the two design screens from the zip file exactly
  ... TESTING REQUIREMENT: Test everything yourself, live in-browser — station alerts display and override correctly,
  Help Center search and FAQ expand/collapse work ... STOP CONDITION: Once built, matches the design, and the entire app
  runs with zero errors — stop and report back."
*/

import HelpCenterClient from '@/components/help/HelpCenterClient'

export default function HelpPage() {
  return <HelpCenterClient />
}
