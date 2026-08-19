'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Image from 'next/image'
import { isOptimizableImage } from '@/lib/images'
import {
  Pencil,
  LogOut,
  User,
  ShieldCheck,
  Store,
  Mail,
  Phone,
  MapPin,
  Archive,
  Users,
} from 'lucide-react'
import { signOutEverywhereLocal } from '@/lib/offline/signOut'
import type { Profile } from '@/types'
import EditProfileModal from './EditProfileModal'
import ChangePasswordModal from './ChangePasswordModal'
import { ROLE_LABELS } from '@/lib/permissions'

export default function ProfileClient({
  profile,
  itemsManaged,
  staffCount,
}: {
  profile: Profile
  itemsManaged: number
  staffCount: number
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)

  const memberSince = new Date(profile.created_at).getFullYear()
  const roleLabel =
    profile.role === 'owner' ? 'Store Owner' : profile.job_title || ROLE_LABELS[profile.role]

  return (
    <div className="sp-page">
      <div className="relative overflow-hidden sp-rise sp-e1 rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-surface-muted ring-4 ring-surface">
            {isOptimizableImage(profile.avatar_url) ? (
              // 96px = the h-24 w-24 box. This is the largest image in the
              // app, so an unsized <img> here was the worst layout shift going
              // — the whole profile card jumped when it landed.
              <Image
                src={profile.avatar_url}
                alt={profile.full_name}
                width={96}
                height={96}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted">
                {profile.full_name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            {/* The person's own name is the title here, so the eyebrow says
                which page it is — the one case where the two carry different
                information rather than repeating each other. */}
            <p className="sp-eyebrow">Account</p>
            <h1 className="sp-title mt-1.5">{profile.full_name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted">
              <Store className="h-4 w-4" />
              {roleLabel} <span>·</span> Member since {memberSince}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit Profile
              </Button>
              <form action={signOutEverywhereLocal}>
                <button
                  type="submit"
                  className="flex control-h items-center gap-2 rounded-lg bg-danger-bg px-4 text-sm font-semibold text-danger hover:brightness-95"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="sp-rise sp-e1 rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <User className="h-4.5 w-4.5 text-muted-strong" />
              <h2 className="sp-heading">Personal Information</h2>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Full Name</p>
                <p className="mt-1 text-sm font-medium text-foreground">{profile.full_name}</p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  <Mail className="h-3 w-3" /> Email Address
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">{profile.email}</p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  <Phone className="h-3 w-3" /> Phone Number
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">{profile.phone || 'Not set'}</p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  <MapPin className="h-3 w-3" /> Location
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">{profile.location || 'Not set'}</p>
              </div>
            </div>
          </div>

          <div className="sp-rise sp-e1 rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <ShieldCheck className="h-4.5 w-4.5 text-muted-strong" />
              <h2 className="sp-heading">Account Security</h2>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Password</p>
                <p className="text-xs text-muted">Keep your account secure with a strong password.</p>
              </div>
              <button
                onClick={() => setPasswordOpen(true)}
                className="control-h rounded-lg border border-border px-3.5 text-sm font-semibold text-muted-strong hover:bg-surface-muted"
              >
                Update
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-foreground p-5">
              <Archive className="h-5 w-5 text-success" />
              <p className="mt-3 text-2xl font-bold text-surface">
                {itemsManaged >= 1000 ? `${(itemsManaged / 1000).toFixed(1)}k` : itemsManaged}
              </p>
              <p className="text-xs text-muted">Items Managed</p>
            </div>
            <div className="sp-rise sp-e1 rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <Users className="h-5 w-5 text-muted" />
              <p className="mt-3 text-2xl font-bold text-foreground">{staffCount}</p>
              <p className="text-xs text-muted">Staff Members</p>
            </div>
          </div>
        </div>
      </div>

      {editOpen && <EditProfileModal profile={profile} onClose={() => setEditOpen(false)} />}
      {passwordOpen && <ChangePasswordModal onClose={() => setPasswordOpen(false)} />}
    </div>
  )
}
