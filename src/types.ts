export type PageView = 'landing' | 'login' | 'signup' | 'dashboard';

export interface StatItem {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  description: string;
}

export interface FeatureItem {
  id: string;
  iconName: string;
  title: string;
  category: string;
  description: string;
  metrics: string;
  highlightColor: 'gold' | 'crimson' | 'purple' | 'green';
}

export interface HowItWorksStep {
  stepNumber: string;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
  detailPoints: string[];
}

export interface BenefitItem {
  feature: string;
  legacyWay: string;
  stockPulseWay: string;
  impact: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  company: string;
  location: string;
  avatarUrl: string;
  rating: number;
  quote: string;
  metrics: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceAnnual: number;
  isPopular?: boolean;
  features: string[];
  ctaText: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'General' | 'Hardware & Scanning' | 'Pricing' | 'Security';
}

export interface StockProduct {
  id: string;
  name: string;
  category: string;
  stock: number;
  maxStock: number;
  unit: string;
  expiringDays: number;
  temperature: string;
  status: 'optimal' | 'low' | 'warning' | 'critical';
  price: number;
}
