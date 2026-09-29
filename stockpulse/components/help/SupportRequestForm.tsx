'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, Send } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { submitSupportRequest } from '@/app/(dashboard)/help/actions'
import {
  supportCategories,
  validateSupportRequest,
  MAX_MESSAGE,
  type SupportRequestErrors,
} from '@/lib/validation/supportRequest'
import { useAppCopy } from '@/lib/i18n/client'

/**
 * "Need more help", as a form that actually files something.
 *
 * The states are deliberately exhaustive — idle, submitting, sent, failed —
 * because the previous version was a mailto: link, which is indistinguishable
 * from a no-op if the reader has no mail client configured. A support form
 * that silently does nothing is worse than none: the person believes they have
 * been heard and stops looking for another route.
 */
export default function SupportRequestForm({
  defaultName,
  defaultEmail,
}: {
  /** Seeded from the signed-in profile — still editable, since a reply may
      need to go somewhere other than the account address. */
  defaultName: string
  defaultEmail: string
}) {
  const t = useAppCopy().help
  const categories = useMemo(() => supportCategories(t), [t])
  const [name, setName] = useState(defaultName)
  const [email, setEmail] = useState(defaultEmail)
  const [category, setCategory] = useState('other')
  const [message, setMessage] = useState('')

  const [errors, setErrors] = useState<SupportRequestErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [reference, setReference] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    const values = { name, email, category, message }

    // Validate before the round trip so obvious mistakes are corrected without
    // waiting on the network. The action re-runs exactly these rules.
    const found = validateSupportRequest(values, t)
    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }

    setErrors({})
    setSubmitting(true)
    const result = await submitSupportRequest(values)
    setSubmitting(false)

    if (result.ok) {
      setReference(result.reference)
      return
    }
    if (result.errors) setErrors(result.errors)
    if (result.message) setFormError(result.message)
  }

  if (reference) {
    return (
      /* `rounded-xl` is 16px — the modal, panel and drawer rung. This is a
         card in the document flow and nothing about it is an overlay, so it
         was wearing a dialog's radius. 10px and `sp-e1` put it on the same
         rung as every other card. */
      <div className="sp-card-p sp-rise sp-e1 rounded-2xl border border-border bg-surface">
        <div className="flex items-center gap-2 text-accent">
          <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
          <h3 className="sp-heading">{t.sentTitle}</h3>
        </div>
        {/* role="status" so the change is announced — a sighted user sees the
            panel swap, a screen reader user would otherwise get nothing. */}
        <p role="status" className="mt-3 text-sm leading-relaxed text-muted-strong">
          {t.sentBefore}
          <span className="font-mono font-bold text-foreground">{reference}</span>
          {t.sentAfter}
        </p>
        <Button
          variant="secondary"
          className="mt-5"
          onClick={() => {
            setReference(null)
            setMessage('')
            setCategory('other')
          }}
        >
          {t.sendAnother}
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      /* Same 16px -> 10px correction as the sent-confirmation panel above. */
      className="sp-card-p sp-rise sp-e1 rounded-2xl border border-border bg-surface"
    >
      <h3 className="sp-heading">{t.formTitle}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{t.formIntro}</p>

      {formError && (
        <div
          role="alert"
          className="mt-4 rounded-lg bg-danger-bg px-4 py-2.5 text-sm font-medium text-danger"
        >
          {formError}
        </div>
      )}

      <div className="mt-5 space-y-4">
        <Field label={t.fName} error={errors.name} required>
          {(props) => (
            <Input
              {...props}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          )}
        </Field>

        <Field label={t.fEmail} error={errors.email} required hint={t.fEmailHint}>
          {(props) => (
            <Input
              {...props}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          )}
        </Field>

        <Field label={t.fCategory} error={errors.category} required>
          {(props) => (
            <Select {...props} value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field
          label={t.fMessage}
          error={errors.message}
          required
          hint={t.fMessageHint
            .replace('{n}', String(message.trim().length))
            .replace('{max}', MAX_MESSAGE.toLocaleString())}
        >
          {(props) => (
            <Textarea
              {...props}
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.fMessagePlaceholder}
            />
          )}
        </Field>
      </div>

      <Button type="submit" loading={submitting} fullWidth className="mt-5">
        {!submitting && <Send className="h-4 w-4" aria-hidden="true" />}
        {submitting ? t.sending : t.send}
      </Button>
    </form>
  )
}
