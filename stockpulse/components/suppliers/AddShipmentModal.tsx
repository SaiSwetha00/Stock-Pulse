'use client'

import { useId, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { saveShipment } from '@/app/(dashboard)/suppliers/actions'
import type { ShipmentStatus, Supplier } from '@/types'
import { useAppCopy } from '@/lib/i18n/client'

export default function AddShipmentModal({
  suppliers,
  onClose,
}: {
  // storeId removed: the Server Action reads the store from the session.
  suppliers: Supplier[]
  onClose: () => void
}) {
  const t = useAppCopy()
  const ts = t.suppliers
  // Ties the footer submit back to the form it now sits outside of.
  const formId = useId()
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? '')
  const [poNumber, setPoNumber] = useState('')
  const [status, setStatus] = useState<ShipmentStatus>('ordered')
  const [pallets, setPallets] = useState('')
  const [eta, setEta] = useState('')
  const router = useRouter()
  const toast = useToast()
  const [error, setError] = useState('')

  // Held across the action *and* its revalidation, so the modal cannot close
  // before the shipments panel has been re-fetched.
  const [saving, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    startTransition(async () => {
      const result = await saveShipment({ supplierId, poNumber, status, pallets, eta })

      if (!result.ok) {
        setError(result.message ?? ts.shipmentSaveFailed)
        toast.error(ts.shipmentFailedToast, result.message)
        return
      }

      toast.success(ts.shipmentLogged, poNumber ? ts.poPrefix.replace('{n}', poNumber) : undefined)

      // revalidatePath alone does not repaint the client; see SupplierModal.
      router.refresh()
      onClose()
    })
  }

  return (
    <Modal
      title={ts.poTitle} onClose={onClose} width="md"
      /*
        Actions live in Modal's `footer`. `children` scrolls; `footer` is
        pinned, shrink-0, and carries the safe-area-inset-bottom padding. Left
        inside the form the action scrolls away on a short viewport - the same
        shape ProductModal was reported for. The submit carries `form={formId}`
        so native submission, validation and the Enter key still work.
      */
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="control-h flex-1 rounded-lg border border-border text-sm font-semibold text-muted-strong hover:bg-surface-muted"
          >
            {t.common.cancel}
          </button>
          <button
            type="submit"
            form={formId}
            disabled={saving || !suppliers.length}
            className="control-h flex-1 rounded-lg bg-foreground text-sm font-semibold text-surface hover:opacity-90 disabled:opacity-60"
          >
            {saving ? ts.poSaving : ts.poCreate}
          </button>
        </div>
      }
    >
        <form id={formId} onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && <div className="rounded-lg bg-danger-bg px-4 py-2.5 text-sm text-danger">{error}</div>}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
              {ts.fSupplier}
            </label>
            <select
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm focus:border-border-strong focus:bg-surface focus:outline-none"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
              {ts.fPoNumber}
            </label>
            <input
              required
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder={ts.poPlaceholder}
              className="control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm focus:border-border-strong focus:bg-surface focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
                {ts.fStatus}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ShipmentStatus)}
                className="control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm focus:border-border-strong focus:bg-surface focus:outline-none"
              >
                <option value="ordered">{ts.shipmentLabels.ordered}</option>
                <option value="shipped">{ts.shipmentLabels.shipped}</option>
                <option value="transit">{ts.shipmentLabels.transit}</option>
                <option value="dock">{ts.shipmentLabels.dock}</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
                {ts.fPallets}
              </label>
              <input
                type="number"
                min="0"
                value={pallets}
                onChange={(e) => setPallets(e.target.value)}
                className="control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm focus:border-border-strong focus:bg-surface focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
              {ts.fEta}
            </label>
            <input
              type="date"
              value={eta}
              onChange={(e) => setEta(e.target.value)}
              className="control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm focus:border-border-strong focus:bg-surface focus:outline-none"
            />
          </div>

          {!suppliers.length && (
            <p className="text-center text-xs text-muted">{ts.addSupplierFirst}</p>
          )}
        </form>
    </Modal>
  )
}
