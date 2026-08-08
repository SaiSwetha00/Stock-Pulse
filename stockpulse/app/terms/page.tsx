import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Terms of Service — StockPulse',
  description: 'The terms StockPulse is offered under, and what has not been drafted yet.',
}

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="7 August 2026">
      <p className="font-semibold text-foreground">
        This is a placeholder, not a finished set of terms.
      </p>
      <p>
        It exists so the link in the footer goes somewhere honest rather than nowhere. Real terms
        need drafting by someone qualified, against the jurisdiction the business actually operates
        in. What follows is a plain statement of how the software is offered today.
      </p>

      <h2>Cost</h2>
      <p>
        StockPulse is free to use. There are no tiers, no trial that expires, and no payment
        details are collected anywhere in the product.
      </p>

      <h2>What it does and does not do</h2>
      <p>
        StockPulse records what you enter: stock, sales, suppliers, deliveries, staff shifts and
        customers. It does not connect to tills, accounting software or payment processors, it
        requires an internet connection to work, and it involves no sensors or hardware of any
        kind. Nothing in the product predicts spoilage.
      </p>

      <h2>Your data is yours</h2>
      <p>
        You can export your records to CSV from within the app at any time. Deleting your account
        removes the store and everything scoped to it.
      </p>

      <h2>No warranty</h2>
      <p>
        The software is provided as it is. It is a record-keeping tool, not an accountant and not a
        food-safety system — decisions about stock, pricing and what is safe to sell remain yours.
        Keep your own backups of anything you cannot afford to lose.
      </p>

      <h2>What is not written yet</h2>
      <p>
        Limitation of liability, governing law, acceptable use, suspension and termination, dispute
        resolution, and how changes to these terms will be notified. These are genuinely absent
        rather than implied, which is the point of saying so here.
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
