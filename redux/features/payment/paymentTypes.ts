export interface PaymentProvider {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  webhook_secret?: string;
  api_config?: string;
}

export interface PaymentProviderInput {
  name: string;
  slug: string;
  is_active: boolean;
  webhook_secret: string;
  api_config: string;
}

export type PaymentStatus = "pending" | "completed" | "failed" | "cancelled";

export interface PaymentRecord {
  id: string;
  reference: string;
  amount: string | number;
  status: PaymentStatus;
  provider?: {
    id?: string;
    name?: string;
  } | null;
  created_at: string;
}

export type SubscriptionStatus = "active" | "cancelled" | "expired" | "trial";

export interface SubscriptionRecord {
  id: string;
  status: SubscriptionStatus;
  created_at: string;
  current_period_end?: string | null;
  plan?: {
    id?: string;
    name?: string;
  } | null;
}

export interface PaymentAnalyticsResponse {
  total_revenue: number;
  revenue_change: number;
  successful_payments: number;
  payment_change: number;
  conversion_rate: number;
  conversion_change: number;
  recent_payments: Array<{
    amount: string | number;
    provider: string;
    created_at: string;
  }>;
}

export interface SubscriptionAnalyticsResponse {
  active_count: number;
  subscription_change: number;
  status_breakdown: Partial<Record<SubscriptionStatus, number>>;
}

export interface EntitlementFeature {
  name: string;
  limit_type: "BOOLEAN" | "COUNT" | "METERED";
  limit_value: number | null;
  is_unlimited: boolean;
  service_area: string;
  service_identifier: string;
}

export interface EntitlementSnapshot {
  profile_id: string;
  application: string;
  subscription: null | {
    id: string;
    status: "ACTIVE" | "TRIAL";
    start_date: string;
    end_date: string | null;
    trial_end_date: string | null;
    plan: { id: string; slug: string; name: string };
  };
  features: Record<string, EntitlementFeature>;
}

export interface SubscriptionPlanRecord {
  id: string;
  name: string;
  slug: string;
  application: string;
  application_name: string;
  description: string;
  price: string;
  billing_cycle: "MONTHLY" | "QUARTERLY" | "YEARLY" | "ONE_TIME";
  features: any[];
  is_active: boolean;
  trial_days: number;
  display_order?: number;
  is_featured?: boolean;
  intera_coins_reward: any;
  app: string;
  created_at: string;
  updated_at: string;
}

export interface StartTrialResponse {
  subscription: SubscriptionRecord;
  entitlements: EntitlementSnapshot;
  created: boolean;
  message: string;
}
