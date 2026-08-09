import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage, { Todo, type LegalSection } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  // Just the page's own name — app/layout.tsx appends "· StockPulse" via its
  // title template, so naming the product here rendered it twice in the tab.
  title: 'Privacy Policy',
  description:
    'What StockPulse collects, why, who processes it, how long it is kept, and how to exercise your rights.',
}

/**
 * A first draft written from the software, not from a template.
 *
 * Every factual claim below was checked against the running system rather than
 * assumed: the sub-processor list comes from the code and environment that
 * actually send data out, the cookie and storage names come from what the app
 * sets, the region comes from `vercel.json`, and the security section describes
 * enforcement measured in earlier phases. Where something could not be verified
 * from here it is a TODO, not a guess.
 */

const A = 'underline underline-offset-4 hover:text-foreground'

const SECTIONS: LegalSection[] = [
  {
    id: 'who-we-are',
    title: 'Who we are',
    body: (
      <>
        <p>
          StockPulse is store-operations software for independent grocers. It is provided by{' '}
          <Todo>legal entity name</Todo>, registered at <Todo>registered address</Todo>.
        </p>
        <p>
          For questions about this policy or about your data, contact <Todo>contact email</Todo>.
        </p>
        <p>
          This policy takes effect on <Todo>effective date</Todo>.
        </p>
      </>
    ),
  },
  {
    id: 'controller-processor',
    title: 'Two different roles, and why it matters to you',
    body: (
      <>
        <p>
          StockPulse handles two kinds of personal data and its responsibilities differ between
          them. This distinction decides who you should contact about what, so it comes first.
        </p>
        <ul>
          <li>
            <strong>Your account, and your staff&apos;s accounts.</strong> We decide what is
            collected and why, so we are the controller. Requests about this data come to us.
          </li>
          <li>
            <strong>Everything you enter about your business and your customers</strong> — products,
            sales, suppliers, rosters, and customer records. You decide what to put in and why; we
            only store and process it on your behalf, so you are the controller and we are your
            processor. If one of your customers asks what you hold about them, that request is yours
            to answer. We will help you answer it.
          </li>
        </ul>
        <p>
          A consequence worth stating plainly:{' '}
          <strong>the customer records you enter are your responsibility.</strong> You are the one
          who must have a lawful reason to hold a customer&apos;s name, phone number and purchase
          history, and who must tell them you hold it.
        </p>
      </>
    ),
  },
  {
    id: 'what-we-collect',
    title: 'What we collect, and why',
    body: (
      <>
        <h3>Account and profile</h3>
        <p>
          Full name, email address, role (owner, manager or staff), and optionally job title, phone
          number, location and a profile photo. Needed to give you an account, to show colleagues
          who did what, and to apply the correct permissions.
        </p>

        <h3>Store details</h3>
        <p>
          Store name, address, contact phone, and your operational settings such as low-stock
          thresholds and notification preferences.
        </p>

        <h3>Business records you enter</h3>
        <p>
          Products, categories, stock levels, prices, suppliers, shipments, sales and their line
          items. This is the substance of the product; without it there is nothing to show you.
        </p>

        <h3>Staff scheduling</h3>
        <p>
          Shifts, and leave records including the dates, the type of leave (holiday, sick, unpaid or
          other) and any note the person entering it adds.{' '}
          <strong>A note on a sick-leave record can easily contain health information</strong>,
          which in many jurisdictions is a special category of data with stricter rules. Keep notes
          minimal.
        </p>

        <h3>Customer records</h3>
        <p>
          Whatever you choose to enter: name, email, phone, loyalty tier, visit count and total
          spend. StockPulse does not collect these from your customers directly and has no
          relationship with them.
        </p>

        <h3>Uploaded images</h3>
        <p>
          Profile photos and product photos. Both are stored in a public bucket — see{' '}
          <Link href="#security" className={A}>
            Security
          </Link>{' '}
          for what that means and does not mean.
        </p>

        <h3>Support requests</h3>
        <p>
          The name, email address, category and message you submit through the Help Centre, so we
          can reply.
        </p>

        <h3>AI assistant conversations</h3>
        <p>
          The messages you exchange with the built-in assistant, stored so a conversation survives a
          page refresh. These are private to the person who had them: a store owner cannot read a
          staff member&apos;s conversations, and neither can a manager. That is enforced by database
          policy, not merely hidden in the interface.
        </p>

        <h3>Technical data</h3>
        <p>
          A session cookie, and server logs produced by our hosting provider in the ordinary course
          of serving requests. We do not use analytics, advertising or tracking cookies of any kind.
        </p>
      </>
    ),
  },
  {
    id: 'legal-basis',
    title: 'Legal basis for processing',
    body: (
      <>
        <p>
          The framework that applies depends on where you and your customers are, which is a
          question for <Todo>governing jurisdiction</Todo>. Written below in the language of the
          UK/EU GDPR because it is the strictest common standard; the reasoning maps onto most
          regimes.
        </p>
        <ul>
          <li>
            <strong>Performance of a contract</strong> — account data, store data and every business
            record. We cannot provide the service without them.
          </li>
          <li>
            <strong>Legitimate interests</strong> — security, preventing abuse, keeping an audit
            trail of administrative actions, and replying to support requests. Balanced against your
            interests, and none of it is used for profiling or advertising.
          </li>
          <li>
            <strong>Consent</strong> — optional profile and product photographs, and use of the AI
            assistant, which you choose to open. Withdrawable at any time by removing the image or
            not using the feature.
          </li>
          <li>
            <strong>Legal obligation</strong> — where we are required to retain records, for example
            for tax or in response to a lawful request.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'sub-processors',
    title: 'Sub-processors',
    body: (
      <>
        <p>
          Four companies process data on our behalf. Each is named individually, with what it
          receives and why.
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> — the database, authentication and file storage. It holds
            everything described above except what the other three receive. Passwords are stored by
            Supabase as salted hashes; we never see or store a password.
          </li>
          <li>
            <strong>Vercel</strong> — hosting and delivery. Processes requests in transit and
            produces server logs.
          </li>
          <li>
            <strong>Resend</strong> — transactional email. Currently used for support-request
            notifications only: it receives the name, email address and message from a support form.
          </li>
          <li>
            <strong>Google (Gemini API)</strong> — the AI assistant. When you send the assistant a
            message, that message is sent to Google. Depending on what you ask, the assistant may
            also send Google product names and stock levels, sales and revenue summaries, and staff
            names.{' '}
            <strong>
              If you would rather none of your business data reached Google, do not use the
              assistant.
            </strong>{' '}
            It is entirely optional and nothing else in the app depends on it.
          </li>
        </ul>
        <p>We do not sell personal data, and we do not share it with anyone for advertising.</p>
      </>
    ),
  },
  {
    id: 'where-data-lives',
    title: 'Where your data is stored',
    body: (
      <>
        <p>
          The application is deployed to the Mumbai (<code>bom1</code>) region. The database and
          file storage are hosted in the region chosen for our Supabase project:{' '}
          <Todo>confirm Supabase project region in the Supabase dashboard</Todo>.
        </p>
        <p>
          Our email and AI sub-processors operate internationally, so a support request or an
          assistant conversation may be processed outside your country. Where a transfer leaves a
          region with transfer restrictions, it relies on the receiving provider&apos;s standard
          contractual clauses.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep it',
    body: (
      <>
        <p>
          Business records are kept for as long as your store account is active, because they are
          the store&apos;s own trading history and deleting them silently would destroy your
          records. You can delete individual products, customers, suppliers, shifts and leave
          entries yourself at any time, and a deletion takes effect immediately.
        </p>
        <p>Two limits worth being honest about:</p>
        <ul>
          <li>
            A product that appears in a past sale cannot be deleted, because removing it would
            corrupt the sale record it is part of. It can be set to zero stock and retired instead.
          </li>
          <li>
            Deactivating a staff member revokes their ability to sign in but deliberately keeps
            their profile row, so past sales, shifts and audit entries still show who did what.
            Deleting the profile outright would leave holes in your own history.{' '}
            <strong>
              There is currently no self-service way to erase a person entirely; ask us and we will
              do it.
            </strong>
          </li>
        </ul>
        <p>
          Closing your account: contact us and we will delete the store and its records within{' '}
          <Todo>retention period after account closure, e.g. 30 days</Todo>, except anything we are
          required to keep by law.
        </p>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your rights, and how to use them',
    body: (
      <>
        <p>
          Subject to the law where you are, you can ask us to: give you a copy of your data; correct
          it; delete it; restrict or object to how we use it; or send it to another provider in a
          portable format.
        </p>
        <p>Several of these you can do yourself, immediately, without asking:</p>
        <ul>
          <li>Correct your own name, job title, phone, location and photo from your Profile page.</li>
          <li>Export products, sales, customers and suppliers to CSV from each module.</li>
          <li>Clear an AI assistant conversation from the assistant panel.</li>
          <li>Remove a profile or product photo, which deletes the stored file, not just the link.</li>
        </ul>
        <p>
          For anything else, write to <Todo>contact email</Todo>. We will respond within one month.
          If you are unhappy with the response you can complain to your data protection authority in{' '}
          <Todo>governing jurisdiction</Todo>.
        </p>
        <p>
          If you are a <em>customer of a shop that uses StockPulse</em> rather than a StockPulse
          user, please contact the shop. They hold your record and we cannot identify you.
        </p>
      </>
    ),
  },
  {
    id: 'security',
    title: 'Security',
    body: (
      <>
        <p>Measures actually in place, described rather than promised:</p>
        <ul>
          <li>
            <strong>Every table is scoped to one store by database policy</strong>, not by
            application code. A request that tried to read another shop&apos;s data would be refused
            by the database even if it bypassed the application entirely. This has been tested by
            signing in as a real user and attempting cross-store reads and writes: the reads return
            nothing and the writes change nothing.
          </li>
          <li>
            Roles are enforced in the same place. A staff account cannot create, rename or delete
            categories, and this too was verified against the database rather than the interface.
          </li>
          <li>Passwords are hashed by our authentication provider. We never see them.</li>
          <li>All traffic is served over HTTPS.</li>
          <li>The privileged database key is server-side only and can never be sent to a browser.</li>
          <li>
            Writes go through server-side actions that re-check permissions and re-validate input.
          </li>
        </ul>
        <p>
          <strong>One thing to be aware of.</strong> Profile and product images are stored in a
          public bucket, which means anyone holding an image&apos;s full URL can view it without
          signing in. The URLs contain a random identifier and are not listed anywhere, but they are
          not secret. Do not upload anything to a product or profile photo that you would not be
          content to have seen. Uploading is restricted to owners and managers, and writes are
          confined to your own store&apos;s folder.
        </p>
        <p>
          No system is perfectly secure, and we would rather describe our measures accurately than
          claim more than we can support.
        </p>
      </>
    ),
  },
  {
    id: 'breach',
    title: 'If there is a breach',
    body: (
      <>
        <p>
          If a breach occurs that is likely to result in a risk to people&apos;s rights and
          freedoms, we will notify the relevant supervisory authority in{' '}
          <Todo>governing jurisdiction</Todo> without undue delay and, where feasible, within 72
          hours of becoming aware of it.
        </p>
        <p>
          Where the risk to you is high, we will contact affected store owners directly at their
          account email address, describing what happened, what data was involved, what we are doing
          about it, and what we suggest you do.
        </p>
        <p>
          If you are a store owner, remember that your own customers&apos; data is under your
          control: you may have your own notification duties towards them.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and browser storage',
    body: (
      <>
        <p>
          No advertising cookies, no analytics cookies, no third-party trackers. There is no cookie
          banner because there is nothing to consent to beyond what is strictly necessary.
        </p>
        <ul>
          <li>
            <strong>Session cookie</strong> (named <code>sb-&lt;project&gt;-auth-token</code>) — set
            by our authentication provider to keep you signed in. Strictly necessary; the app cannot
            work without it. Cleared when you sign out.
          </li>
          <li>
            <strong>Theme preference</strong> (<code>sp-theme</code> in local storage) — remembers
            light or dark so the page does not flash the wrong one before it loads.
          </li>
          <li>
            <strong>Voice input language</strong> (local storage) — kept per device rather than per
            account, because a till in the shop and a phone in the stockroom can reasonably want
            different languages.
          </li>
        </ul>
        <p>
          The two local-storage values never leave your browser. Clearing your browser storage
          removes them with no effect beyond resetting those preferences.
        </p>
      </>
    ),
  },
  {
    id: 'children',
    title: "Children's data",
    body: (
      <>
        <p>
          StockPulse is a business tool and is not directed at children. We do not knowingly create
          accounts for anyone under 16, and accounts are only created by a store owner inviting a
          colleague.
        </p>
        <p>
          Two situations deserve care, and both are yours to manage as the controller: a shop
          employing someone under 18 will hold that young person&apos;s data in staff records and
          rosters, and a customer record you add could belong to a minor. If you believe a
          child&apos;s data has reached us in a way that needs attention, write to{' '}
          <Todo>contact email</Todo> and we will delete it.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <>
        <p>
          When this policy changes, the &ldquo;Last updated&rdquo; date at the top changes with it,
          and the previous version is superseded from that date.
        </p>
        <p>
          For a change that materially affects your rights or meaningfully widens what we do with
          your data — a new sub-processor, a new purpose, a longer retention period — we will
          additionally email store owners at their account address at least{' '}
          <Todo>notice period, e.g. 30 days</Todo> before it takes effect, so there is time to
          object or to close the account. Minor corrections are made without notice.
        </p>
      </>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="9 August 2026"
      intro={
        <>
          <p>
            This policy explains what StockPulse collects, why, who else processes it, how long it
            is kept, and what you can ask us to do about it. It is written to be read by the person
            running the shop rather than by a lawyer, and it describes the system as it actually
            behaves today.
          </p>
          <p>
            Related:{' '}
            <Link href="/terms" className={A}>
              Terms of Service
            </Link>
            . Questions can also go through the{' '}
            <Link href="/help" className={A}>
              Help Centre
            </Link>
            .
          </p>
        </>
      }
      sections={SECTIONS}
    />
  )
}
