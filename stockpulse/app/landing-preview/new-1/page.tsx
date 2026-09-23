import type { Metadata } from 'next'
import ConceptClean from '@/components/landing-preview/new/ConceptClean'

// Inherits app/landing-preview/layout.tsx: noindex, and 404 on a Vercel production deployment.
export const metadata: Metadata = { title: 'Concept 1 — Clean Premium SaaS' }

export default function NewConceptOne() {
  return <ConceptClean />
}
