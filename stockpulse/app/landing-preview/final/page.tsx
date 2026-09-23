import type { Metadata } from 'next'
import LandingFinal from '@/components/landing-preview/final/LandingFinal'

// Inherits app/landing-preview/layout.tsx: noindex, and 404 on a Vercel
// production deployment. The live landing page is still app/page.tsx.
export const metadata: Metadata = {
  title: 'Landing page preview',
}

export default function LandingPreviewFinal() {
  return <LandingFinal />
}
