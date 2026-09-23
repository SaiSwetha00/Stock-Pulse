import type { Metadata } from 'next'
import ConceptProduct from '@/components/landing-preview/new/ConceptProduct'

// Inherits app/landing-preview/layout.tsx: noindex, and 404 on a Vercel production deployment.
export const metadata: Metadata = { title: 'Concept 2 — Product-first' }

export default function NewConceptTwo() {
  return <ConceptProduct />
}
