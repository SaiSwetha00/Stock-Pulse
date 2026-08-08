'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import { canManage } from '@/lib/permissions'

export type ResolveResult = { ok: true } | { ok: false; message: string }

/**
 * Open or close a support request.
 *
 * Status is the only field this can touch, and that is enforced twice: here by
 * sending only those columns, and in the database by the trigger from migration
 * 0010, which rejects an UPDATE changing anything else. The second is the real
 * boundary — see 0006 for why the contents of a request stay immutable even to
 * the owner.
 */
export async function setRequestStatus(
  id: string,
  status: 'open' | 'resolved',
): Promise<ResolveResult> {
  const { profile } = await getCurrentUser()

  // Mirrors the RLS policy so a refusal reads as a sentence rather than as
  // zero rows updated. lib/permissions.ts and can_manage() must stay in step.
  if (!canManage(profile.role)) {
    return { ok: false, message: 'Only an owner or manager can change a request.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('support_requests')
    .update({
      status,
      resolved_at: status === 'resolved' ? new Date().toISOString() : null,
      resolved_by: status === 'resolved' ? profile.id : null,
    })
    .eq('id', id)

  if (error) {
    // The trigger's message is deliberately readable, so pass it through
    // rather than replacing it with something vaguer.
    return { ok: false, message: error.message }
  }

  revalidatePath('/support')
  return { ok: true }
}
