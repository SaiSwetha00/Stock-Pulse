import type { Metadata } from 'next'
import ConceptEditorial from '@/components/landing-preview/new/ConceptEditorial'

// Inherits app/landing-preview/layout.tsx: noindex, and 404 on a Vercel production deployment.
export const metadata: Metadata = { title: 'Concept 3 — Modern Editorial' }

export default function NewConceptThree() {
  return <ConceptEditorial />
}
