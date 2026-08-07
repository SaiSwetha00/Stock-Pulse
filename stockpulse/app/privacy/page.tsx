import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy Policy — StockPulse',
  description: 'What StockPulse stores, who can see it, and what is still being written.',
}

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="7 August 2026">
      <p className="font-semibold text-foreground">
        This is a placeholder, not a finished privacy policy.
      </p>
      <p>
        It exists so the link in the footer goes somewhere honest rather than nowhere. A real
        policy has to be written by a person who knows which jurisdiction this operates under and
        what the business intends to do with the data. Until that exists, what follows is a plain
        description of what the software actually does today — accurate, but not a legal document
        and not a substitute for one.
      </p>

      <h2>What StockPulse stores</h2>
      <p>
        If you create a store, the app holds the account details you enter — name, email address,
        and optionally a phone number, location and profile photo. It holds the trading records you
        enter yourself: products, stock levels, sales, suppliers, deliveries, staff shifts, and any
        customer records you choose to add, which may include a customer&apos;s name, email, phone
        number and purchase history.
      </p>
      <p>
        Conversations with the AI assistant are stored so they survive a refresh. They are private
        to the person who had them — your store owner cannot read them, and neither can a manager.
        That is enforced by the database, not merely hidden in the interface.
      </p>

      <h2>Who can see it</h2>
      <p>
        Data is scoped to your store. Members of one store cannot read another store&apos;s
        records; this is enforced at the database level rather than in the application, so it
        applies to every route without exception. Within a store, what each person sees depends on
        whether they are an owner, a manager or staff.
      </p>

      <h2>What is not written yet</h2>
      <p>
        Retention periods, deletion requests, lawful basis for processing, the list of
        sub-processors, international transfers, and how to reach a data controller. These are the
        parts that need a human, and they are genuinely absent — which is why this page says so
        rather than inventing them.
      </p>

      <p>
        Questions in the meantime can go through the{' '}
        <Link href="/help" className="underline underline-offset-4 hover:text-foreground">
          Help Centre
        </Link>
        .
      </p>
    </LegalPage>
  )
}
