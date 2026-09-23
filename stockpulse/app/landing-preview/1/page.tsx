import ConceptMinimal from '@/components/landing-preview/ConceptMinimal'
import PreviewSwitcher from '@/components/landing-preview/PreviewSwitcher'

export default function LandingPreviewOne() {
  return (
    <>
      <ConceptMinimal />
      <PreviewSwitcher current={1} />
    </>
  )
}
