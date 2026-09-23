import type { Metadata } from 'next'
import Concept1 from '@/components/auth-preview/Concept1'

export const metadata: Metadata = { title: 'Concept 1 — Product + auth split' }

export default function AuthConcept1Page() {
  return <Concept1 />
}
