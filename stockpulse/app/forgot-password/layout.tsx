/**
 * Provides the chosen language to /forgot-password. One shared implementation,
 * so the four auth routes cannot drift apart — see
 * components/auth/AuthLocaleLayout.
 */
export { default, generateMetadata } from '@/components/auth/AuthLocaleLayout'
