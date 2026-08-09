import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage, { Todo, type LegalSection } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The agreement for using StockPulse: acceptable use, your responsibilities, availability, liability and termination.',
}

/**
 * A first draft. Same standard as the privacy policy: every statement about
 * how the software behaves is checked against the software, and everything
 * that depends on the business — its entity, its jurisdiction, whether it
 * charges — is a marked TODO rather than a plausible invention.
 */

const A = 'underline underline-offset-4 hover:text-foreground'

const SECTIONS: LegalSection[] = [
  {
    id: 'agreement',
    title: 'Who this agreement is between',
    body: (
      <>
        <p>
          These terms are between <Todo>legal entity name</Todo>, registered at{' '}
          <Todo>registered address</Todo> (&ldquo;we&rdquo;, &ldquo;us&rdquo;), and the person or
          business that opens a StockPulse store account (&ldquo;you&rdquo;).
        </p>
        <p>
          They take effect on <Todo>effective date</Todo>, and you accept them by creating an
          account or by continuing to use the service.
        </p>
        <p>
          The{' '}
          <Link href="/privacy" className={A}>
            Privacy Policy
          </Link>{' '}
          forms part of this agreement.
        </p>
      </>
    ),
  },
  {
    id: 'the-service',
    title: 'What the service is',
    body: (
      <>
        <p>
          StockPulse is web-based software for running an independent grocery store: inventory,
          sales, suppliers, customers, staff rostering, reporting and an optional AI assistant.
        </p>
        <p>
          It is a record-keeping and operations tool.{' '}
          <strong>
            It is not accounting software, not a point-of-sale certified for tax purposes, and not
            advice of any kind — financial, legal, employment or otherwise.
          </strong>{' '}
          Figures it displays are derived from what you enter. If you need numbers for a tax return
          or a regulator, have them prepared by someone qualified.
        </p>
      </>
    ),
  },
  {
    id: 'your-account',
    title: 'Your account',
    body: (
      <>
        <p>
          You must be old enough to enter a contract where you live, and you must give accurate
          registration details.
        </p>
        <p>
          You are responsible for keeping your password secret and for everything done through your
          account. Tell us promptly at <Todo>contact email</Todo> if you believe it has been used
          without your permission.
        </p>
        <p>
          One store account belongs to one business. Sharing a single login between several people
          instead of inviting them as staff defeats every record of who did what, and we may treat
          it as a breach of these terms.
        </p>
      </>
    ),
  },
  {
    id: 'staff-and-roles',
    title: 'Staff, roles, and what you are responsible for',
    body: (
      <>
        <p>StockPulse has three roles, and the difference between them is a real one:</p>
        <ul>
          <li>
            <strong>Owner</strong> — everything, including store settings, inviting and deactivating
            staff, and the audit log.
          </li>
          <li>
            <strong>Manager</strong> — day-to-day operations: products, categories, customers,
            suppliers, shifts and reports. Not store settings, not hiring, not the audit log.
          </li>
          <li>
            <strong>Staff</strong> — viewing products and shifts, and recording sales.
          </li>
        </ul>
        <p>
          <strong>Assigning a role is your decision and your responsibility.</strong> Giving someone
          Manager gives them access to your customers&apos; personal data and to your trading
          figures. We enforce the roles you set; we cannot judge whether the person should have
          them.
        </p>
        <p>You are responsible for:</p>
        <ul>
          <li>
            Everything your staff do in the account, including what they enter, change or delete.
          </li>
          <li>
            Removing access promptly when someone leaves. Deactivating them revokes sign-in and
            takes effect at their next token refresh.
          </li>
          <li>
            Having a lawful basis for the customer and staff data you put in, and for telling those
            people you hold it. See the{' '}
            <Link href="/privacy#controller-processor" className={A}>
              Privacy Policy
            </Link>{' '}
            — for that data you are the controller and we act on your instructions.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable use',
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>Break the law, or use StockPulse to help anyone else do so.</li>
          <li>
            Upload data you have no right to hold, or images that are unlawful, obscene, or infringe
            someone else&apos;s rights.
          </li>
          <li>
            Try to reach another store&apos;s data, probe or circumvent the access controls, or test
            the security of the service without our written permission.
          </li>
          <li>Scrape the service, run automated bulk requests against it, or resell access to it.</li>
          <li>
            Upload malware, or deliberately place a load on the service intended to degrade it for
            others.
          </li>
          <li>Reverse-engineer the service except where the law expressly says you may.</li>
          <li>
            Use the AI assistant to generate unlawful content, or rely on its output as fact without
            checking it. It can be wrong.
          </li>
        </ul>
        <p>
          Reporting a security problem you find by accident is welcome and will not be held against
          you — write to <Todo>contact email</Todo>. Continuing to explore after you find one is
          not.
        </p>
      </>
    ),
  },
  {
    id: 'your-data',
    title: 'Your data, and ours',
    body: (
      <>
        <p>
          The data you put into StockPulse stays yours. We do not claim ownership of it, we do not
          sell it, and we do not use it to train AI models.
        </p>
        <p>
          You grant us the limited permission needed to run the service: to store your data, process
          it, back it up, and display it to the people you have given access. That permission ends
          when the data is deleted.
        </p>
        <p>
          You can export your products, sales, customers and suppliers to CSV at any time from
          within the app, without asking us. That is deliberate: leaving should not require our
          cooperation.
        </p>
        <p>The software itself, its design and its content remain ours.</p>
      </>
    ),
  },
  {
    id: 'availability',
    title: 'Availability',
    body: (
      <>
        <p>
          <strong>There is no uptime guarantee and no service level agreement.</strong> StockPulse
          is provided on a reasonable-efforts basis. We do not promise it will be available at any
          particular time or that it will be uninterrupted or error-free.
        </p>
        <p>
          It may be unavailable for maintenance, for upgrades, because a third-party provider we
          depend on has an outage, or for reasons outside our control. We will try to give notice of
          planned downtime, but we may need to act without notice to protect the service or its
          data.
        </p>
        <p>
          <strong>Keep your own records.</strong> If your business cannot tolerate being unable to
          reach this software for a period, do not make it your only copy of anything you depend on.
          The CSV export exists partly for this reason.
        </p>
        <p>
          Features may change, and we may withdraw one. If we withdraw something you materially rely
          on, we will give <Todo>notice period for feature withdrawal, e.g. 30 days</Todo> notice
          where we reasonably can.
        </p>
      </>
    ),
  },
  {
    id: 'fees',
    title: 'Fees',
    body: (
      <>
        <p>
          <Todo>
            pricing model — whether the service is paid, the plans, billing cycle, taxes, refund
            policy, and what happens at the end of any trial
          </Todo>
        </p>
        <p>
          This section is deliberately blank rather than filled with a plausible-looking price.
          Nothing in the software currently takes a payment.
        </p>
      </>
    ),
  },
  {
    id: 'termination',
    title: 'Suspension and termination',
    body: (
      <>
        <p>
          <strong>You</strong> may stop using StockPulse at any time and ask us to close your account
          at <Todo>contact email</Todo>. Export anything you want to keep first.
        </p>
        <p>
          <strong>We</strong> may suspend or close an account if you materially breach these terms —
          in particular the acceptable-use section — if we are required to by law, or if we stop
          offering the service. Except where the breach is serious or the law requires otherwise, we
          will warn you first and give you a chance to put it right.
        </p>
        <p>
          On closure, access ends and your data is deleted on the timetable in the{' '}
          <Link href="/privacy#retention" className={A}>
            Privacy Policy
          </Link>
          . If we close your account because we are discontinuing the service, we will give you
          reasonable notice and an opportunity to export.
        </p>
        <p>
          The sections on your data and ours, disclaimers, liability and governing law survive
          termination.
        </p>
      </>
    ),
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers',
    body: (
      <>
        <p>
          To the fullest extent the law allows, StockPulse is provided &ldquo;as is&rdquo; and
          &ldquo;as available&rdquo;, without warranties of any kind, express or implied, including
          any implied warranty of merchantability, fitness for a particular purpose, or
          non-infringement.
        </p>
        <p>
          We do not warrant that the service will meet your requirements, that it will be
          uninterrupted or secure, or that any defect will be corrected.
        </p>
        <p>
          Some jurisdictions do not allow the exclusion of certain warranties, and where that is so,
          nothing here excludes a right you have that cannot lawfully be excluded — including, where
          applicable, statutory consumer rights.
        </p>
      </>
    ),
  },
  {
    id: 'liability',
    title: 'Limitation of liability',
    body: (
      <>
        <p>
          <strong>Nothing in these terms limits liability that cannot lawfully be limited</strong>,
          including liability for death or personal injury caused by negligence, or for fraud or
          fraudulent misrepresentation.
        </p>
        <p>Subject to that, and to the fullest extent the law allows:</p>
        <ul>
          <li>
            We are not liable for indirect or consequential loss, or for loss of profit, revenue,
            goodwill, business opportunity, or anticipated savings.
          </li>
          <li>
            We are not liable for loss or corruption of data to the extent it results from your own
            failure to keep an independent copy of anything you depend on.
          </li>
          <li>
            Our total liability arising out of or in connection with this agreement is capped at{' '}
            <Todo>
              liability cap — commonly the fees paid in the 12 months before the claim, or a fixed
              sum where the service is free
            </Todo>
            .
          </li>
        </ul>
        <p>
          This allocation of risk is part of the basis on which the service is offered at its price.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    body: (
      <>
        <p>
          We may change these terms. The &ldquo;Last updated&rdquo; date at the top will change with
          them.
        </p>
        <p>
          For a change that materially affects your rights or obligations, we will email store
          owners at their account address at least <Todo>notice period, e.g. 30 days</Todo> before
          it takes effect. If you do not accept the change, your remedy is to stop using the service
          and close your account before that date. Continuing to use it afterwards means you accept
          the new terms.
        </p>
      </>
    ),
  },
  {
    id: 'governing-law',
    title: 'Governing law and disputes',
    body: (
      <>
        <p>
          This agreement is governed by the laws of <Todo>governing jurisdiction</Todo>, and the
          courts of <Todo>governing jurisdiction — courts with exclusive jurisdiction</Todo> have
          exclusive jurisdiction over any dispute, without regard to conflict-of-law rules.
        </p>
        <p>
          If you are a consumer, this does not deprive you of the protection of the mandatory law of
          the country where you live.
        </p>
        <p>
          Before starting proceedings, please contact us at <Todo>contact email</Todo> — most
          disagreements are quicker to resolve directly.
        </p>
        <p>
          If any provision of these terms is found unenforceable, the rest continues in force and
          that provision is applied as narrowly as needed to make it enforceable.
        </p>
      </>
    ),
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="9 August 2026"
      intro={
        <>
          <p>
            These terms set out what you can expect from StockPulse and what we expect from you.
            They are written to be read rather than to be impenetrable, and the parts that could
            cost you something — availability, liability, termination — say so plainly instead of
            hiding in a wall of capitals.
          </p>
          <p>
            Related:{' '}
            <Link href="/privacy" className={A}>
              Privacy Policy
            </Link>
            .
          </p>
        </>
      }
      sections={SECTIONS}
    />
  )
}
