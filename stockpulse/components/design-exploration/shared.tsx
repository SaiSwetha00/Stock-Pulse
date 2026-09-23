/**
 * Moved. The dashboard panels now live in components/landing/panels — the real
 * landing page renders them, and production must not import from a preview
 * folder that could be deleted with the previews.
 *
 * This re-export keeps the /design-exploration mockups working unchanged.
 */
export {
  LINKS,
  CAPABILITIES,
  Mark,
  ProductsTile,
  LotsTile,
  LowStockTile,
  ExpiringTile,
  LowStockPanel,
  ExpiringPanel,
} from '@/components/landing/panels'
