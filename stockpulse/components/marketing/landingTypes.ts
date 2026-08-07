export interface StatItem {
  label: string
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  description: string
}

export interface FeatureItem {
  id: string
  iconName: string
  title: string
  category: string
  description: string
  metrics: string
  highlightColor: 'gold' | 'crimson' | 'purple' | 'green'
}

export interface HowItWorksStep {
  stepNumber: string
  title: string
  subtitle: string
  description: string
  iconName: string
  detailPoints: string[]
}

export interface BenefitItem {
  feature: string
  legacyWay: string
  stockPulseWay: string
  impact: string
}

/**
 * Illustrative use-case scenarios, not real customer testimonials — there is
 * no name/role/company/avatar/rating here on purpose, since none of those
 * would be real either.
 */
export interface TestimonialItem {
  id: string
  scenario: string
  quote: string
  feature: string
}

export interface PricingPlan {
  id: string
  name: string
  tagline: string
  priceMonthly: number
  priceAnnual: number
  isPopular?: boolean
  features: string[]
  ctaText: string
}

export interface FAQItem {
  id: string
  question: string
  answer: string
  category: 'General' | 'Hardware & Scanning' | 'Pricing' | 'Security'
}

export interface StockProduct {
  id: string
  name: string
  category: string
  stock: number
  maxStock: number
  unit: string
  expiringDays: number
  temperature: string
  status: 'optimal' | 'low' | 'warning' | 'critical'
  price: number
}
