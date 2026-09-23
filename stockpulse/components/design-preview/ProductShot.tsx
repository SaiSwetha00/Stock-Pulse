/**
 * Moved. The dashboard visual now lives in components/product/DashboardShot —
 * the real auth screens render it behind the sign-in form, and production must
 * not import from a preview folder that could be deleted with the previews.
 *
 * This re-export keeps the /design-preview and /design-exploration mockups
 * working unchanged.
 */
export { default, productTokens, PRODUCT_LABEL, type Palette } from '@/components/product/DashboardShot'
