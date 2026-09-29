/**
 * Provides the chosen language to /reset-password. One shared implementation,
 * so the four auth routes cannot drift apart — see
 * components/auth/AuthLocaleLayout.
 *
 * This route must stay reachable WITH a session — the recovery link signs the
 * user in before they choose a new password. That rule lives in
 * lib/supabase/middleware.ts and is untouched by adding a layout here.
 */
export { default, generateMetadata } from '@/components/auth/AuthLocaleLayout'
