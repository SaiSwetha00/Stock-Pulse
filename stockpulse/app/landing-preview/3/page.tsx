import ConceptEnterprise from '@/components/landing-preview/ConceptEnterprise'
import PreviewSwitcher from '@/components/landing-preview/PreviewSwitcher'

export default function LandingPreviewThree() {
  return (
    <>
      <ConceptEnterprise />
      <PreviewSwitcher current={3} />
    </>
  )
}
