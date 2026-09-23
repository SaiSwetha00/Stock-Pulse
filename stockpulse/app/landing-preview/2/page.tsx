import ConceptGrocery from '@/components/landing-preview/ConceptGrocery'
import PreviewSwitcher from '@/components/landing-preview/PreviewSwitcher'

export default function LandingPreviewTwo() {
  return (
    <>
      <ConceptGrocery />
      <PreviewSwitcher current={2} />
    </>
  )
}
