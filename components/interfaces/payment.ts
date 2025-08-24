
export interface Feature {
  id: string
  name: string
  slug: string
  application: string
  application_name: string
  description: string
  is_active: boolean
  feature_type: "CORE" | "ADDON" | "PREMIUM"
}

export interface PlanFeature {
  id: string
  feature: Feature
  limit_value: number | null
  is_unlimited: boolean
}

export interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  application: string
  application_name: string
  description: string
  price: string
  billing_cycle: "MONTHLY" | "QUARTERLY" | "YEARLY" | "ONE_TIME"
  features: Feature[]
  is_active: boolean
  trial_days: number
  intera_coins_reward: number
}
